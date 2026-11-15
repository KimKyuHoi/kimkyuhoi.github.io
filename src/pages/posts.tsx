import React from 'react';
import { graphql } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import PostCard from '@/features/blog/components/PostCard';
import usePostFilter, { ALL_CATEGORIES } from '@/hooks/usePostFilter';
import PageHeader from '@/components/PageHeader';

const PostsPage: React.FC<PageProps<Queries.PostsPageQuery>> = ({ data, location }) => {
  const posts = data.allMarkdownRemark.nodes;
  const { category, tag, selectCategory, clearTag } = usePostFilter(location);

  // 태그 필터가 걸려 있으면 탭의 글 수도 그 태그 안에서 센다.
  const tagged = posts.filter((post) => !tag || post.frontmatter?.tags?.includes(tag));
  const counts = new Map<string, number>([[ALL_CATEGORIES, tagged.length]]);
  posts.forEach((post) => {
    const name = post.frontmatter?.category;
    if (name && !counts.has(name)) counts.set(name, 0);
  });
  tagged.forEach((post) => {
    const name = post.frontmatter?.category;
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  });

  const filtered = tagged.filter(
    (post) => category === ALL_CATEGORIES || post.frontmatter?.category === category
  );

  return (
    <Layout location={location}>
      <PageHeader title="Posts" description="카테고리와 태그별 글 모음" />

      <Tabs role="group" aria-label="카테고리">
        {Array.from(counts, ([name, count]) => {
          const active = name === category;
          return (
            <Tab
              key={name}
              type="button"
              active={active}
              aria-pressed={active}
              disabled={count === 0 && !active}
              onClick={() => selectCategory(name)}
            >
              {active ? (
                <TabPill
                  layoutId="tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              ) : null}
              <TabLabel>
                {name}
                <Count>{count}</Count>
              </TabLabel>
            </Tab>
          );
        })}
      </Tabs>

      {tag ? (
        <TagFilter>
          <span>
            태그 <b>#{tag}</b>
          </span>
          <ClearButton type="button" onClick={clearTag}>
            <X size={14} aria-hidden="true" />
            태그 필터 해제
          </ClearButton>
        </TagFilter>
      ) : null}

      {filtered.length ? (
        <List>
          {filtered.map((post) => (
            <PostCard
              key={post.fields?.slug}
              slug={post.fields?.slug || ''}
              title={post.frontmatter?.title || post.fields?.slug || ''}
              description={post.frontmatter?.description || post.excerpt || ''}
              date={post.frontmatter?.date || ''}
              category={post.frontmatter?.category || '기타'}
              excerpt={post.excerpt || ''}
              hero={post.frontmatter?.hero || undefined}
              tags={(post.frontmatter?.tags as string[]) || []}
              headingLevel="h2"
            />
          ))}
        </List>
      ) : (
        <Empty>
          <p>이 조건에 맞는 글이 없습니다.</p>
          <ClearButton type="button" onClick={() => selectCategory(ALL_CATEGORIES)}>
            전체 카테고리 보기
          </ClearButton>
        </Empty>
      )}
    </Layout>
  );
};

export default PostsPage;

export const Head: React.FC<PageProps<Queries.PostsPageQuery>> = ({ data }) => (
  <Seo
    title="Posts"
    pathname="/posts/"
    type="collection"
    list={data.allMarkdownRemark.nodes.map((post) => ({
      name: post.frontmatter?.title || '',
      path: post.fields?.slug || '/',
    }))}
    description="카테고리별 기술 블로그 글 모음. 오픈소스, 프론트엔드 개발, 회고록 등 다양한 주제의 글을 확인하세요."
  />
);

export const pageQuery = graphql`
  query PostsPage {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        excerpt(pruneLength: 160)
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "YYYY년 M월 D일")
          description
          category
          tags
          featured
          hero
        }
      }
    }
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  position: relative;
  min-height: 44px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.border};
  background: transparent;
  color: ${({ active, theme }) => (active ? theme.text.inverse : theme.text.primary)};
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;

  &:disabled {
    color: ${({ theme }) => theme.text.caption};
    cursor: default;
  }
`;

const TabLabel = styled.span`
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

const Count = styled.span`
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;

  /* 선택된 탭은 파란 바탕에 흰 글자라, 흐리게 하면 대비가 4.5:1 아래로 떨어진다. */
  button[aria-pressed='true'] & {
    opacity: 1;
  }
`;

const TabPill = styled(motion.span)`
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: ${({ theme }) => theme.accentSolid};
`;

const TagFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 15px;
  color: ${({ theme }) => theme.text.muted};

  b {
    color: ${({ theme }) => theme.text.primary};
  }
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.bg.muted};
  }
`;

const List = styled.div`
  display: grid;
  gap: 18px;
`;

const Empty = styled.div`
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 32px 0;
  color: ${({ theme }) => theme.text.muted};

  p {
    margin: 0;
  }
`;
