/**
 * 페이지 전환. 브라우저의 View Transitions API로 이전 화면과 새 화면을 부드럽게 잇는다.
 * 지원하지 않는 브라우저와 모션 줄이기 설정에서는 아무것도 하지 않고 평소처럼 이동한다.
 */
type Navigate = ((to: string, options?: unknown) => unknown) & { withTransition?: boolean };

declare global {
  interface Window {
    ___navigate?: Navigate;
    ___loader?: { loadPage: (path: string) => Promise<unknown> };
  }
}

const TITLE_NAME = 'post-title';
// 전환이 시작되면 새 화면이 준비될 때까지 화면이 멈춘다. 이 시간을 넘기면 기다리지 않고 풀어 준다.
const MAX_FREEZE_MS = 1000;
const MAX_PREFETCH_MS = 1500;

let finish: (() => void) | null = null;
let morphSource: HTMLElement | null = null;

const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * 전환이 새 화면을 기다리는 동안 브라우저는 화면 갱신을 멈추고, requestAnimationFrame 콜백도 돌리지 않는다.
 * 그런데 Gatsby의 라우터(@gatsbyjs/reach-router)는 주소가 바뀐 뒤의 렌더링을 requestAnimationFrame으로 미룬다.
 * 그대로 두면 서로를 기다리며 멈추므로, 그 짧은 구간에만 프레임 콜백을 타이머로 대신 돌려 준다.
 * 돌려받은 함수를 호출하면 원래대로 되돌린다.
 */
const runFramesOnTimers = () => {
  const nativeRequest = window.requestAnimationFrame;
  const nativeCancel = window.cancelAnimationFrame;
  const timers = new Map<number, number>();
  // 브라우저가 발급하는 id(양수)와 겹치지 않도록 음수 id를 쓴다.
  let nextId = -1;

  window.requestAnimationFrame = (callback) => {
    const id = nextId--;
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        callback(performance.now());
      }, 0)
    );
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const timer = timers.get(id);
    if (timer === undefined) {
      nativeCancel.call(window, id);
      return;
    }
    window.clearTimeout(timer);
    timers.delete(id);
  };

  return () => {
    window.requestAnimationFrame = nativeRequest;
    window.cancelAnimationFrame = nativeCancel;
  };
};

const clearTitleMorph = () => {
  morphSource?.style.removeProperty('view-transition-name');
  morphSource = null;
};

/** 글 카드를 눌렀을 때, 카드 제목이 글 페이지의 제목으로 이어지며 커지도록 표시해 둔다. */
export const markTitleMorph = (title: HTMLElement | null) => {
  if (!title || !document.startViewTransition) return;
  clearTitleMorph();
  // 지금 화면에 같은 이름을 쓰는 제목(글 페이지의 h1)이 있으면 이름이 겹쳐 전환 전체가 취소된다. 먼저 떼어 둔다.
  document.querySelectorAll<HTMLElement>('[data-morph-title]').forEach((current) => {
    current.style.setProperty('view-transition-name', 'none');
  });
  title.style.setProperty('view-transition-name', TITLE_NAME);
  morphSource = title;
};

/** Gatsby의 페이지 이동 함수를 감싸, 다른 페이지로 갈 때 화면 전환을 입힌다. */
export const installPageTransitions = () => {
  const original = window.___navigate;
  if (!document.startViewTransition || !original || original.withTransition) return;

  const navigate: Navigate = (to, options) => {
    // navigate(-1)처럼 숫자로 호출되는 기록 이동은 그대로 넘긴다.
    if (typeof to !== 'string') return original(to, options);

    const target = new URL(to, window.location.href);
    const samePage = normalize(target.pathname) === normalize(window.location.pathname);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (samePage || reduceMotion || finish) {
      clearTitleMorph();
      return original(to, options);
    }

    // 다음 페이지의 데이터를 먼저 받아 둔다. 보통은 링크가 보일 때 이미 받아져 있다.
    const prefetched = window.___loader
      ? Promise.race([window.___loader.loadPage(target.pathname), wait(MAX_PREFETCH_MS)])
      : Promise.resolve();

    return prefetched
      .catch(() => undefined)
      .then(() => {
        const root = document.documentElement;
        root.dataset.pageTransition = 'on';

        const transition = document.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              const restoreFrames = runFramesOnTimers();
              const timer = window.setTimeout(() => finish?.(), MAX_FREEZE_MS);
              finish = () => {
                window.clearTimeout(timer);
                restoreFrames();
                finish = null;
                resolve();
              };
              original(to, options);
            })
        );

        transition.finished
          .catch(() => undefined)
          .finally(() => {
            delete root.dataset.pageTransition;
            clearTitleMorph();
          });
      });
  };

  navigate.withTransition = true;
  window.___navigate = navigate;
};

/** 새 페이지가 그려진 뒤(onRouteUpdate)에 호출해 전환을 마무리한다. */
export const completePageTransition = () => {
  // 타이머로 한 박자 미뤄, 새 페이지의 effect가 끝난 뒤에 새 화면의 스냅샷이 찍히게 한다.
  window.setTimeout(() => finish?.(), 0);
};
