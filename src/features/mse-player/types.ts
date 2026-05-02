export type StreamFormat = 'mp4' | 'hls' | 'dash' | 'unknown';

export type Variant = {
  id: string;
  label: string;
  bandwidth: number;
  codec: string;
  width?: number;
  height?: number;
  url?: string;
  repId?: string;
};

export type Preset = {
  id: string;
  label: string;
  description: string;
  asset: string;
  codec: string;
  category: 'works' | 'edu';
};

export type LogEntry = {
  step: number;
  msg: string;
  type: 'ok' | 'err' | '';
  id: string;
};

export type PlayerState = {
  format: StreamFormat;
  readyState: 'closed' | 'open' | 'ended' | string;
  codecResolved: string | null;
  codecSupported: boolean | null;
  sourceBufferReady: boolean;
  segmentsLoaded: number;
  bytesLoaded: number;
  bufferedRanges: Array<{ start: number; end: number }>;
  variants: Variant[];
  selectedVariantId: string | null;
};

export const initialPlayerState: PlayerState = {
  format: 'unknown',
  readyState: 'closed',
  codecResolved: null,
  codecSupported: null,
  sourceBufferReady: false,
  segmentsLoaded: 0,
  bytesLoaded: 0,
  bufferedRanges: [],
  variants: [],
  selectedVariantId: null,
};

export type StreamCtx = {
  ms: MediaSource;
  video: HTMLVideoElement;
  addLog: (step: number, msg: string, type?: LogEntry['type']) => void;
  patchState: (p: Partial<PlayerState>) => void;
  cancelled: () => boolean;
  onSegment: (sb: SourceBuffer) => void;
  preferredVariantId?: string;
};
