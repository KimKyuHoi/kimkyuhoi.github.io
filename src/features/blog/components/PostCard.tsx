import React, { useRef } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import SpotlightCard from '@/reactbits/SpotlightCard';
import { useThemeMode } from '@/hooks/useThemeMode';
import useExcerptFit from '@/hooks/useExcerptFit';
import { markTitleMorph } from '@/motion/pageTransition';
import { media } from '@/styles/media';
import {
  budgetBlock,
  budgetExcerpt,
  budgetLines,
  budgetTitle,
  budgetType,
} from '@/styles/lineBudget';

interface PostCardProps {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  category?: string;
  excerpt?: string;
  hero?: string;
  tags?: string[];
  /** 카드 제목의 제목 수준. 목록 페이지의 문서 구조에 맞춰 고른다. */
  headingLevel?: 'h2' | 'h3';
}

export const categoryPath = (category: string) =>
  `/posts/?category=${encodeURIComponent(category)}`;
export const tagPath = (tag: string) => `/posts/?tag=${encodeURIComponent(tag)}`;

const PostCard: React.FC<PostCardProps> = ({
  slug,
  title,
  description,
  date,
  category = '기타',
  excerpt,
  tags,
  headingLevel = 'h3',
}) => {
  const { mode } = useThemeMode();
  const textRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const excerptRef = useRef<HTMLParagraphElement>(null);
  useExcerptFit(textRef, titleRef, excerptRef);

  // 새 탭으로 여는 클릭이 아니라면, 이 카드의 제목이 글 페이지의 제목으로 이어지게 한다.
  const handleOpen = (event: React.MouseEvent) => {
    const plainClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (plainClick) markTitleMorph(titleRef.current);
  };

  return (
    <Card className="reveal-on-scroll">
      <SpotlightCard
        theme={mode}
        spotlightColor="#3182f6"
        intensity={0.22}
        spotlightSize={320}
        borderGlow={0.9}
        style={
          {
            '--spotlight-card-surface': 'var(--bg-surface)',
            '--spotlight-card-border': 'var(--border)',
            '--spotlight-card-shadow': 'none',
          } as React.CSSProperties
        }
      >
        <Content>
          <Text ref={textRef}>
            <Title as={headingLevel} ref={titleRef}>
              {/* 제목 링크의 ::after가 카드 전체를 덮어, 카드 어디를 눌러도 글로 이동한다. */}
              <TitleLink to={slug} onClick={handleOpen}>
                {title}
              </TitleLink>
            </Title>
            <Excerpt ref={excerptRef}>{description || excerpt}</Excerpt>
          </Text>
          <Footer>
            <Meta>
              <CategoryLink to={categoryPath(category)}>{category}</CategoryLink>
              <time>{date}</time>
            </Meta>
            {tags && tags.length ? (
              <Tags>
                {tags.map((tag) => (
                  <li key={tag}>
                    <TagLink to={tagPath(tag)}>{tag}</TagLink>
                  </li>
                ))}
              </Tags>
            ) : null}
          </Footer>
        </Content>
      </SpotlightCard>
    </Card>
  );
};

export default PostCard;

// 카드가 좁을 때(폰의 한 단)와 넓을 때를 가르는 카드 자신의 폭. 화면 폭이 아니라 카드 폭으로 판단해야
// 사이드바 옆에 놓인 카드와 전체 폭을 쓰는 카드가 각자 맞는 규격을 고른다.
const NARROW_CARD = '(max-width: 479px)';
const WIDE_CARD = '(min-width: 800px)';

const Card = styled.article`
  container: post-card / inline-size;
  border-radius: ${({ theme }) => theme.radius.xl};

  /* React Bits SpotlightCard의 기본 여백과 모서리를 블로그 카드 규격으로 덮어쓴다. */
  .spotlight-card {
    padding: 24px;
    border-radius: ${({ theme }) => theme.radius.xl};
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* 마우스가 있는 기기에서만 떠오른다. 터치 기기에서는 hover가 누른 뒤에도 남아 카드가 떠 있는 채로 굳는다. */
  @media (hover: hover) {
    &:hover .spotlight-card {
      transform: translateY(-4px);
    }
  }

  /* 손가락으로 누르는 동안에는 살짝 눌린다. */
  @media (hover: none) {
    &:active .spotlight-card {
      transform: scale(0.985);
    }
  }

  @media (max-width: 768px) {
    .spotlight-card {
      padding: 20px;
    }
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 14px;
  }
`;

