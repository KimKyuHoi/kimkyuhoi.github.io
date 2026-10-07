import React, { useState } from 'react';
import styled from '@emotion/styled';
import { DEBOUNCE_MS } from '../variants';

type Props = {
  latency: number;
  onLatency: (ms: number) => void;
  failing: boolean;
  onFailing: (on: boolean) => void;
  onReset: () => void;
};

function clickAllHearts() {
  document.querySelectorAll<HTMLButtonElement>('[data-lab-heart]').forEach((b) => b.click());
}

export function Controls({ latency, onLatency, failing, onFailing, onReset }: Props) {
  const [running, setRunning] = useState(false);

  const run = (offsets: number[], after?: () => void) => {
    setRunning(true);
    offsets.forEach((ms) => setTimeout(clickAllHearts, ms));
    setTimeout(
      () => {
        after?.();
        setRunning(false);
      },
      Math.max(...offsets) + DEBOUNCE_MS + latency + 200
    );
  };

  const runFailure = () => {
    const wasOn = failing;
    onFailing(true);
    run([0], () => onFailing(wasOn));
  };

  return (
    <Bar>
      <Field>
        <label htmlFor="lab-latency">서버 지연 {latency}ms</label>
        <input
          id="lab-latency"
          type="range"
          min={300}
          max={3000}
          step={100}
          value={latency}
          onChange={(e) => onLatency(Number(e.target.value))}
        />
      </Field>

      <Switch $on={failing}>
        <input
          type="checkbox"
          checked={failing}
          disabled={running}
          onChange={(e) => onFailing(e.target.checked)}
        />
        <Knob aria-hidden="true" />
        <span>서버 실패 모드</span>
        <State>{failing ? 'ON' : 'OFF'}</State>
      </Switch>

      <Buttons>
        <Btn disabled={running} onClick={() => run([0])}>
          한 번 클릭
        </Btn>
        <Btn disabled={running} onClick={() => run([0, 150, 300])}>
          연타 3회
        </Btn>
        <Btn disabled={running} onClick={() => run([0, DEBOUNCE_MS + Math.round(latency / 2)])}>
          반영 중 반대 클릭
        </Btn>
        <Btn disabled={running} onClick={runFailure}>
          실패 시 롤백
        </Btn>
        <Btn disabled={running} onClick={onReset} $ghost>
          초기화
        </Btn>
      </Buttons>
    </Bar>
  );
}

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.bg.muted};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  min-width: 220px;

  input {
    width: 100%;
  }
`;

const Switch = styled.label<{ $on: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $on, theme }) => ($on ? '#e5484d' : theme.text.primary)};
  cursor: pointer;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const State = styled.b`
  display: inline-block;
  min-width: 2.4em;
`;

const Knob = styled.i`
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: ${({ theme }) => theme.border};
  transition: background 120ms ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform 120ms ease;
  }

  input:checked + & {
    background: #e5484d;
  }
  input:checked + &::after {
    transform: translateX(14px);
  }
  input:disabled + & {
    opacity: 0.5;
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const Btn = styled.button<{ $ghost?: boolean }>`
  padding: 8px 12px;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme, $ghost }) => ($ghost ? theme.border : theme.accent)};
  background: ${({ theme, $ghost }) => ($ghost ? 'transparent' : theme.accent)};
  color: ${({ theme, $ghost }) => ($ghost ? theme.text.primary : theme.text.inverse)};
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
