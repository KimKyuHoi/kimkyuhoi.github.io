import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useSetAtom } from 'jotai';
import { ListTree, SkipBack, SkipForward } from 'lucide-react';
import { readingAtom } from '@/atoms/reading';
import { DOCK_GAP, DOCK_HEIGHT, media } from '@/styles/media';
import { scrollToY } from '@/utils/scroll';
import type { Heading } from '@/features/blog/components/ChapterSheet';

// 목차 시트는 처음 열 때 내려받는다.
const ChapterSheet = React.lazy(() => import('@/features/blog/components/ChapterSheet'));

type PlayerBarProps = {
  /** 본문 요소. 이 안의 h2를 챕터로 삼는다. */
  bodyRef: React.RefObject<HTMLElement | null>;
};

const OFFSET = 96;

/** 위치(0~1)가 progress 이하인 마지막 항목의 순번. 없으면 -1 */
const lastReached = (marks: { at: number }[], progress: number) => {
  let index = -1;
  marks.forEach((mark, i) => {
    if (progress >= mark.at - 0.001) index = i;
  });
  return index;
};

/**
 * 글을 영상처럼 탐색하는 하단 바.
 * 타임라인은 본문을 지나온 비율이고, 눈금은 h2(챕터) 위치다. 이전·다음 챕터로 건너뛸 수 있고,
 * 목차 버튼으로 전체 목차(h2·h3)를 시트로 열 수 있다. 폰에서는 하단 독과 같은 자리에 놓인다.
 */
const PlayerBar: React.FC<PlayerBarProps> = ({ bodyRef }) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const geometry = useRef({ top: 0, height: 1 });
  const [chapters, setChapters] = useState<Heading[]>([]);
  const [outline, setOutline] = useState<Heading[]>([]);
  const [current, setCurrent] = useState(-1);
  const [currentHeading, setCurrentHeading] = useState(-1);
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const setReading = useSetAtom(readingAtom);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;

    let raf = 0;
    let marks: Heading[] = [];
    let headings: Heading[] = [];

    const update = () => {
      raf = 0;
      const { top, height } = geometry.current;
      const position = window.scrollY + OFFSET - top;
      const progress = Math.min(1, Math.max(0, position / height));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;

      setCurrent(lastReached(marks, progress));
      setCurrentHeading(lastReached(headings, progress));
      setPercent(Math.round(progress * 100));
      // 본문을 읽는 동안에만 보인다. 댓글 영역에서는 물러난다.
      setVisible(position > 0 && window.scrollY < top + height - window.innerHeight * 0.4);
    };

    const measure = () => {
      const rect = body.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const height = Math.max(1, rect.height - window.innerHeight * 0.5);
      geometry.current = { top, height };
      headings = Array.from(body.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map(
        (heading) => ({
          id: heading.id,
          title: heading.textContent?.trim() || '',
          depth: heading.tagName === 'H2' ? 2 : 3,
          at: Math.min(1, (heading.getBoundingClientRect().top + window.scrollY - top) / height),
        })
      );
      marks = headings.filter((heading) => heading.depth === 2);
      setOutline(headings);
      setChapters(marks);
      update();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // 이미지가 늦게 로드되면 본문 높이가 바뀌므로 다시 잰다.
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [bodyRef]);

  // 폰에서는 이 바가 하단 독의 자리를 쓴다. 보이는 동안 독이 물러나도록 알린다.
  useEffect(() => {
    setReading(visible);
    return () => setReading(false);
  }, [visible, setReading]);

  const seekTo = (fraction: number) => {
    const { top, height } = geometry.current;
    scrollToY(top + height * fraction - OFFSET + 1);
  };

  const jump = (direction: 1 | -1) => {
    const target = chapters[current + direction];
    if (target) seekTo(target.at);
    else if (direction === -1) seekTo(0);
  };

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width);
  };

  const openSheet = () => {
    setSheetLoaded(true);
    setSheetOpen(true);
  };

  const handleSelect = (heading: Heading | null) => {
    setSheetOpen(false);
    // 시트가 내려가는 동안 뒤에서 바로 움직이기 시작하도록, 시트가 멈춰 둔 스크롤을 먼저 풀어 준다.
    window.__lenis?.start();
    seekTo(heading ? heading.at : 0);
  };

  const title = current >= 0 ? chapters[current]?.title : '도입';

  return (
    <>
      <Bar data-visible={visible} aria-label="글 탐색" inert={!visible}>
        <IconButton
          type="button"
          onClick={openSheet}
          aria-label="목차 열기"
          aria-haspopup="dialog"
          data-toc=""
        >
          <ListTree aria-hidden="true" data-outline="" />
        </IconButton>
        <IconButton type="button" onClick={() => jump(-1)} aria-label="이전 챕터">
          <SkipBack aria-hidden="true" />
        </IconButton>
        <IconButton
          type="button"
          onClick={() => jump(1)}
          aria-label="다음 챕터"
          disabled={current >= chapters.length - 1}
        >
          <SkipForward aria-hidden="true" />
        </IconButton>
        <Now>
          <ChapterTitle>{title}</ChapterTitle>
          {/* 마우스 사용자를 위한 보조 조작. 키보드와 터치로는 이전·다음 챕터 버튼과 목차를 쓴다. */}
          <Track onClick={handleTrackClick} aria-hidden="true">
            <Rail>
              <Fill ref={fillRef} />
            </Rail>
            {chapters.map((chapter) => (
              <Tick
                key={chapter.id}
                style={{ left: `${chapter.at * 100}%` }}
                title={chapter.title}
              />
            ))}
          </Track>
        </Now>
        <Percent>{percent}%</Percent>
      </Bar>

      {sheetLoaded ? (
        <React.Suspense fallback={null}>
          <ChapterSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            headings={outline}
            current={currentHeading}
            onSelect={handleSelect}
          />
        </React.Suspense>
      ) : null}
    </>
  );
};

