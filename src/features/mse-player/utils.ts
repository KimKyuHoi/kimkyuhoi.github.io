import { BUFFER_POLL_MS } from './constants';
import type { StreamFormat } from './types';

export const detectFormat = (url: string): StreamFormat => {
  const path = url.toLowerCase().split('?')[0];
  if (path.endsWith('.mpd')) return 'dash';
  if (path.endsWith('.m3u8')) return 'hls';
  if (path.endsWith('.mp4') || path.endsWith('.m4s') || path.endsWith('.webm')) {
    return 'mp4';
  }
  return 'unknown';
};

export const resolveUrl = (rel: string, base: string): string => {
  try {
    return new URL(rel, base).toString();
  } catch {
    return rel;
  }
};

export const fillTemplate = (tpl: string, repId: string, num: number, bandwidth: string): string =>
  tpl
    .replace(/\$RepresentationID\$/g, repId)
    .replace(/\$Bandwidth\$/g, bandwidth)
    .replace(/\$Number(?:%0(\d+)d)?\$/g, (_m, pad) => {
      const s = String(num);
      return pad ? s.padStart(parseInt(pad, 10), '0') : s;
    });

export const appendBufferAsync = (sb: SourceBuffer, buf: ArrayBuffer): Promise<void> =>
  new Promise((resolve, reject) => {
    const onEnd = () => {
      sb.removeEventListener('updateend', onEnd);
      sb.removeEventListener('error', onErr);
      resolve();
    };
    const onErr = () => {
      sb.removeEventListener('updateend', onEnd);
      sb.removeEventListener('error', onErr);
      reject(new Error('SourceBuffer 에러 (보통 잘못된 미디어 데이터)'));
    };
    sb.addEventListener('updateend', onEnd);
    sb.addEventListener('error', onErr);
    sb.appendBuffer(buf);
  });

// HLS/DASH master CODECS 문자열에서 video / audio 코덱을 분리
const VIDEO_PREFIXES = ['avc1', 'avc3', 'hvc1', 'hev1', 'av01', 'vp9', 'vp09'];
const AUDIO_PREFIXES = ['mp4a', 'opus', 'ac-3', 'ec-3'];

export const splitCodecs = (
  codecs: string
): { video: string | null; audio: string | null; all: string[] } => {
  const all = codecs
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const video = all.find((c) => VIDEO_PREFIXES.some((p) => c.toLowerCase().startsWith(p))) ?? null;
  const audio = all.find((c) => AUDIO_PREFIXES.some((p) => c.toLowerCase().startsWith(p))) ?? null;
  return { video, audio, all };
};

// 버퍼가 currentTime 기준으로 ahead초 이상 남아있는지 확인
export const getBufferAhead = (sb: SourceBuffer, currentTime: number): number => {
  if (sb.buffered.length === 0) return 0;
  let end = 0;
  for (let i = 0; i < sb.buffered.length; i += 1) {
    const s = sb.buffered.start(i);
    const e = sb.buffered.end(i);
    if (s <= currentTime + 0.1 && e > end) end = e;
  }
  // currentTime이 buffered 안에 있으면 end - currentTime, 아니면 마지막 end
  return Math.max(0, end - currentTime);
};

// 버퍼 ahead가 minAhead 미만이 될 때까지 폴링
export const waitForBufferLow = async (
  video: HTMLVideoElement,
  sb: SourceBuffer,
  minAhead: number,
  cancelled: () => boolean
): Promise<void> => {
  while (!cancelled()) {
    const ahead = getBufferAhead(sb, video.currentTime);
    if (ahead < minAhead) return;

    await new Promise((r) => setTimeout(r, BUFFER_POLL_MS));
  }
};
