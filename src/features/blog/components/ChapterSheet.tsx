import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import BottomSheet from '@/components/BottomSheet';

/** 본문의 제목 하나. at은 본문 전체에서의 위치(0~1)다. */
export type Heading = { id: string; title: string; depth: 2 | 3; at: number };

type ChapterSheetProps = {
  open: boolean;
  onClose: () => void;
  headings: Heading[];
  /** 지금 읽고 있는 제목의 순번. 첫 제목에 닿기 전(도입)이면 -1 */
  current: number;
  /** 고른 제목으로 이동한다. null이면 글의 맨 처음(도입)이다. */
  onSelect: (heading: Heading | null) => void;
};

/**
 * 글의 목차를 화면 아래에서 올라오는 시트로 보여 준다.
 * 넓은 화면의 사이드바 목차를 대신하는 것으로, 플레이어 바의 목차 버튼으로 연다.
 */
const ChapterSheet: React.FC<ChapterSheetProps> = ({
  open,
  onClose,
  headings,
  current,
  onSelect,
}) => {
  const listRef = useRef<HTMLOListElement>(null);

  // 열릴 때 지금 읽는 곳이 목록 가운데에 오게 한다.
  // scrollIntoView는 바깥의 스크롤 상자까지 함께 움직이므로 쓰지 않고, 목록을 감싼 상자만 직접 스크롤한다.
  useEffect(() => {
    if (!open) return;
    const scroller = listRef.current?.parentElement;
    const item = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!scroller || !item) return;
    const offset = item.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += offset - (scroller.clientHeight - item.offsetHeight) / 2;
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="목차">
      <List ref={listRef}>
        <li>
          <Row type="button" aria-current={current < 0} onClick={() => onSelect(null)}>
            도입
          </Row>
        </li>
        {headings.map((heading, index) => (
          <li key={heading.id}>
            <Row
              type="button"
              data-depth={heading.depth}
              aria-current={index === current}
              onClick={() => onSelect(heading)}
            >
              {heading.title}
            </Row>
          </li>
        ))}
      </List>
    </BottomSheet>
  );
};

export default ChapterSheet;

const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    margin: 0;
  }
`;

const Row = styled.button`
  position: relative;
  display: block;
  width: 100%;
  min-height: 48px;
  padding: 12px 12px 12px 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  text-align: left;
  color: ${({ theme }) => theme.text.primary};
  word-break: keep-all;
  cursor: pointer;

  /* 하위 제목은 한 단 들여 쓰고 한 톤 낮춘다. */
  &[data-depth='3'] {
    min-height: 44px;
    padding-left: 32px;
    font-size: 15px;
    font-weight: 500;
    color: ${({ theme }) => theme.text.muted};
  }

  &:hover,
  &:active {
    background: ${({ theme }) => theme.bg.muted};
  }

  /* 지금 읽는 곳: 왼쪽에 막대를 세우고 강조색으로 쓴다. */
  &[aria-current='true'] {
    font-weight: 700;
    color: ${({ theme }) => theme.accent};
  }

  &[aria-current='true']::before {
    content: '';
    position: absolute;
    top: 14px;
    bottom: 14px;
    left: 4px;
    width: 3px;
    border-radius: 2px;
    background: ${({ theme }) => theme.accent};
  }
`;
