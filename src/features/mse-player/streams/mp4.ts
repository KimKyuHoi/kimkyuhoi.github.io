import type { StreamCtx } from '../types';
import { appendBufferAsync } from '../utils';

export async function streamMp4(asset: string, codec: string, ctx: StreamCtx) {
  const { ms, addLog, patchState, cancelled, onSegment } = ctx;
  if (!codec) throw new Error('MP4 모드는 코덱 문자열이 필요합니다.');

  const supported = MediaSource.isTypeSupported(codec);
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
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = await r.arrayBuffer();
  if (cancelled()) return;
  const sizeMB = buf.byteLength / 1024 / 1024;
  addLog(5, `세그먼트 수신 완료 (${sizeMB.toFixed(2)} MB)`, 'ok');

  await appendBufferAsync(sb, buf);
  addLog(5, 'appendBuffer 완료 → <video>에서 디코딩·재생 시작', 'ok');
  patchState({ segmentsLoaded: 1, bytesLoaded: buf.byteLength });
  onSegment(sb);
  if (ms.readyState === 'open') {
    try {
      ms.endOfStream();
    } catch {
      // ignore
    }
  }
}
