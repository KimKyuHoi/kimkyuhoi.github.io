import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { LOG_INTERVAL_MS } from '../constants';
import { getMediaSourceClass, isManagedMediaSource } from '../mse-compat';
import { streamMp4, streamHls, streamDash } from '../streams';
import type { LogEntry, PlayerState, StreamCtx } from '../types';
import { initialPlayerState } from '../types';
import { detectFormat } from '../utils';
import LogPanel from './LogPanel';
import StateBadges from './StateBadges';
import BufferTimeline from './BufferTimeline';
import QualitySelector from './QualitySelector';

type Props = {
  asset: string;
  codec: string;
  runId: number;
  preferredVariantId?: string;
  onVariantChange?: (id: string) => void;
};

const Player: React.FC<Props> = ({ asset, codec, runId, preferredVariantId, onVariantChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [state, setState] = useState<PlayerState>(initialPlayerState);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const queueRef = useRef<LogEntry[]>([]);
  const drainingRef = useRef(false);
  const cancelTokenRef = useRef(0);

  const drainQueue = async (token: number) => {
    drainingRef.current = true;
    while (queueRef.current.length > 0) {
      if (token !== cancelTokenRef.current) break;
      const next = queueRef.current.shift();
      if (!next) break;
      setLogs((prev) => [...prev, next]);
      await new Promise((r) => setTimeout(r, LOG_INTERVAL_MS));
    }
    drainingRef.current = false;
  };

  const addLog = (step: number, msg: string, type: LogEntry['type'] = '') => {
    queueRef.current.push({
      step,
      msg,
      type,
      id: `${Date.now()}-${Math.random()}`,
    });
    if (!drainingRef.current) {
      drainQueue(cancelTokenRef.current);
    }
  };

  const patchState = (patch: Partial<PlayerState>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    cancelTokenRef.current += 1;
    const myToken = cancelTokenRef.current;
    queueRef.current = [];
    drainingRef.current = false;

    setLogs([]);
    setState(initialPlayerState);
    setDuration(0);
    setCurrentTime(0);

    const format = detectFormat(asset);
    addLog(1, `자산 URL: ${asset}`);
    addLog(1, `포맷 감지: ${format.toUpperCase()}`, format === 'unknown' ? 'err' : 'ok');
    patchState({ format });

    // MediaSource 또는 ManagedMediaSource 생성자 획득
    const MSClass = getMediaSourceClass();
    if (!MSClass) {
      addLog(
        2,
        '❌ 이 브라우저는 MediaSource / ManagedMediaSource 어느 쪽도 지원하지 않습니다.',
        'err'
      );
      return;
    }

    const isManaged = isManagedMediaSource();
    if (isManaged) {
      addLog(2, '📱 ManagedMediaSource 감지 (iOS 17.1+)', 'ok');
      // ManagedMediaSource는 AirPlay 비활성화 또는 HLS <source> 폴백이 필수
      video.disableRemotePlayback = true;
    } else {
      addLog(2, 'MediaSource 감지 (데스크톱)');
    }

    const ms = new MSClass();
    video.src = URL.createObjectURL(ms);
    patchState({ readyState: ms.readyState });
    addLog(
      2,
      `${isManaged ? 'ManagedMediaSource' : 'MediaSource'} 생성 → readyState: ${ms.readyState}`
    );
    addLog(2, 'video.src 연결 (blob URL)');

    const updateBufferedFor = (sb: SourceBuffer) => {
      const ranges: Array<{ start: number; end: number }> = [];
      for (let i = 0; i < sb.buffered.length; i += 1) {
        ranges.push({ start: sb.buffered.start(i), end: sb.buffered.end(i) });
      }
      patchState({ bufferedRanges: ranges });
    };

    const onMetadata = () => setDuration(video.duration || 0);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);

    const ctx: StreamCtx = {
      ms,
      video,
      addLog,
      patchState,
      cancelled: () => cancelTokenRef.current !== myToken,
      onSegment: updateBufferedFor,
      preferredVariantId,
    };

    const handleSourceOpen = async () => {
      if (ctx.cancelled()) return;
      patchState({ readyState: ms.readyState });
      addLog(2, `sourceopen → readyState: ${ms.readyState}`, 'ok');
      try {
        if (format === 'mp4') {
          await streamMp4(asset, codec, ctx);
        } else if (format === 'hls') {
          await streamHls(asset, ctx);
        } else if (format === 'dash') {
          await streamDash(asset, ctx);
        } else {
          throw new Error('확장자로 포맷을 추정하지 못했습니다 (.mp4 / .m3u8 / .mpd 만 지원).');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        addLog(5, `❌ ${msg}`, 'err');
      } finally {
        if (!ctx.cancelled()) patchState({ readyState: ms.readyState });
      }
    };

    ms.addEventListener('sourceopen', handleSourceOpen);

    // ManagedMediaSource 전력 관리 이벤트
    if (isManaged) {
      const onStartStreaming = () => addLog(2, '▶️ startstreaming → 세그먼트 fetch 재개');
      const onEndStreaming = () => addLog(2, '⏸️ endstreaming → 세그먼트 fetch 일시정지 (절전)');
      (ms as EventTarget).addEventListener('startstreaming', onStartStreaming);
      (ms as EventTarget).addEventListener('endstreaming', onEndStreaming);

      return () => {
        ms.removeEventListener('sourceopen', handleSourceOpen);
        (ms as EventTarget).removeEventListener('startstreaming', onStartStreaming);
        (ms as EventTarget).removeEventListener('endstreaming', onEndStreaming);
        video.removeEventListener('loadedmetadata', onMetadata);
        video.removeEventListener('timeupdate', onTimeUpdate);
      };
    }

    return () => {
      ms.removeEventListener('sourceopen', handleSourceOpen);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [asset, codec, runId, preferredVariantId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card>
      <Video ref={videoRef} controls playsInline muted preload="metadata" />

      <StateBadges state={state} />

      {state.variants.length > 0 && onVariantChange && (
        <QualitySelector
          variants={state.variants}
          selectedId={state.selectedVariantId}
          onSelect={onVariantChange}
        />
      )}

      <BufferTimeline
        duration={duration}
        currentTime={currentTime}
        bufferedRanges={state.bufferedRanges}
      />

      <LogPanel logs={logs} />
    </Card>
  );
};

export default Player;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Video = styled.video`
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 200px;
  border-radius: 8px;
  background: #000;
  display: block;
  object-fit: contain;
`;
