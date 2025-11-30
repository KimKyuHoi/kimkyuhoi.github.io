import React, { useMemo, useState } from 'react';
import { graphql } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import PostCard from '@/features/blog/components/PostCard';

const PostsPage: React.FC<PageProps<Queries.PostsPageQuery>> = ({ data, location }) => {
  const posts = data.allMarkdownRemark.nodes;
  const categories = (() => {
    const set = new Set<string>(['전체']);
    posts.forEach((p) => {
      if (p.frontmatter?.category) set.add(p.frontmatter.category);
    });
    return Array.from(set);
  })();

  const [active, setActive] = useState<string>('전체');

  const filtered = posts.filter((p) => active === '전체' || p.frontmatter?.category === active);

  return (
    <Layout location={location}>
      <Header>
        <div>
          <Title>Posts</Title>
          <Desc>카테고리별 글 모음</Desc>
        </div>
      </Header>

      <Tabs>
        {categories.map((cat) => (
          <Tab key={cat} active={cat === active} onClick={() => setActive(cat)}>
            {cat}
          </Tab>
        ))}
      </Tabs>

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
          />
        ))}
      </List>
    </Layout>
  );
};

export default PostsPage;

export const Head = () => <Seo title="Posts" />;

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

const Header = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  color: ${({ theme }) => theme.text.primary};
`;

const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ active, theme }) => `1px solid ${active ? theme.accent : theme.border}`};
  background: ${({ active, theme }) => (active ? theme.bg.muted : theme.bg.surface)};
  color: ${({ active, theme }) => (active ? theme.accent : theme.text.primary)};
  font-weight: 700;
  cursor: pointer;
`;

const List = styled.div`
  display: grid;
  gap: 18px;
`;
