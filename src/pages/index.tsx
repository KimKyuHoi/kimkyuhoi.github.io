import React from 'react';
import { graphql, Link } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import PostCard, { categoryPath, tagPath } from '@/features/blog/components/PostCard';
import StreamHero from '@/features/home/StreamHero';
import ProjectCard from '@/features/playground/ProjectCard';
import { projects } from '@/features/playground/projects';

const IndexPage: React.FC<PageProps<Queries.IndexPageQuery>> = ({ data, location }) => {
  const posts = data.allMarkdownRemark.nodes as unknown as Queries.MarkdownRemark[];

  const categories = (() => {
    const set = new Set<string>(['전체']);
    posts.forEach((p) => {
      if (p.frontmatter?.category) set.add(p.frontmatter.category);
    });
    return Array.from(set);
  })();

  const tags = (() => {
    const arr: string[] = [];
    posts.forEach((p) => {
      p.frontmatter?.tags?.forEach((t) => {
        if (t && !arr.includes(t)) arr.push(t);
      });
    });
    return arr.slice(0, 12);
  })();

  const latest = posts.slice(0, 3);
  const picks = posts.filter((p) => p.frontmatter?.featured).slice(0, 3);
  const popular = (picks.length ? picks : posts).slice(0, 5);

  return (
    <Layout location={location}>
      <StreamHero />

      <Grid>
        <Main>
          <Section>
            <SectionHeader>
              <SectionTitle>최신 글</SectionTitle>
              {/* 좁은 화면에서는 사이드바가 숨으므로 여기에 전체 목록 링크를 둔다. */}
              <MoreLink to="/posts/" data-narrow-only="">
                모든 글 보기
              </MoreLink>
            </SectionHeader>

            <List>
              {latest.map((post) => (
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
          </Section>
        </Main>

        <Sidebar>
          <Widget>
            <WidgetTitle>카테고리</WidgetTitle>
            <CategoryList>
              {categories.map((cat) => (
                <li key={cat}>
                  <Link to={cat === '전체' ? '/posts/' : categoryPath(cat)}>{cat}</Link>
                </li>
              ))}
            </CategoryList>
            <SmallLink to="/posts">모든 글 보기 →</SmallLink>
          </Widget>

          <Widget>
            <WidgetTitle>주인장 픽</WidgetTitle>
            <MiniList>
              {popular.map((post) => (
                <MiniItem key={post.fields?.slug}>
                  <Link to={post.fields?.slug || ''}>{post.frontmatter?.title}</Link>
                  <span>{post.frontmatter?.date}</span>
                </MiniItem>
              ))}
            </MiniList>
          </Widget>

          <Widget>
            <WidgetTitle>태그</WidgetTitle>
            <TagCloud>
              {tags.map((tag) => (
                <TagBadge key={tag} to={tagPath(tag)}>
                  #{tag}
                </TagBadge>
              ))}
            </TagCloud>
          </Widget>
        </Sidebar>
      </Grid>

      <Section aria-labelledby="home-playground">
        <SectionHeader>
          <div>
            <SectionTitle id="home-playground">플레이그라운드</SectionTitle>
            <SectionDesc>글로 설명한 내용을 직접 만져 볼 수 있게 만든 실험들</SectionDesc>
          </div>
          <MoreLink to="/playground/">실험 모두 보기</MoreLink>
        </SectionHeader>
        <ProjectGrid>
          {projects.slice(0, 2).map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </ProjectGrid>
      </Section>
    </Layout>
  );
};

export default IndexPage;

export const Head = () => (
  <Seo
    title="홈"
    pathname="/"
    description="프론트엔드 개발자 앤디의 기술 블로그. 오픈소스 기여, DRM, 미디어 스트리밍, React, Next.js 등 웹 개발 경험을 공유합니다."
  />
);

export const pageQuery = graphql`
  query IndexPage {
    site {
      siteMetadata {
        featuredCategories
      }
    }
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        excerpt(pruneLength: 140)
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 60px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const Main = styled.div`
  display: grid;
  gap: 40px;
`;

const Sidebar = styled.aside`
  display: grid;
  gap: 32px;
  position: sticky;
  top: 100px;

  @media (max-width: 980px) {
    display: none;
  }
`;

const Section = styled.section`
  display: grid;
  gap: 24px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
`;

const SectionDesc = styled.p`
  margin: 6px 0 0;
  font-size: 15px;
  color: ${({ theme }) => theme.text.muted};
`;

const MoreLink = styled(Link)`
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  &[data-narrow-only] {
    @media (min-width: 981px) {
      display: none;
    }
  }
`;

const List = styled.div`
  display: grid;
  gap: 18px;
`;

const ProjectGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, 1fr);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Widget = styled.div`
  background: ${({ theme }) => theme.bg.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const WidgetTitle = styled.div`
  font-weight: 800;
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  li {
    /* 전역 목록 스타일의 아래 여백이 줄 간격을 벌려 놓으므로 없앤다. */
    margin: 0;
    background: ${({ theme }) => theme.bg.muted};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 13px;
    transition: all 0.2s ease;

    a {
      display: block;
      padding: 6px 10px;
      color: ${({ theme }) => theme.text.muted};
      text-decoration: none;
    }

    &:hover {
      background: ${({ theme }) => theme.border};
      transform: translateY(-1px);
      a {
        color: ${({ theme }) => theme.text.primary};
      }
    }
  }
`;

const SmallLink = styled(Link)`
  color: ${({ theme }) => theme.accent};
  font-weight: 700;
  font-size: 14px;
`;

const MiniList = styled.div`
  display: grid;
  gap: 8px;
`;

const MiniItem = styled.div`
  display: grid;
  gap: 4px;
  a {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  span {
    color: ${({ theme }) => theme.text.caption};
    font-size: 12px;
  }
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagBadge = styled(Link)`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  border: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text.muted};
  font-size: 12px;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text.primary};
  }
`;
