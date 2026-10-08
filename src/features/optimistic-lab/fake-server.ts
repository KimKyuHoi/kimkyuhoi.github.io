export type LogKind = 'req' | 'ok' | 'fail' | 'abort' | 'late';
export type LogEntry = { t: number; kind: LogKind; text: string };

type Listener = () => void;

export class FakeServer {
  wished = false;
  latency = 1200;
  failing = false;
  log: LogEntry[] = [];
  private listeners = new Set<Listener>();
  private epoch = performance.now();

  now() {
    return Math.round(performance.now() - this.epoch);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private push(kind: LogKind, text: string) {
    this.log = [...this.log, { t: this.now(), kind, text }];
    this.emit();
  }

  reset() {
    this.wished = false;
    this.log = [];
    this.epoch = performance.now();
    this.emit();
  }

  set(wished: boolean, signal?: AbortSignal): Promise<void> {
    const method = wished ? 'POST' : 'DELETE';
    const fail = this.failing;
    this.push('req', `${method} 전송`);

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      setTimeout(() => {
        if (fail) {
          this.push('fail', `${method} 500`);
          if (!settled) {
            settled = true;
            reject(new Error('500'));
          }
          return;
        }
        this.wished = wished;
        if (settled) {
          this.push('late', `${method} 서버는 처리함 (클라이언트는 이미 취소)`);
          this.emit();
          return;
        }
        settled = true;
        this.push('ok', `${method} ${wished ? '201' : '204'}`);
        resolve();
      }, this.latency);

      signal?.addEventListener('abort', () => {
        if (settled) return;
        settled = true;
        this.push('abort', `${method} 클라이언트 취소`);
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });
  }
}
