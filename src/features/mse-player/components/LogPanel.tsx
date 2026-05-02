import React from 'react';
import styled from '@emotion/styled';
import type { LogEntry } from '../types';

type Props = {
  logs: LogEntry[];
};

const LogPanel: React.FC<Props> = ({ logs }) => (
  <Panel>
    {logs.map((l) => (
      <Line key={l.id}>
        <Step>[{l.step}단계]</Step>
        <Msg logType={l.type}>{l.msg}</Msg>
      </Line>
    ))}
    {logs.length === 0 && <Dim>초기화 중...</Dim>}
  </Panel>
);

export default LogPanel;

const Panel = styled.div`
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 8px;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12.5px;
  line-height: 1.7;
  min-height: 200px;
  max-height: 360px;
  overflow-y: auto;
`;

const Line = styled.div`
  display: block;
  animation: log-fade-in 0.22s ease-out;

  @keyframes log-fade-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Step = styled.span`
  color: #60a5fa;
  font-weight: 700;
  margin-right: 6px;
`;

const Msg = styled.span<{ logType: 'ok' | 'err' | '' }>`
  color: ${({ logType }) =>
    logType === 'ok' ? '#4ade80' : logType === 'err' ? '#f87171' : 'inherit'};
`;

const Dim = styled.span`
  color: #64748b;
`;
