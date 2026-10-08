import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Heart } from 'lucide-react';
import type { FakeServer, LogEntry } from '../fake-server';
import type { Toggle } from '../variants';

type Props = {
  title: string;
  subtitle: string;
  server: FakeServer;
  useToggle: (server: FakeServer) => Toggle;
};

export function HeartCard({ title, subtitle, server, useToggle }: Props) {
  const { shown, pending, toggle } = useToggle(server);
  const [trace, setTrace] = useState<{ t: number; shown: boolean }[]>([]);
  const [, bump] = useState(0);

  useEffect(() => server.subscribe(() => bump((n) => n + 1)), [server]);
  useEffect(() => {
    setTrace((prev) => [...prev, { t: server.now(), shown }]);
  }, [shown, server]);

  return (
    <Card>
      <CardHead>
        <CardTitle>{title}</CardTitle>
        <CardSub>{subtitle}</CardSub>
      </CardHead>

      <HeartButton
        type="button"
        data-lab-heart
        aria-pressed={shown}
        aria-busy={pending}
        onClick={toggle}
        $on={shown}
      >
        <Heart size={26} fill={shown ? 'currentColor' : 'none'} strokeWidth={1.8} />
      </HeartButton>
      <Status>
        <span>화면 {shown ? '❤️' : '🤍'}</span>
        <span>서버 {server.wished ? '❤️' : '🤍'}</span>
        <span>{pending ? '요청 중…' : '대기'}</span>
      </Status>

      <Label>화면 전이</Label>
      <Trace>
        {trace.map((e, i) => (
          <TraceItem key={i} title={`${e.t - (trace[0]?.t ?? 0)}ms`}>
            {e.shown ? '❤️' : '🤍'}
          </TraceItem>
        ))}
      </Trace>

      <Label>요청 로그</Label>
      <Log>
        {server.log.length === 0 && <Muted>—</Muted>}
        {server.log.map((e, i) => (
          <LogLine key={i} $kind={e.kind}>
            <time>{String(e.t - server.log[0].t).padStart(4, ' ')}ms</time> {e.text}
          </LogLine>
        ))}
      </Log>
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const CardHead = styled.div`
  margin-bottom: 12px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 15px;
`;

const CardSub = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.text.muted};
`;

const HeartButton = styled.button<{ $on: boolean }>`
  align-self: center;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 50%;
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ $on, theme }) => ($on ? '#ff4d8d' : theme.text.muted)};
  cursor: pointer;
  transition: color 120ms ease;
`;

const Status = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 10px 0 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.text.muted};
`;

const Label = styled.div`
  margin: 8px 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.text.caption};
`;

const Trace = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  min-height: 24px;
  padding: 4px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  font-size: 16px;
  line-height: 1;
`;

const TraceItem = styled.span``;

const Log = styled.div`
  flex: 1;
  min-height: 120px;
  max-height: 180px;
  overflow: auto;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.code};
  color: #e5e8eb;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 11.5px;
  line-height: 1.7;
`;

const LogLine = styled.div<{ $kind: LogEntry['kind'] }>`
  white-space: pre;
  color: ${({ $kind }) =>
    $kind === 'ok'
      ? '#7ee787'
      : $kind === 'fail'
        ? '#ff7b72'
        : $kind === 'abort'
          ? '#d2a8ff'
          : $kind === 'late'
            ? '#ffa657'
            : '#9cb3c9'};

  time {
    color: #6b7684;
  }
`;

const Muted = styled.span`
  color: #6b7684;
`;
