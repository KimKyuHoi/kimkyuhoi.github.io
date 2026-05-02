import React from 'react';
import styled from '@emotion/styled';
import type { PlayerState } from '../types';

type Props = {
  state: PlayerState;
};

const StateBadges: React.FC<Props> = ({ state }) => (
  <Row>
    <Badge tone="info">
      포맷: <strong>{state.format.toUpperCase()}</strong>
    </Badge>
    <Badge tone={state.readyState === 'open' || state.readyState === 'ended' ? 'ok' : 'idle'}>
      MediaSource.readyState: <strong>{state.readyState}</strong>
    </Badge>
    <Badge tone={state.codecSupported === null ? 'idle' : state.codecSupported ? 'ok' : 'err'}>
      isTypeSupported:{' '}
      <strong>{state.codecSupported === null ? '-' : String(state.codecSupported)}</strong>
    </Badge>
    <Badge tone={state.sourceBufferReady ? 'ok' : 'idle'}>
      SourceBuffer: <strong>{state.sourceBufferReady ? 'ready' : 'idle'}</strong>
    </Badge>
    {state.segmentsLoaded > 0 && (
      <Badge tone="ok">
        segments: <strong>{state.segmentsLoaded}</strong>
      </Badge>
    )}
    {state.bytesLoaded > 0 && (
      <Badge tone="ok">
        받은 데이터: <strong>{(state.bytesLoaded / 1024 / 1024).toFixed(2)} MB</strong>
      </Badge>
    )}
  </Row>
);

export default StateBadges;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Badge = styled.span<{ tone: 'ok' | 'err' | 'idle' | 'info' }>`
  font-size: 11.5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.font.mono};
  background: ${({ tone, theme }) => {
    if (tone === 'ok') return 'rgba(74, 222, 128, 0.12)';
    if (tone === 'err') return 'rgba(248, 113, 113, 0.12)';
    if (tone === 'info') return 'rgba(96, 165, 250, 0.12)';
    return theme.bg.muted;
  }};
  color: ${({ tone, theme }) => {
    if (tone === 'ok') return '#16a34a';
    if (tone === 'err') return '#dc2626';
    if (tone === 'info') return '#2563eb';
    return theme.text.muted;
  }};

  strong {
    font-weight: 700;
    color: inherit;
  }
`;