// 제목과 설명이 함께 쓰는 자리. 글의 길이와 상관없이 카드 높이가 같도록 줄 수를 정해 둔다 (lineBudget.ts).
// 제목은 두 줄까지 쓰고, 그때에도 설명 한 줄은 남는다. 제목이 한 줄이면 설명이 두 줄을 쓴다.
const Text = styled.div`
  ${budgetBlock}
  ${budgetType({ title: 24, titleLine: 34, excerpt: 16, excerptLine: 26, gap: 12 })}
  ${budgetLines(2, 1)}

  @media (max-width: 768px) {
    ${budgetType({ title: 20, titleLine: 28, excerpt: 15, excerptLine: 24, gap: 12 })}
  }

  /* 좁은 카드에서는 제목이 세 줄까지 가는 글이 있다. 제목을 자르지 않도록 한 줄을 더 잡는다. */
  @container post-card ${NARROW_CARD} {
    ${budgetLines(3, 1)}
  }
`;

const Title = styled.h3`
  ${budgetTitle}

  /* 페이지 전환에서 글자만 자연스럽게 커지도록, 상자를 글자 폭에 맞춘다. */
  width: fit-content;
  max-width: 100%;
  font-weight: 700;
  color: ${({ theme }) => theme.text.primary};
  word-break: keep-all;
  transition: color 0.25s ease;

  @media (hover: hover) {
    article:hover & {
      color: ${({ theme }) => theme.accent};
    }
  }
`;

const TitleLink = styled(Link)`
  color: inherit;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: -2px;
  }
`;

const Excerpt = styled.p`
  ${budgetExcerpt}

  color: ${({ theme }) => theme.text.muted};
`;

// 분류·날짜와 태그를 카드 맨 아래 한 줄에 모은다. 태그가 없는 카드도 같은 높이가 되도록 줄 높이를 잡아 둔다.
const Footer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;

  @media (hover: none) {
    min-height: 36px;
  }

  ${media.phone} {
    min-height: 20px;
  }
`;

const Meta = styled.div`
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.text.muted};
`;

// 분류·태그 링크는 카드 전체를 덮는 제목 링크보다 위에 있어야 눌린다.
const CategoryLink = styled(Link)`
  position: relative;
  z-index: 2;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};

  /* 손가락으로 누르기 쉽게 누르는 영역만 사방으로 넓힌다 (보이는 위치는 그대로). */
  @media (hover: none) {
    margin: -10px;
    padding: 10px;
  }

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const Tags = styled.ul`
  display: flex;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;

  /* 태그가 줄을 바꾸면 카드 높이가 달라진다. 한 줄에 들어가는 만큼만 보여 주고, 그래도 넘치면 칩이 줄어든다. */
  li {
    flex: 0 1 auto;
    min-width: 0;
    margin: 0;
  }

  /* 터치 기기에서는 칩이 줄어들더라도 누를 수 있는 폭은 남긴다. */
  @media (hover: none) {
    li {
      min-width: 40px;
    }
  }

  li:nth-of-type(n + 4) {
    display: none;
  }

  @container post-card ${WIDE_CARD} {
    li:nth-of-type(n + 4) {
      display: block;
    }

    li:nth-of-type(n + 7) {
      display: none;
    }
  }

  /* 폰에서는 카드에 태그를 싣지 않는다. 좁은 화면에서는 칩이 카드를 차지해 목록을 훑기 어렵게 하고,
     카드를 누르려다 칩을 잘못 누르기 쉽다. 태그는 글 페이지의 머리말에서 볼 수 있다. */
  ${media.phone} {
    display: none;
  }
`;

const TagLink = styled(Link)`
  position: relative;
  z-index: 2;
  display: block;
  padding: 4px 10px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  /* 손가락으로 누르기 쉽게 조금 키운다 (태블릿). 보조 링크라 칩이 카드를 차지하지 않을 만큼만 키운다. */
  @media (hover: none) {
    padding: 8px 12px;
    text-align: center;
  }

  &:hover {
    background: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text.primary};
  }
`;
