import { KEEP_AHEAD_SECONDS, PREBUFFER_SECONDS, SEGMENT_LIMIT } from '../constants';
import type { StreamCtx, Variant } from '../types';
import { appendBufferAsync, resolveUrl, splitCodecs, waitForBufferLow } from '../utils';

type ParsedVariant = {
  url: string;
  codecs: string | null;
  bandwidth: number;
  resolution?: { w: number; h: number };
};

const parseMaster = (text: string, baseUrl: string): ParsedVariant[] => {
  const lines = text.split('\n').map((l) => l.trim());
  const variants: ParsedVariant[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue;
    const cm = lines[i].match(/CODECS="([^"]+)"/);
    const bm = lines[i].match(/BANDWIDTH=(\d+)/);
    const rm = lines[i].match(/RESOLUTION=(\d+)x(\d+)/);
    const bandwidth = bm ? parseInt(bm[1], 10) : Number.MAX_SAFE_INTEGER;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (lines[j] && !lines[j].startsWith('#')) {
        variants.push({
          url: resolveUrl(lines[j], baseUrl),
          codecs: cm ? cm[1] : null,
          bandwidth,
          resolution: rm ? { w: parseInt(rm[1], 10), h: parseInt(rm[2], 10) } : undefined,
        });
        break;
      }
    }
  }
  return variants;
};

const variantToOption = (v: ParsedVariant, idx: number): Variant => {
  const kbps = (v.bandwidth / 1000).toFixed(0);
  const reso = v.resolution ? `${v.resolution.h}p` : `v${idx + 1}`;
  return {
    id: `hls-${idx}`,
    label: `${reso} · ${kbps} kbps`,
    bandwidth: v.bandwidth,
    codec: v.codecs ?? '',
    width: v.resolution?.w,
    height: v.resolution?.h,
    url: v.url,
  };
};

