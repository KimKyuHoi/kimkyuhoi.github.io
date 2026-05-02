import { KEEP_AHEAD_SECONDS, PREBUFFER_SECONDS, SEGMENT_LIMIT } from '../constants';
import type { StreamCtx, Variant } from '../types';
import { appendBufferAsync, fillTemplate, resolveUrl, waitForBufferLow } from '../utils';

export async function streamDash(asset: string, ctx: StreamCtx) {
  const { ms, video, addLog, patchState, cancelled, onSegment, preferredVariantId } = ctx;

  addLog(5, '.mpd manifest fetch...');
  const xml = await fetch(asset).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
  if (cancelled()) return;

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('MPD XML 파싱 실패');
  }

  const adaptations = Array.from(doc.querySelectorAll('AdaptationSet'));
  const videoAdapt = adaptations.find((a) => {
    const ct = a.getAttribute('contentType') || a.getAttribute('mimeType') || '';
    return ct.includes('video');
  });
  if (!videoAdapt) throw new Error('비디오 AdaptationSet 없음');

  const reps = Array.from(videoAdapt.querySelectorAll('Representation'));
  if (reps.length === 0) throw new Error('Representation 없음');

  // 모든 Representation을 variant 옵션으로 변환
  const sortedReps = [...reps].sort((a, b) => {
    const ba = parseInt(a.getAttribute('bandwidth') || '0', 10);
    const bb = parseInt(b.getAttribute('bandwidth') || '0', 10);
    return ba - bb;
  });

  const options: Variant[] = sortedReps.map((r, idx) => {
    const bw = parseInt(r.getAttribute('bandwidth') || '0', 10);
    const w = parseInt(r.getAttribute('width') || '0', 10);
    const h = parseInt(r.getAttribute('height') || '0', 10);
    const reso = h > 0 ? `${h}p` : `r${idx + 1}`;
    return {
      id: `dash-${r.getAttribute('id') || idx}`,
      label: `${reso} · ${(bw / 1000).toFixed(0)} kbps`,
      bandwidth: bw,
      codec: r.getAttribute('codecs') || videoAdapt.getAttribute('codecs') || 'avc1.42E01E',
      width: w || undefined,
      height: h || undefined,
      repId: r.getAttribute('id') || String(idx),
    };
  });
  patchState({ variants: options });

  // 사용자 선호 또는 최저 bandwidth
  let pickedIdx = 0;
  if (preferredVariantId) {
    const found = options.findIndex((v) => v.id === preferredVariantId);
    if (found >= 0) pickedIdx = found;
  }
  const rep = sortedReps[pickedIdx];
  patchState({ selectedVariantId: options[pickedIdx].id });

  const repId = rep.getAttribute('id') || '0';
  const codecs = rep.getAttribute('codecs') || videoAdapt.getAttribute('codecs') || 'avc1.42E01E';
  const mimeType =
    rep.getAttribute('mimeType') || videoAdapt.getAttribute('mimeType') || 'video/mp4';
  const bandwidth = rep.getAttribute('bandwidth') || '0';

  addLog(5, `AdaptationSet 선택: video / Representations ${reps.length}개`, 'ok');
  addLog(5, `Representation 선택: ${options[pickedIdx].label}`, 'ok');

  const segTpl =
    rep.querySelector('SegmentTemplate') || videoAdapt.querySelector('SegmentTemplate');
  if (!segTpl) {
    throw new Error('SegmentTemplate 없음 (SegmentList / SegmentBase는 미지원)');
  }

  const initTplStr = segTpl.getAttribute('initialization');
  const mediaTplStr = segTpl.getAttribute('media');
  if (!initTplStr || !mediaTplStr) {
    throw new Error('SegmentTemplate의 initialization / media 속성 없음');
  }
  const startNumber = parseInt(segTpl.getAttribute('startNumber') || '1', 10);

  // SegmentTimeline 처리 — $Time$ 또는 $Number$ + Timeline 둘 다 지원
  // <SegmentTimeline><S t="0" d="48000" r="2"/>... 누적해서 (time, num) 리스트 생성
  type TimelineEntry = { number: number; time: number; duration: number };
  let timeline: TimelineEntry[] | null = null;
  const timelineEl = segTpl.querySelector('SegmentTimeline');
  if (timelineEl) {
    timeline = [];
    let currentTime = 0;
    let num = startNumber;
    const sList = Array.from(timelineEl.querySelectorAll('S'));
    for (const s of sList) {
      const tAttr = s.getAttribute('t');
      const d = parseInt(s.getAttribute('d') || '0', 10);
      const r = parseInt(s.getAttribute('r') || '0', 10); // 반복 횟수
      if (tAttr !== null) currentTime = parseInt(tAttr, 10);
      const reps = r < 0 ? 1 : r + 1; // r=-1 (끝까지)는 데모상 1회로 제한
      for (let i = 0; i < reps; i += 1) {
        timeline.push({ number: num, time: currentTime, duration: d });
        currentTime += d;
        num += 1;
      }
    }
    addLog(5, `SegmentTimeline 감지 → ${timeline.length}개 segment 시점 계산`, 'ok');
  }

  let base = asset.substring(0, asset.lastIndexOf('/') + 1);
  const baseEls = doc.querySelectorAll('BaseURL');
  if (baseEls.length > 0) {
    const t = baseEls[0].textContent?.trim();
    if (t) {
      base = resolveUrl(t, base);
      if (!base.endsWith('/')) base += '/';
    }
  }

  const initUrl = resolveUrl(fillTemplate(initTplStr, repId, 0, bandwidth), base);

  const mimeCodec = `${mimeType}; codecs="${codecs}"`;
  const supported = MediaSource.isTypeSupported(mimeCodec);
  patchState({ codecSupported: supported, codecResolved: mimeCodec });
  if (!supported) {
    addLog(3, `❌ 코덱 미지원: ${mimeCodec}`, 'err');
    return;
  }
  addLog(3, `✅ 코덱 지원: ${mimeCodec}`, 'ok');

  const sb = ms.addSourceBuffer(mimeCodec);
  patchState({ sourceBufferReady: true });
  addLog(4, 'SourceBuffer 생성', 'ok');

  addLog(5, `init segment fetch: ${initUrl}`);
  const initRes = await fetch(initUrl);
  if (!initRes.ok) throw new Error(`init segment HTTP ${initRes.status}`);
  const initBuf = await initRes.arrayBuffer();
  if (cancelled()) return;
  await appendBufferAsync(sb, initBuf);
  addLog(5, `init 주입 (${(initBuf.byteLength / 1024).toFixed(1)} KB)`, 'ok');

  let bytes = initBuf.byteLength;
  let count = 0;
  addLog(5, '재생되면서 progressive로 추가 segment fetch', 'ok');
  for (let i = 0; i < SEGMENT_LIMIT; i += 1) {
    if (cancelled()) return;

    // 첫 segment는 즉시, 그 이후는 버퍼 ahead가 부족할 때만
    if (i > 0) {
      const ahead = (() => {
        if (sb.buffered.length === 0) return 0;
        return Math.max(0, sb.buffered.end(sb.buffered.length - 1) - video.currentTime);
      })();
      const threshold = i === 1 ? PREBUFFER_SECONDS : KEEP_AHEAD_SECONDS;
      if (ahead >= threshold) {
        addLog(5, `버퍼 ${ahead.toFixed(1)}s 충분 → ${threshold}s 아래로 떨어질 때까지 대기...`);
        await waitForBufferLow(video, sb, threshold, cancelled);
        if (cancelled()) return;
      }
    }

    // SegmentTimeline이 있으면 거기서 number/time 사용, 없으면 startNumber + i
    let num: number;
    let time: number | null = null;
    if (timeline) {
      if (i >= timeline.length) {
        addLog(5, 'SegmentTimeline 끝 도달', 'ok');
        break;
      }
      num = timeline[i].number;
      time = timeline[i].time;
    } else {
      num = startNumber + i;
    }

    // $Time$ 또는 $Number$ 치환 (둘 다 처리)
    let mediaPath = fillTemplate(mediaTplStr, repId, num, bandwidth);
    if (time !== null) {
      mediaPath = mediaPath.replace(/\$Time\$/g, String(time));
    }
    const segUrl = resolveUrl(mediaPath, base);

    try {
      const r = await fetch(segUrl);
      if (!r.ok) {
        addLog(5, `segment ${num}: HTTP ${r.status} (스트림 끝)`, '');
        break;
      }
      const buf = await r.arrayBuffer();
      if (cancelled()) return;
      await appendBufferAsync(sb, buf);
      bytes += buf.byteLength;
      count += 1;
      const tag = time !== null ? `t=${time}` : `n=${num}`;
      addLog(
        5,
        `[${i + 1}/${SEGMENT_LIMIT}] segment ${tag} 주입 (${(buf.byteLength / 1024).toFixed(0)} KB)`,
        'ok'
      );
      patchState({ segmentsLoaded: count, bytesLoaded: bytes });
      onSegment(sb);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(5, `segment ${num} 실패: ${msg}`, 'err');
      break;
    }
  }

  if (ms.readyState === 'open') {
    try {
      ms.endOfStream();
    } catch {
      // ignore
    }
  }
  addLog(
    5,
    `DASH 재생 준비 완료 — 총 ${count}개 segment / ${(bytes / 1024 / 1024).toFixed(2)} MB`,
    'ok'
  );
}