export default PlayerBar;

const Bar = styled.nav`
  position: fixed;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 4px;
  width: min(680px, calc(100vw - 24px));
  padding: 6px 16px 6px 6px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.bg.float};
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: ${({ theme }) => theme.shadow.card};
  transform: translate(-50%, 0);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease;

  &[data-visible='false'] {
    transform: translate(-50%, 140%);
    opacity: 0;
  }

  /* 폰: 하단 독(Dock.tsx)과 같은 자리, 같은 모양. 본문에 들어서면 독이 이 바로 바뀌는 것처럼 보인다.
     제목과 진행률을 한 줄에, 타임라인을 그 아래 한 줄에 놓아 좁은 폭을 아껴 쓴다. */
  ${media.phone} {
    bottom: calc(${DOCK_GAP}px + env(safe-area-inset-bottom, 0px));
    display: grid;
    grid-template-columns: 44px 44px 44px minmax(0, 1fr) auto;
    grid-template-areas:
      'toc prev next title percent'
      'toc prev next track track';
    align-items: center;
    column-gap: 2px;
    width: min(440px, calc(100vw - 24px));
    height: ${DOCK_HEIGHT}px;
    padding: 6px 16px 6px 6px;
    border-radius: 24px;

    &[data-visible='false'] {
      transform: translate(-50%, 16px) scale(0.96);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const IconButton = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  transition: background 0.2s ease;

  /* 마우스가 있는 기기에서만. 터치 기기에서는 hover가 누른 뒤에도 남아 버튼이 계속 켜진 것처럼 보인다. */
  @media (hover: hover) {
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.bg.muted};
    }
  }

  &:active:not(:disabled) {
    background: ${({ theme }) => theme.bg.muted};
  }

  &:disabled {
    color: ${({ theme }) => theme.text.caption};
    cursor: default;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  /* 선으로 된 아이콘은 채우지 않는다. */
  svg[data-outline] {
    width: 20px;
    height: 20px;
    fill: none;
  }

  /* 넓은 화면에는 사이드바 목차가 있으므로 목차 버튼을 두지 않는다. */
  &[data-toc] {
    ${media.desktop} {
      display: none;
    }
  }

  ${media.phone} {
    grid-row: 1 / 3;
  }
`;

const Now = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
  padding: 0 8px;

  /* 폰에서는 제목과 타임라인이 바의 격자에 직접 놓인다. */
  ${media.phone} {
    display: contents;
  }
`;

const ChapterTitle = styled.span`
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.text.primary};

  ${media.phone} {
    grid-area: title;
    align-self: end;
    padding-left: 8px;
    font-size: 14px;
  }
`;

const Track = styled.div`
  position: relative;
  padding: 6px 0;
  cursor: pointer;

  ${media.phone} {
    grid-area: track;
    align-self: start;
    margin-left: 8px;
  }

  /* 손가락으로는 가는 타임라인을 정확히 누르기 어렵고, 스치기만 해도 글이 엉뚱한 곳으로 넘어간다. */
  ${media.touch} {
    pointer-events: none;
  }
`;

const Rail = styled.div`
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: ${({ theme }) => theme.bg.muted};
`;

const Fill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  transform: scaleX(0);
  transform-origin: 0 50%;
`;

// 챕터 경계. 타임라인을 배경색으로 끊어 영상 플레이어의 챕터 구분처럼 보이게 한다.
const Tick = styled.i`
  position: absolute;
  top: 6px;
  width: 3px;
  height: 4px;
  margin-left: -1px;
  background: ${({ theme }) => theme.bg.page};
`;

const Percent = styled.span`
  flex-shrink: 0;
  min-width: 3.2em;
  text-align: right;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.text.muted};

  ${media.phone} {
    grid-area: percent;
    align-self: end;
    min-width: 2.8em;
    line-height: 1.4;
  }
`;
