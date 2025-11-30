import React, { useState } from 'react';
import { graphql, Link } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import PostCard from '@/features/blog/components/PostCard';
import { Github, Linkedin, Instagram, Link as LinkIcon } from 'lucide-react';

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

  const [activeCat, setActiveCat] = useState<string>('전체');

  const latest = posts.slice(0, 12);
  const filtered = latest.filter(
    (p) => activeCat === '전체' || p.frontmatter?.category === activeCat
  );
  const picks = posts.filter((p) => p.frontmatter?.featured).slice(0, 3);
  const popular = (picks.length ? picks : posts).slice(0, 5);

  return (
    <Layout location={location}>
      <Hero
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <Headline>개발자 앤디</Headline>
          <Sub>안녕하세요! 프론트엔드 개발을 좋아하는 개발자 김규회입니다.</Sub>
          <SocialLinks>
            <SocialLink
              href="https://github.com/KimKyuHoi"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github /> GitHub
            </SocialLink>
            <SocialLink
              href="https://www.linkedin.com/in/%EA%B7%9C%ED%9A%8C-%EA%B9%80-2ba0a5254/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin /> LinkedIn
            </SocialLink>
            <SocialLink href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Instagram /> Instagram
            </SocialLink>
            <SocialLink
              href="https://velog.io/@k_gu_wae123/posts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIcon /> Velog
            </SocialLink>
          </SocialLinks>
        </div>
      </Hero>

      <Grid>
        <Main>
          <Section>
            <SectionTitle>최신 글</SectionTitle>
            <MobileTabs>
              {categories.map((cat) => (
                <Tab key={cat} active={cat === activeCat} onClick={() => setActiveCat(cat)}>
                  {cat}
                </Tab>
              ))}
            </MobileTabs>
            <List
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
              }}
            >
              {(filtered.length ? filtered : latest).map((post) => (
                <motion.div
                  key={post.fields?.slug}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <PostCard
                    slug={post.fields?.slug || ''}
                    title={post.frontmatter?.title || post.fields?.slug || ''}
                    description={post.frontmatter?.description || post.excerpt || ''}
                    date={post.frontmatter?.date || ''}
                    category={post.frontmatter?.category || '기타'}
                    excerpt={post.excerpt || ''}
                    hero={post.frontmatter?.hero || undefined}
                    tags={(post.frontmatter?.tags as string[]) || []}
                  />
                </motion.div>
              ))}
            </List>
          </Section>
        </Main>

        <Sidebar
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Widget>
            <WidgetTitle>카테고리</WidgetTitle>
            <CategoryList>
              {categories.map((cat) => (
                <li key={cat}>{cat}</li>
              ))}
            </CategoryList>
            <SmallLink to="/posts">모든 글 보기 →</SmallLink>
          </Widget>

          <Widget>
            <WidgetTitle>에디터 픽</WidgetTitle>
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
                <TagBadge key={tag}>#{tag}</TagBadge>
              ))}
            </TagCloud>
          </Widget>

          <Widget>
            <WidgetTitle>최근 업데이트</WidgetTitle>
            <p>새로운 글과 프로젝트를 곧 공유할 예정입니다.</p>
          </Widget>
        </Sidebar>
      </Grid>
    </Layout>
  );
};

export default IndexPage;

export const Head = () => <Seo title="홈" />;

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

const HeroBase = styled.section`
  margin-bottom: 48px;
  padding-bottom: 20px;

  @media (max-width: 768px) {
    margin-bottom: 32px;
  }
`;
const Hero = motion.create(HeroBase);

const Headline = styled.h1`
  margin: 0 0 12px;
  font-size: 42px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.text.primary};

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const Sub = styled.p`
  margin: 0 0 24px;
  font-size: 18px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
  max-width: 600px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.bg.muted};
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full || '999px'};
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.primary};
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
    transform: translateY(-2px);
  }

  svg {
    width: 18px;
    height: 18px;
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

const SidebarBase = styled.aside`
  display: grid;
  gap: 32px;
  position: sticky;
  top: 100px;

  @media (max-width: 980px) {
    display: none;
  }
`;
const Sidebar = motion.create(SidebarBase);

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

const ListBase = styled.div`
  display: grid;
  gap: 18px;
`;
const List = motion.create(ListBase);

const MobileTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  @media (max-width: 980px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-right: -20px;
    padding-right: 20px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 7px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, active }) => (active ? theme.accent : theme.border)};
  background: ${({ theme, active }) => (active ? theme.bg.muted : theme.bg.surface)};
  color: ${({ theme, active }) => (active ? theme.accent : theme.text.primary)};
  font-weight: 700;
  cursor: pointer;
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
    background: ${({ theme }) => theme.bg.muted};
    border: 1px solid ${({ theme }) => theme.border};
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.text.muted};
    font-size: 13px;
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

const TagBadge = styled.span`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  border: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text.muted};
  font-size: 12px;
`;
