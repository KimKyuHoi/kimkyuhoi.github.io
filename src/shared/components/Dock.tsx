import React, { useState } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { readingAtom } from '@/atoms/reading';
import { dockItems, isSamePath } from '@/components/navigation';
import { DOCK_GAP, DOCK_HEIGHT, media } from '@/styles/media';
import { scrollToY } from '@/utils/scroll';

type DockProps = {
  pathname: string;
  /** 지금 화면이 속한 메뉴의 주소. 어느 메뉴에도 속하지 않으면 null */
  activeTo: string | null;
};

/**
 * 폰에서 쓰는 하단 메뉴. 엄지가 닿는 화면 아래에 떠 있다.
 * 글 본문을 읽는 동안에는 같은 자리를 플레이어 바가 쓰므로 물러나 있는다.
 */
const Dock: React.FC<DockProps> = ({ pathname, activeTo }) => {
  const reading = useAtomValue(readingAtom);
  // 누른 즉시 활성 표시를 옮겨, 새 화면이 준비되기 전에도 눌렸다는 것을 알린다.
  const [pressed, setPressed] = useState<string | null>(null);
  const target = pressed ?? activeTo;

  const handleClick = (to: string) => (event: React.MouseEvent) => {
    const plainClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!plainClick) return;

    // 지금 보고 있는 화면의 메뉴를 다시 누르면 맨 위로 올라간다.
    if (isSamePath(pathname, to)) {
      event.preventDefault();
      scrollToY(0);
      return;
    }
    setPressed(to);
  };

  return (
    <Bar className="site-dock" aria-label="주 메뉴" data-hidden={reading} inert={reading}>
      {dockItems.map(({ label, to, Icon }) => (
        <Item
          key={to}
          to={to}
          aria-current={activeTo === to ? 'page' : undefined}
          data-on={target === to || undefined}
          onClick={handleClick(to)}
        >
          {target === to ? (
            <Pill
              layoutId="dock-pill"
              transition={{ type: 'spring', stiffness: 480, damping: 38 }}
            />
          ) : null}
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </Item>
      ))}
    </Bar>
  );
};

export default Dock;

const Bar = styled.nav`
  display: none;

  ${media.phone} {
    position: fixed;
    left: 50%;
    bottom: calc(${DOCK_GAP}px + env(safe-area-inset-bottom, 0px));
    z-index: 45;
    display: grid;
    /* 가운데 칸(플레이그라운드)은 이름이 길어 조금 넓게 잡는다. 320px 폭에서도 이름이 칸 안에 들어간다. */
    grid-template-columns: 1fr 1fr 1.35fr 1fr 1fr;
    width: min(440px, calc(100vw - 24px));
    height: ${DOCK_HEIGHT}px;
    padding: 6px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 24px;
    background: ${({ theme }) => theme.bg.float};
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    box-shadow: ${({ theme }) => theme.shadow.card};
    transform: translateX(-50%);
    transition:
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.25s ease;

    &[data-hidden='true'] {
      transform: translate(-50%, 16px) scale(0.96);
      opacity: 0;
      pointer-events: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Item = styled(Link)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 18px;
  color: ${({ theme }) => theme.text.muted};
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.2s ease,
    transform 0.15s ease;

  &[data-on] {
    color: ${({ theme }) => theme.text.primary};
  }

  &:active {
    transform: scale(0.92);
  }

  svg {
    position: relative;
    width: 22px;
    height: 22px;
    stroke-width: 1.9;
  }

  /* 이름은 칸보다 길어도 자르지 않는다. 가운데 정렬된 채로 양옆 칸의 빈 곳까지 쓴다. */
  span {
    position: relative;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  &[data-on] span {
    font-weight: 700;
  }
`;

const Pill = styled(motion.i)`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: ${({ theme }) => theme.bg.muted};
`;
