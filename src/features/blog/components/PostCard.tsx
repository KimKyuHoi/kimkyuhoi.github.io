import React, { useRef } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import SpotlightCard from '@/reactbits/SpotlightCard';
import { useThemeMode } from '@/hooks/useThemeMode';
import { markTitleMorph } from '@/motion/pageTransition';
import { media } from '@/styles/media';

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
  const titleRef = useRef<HTMLHeadingElement>(null);

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
          <Meta>
            <CategoryLink to={categoryPath(category)}>{category}</CategoryLink>
            <time>{date}</time>
          </Meta>
          <Title as={headingLevel} ref={titleRef}>
            {/* 제목 링크의 ::after가 카드 전체를 덮어, 카드 어디를 눌러도 글로 이동한다. */}
            <TitleLink to={slug} onClick={handleOpen}>
              {title}
            </TitleLink>
          </Title>
          <Excerpt>{description || excerpt}</Excerpt>
          {tags && tags.length ? (
            <Tags>
              {tags.map((tag) => (
                <li key={tag}>
                  <TagLink to={tagPath(tag)}>{tag}</TagLink>
                </li>
              ))}
            </Tags>
          ) : null}
        </Content>
      </SpotlightCard>
    </Card>
  );
};

export default PostCard;

const Card = styled.article`
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
  gap: 12px;
`;

// 카테고리·태그 링크는 카드 전체를 덮는 제목 링크보다 위에 있어야 눌린다.
const Meta = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  gap: 8px;
  align-items: center;
  align-self: flex-start;
  font-size: 14px;
  color: ${({ theme }) => theme.text.muted};
`;

const CategoryLink = styled(Link)`
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

const Title = styled.h3`
  /* 페이지 전환에서 글자만 자연스럽게 커지도록, 상자를 글자 폭에 맞춘다. */
  width: fit-content;
  max-width: 100%;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ theme }) => theme.text.primary};
  word-break: keep-all;
  transition: color 0.25s ease;

  @media (hover: hover) {
    article:hover & {
      color: ${({ theme }) => theme.accent};
    }
  }

  @media (max-width: 768px) {
    font-size: 20px;
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
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.text.muted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const Tags = styled.ul`
  position: relative;
  z-index: 2;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-self: flex-start;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;

  li {
    margin: 0;
  }

  /* 폰에서는 카드에 태그를 싣지 않는다. 좁은 화면에서는 칩이 카드마다 두세 줄씩 쌓여 목록을 훑기 어렵게 하고,
     카드를 누르려다 칩을 잘못 누르기 쉽다. 태그는 글 페이지의 머리말에서 볼 수 있다. */
  ${media.phone} {
    display: none;
  }
`;

const TagLink = styled(Link)`
  display: block;
  padding: 4px 10px;

  /* 손가락으로 누르기 쉽게 키운다 (태블릿). */
  @media (hover: none) {
    min-width: 44px;
    padding: 9px 12px;
    text-align: center;
  }
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};
  font-size: 13px;
  font-weight: 500;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text.primary};
  }
`;
