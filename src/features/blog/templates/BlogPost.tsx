import React, { Suspense } from 'react';
import { graphql, Link } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import Toc from '@/features/blog/components/TableOfContents';
import BuyMeCoffee from '@/features/blog/components/BuyMeCoffee';
import { Skeleton } from '@/ui/Skeleton';
import { useMounted } from '@/hooks/useMounted';

const Utterances = React.lazy(() => import('@/features/blog/components/Utterances'));

const BlogPostTemplate: React.FC<PageProps<Queries.BlogPostBySlugQuery>> = ({ data, location }) => {
  const post = data.markdownRemark;
  const previous = data.previous;
  const next = data.next;
  const isMounted = useMounted();

  return (
    <Layout location={location}>
      <ArticleWrapper>
        <Main>
          <article itemScope itemType="http://schema.org/Article">
            <header>
              <Category>{post?.frontmatter?.category || '기타'}</Category>
              <Title itemProp="headline">{post?.frontmatter?.title}</Title>
              <Meta>
                <span>{post?.frontmatter?.date}</span>
                {post?.frontmatter?.tags?.length ? (
                  <Tags>
                    {(post.frontmatter.tags as string[]).map((tag) => (
                      <Tag key={tag}>#{tag}</Tag>
                    ))}
                  </Tags>
                ) : null}
              </Meta>
              {post?.frontmatter?.hero ? <Hero src={post.frontmatter.hero} alt="" /> : null}
            </header>

            <PostBody
              dangerouslySetInnerHTML={{ __html: post?.html || '' }}
              itemProp="articleBody"
            />
          </article>

          <BuyMeCoffee />

          <Nav>
            {previous ? (
              <Link to={previous.fields?.slug || ''} rel="prev">
                ← {previous.frontmatter?.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={next.fields?.slug || ''} rel="next">
                {next.frontmatter?.title} →
              </Link>
            ) : (
              <span />
            )}
          </Nav>

          {isMounted ? (
            <Suspense fallback={<Skeleton height="300px" />}>
              <Utterances />
            </Suspense>
          ) : (
            <Skeleton height="300px" />
          )}
        </Main>

        <Aside>
          <Toc tableOfContents={post?.tableOfContents as string} />
        </Aside>
      </ArticleWrapper>
    </Layout>
  );
};

export default BlogPostTemplate;

export const Head: React.FC<PageProps<Queries.BlogPostBySlugQuery>> = ({ data }) => {
  const post = data.markdownRemark;
  const siteTitle = data.site?.siteMetadata?.title || `Blog`;
  return (
    <Seo
      title={post?.frontmatter?.title || siteTitle}
      description={post?.frontmatter?.description || post?.excerpt || undefined}
    />
  );
};

export const pageQuery = graphql`
  query BlogPostBySlug($id: String!, $previousPostId: String, $nextPostId: String) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      tableOfContents
      frontmatter {
        title
        date(formatString: "YYYY년 M월 D일")
        description
        category
        tags
        hero
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
  }
`;

const ArticleWrapper = styled.div`
  display: grid;
  gap: 40px;
  grid-template-columns: 1fr 240px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Main = styled.div`
  background: transparent;
  padding: 0;
  max-width: 100%;
  overflow: hidden;
`;

const Aside = styled.div`
  position: sticky;
  top: 100px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Category = styled.div`
  color: ${({ theme }) => theme.accent};
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0 0 24px;
  font-size: 40px;
  line-height: 1.3;
  font-weight: 800;
  color: ${({ theme }) => theme.text.primary};
  word-break: keep-all;

  @media (max-width: 768px) {
    font-size: 30px;
  }
`;

const Meta = styled.div`
  margin-bottom: 32px;
  color: ${({ theme }) => theme.text.muted};
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  flex-wrap: wrap;
  padding-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const Tags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: ${({ theme }) => theme.bg.muted};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.muted};
`;

const Hero = styled.img`
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.lg};
  margin: 0 0 40px;
  object-fit: cover;
  max-height: 500px;
`;

const PostBody = styled.section`
  font-size: 15px;
  line-height: 1.75;
  color: ${({ theme }) => theme.text.primary};
  overflow-x: hidden;

  p {
    margin-bottom: 18px;
    word-break: keep-all;
  }

  a {
    color: ${({ theme }) => theme.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 4px;
    &:hover {
      color: ${({ theme }) => theme.accent2};
    }
  }

  h2 {
    font-size: 22px;
    font-weight: 700;
    margin: 36px 0 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 28px 0 12px;
  }

  h4 {
    font-size: 17px;
    font-weight: 700;
    margin: 24px 0 12px;
  }

  ul,
  ol {
    margin-bottom: 24px;
    padding-left: 24px;

    @media (max-width: 768px) {
      padding-left: 20px;
    }

    li {
      margin-bottom: 8px;
    }
  }

  blockquote {
    margin: 32px 0;
    padding: 24px 28px;
    background: #f8fbff;
    border-left: 5px solid ${({ theme }) => theme.accent};
    border-radius: ${({ theme }) => theme.radius.sm};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);

    p {
      margin: 0;
      font-size: 14.5px;
      line-height: 1.7;
    }
  }

  .table-wrapper {
    overflow-x: auto;
    margin: 24px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    display: block;
    overflow-x: auto;

    th,
    td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid ${({ theme }) => theme.border};
      white-space: nowrap;
    }

    th {
      font-weight: 700;
      background: ${({ theme }) => theme.bg.muted};
      color: ${({ theme }) => theme.text.primary};
    }

    td {
      color: ${({ theme }) => theme.text.muted};
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  img {
    max-width: 100%;
    border-radius: ${({ theme }) => theme.radius.md};
    margin: 24px auto 8px;
    display: block;
  }

  code {
    background: ${({ theme }) => theme.bg.codeInline};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.9em;
  }

  pre {
    background: ${({ theme }) => theme.bg.code};
    padding: 20px;
    border-radius: ${({ theme }) => theme.radius.md};
    overflow-x: auto;
    margin: 24px 0;
    max-width: 100%;

    code {
      background: transparent;
      padding: 0;
      color: #f8f9fa;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
`;

const Nav = styled.nav`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 60px 0 40px;
  padding-top: 40px;
  border-top: 1px solid ${({ theme }) => theme.border};

  a {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px;
    background: ${({ theme }) => theme.bg.surface};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    color: ${({ theme }) => theme.text.primary};
    font-weight: 700;
    font-size: 16px;
    transition: all 0.2s ease;
    text-decoration: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.shadow.soft};
      border-color: ${({ theme }) => theme.accent};
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
