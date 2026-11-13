import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { SkipBack, SkipForward } from 'lucide-react';

type Chapter = { id: string; title: string; at: number };

type PlayerBarProps = {
  /** 본문 요소. 이 안의 h2를 챕터로 삼는다. */
  bodyRef: React.RefObject<HTMLElement | null>;
};

const OFFSET = 96;

const scrollToY = (y: number) => {
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
};

/**
 * 글을 영상처럼 탐색하는 하단 바.
 * 타임라인은 본문을 지나온 비율이고, 눈금은 h2(챕터) 위치다. 이전·다음 챕터로 건너뛸 수 있다.
 */
const PlayerBar: React.FC<PlayerBarProps> = ({ bodyRef }) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const geometry = useRef({ top: 0, height: 1 });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [current, setCurrent] = useState(-1);
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;

    let raf = 0;
    let marks: Chapter[] = [];

    const update = () => {
      raf = 0;
      const { top, height } = geometry.current;
      const position = window.scrollY + OFFSET - top;
      const progress = Math.min(1, Math.max(0, position / height));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;

      let index = -1;
      marks.forEach((mark, i) => {
        if (progress >= mark.at - 0.001) index = i;
      });
      setCurrent(index);
      setPercent(Math.round(progress * 100));
      // 본문을 읽는 동안에만 보인다. 댓글 영역에서는 물러난다.
      setVisible(position > 0 && window.scrollY < top + height - window.innerHeight * 0.4);
    };

    const measure = () => {
      const rect = body.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const height = Math.max(1, rect.height - window.innerHeight * 0.5);
      geometry.current = { top, height };
      marks = Array.from(body.querySelectorAll<HTMLElement>('h2[id]')).map((heading) => ({
        id: heading.id,
        title: heading.textContent?.trim() || '',
        at: Math.min(1, (heading.getBoundingClientRect().top + window.scrollY - top) / height),
      }));
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

  const title = current >= 0 ? chapters[current]?.title : '도입';

  return (
    <Bar data-visible={visible} aria-label="글 탐색" inert={!visible}>
      <SkipButton type="button" onClick={() => jump(-1)} aria-label="이전 챕터">
        <SkipBack aria-hidden="true" />
      </SkipButton>
      <SkipButton
        type="button"
        onClick={() => jump(1)}
        aria-label="다음 챕터"
        disabled={current >= chapters.length - 1}
      >
        <SkipForward aria-hidden="true" />
      </SkipButton>
      <Now>
        <ChapterTitle>{title}</ChapterTitle>
        {/* 마우스 사용자를 위한 보조 조작. 키보드로는 이전·다음 챕터 버튼을 쓴다. */}
        <Track onClick={handleTrackClick} aria-hidden="true">
          <Rail>
            <Fill ref={fillRef} />
          </Rail>
          {chapters.map((chapter) => (
            <Tick key={chapter.id} style={{ left: `${chapter.at * 100}%` }} title={chapter.title} />
          ))}
        </Track>
      </Now>
      <Percent>{percent}%</Percent>
    </Bar>
  );
};

export default PlayerBar;

const Bar = styled.nav`
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 4px;
  width: min(680px, calc(100vw - 24px));
  padding: 6px 16px 6px 6px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.bg.header};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  transform: translate(-50%, 0);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease;

  &[data-visible='false'] {
    transform: translate(-50%, 140%);
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SkipButton = styled.button`
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

  &:hover:not(:disabled) {
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
`;

const Now = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
  padding: 0 8px;
`;

const ChapterTitle = styled.span`
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.text.primary};
`;

const Track = styled.div`
  position: relative;
  padding: 6px 0;
  cursor: pointer;
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
`;
