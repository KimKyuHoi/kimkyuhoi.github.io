import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { FakeServer } from './fake-server';
import {
  useActionToggle,
  useBlockingToggle,
  useDebouncedToggle,
  useNaiveOptimisticToggle,
  useOptimisticOnlyToggle,
} from './variants';
import { HeartCard } from './components/HeartCard';
import { Controls } from './components/Controls';

const VARIANTS = [
  {
    id: 'blocking',
    title: '1. 차단형 (원래 코드)',
    subtitle: '응답이 와야 하트가 바뀐다. 요청 중 클릭은 버려진다.',
    useToggle: useBlockingToggle,
  },
  {
    id: 'naive',
    title: '2. 즉시 반영 (useState)',
    subtitle: '클릭마다 화면 먼저, 요청 1건. 응답이 화면을 덮어쓴다.',
    useToggle: useNaiveOptimisticToggle,
  },
  {
    id: 'optimistic',
    title: '3. useOptimistic만',
    subtitle: 'debounce·abort 없이 Action만. 연타해도 마지막 의도만 남는다.',
    useToggle: useOptimisticOnlyToggle,
  },
  {
    id: 'debounce',
    title: '4. + debounce 400ms',
    subtitle: '연타를 모아 마지막 의도만 보낸다. 반영 중 반대 클릭은?',
    useToggle: useDebouncedToggle,
  },
  {
    id: 'action',
    title: '5. useOptimistic + abort',
    subtitle: '클릭 하나 = AbortController 하나. 롤백은 React 가 한다.',
    useToggle: useActionToggle,
  },
] as const;

export function OptimisticLabPage() {
  const [runId, setRunId] = useState(0);
  const [latency, setLatency] = useState(1200);
  const [failing, setFailing] = useState(false);
  const servers = useMemo(() => VARIANTS.map(() => new FakeServer()), []);

  const applyLatency = (ms: number) => {
    setLatency(ms);
    servers.forEach((s) => (s.latency = ms));
  };
  const applyFailing = (on: boolean) => {
    setFailing(on);
    servers.forEach((s) => (s.failing = on));
  };

  return (
    <>
      <Controls
        latency={latency}
        onLatency={applyLatency}
        failing={failing}
        onFailing={applyFailing}
        onReset={() => {
          servers.forEach((s) => s.reset());
          applyFailing(false);
          setRunId((n) => n + 1);
        }}
      />

      <Grid>
        {VARIANTS.map((v, i) => (
          <HeartCard
            key={`${v.id}-${runId}`}
            title={v.title}
            subtitle={v.subtitle}
            server={servers[i]}
            useToggle={v.useToggle}
          />
        ))}
      </Grid>

      <Legend>
        <span>❤️🤍 화면 전이 — 한 번 눌렀는데 세 칸 이상이면 깜빡임</span>
        <span>
          <Dot $c="#9cb3c9" /> 전송 <Dot $c="#7ee787" /> 성공 <Dot $c="#ff7b72" /> 실패{' '}
          <Dot $c="#d2a8ff" /> 클라이언트 취소 <Dot $c="#ffa657" /> 취소했지만 서버는 처리함
        </span>
      </Legend>
    </>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.text.muted};
`;

const Dot = styled.i<{ $c: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 4px 0 2px;
  border-radius: 50%;
  background: ${({ $c }) => $c};
  vertical-align: middle;
`;
