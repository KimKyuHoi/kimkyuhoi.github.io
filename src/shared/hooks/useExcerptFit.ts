import { useEffect } from 'react';
import type { RefObject } from 'react';

type Parts = { title: HTMLElement; excerpt: HTMLElement };
type ElementRef = RefObject<HTMLElement | null>;

// 카드가 많은 목록에서도 한 번에 재도록 관찰자 하나를 모든 카드가 함께 쓴다.
const cards = new Map<HTMLElement, Parts>();
const owners = new WeakMap<Element, HTMLElement>();
let observer: ResizeObserver | null = null;

const countLines = (block: HTMLElement, { title, excerpt }: Parts) => {
  const line = parseFloat(getComputedStyle(excerpt).lineHeight);
  if (!line) return null;
  const gap = parseFloat(getComputedStyle(block).rowGap) || 0;
  const room = block.clientHeight - title.offsetHeight - gap;
  // 높이는 정수로 반올림되어 나오므로 1px의 여유를 둔다.
  return Math.max(1, Math.floor((room + 1) / line));
};

const fit = (entries: ResizeObserverEntry[]) => {
  const blocks = new Set<HTMLElement>();
  entries.forEach((entry) => {
    const block = owners.get(entry.target);
    if (block) blocks.add(block);
  });

  // 읽기를 모두 끝낸 뒤에 쓴다. 카드마다 읽고 쓰기를 번갈아 하면 그때마다 레이아웃을 다시 계산하게 된다.
  const results = [...blocks].map((block) => {
    const parts = cards.get(block);
    return [block, parts ? countLines(block, parts) : null] as const;
  });
  results.forEach(([block, lines]) => {
    if (lines) block.style.setProperty('--excerpt-lines', String(lines));
  });
};

/**
 * 글 카드에서 제목과 설명은 정해진 높이를 나눠 쓴다. 제목이 길수록 설명에 남는 줄이 줄어들므로,
 * 남은 자리에 들어가는 줄 수를 재서 `--excerpt-lines`에 적어 둔다. 스타일은 이 줄 수에서 말줄임표를 붙인다.
 * 이 값이 없을 때(스크립트가 돌기 전)에도 넘치는 줄은 줄 경계에서 잘려 있으므로 카드 높이는 변하지 않는다.
 */
const useExcerptFit = (blockRef: ElementRef, titleRef: ElementRef, excerptRef: ElementRef) => {
  useEffect(() => {
    const block = blockRef.current;
    const title = titleRef.current;
    const excerpt = excerptRef.current;
    if (!block || !title || !excerpt || typeof ResizeObserver === 'undefined') return undefined;

    observer ??= new ResizeObserver(fit);
    const shared = observer;
    cards.set(block, { title, excerpt });
    owners.set(block, block);
    owners.set(title, block);
    shared.observe(block);
    shared.observe(title);

    return () => {
      shared.unobserve(block);
      shared.unobserve(title);
      cards.delete(block);
    };
  }, [blockRef, titleRef, excerptRef]);
};

export default useExcerptFit;
