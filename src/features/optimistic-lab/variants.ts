import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import type { FakeServer } from './fake-server';

export const DEBOUNCE_MS = 400;

export type Toggle = { shown: boolean; pending: boolean; toggle: () => void };

export function useBlockingToggle(server: FakeServer): Toggle {
  const [shown, setShown] = useState(false);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const next = !shown;
    setPending(true);
    try {
      await server.set(next);
      setShown(next);
    } catch {
      /* 실패: 그대로 */
    } finally {
      setPending(false);
    }
  };

  return { shown, pending, toggle };
}

export function useNaiveOptimisticToggle(server: FakeServer): Toggle {
  const [shown, setShown] = useState(false);
  const [inFlight, setInFlight] = useState(0);

  const toggle = () => {
    const next = !shown;
    setShown(next);
    setInFlight((n) => n + 1);
    server
      .set(next)
      .then(() => setShown(next))
      .catch(() => setShown(!next))
      .finally(() => setInFlight((n) => n - 1));
  };

  return { shown, pending: inFlight > 0, toggle };
}

export function useDebouncedToggle(server: FakeServer): Toggle {
  const [shown, setShown] = useState(false);
  const [inFlight, setInFlight] = useState(0);
  const desiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    const next = !desiredRef.current;
    desiredRef.current = next;
    setShown(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setInFlight((n) => n + 1);
      server
        .set(next)
        .then(() => setShown(next))
        .catch(() => setShown(!next))
        .finally(() => setInFlight((n) => n - 1));
    }, DEBOUNCE_MS);
  };

  return { shown, pending: inFlight > 0, toggle };
}

export function useOptimisticOnlyToggle(server: FakeServer): Toggle {
  const [value, setValue] = useState(false);
  const [shown, show] = useOptimistic(value);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !shown;
    startTransition(async () => {
      show(next);
      try {
        await server.set(next);
        startTransition(() => setValue(next));
      } catch {
        /* 실패: value 가 안 바뀌었으니 transition 이 끝나면 원래 값으로 */
      }
    });
  };

  return { shown, pending, toggle };
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

type Attempt = {
  controller: AbortController;
  sent: boolean; // 요청이 서버로 출발했는지
  settled: boolean; // 응답을 받아 서버 상태가 확정됐는지
  unsure: boolean; // 이전 요청 때문에 서버 상태를 확신할 수 없는지
};

export function useActionToggle(server: FakeServer): Toggle {
  const [value, setValue] = useState(false);
  const [shown, show] = useOptimistic(value);
  const [pending, startTransition] = useTransition();
  const lastRef = useRef<Attempt | null>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const toggle = () => {
    const next = !shown;
    const prev = lastRef.current;
    prev?.controller.abort();
    const attempt: Attempt = {
      controller: new AbortController(),
      sent: false,
      settled: false,
      unsure: !!prev && !prev.settled && (prev.sent || prev.unsure),
    };
    lastRef.current = attempt;
    const { signal } = attempt.controller;

    startTransition(async () => {
      show(next);
      await sleep(DEBOUNCE_MS, signal);
      if (signal.aborted) return;
      // 서버 상태를 확실히 아는데 그 값으로 돌아왔다면 보낼 요청이 없다
      if (!attempt.unsure && next === valueRef.current) return;
      attempt.sent = true;
      try {
        await server.set(next, signal);
        if (signal.aborted) return;
        attempt.settled = true;
        setValue(next);
      } catch {
        if (signal.aborted) return;
        attempt.settled = true;
        /* 실패: value 가 안 바뀌었으니 transition 이 끝나면 원래 값으로 */
      }
    });
  };

  return { shown, pending, toggle };
}
