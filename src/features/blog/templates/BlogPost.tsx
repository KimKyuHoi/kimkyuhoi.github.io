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
import RevealText from '@/motion/RevealText';
import PlayerBar from '@/features/blog/components/PlayerBar';
import PostCard, { categoryPath, tagPath } from '@/features/blog/components/PostCard';
import useImageZoom from '@/features/blog/hooks/useImageZoom';

const Utterances = React.lazy(() => import('@/features/blog/components/Utterances'));

// 빌드할 때 만들어 두는 글별 공유 이미지의 경로. gatsby-node.js의 ogImageName과 같은 규칙이어야 한다.
const ogImagePath = (slug: string) => `/og/${slug.replace(/^\/|\/$/g, '').replace(/\//g, '-')}.png`;

const BlogPostTemplate: React.FC<PageProps<Queries.BlogPostBySlugQuery>> = ({ data, location }) => {
  const post = data.markdownRemark;
  const previous = data.previous;
  const next = data.next;
  const isMounted = useMounted();
  const bodyRef = React.useRef<HTMLElement>(null);
  useImageZoom(bodyRef);

  // 시리즈: 같은 카테고리에서 chapter가 매겨진 글을 장 순서대로 잇는다.
  const category = post?.frontmatter?.category || '기타';
  const series =
    post?.frontmatter?.chapter == null
      ? []
      : data.others.nodes
          .filter(
            (node) => node.frontmatter?.category === category && node.frontmatter?.chapter != null
          )
          .sort((a, b) => (a.frontmatter?.chapter || 0) - (b.frontmatter?.chapter || 0));

  // 이어서 볼 글: 같은 카테고리와 겹치는 태그가 많은 순으로 고른다.
  const tags = (post?.frontmatter?.tags as string[]) || [];
  const related = data.others.nodes
    .filter((node) => node.fields?.slug !== post?.fields?.slug)
    .map((node) => ({
      node,
      score:
        (node.frontmatter?.category === post?.frontmatter?.category ? 2 : 0) +
        (node.frontmatter?.tags || []).filter((tag) => tag && tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ node }) => node);

  return (
    <Layout location={location} section="/posts/">
      <ArticleWrapper>
        <Main>
          <article itemScope itemType="http://schema.org/Article">
            <header>
              <Category to={categoryPath(category)}>{category}</Category>
              <Title itemProp="headline" data-morph-title="">
                <RevealText text={post?.frontmatter?.title || ''} />
              </Title>
              {post?.frontmatter?.description ? (
                <Lead itemProp="description">{post.frontmatter.description}</Lead>
              ) : null}
              <Meta>
                <Author to="/about/" rel="author">
                  김규회
                </Author>
                <time dateTime={post?.frontmatter?.rawDate || undefined}>
                  {post?.frontmatter?.date}
                </time>
                {post?.frontmatter?.tags?.length ? (
                  <Tags>
                    {(post.frontmatter.tags as string[]).map((tag) => (
                      <Tag key={tag} to={tagPath(tag)}>
                        #{tag}
                      </Tag>
                    ))}
                  </Tags>
                ) : null}
              </Meta>
              {post?.frontmatter?.hero ? <Hero src={post.frontmatter.hero} alt="" /> : null}
            </header>

            {series.length > 1 ? (
              <Series aria-labelledby="series-heading">
                <SeriesTitle id="series-heading">{category} 시리즈</SeriesTitle>
                <ol>
                  {series.map((item) => {
                    const current = item.fields?.slug === post?.fields?.slug;
                    return (
                      <li key={item.fields?.slug} aria-current={current ? 'page' : undefined}>
                        {current ? (
                          <span>{item.frontmatter?.title}</span>
                        ) : (
                          <Link to={item.fields?.slug || ''}>{item.frontmatter?.title}</Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Series>
            ) : null}

            <PostBody
              ref={bodyRef}
              dangerouslySetInnerHTML={{ __html: post?.html || '' }}
              itemProp="articleBody"
            />
          </article>

          <BuyMeCoffee />

          {related.length ? (
            <Related aria-labelledby="related-heading">
              <RelatedTitle id="related-heading">이어서 볼 글</RelatedTitle>
              {related.map((node) => (
                <PostCard
                  key={node.fields?.slug}
                  slug={node.fields?.slug || ''}
                  title={node.frontmatter?.title || ''}
                  description={node.frontmatter?.description || ''}
                  date={node.frontmatter?.date || ''}
                  category={node.frontmatter?.category || '기타'}
                  tags={(node.frontmatter?.tags as string[]) || []}
                />
              ))}
            </Related>
          ) : null}

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
      <PlayerBar bodyRef={bodyRef} />
    </Layout>
  );
};

export default BlogPostTemplate;

export const Head: React.FC<PageProps<Queries.BlogPostBySlugQuery>> = ({ data }) => {
  const post = data.markdownRemark;
  const siteTitle = data.site?.siteMetadata?.title || `Blog`;
  const slug = post?.fields?.slug || '';

  return (
    <Seo
      title={post?.frontmatter?.title || siteTitle}
      description={post?.frontmatter?.description || post?.excerpt || undefined}
      pathname={slug}
      image={post?.frontmatter?.hero || ogImagePath(slug)}
      article={{
        publishedTime: post?.frontmatter?.rawDate || undefined,
        modifiedTime: post?.frontmatter?.rawDate || undefined,
        tags: (post?.frontmatter?.tags as string[]) || [],
        category: post?.frontmatter?.category || undefined,
        words: post?.wordCount?.words || undefined,
      }}
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
      wordCount {
        words
      }
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "YYYY년 M월 D일")
        rawDate: date(formatString: "YYYY-MM-DD")
        description
        category
        tags
        hero
        chapter
      }
    }
    others: allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "YYYY년 M월 D일")
          description
          category
          tags
          chapter
        }
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

const Category = styled(Link)`
  display: inline-block;
  color: ${({ theme }) => theme.accent};
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  /* 손가락으로 누르기 쉽게 누르는 영역만 넓힌다 (보이는 위치는 그대로). */
  @media (hover: none) {
    margin: -8px -8px 4px;
    padding: 8px;
  }
`;

const Title = styled.h1`
  /* 페이지 전환에서 글자만 자연스럽게 커지도록, 상자를 글자 폭에 맞춘다. */
  width: fit-content;
  max-width: 100%;
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

// 글의 한 줄 요약. 검색 엔진과 AI 답변 엔진이 글의 요지를 바로 읽을 수 있게 본문 위에 보여 준다.
const Lead = styled.p`
  margin: -8px 0 24px;
  font-size: 18px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text.muted};
  word-break: keep-all;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const Author = styled(Link)`
  font-weight: 700;
  color: ${({ theme }) => theme.text.primary};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  @media (hover: none) {
    margin: -8px;
    padding: 8px;
  }
`;

const Series = styled.nav`
  margin: 0 0 32px;
  padding: 20px 24px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};

  ol {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    margin: 0;
    font-size: 15px;
    color: ${({ theme }) => theme.text.muted};
  }

  a:hover {
    color: ${({ theme }) => theme.accent};
  }

  li[aria-current='page'] {
    font-weight: 700;
    color: ${({ theme }) => theme.text.primary};
  }
`;

const SeriesTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
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

const Tag = styled(Link)`
  padding: 4px 10px;

  /* 손가락으로 누르기 쉽게 조금 키운다. 태그는 보조 링크라 칩이 화면을 차지하지 않을 만큼만 키운다. */
  @media (hover: none) {
    min-width: 40px;
    padding: 6px 12px;
    text-align: center;
  }
  background: ${({ theme }) => theme.bg.muted};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.muted};
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text.primary};
  }
`;

const Hero = styled.img`
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.lg};
  margin: 0 0 40px;
  object-fit: cover;
  max-height: 500px;
`;

const PostBody = styled.section`
  font-size: 16px;
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
    margin: 24px 0;
    padding: 14px 20px;
    background: #f8fbff;
    border-left: 5px solid ${({ theme }) => theme.accent};

    /* 라이트 전용 배경색이 다크 모드에서도 쓰여 글자가 보이지 않던 것을 바로잡는다. */
    body.dark & {
      background: ${({ theme }) => theme.bg.muted};
    }

    /* 다크 모드의 인용문 바탕은 페이지보다 밝아서, 본문 링크 색 그대로는 대비가 3:1에 못 미친다. */
    body.dark & a {
      color: #8ab8ff;
    }

    border-radius: ${({ theme }) => theme.radius.sm};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);

    p {
      margin: 0;
      font-size: 14.5px;
      line-height: 1.7;
    }

    li {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 4px;
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

    td {
      white-space: normal;
      word-break: keep-all;
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
    height: auto;
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

  .gatsby-remark-prismjs-copy-button-container {
    position: relative;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    height: 0;
    overflow: visible;
    display: flex;
    justify-content: flex-end;
    z-index: 2;
    pointer-events: none;
  }

  .gatsby-remark-prismjs-copy-button {
    pointer-events: auto;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 26px;
    padding: 0 12px;
    margin: 36px 12px 0 0;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(248, 249, 250, 0.9);
    font-family: ${({ theme }) => theme.font.body};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
    border-radius: 6px;
    outline: none;
    user-select: none;
    animation: none;
    transition:
      background 0.18s ease,
      color 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .gatsby-remark-prismjs-copy-button:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.32);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .gatsby-remark-prismjs-copy-button:active {
    transform: translateY(0);
  }

  .gatsby-remark-prismjs-copy-button:focus-visible {
    box-shadow: 0 0 0 2px rgba(120, 170, 255, 0.5);
    border-color: rgba(120, 170, 255, 0.7);
  }

  .gatsby-remark-prismjs-copy-button.copied {
    background: rgba(126, 211, 33, 0.18);
    border-color: rgba(126, 211, 33, 0.5);
    color: #b5e88c;
    animation: none;
  }

  @media (max-width: 600px) {
    .gatsby-remark-prismjs-copy-button {
      background: rgba(255, 255, 255, 0.1);
    }

    .gatsby-remark-prismjs-copy-button:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }

  /* 터치 기기에서는 복사 버튼을 손가락으로 누르기 쉬운 크기로 키운다.
     커진 버튼이 코드 첫 줄을 가리지 않도록, 복사 버튼이 붙은 코드 블록은 위쪽을 그만큼 비운다. */
  @media (hover: none) {
    .gatsby-remark-prismjs-copy-button {
      height: 40px;
      padding: 0 14px;
      margin: 30px 8px 0 0;
      font-size: 12px;
    }

    .gatsby-remark-prismjs-copy-button-container + .gatsby-highlight pre {
      padding-top: 58px;
    }
  }
`;

const Related = styled.section`
  display: grid;
  gap: 16px;
  margin-top: 60px;
`;

const RelatedTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
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
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
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