export async function streamHls(asset: string, ctx: StreamCtx) {
  const { ms, video, addLog, patchState, cancelled, onSegment, preferredVariantId } = ctx;

  addLog(5, '.m3u8 매니페스트 fetch...');
  const text = await fetch(asset).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
  if (cancelled()) return;

  let mediaUrl = asset;
  let codecsStr: string | null = null;
  let pickedIndex = 0;

  if (text.includes('#EXT-X-STREAM-INF')) {
    const variants = parseMaster(text, asset);
    if (variants.length === 0) throw new Error('master에 variant가 없습니다');

    // bandwidth 오름차순 정렬
    variants.sort((a, b) => a.bandwidth - b.bandwidth);

    // UI 옵션으로 노출
    const options = variants.map((v, idx) => variantToOption(v, idx));
    patchState({ variants: options });

    // 사용자 선호 variant가 있으면 그걸로, 없으면 가장 낮은 거
    if (preferredVariantId) {
      const found = options.findIndex((v) => v.id === preferredVariantId);
      if (found >= 0) pickedIndex = found;
    }
    const picked = variants[pickedIndex];
    patchState({ selectedVariantId: options[pickedIndex].id });

    mediaUrl = picked.url;
    codecsStr = picked.codecs;
    addLog(
      5,
      `master 감지 → variant 선택: ${options[pickedIndex].label} (총 ${variants.length}개 중)`,
      'ok'
    );
    addLog(5, `variant URL: ${mediaUrl}`);
    if (codecsStr) addLog(5, `variant CODECS: ${codecsStr}`);
  }

  let mediaText = text;
  if (mediaUrl !== asset) {
    mediaText = await fetch(mediaUrl).then((r) => r.text());
    if (cancelled()) return;
  }

  // media playlist 파싱 (byte-range 지원 포함)
  type SegmentRef = {
    url: string;
    range?: { offset: number; length: number };
  };
  const lines = mediaText.split('\n').map((l) => l.trim());
  let initUri: string | null = null;
  let initRange: { offset: number; length: number } | undefined;
  const segments: SegmentRef[] = [];
  let pendingRange: { offset: number; length: number } | undefined;
  let lastByteEnd = 0;

  for (const line of lines) {
    if (line.startsWith('#EXT-X-MAP')) {
      const um = line.match(/URI="([^"]+)"/);
      if (um) initUri = resolveUrl(um[1], mediaUrl);
      const bm = line.match(/BYTERANGE="(\d+)(?:@(\d+))?"/);
      if (bm) {
        const length = parseInt(bm[1], 10);
        const offset = bm[2] ? parseInt(bm[2], 10) : 0;
        initRange = { length, offset };
      }
    } else if (line.startsWith('#EXT-X-BYTERANGE')) {
      // #EXT-X-BYTERANGE:<length>[@<offset>]
      const m = line.match(/#EXT-X-BYTERANGE:(\d+)(?:@(\d+))?/);
      if (m) {
        const length = parseInt(m[1], 10);
        const offset = m[2] ? parseInt(m[2], 10) : lastByteEnd;
        pendingRange = { length, offset };
        lastByteEnd = offset + length;
      }
    } else if (line && !line.startsWith('#')) {
      segments.push({
        url: resolveUrl(line, mediaUrl),
        range: pendingRange,
      });
      pendingRange = undefined;
    }
  }

  if (!initUri) {
    throw new Error(
      '#EXT-X-MAP이 없는 HLS입니다. .ts 트랜스먹싱이 필요해서 raw MSE로는 재생할 수 없습니다.'
    );
  }
  addLog(
    5,
    `init URI: ${initUri}${initRange ? ` (byte ${initRange.offset}-${initRange.offset + initRange.length - 1})` : ''}`
  );
  const useByteRange = segments.some((s) => s.range);
  if (useByteRange) {
    addLog(5, `🎯 byte-range HLS 감지 → Range 헤더로 부분 fetch (단일 파일에서 조각만)`, 'ok');
  }

  // 분리 트랙 가능성 처리: master CODECS에 video+audio 모두 있는 경우
  // 실제 init segment는 video만 있을 수 있음 → video 코덱만 declare
  let mimeCodec: string;
  if (codecsStr) {
    const split = splitCodecs(codecsStr);
    if (split.video && split.audio && split.all.length > 1) {
      addLog(
        5,
        `⚠️ master에 video+audio 둘 다 표시됨. 분리 트랙 가능성 → video 코덱만 declare (오디오는 별도 SourceBuffer 필요)`
      );
      mimeCodec = `video/mp4; codecs="${split.video}"`;
    } else {
      mimeCodec = `video/mp4; codecs="${codecsStr}"`;
    }
  } else {
    mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  }

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

  const fetchWithRange = async (
    url: string,
    range?: { offset: number; length: number }
  ): Promise<ArrayBuffer> => {
    const headers: Record<string, string> = {};
    if (range) {
      headers.Range = `bytes=${range.offset}-${range.offset + range.length - 1}`;
    }
    const r = await fetch(url, { headers });
    if (!r.ok && r.status !== 206) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
  };

  addLog(5, 'init segment fetch...');
  const initBuf = await fetchWithRange(initUri, initRange);
  if (cancelled()) return;
  await appendBufferAsync(sb, initBuf);
  addLog(5, `init 주입 (${(initBuf.byteLength / 1024).toFixed(1)} KB)`, 'ok');

  let bytes = initBuf.byteLength;
  let count = 0;
  const limit = Math.min(segments.length, SEGMENT_LIMIT);
  addLog(
    5,
    `세그먼트 ${segments.length}개 발견 — 처음 몇 개 prebuffer 후, 재생되면서 progressive로 추가 fetch`,
    'ok'
  );

  for (let i = 0; i < limit; i += 1) {
    if (cancelled()) return;

    // 첫 segment는 즉시, 그 이후는 버퍼 ahead가 부족할 때만 fetch
    if (i > 0) {
      const ahead = (() => {
        if (sb.buffered.length === 0) return 0;
        return Math.max(0, sb.buffered.end(sb.buffered.length - 1) - video.currentTime);
      })();
      const threshold = i === 1 ? PREBUFFER_SECONDS : KEEP_AHEAD_SECONDS;
      if (ahead >= threshold) {
        addLog(5, `버퍼 ${ahead.toFixed(1)}s 충분 → ${threshold}s 미만으로 떨어질 때까지 대기...`);
        await waitForBufferLow(video, sb, threshold, cancelled);
        if (cancelled()) return;
      }
    }

    try {
      const buf = await fetchWithRange(segments[i].url, segments[i].range);
      if (cancelled()) return;
      await appendBufferAsync(sb, buf);
      bytes += buf.byteLength;
      count += 1;
      const rangeMsg = segments[i].range
        ? ` [bytes ${segments[i].range!.offset}-${segments[i].range!.offset + segments[i].range!.length - 1}]`
        : '';
      addLog(
        5,
        `[${i + 1}/${limit}] segment 주입 (${(buf.byteLength / 1024).toFixed(0)} KB)${rangeMsg}`,
        'ok'
      );
      patchState({ segmentsLoaded: count, bytesLoaded: bytes });
      onSegment(sb);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(5, `segment ${i + 1} 실패: ${msg}`, 'err');
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
  addLog(5, `HLS 재생 끝 — 총 ${count}개 segment / ${(bytes / 1024 / 1024).toFixed(2)} MB`, 'ok');
}
