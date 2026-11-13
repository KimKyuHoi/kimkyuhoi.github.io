import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

interface TocProps {
  tableOfContents?: string | null;
}

// 제목이 화면 위에서 이만큼 내려온 지점을 지나면 "지금 읽는 곳"으로 본다 (고정 헤더 + 여유).
const READING_LINE = 120;

const Toc: React.FC<TocProps> = ({ tableOfContents }) => {
  const wrapperRef = useRef<HTMLElement>(null);

  // 지금 읽고 있는 제목을 목차에서 표시한다.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const links = Array.from(wrapper.querySelectorAll<HTMLAnchorElement>('a[href*="#"]'));
    const headings = links.map((link) =>
      document.getElementById(decodeURIComponent(link.hash.slice(1)))
    );
    let active = -1;
    let raf = 0;

    const update = () => {
      raf = 0;
      let index = -1;
      headings.forEach((heading, i) => {
        if (heading && heading.getBoundingClientRect().top <= READING_LINE) index = i;
      });
      if (index === active) return;

      links[active]?.removeAttribute('aria-current');
      active = index;
      const link = links[index];
      if (!link) return;
      link.setAttribute('aria-current', 'location');

      // 목차가 길어 자체 스크롤이 생겼을 때, 표시된 항목이 목차 안에서 보이게 한다.
      const top = link.offsetTop;
      if (top < wrapper.scrollTop) wrapper.scrollTop = top - 12;
      else if (top + link.offsetHeight > wrapper.scrollTop + wrapper.clientHeight) {
        wrapper.scrollTop = top + link.offsetHeight - wrapper.clientHeight + 12;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [tableOfContents]);

  if (!tableOfContents) return null;
  return (
    <Wrapper ref={wrapperRef} aria-label="목차" data-lenis-prevent="">
      <Title>목차</Title>
      <div dangerouslySetInnerHTML={{ __html: tableOfContents }} />
    </Wrapper>
  );
};

export default Toc;

const Wrapper = styled.nav`
  position: sticky;
  top: 120px;
  padding: 16px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.soft};
  max-height: calc(100vh - 160px);
  overflow: auto;

  /* Reset all list styles inside TOC */
  ul,
  li,
  p {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ul {
    margin-bottom: 0;
  }

  li {
    margin-bottom: 6px;
    line-height: 1.6;
  }

  /* Visual hierarchy for nested lists */
  li > ul {
    margin-left: 8px;
    padding-left: 12px;
    border-left: 1px solid ${({ theme }) => theme.border};
    margin-top: 6px;
    margin-bottom: 6px;
  }

  a {
    color: ${({ theme }) => theme.text.muted};
    font-size: 14px;
    text-decoration: none;
    display: block;
    transition:
      color 0.2s ease,
      transform 0.2s ease;

    /* Text truncation */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      transform: translateX(4px);
      color: ${({ theme }) => theme.accent};
    }

    &[aria-current='location'] {
      color: ${({ theme }) => theme.accent};
      font-weight: 700;
    }
  }
`;

const Title = styled.div`
  font-weight: 800;
  margin-bottom: 10px;
`;
