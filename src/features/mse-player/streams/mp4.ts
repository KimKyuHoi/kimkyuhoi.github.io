import type { StreamCtx } from '../types';
import { appendBufferAsync } from '../utils';
import { isTypeSupportedCompat } from '../mse-compat';

export async function streamMp4(asset: string, codec: string, ctx: StreamCtx) {
  const { ms, addLog, patchState, cancelled, onSegment } = ctx;
  if (!codec) throw new Error('MP4 모드는 코덱 문자열이 필요합니다.');

  const supported = isTypeSupportedCompat(codec);
  patchState({ codecSupported: supported, codecResolved: codec });
  if (!supported) {
    addLog(3, `❌ 코덱 미지원: ${codec}`, 'err');
    return;
  }
  addLog(3, `✅ 코덱 지원: ${codec}`, 'ok');

  const sb = ms.addSourceBuffer(codec);
  patchState({ sourceBufferReady: true });
  addLog(4, 'SourceBuffer 생성 → 디코더 셋업 완료', 'ok');

  addLog(5, 'fetch 시작...');
  const r = await fetch(asset);
  addLog(5, `fetch 응답 수신: HTTP ${r.status}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = await r.arrayBuffer();
  addLog(5, `arrayBuffer 변환 완료: ${buf.byteLength} bytes`);
  if (cancelled()) return;
  const sizeMB = buf.byteLength / 1024 / 1024;
  addLog(5, `세그먼트 수신 완료 (${sizeMB.toFixed(2)} MB)`, 'ok');

  const chunkSize = 512 * 1024; // 512KB 청크 단위로 쪼개서 넣음 (iOS QuotaExceededError 방지)
  let offset = 0;
  let chunkCount = 0;

  while (offset < buf.byteLength) {
    if (cancelled()) return;
    const end = Math.min(offset + chunkSize, buf.byteLength);
    const chunk = buf.slice(offset, end);
    await appendBufferAsync(sb, chunk);
    offset = end;
    chunkCount += 1;
    addLog(5, `청크 [${chunkCount}] 주입 완료 (${(offset / 1024 / 1024).toFixed(2)} MB)`);
  }

  addLog(5, '전체 appendBuffer 완료 → <video>에서 디코딩·재생 시작', 'ok');
  patchState({ segmentsLoaded: chunkCount, bytesLoaded: buf.byteLength });
  onSegment(sb);
  if (ms.readyState === 'open') {
    try {
      ms.endOfStream();
    } catch {
      // ignore
    }
  }
}
