/**
 * SEO component that queries for data with
 * Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

type SeoProps = {
  title: string;
  description?: string;
  pathname?: string;
  image?: string;
  /** 페이지 종류. 소개 페이지는 profile, 글 목록은 collection으로 구조화 데이터를 낸다. */
  type?: 'website' | 'profile' | 'collection';
  /** 목록 페이지에 실린 항목들 (구조화 데이터의 ItemList) */
  list?: { name: string; path: string }[];
  /** 검색 결과에 노출하지 않을 페이지 */
  noindex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
    category?: string;
    /** 본문 단어 수 */
    words?: number;
  };
  children?: React.ReactNode;
};

type SeoQuery = {
  site: {
    siteMetadata: {
      title?: string;
      description?: string;
      siteUrl?: string;
      author?: {
        name?: string;
        summary?: string;
      } | null;
      social?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        velog?: string;
      } | null;
    };
  };
};

const PAGE_TYPES = {
  website: 'WebPage',
  profile: 'ProfilePage',
  collection: 'CollectionPage',
} as const;

const Seo: React.FC<SeoProps> = ({
  description,
  title,
  pathname,
  image,
  type = 'website',
  list,
  noindex = false,
  article,
  children,
}) => {
  const { site } = useStaticQuery<SeoQuery>(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
          author {
            name
            summary
          }
          social {
            twitter
            github
            linkedin
            velog
          }
        }
      }
    }
  `);

  const metaDescription = description || site.siteMetadata.description || '';
  const defaultTitle = site.siteMetadata?.title;
  const siteUrl = site.siteMetadata?.siteUrl || '';
  const authorName = site.siteMetadata?.author?.name || '앤디';

  // canonical URL - siteUrl과 pathname 조합
  const canonicalUrl = pathname ? `${siteUrl}${pathname}` : siteUrl;

  // og:image - 절대 URL로 보장
  const ogImage = (() => {
    if (image) {
      // 이미 절대 URL이면 그대로, 아니면 siteUrl 붙이기
      return image.startsWith('http') ? image : `${siteUrl}${image}`;
    }
    return `${siteUrl}/og-image.png`;
  })();

  const isArticle = !!article;

  const social = site.siteMetadata?.social;
  const githubUrl = `https://github.com/${social?.github || 'KimKyuHoi'}`;
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;

  // 검색 엔진과 AI 답변 엔진이 "누가 쓴 어떤 글인지"를 한 그래프로 읽을 수 있게 @id로 서로 잇는다.
  const person = {
    '@type': 'Person',
    '@id': personId,
    name: '김규회',
    alternateName: authorName,
    jobTitle: 'Frontend Developer',
    description: site.siteMetadata?.author?.summary,
    url: `${siteUrl}/about/`,
    sameAs: [githubUrl, social?.linkedin, social?.velog].filter(Boolean),
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: defaultTitle,
    description: site.siteMetadata?.description,
    url: siteUrl,
    inLanguage: 'ko-KR',
    publisher: { '@id': personId },
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${siteUrl}/` },
      ...(isArticle
        ? [{ '@type': 'ListItem', position: 2, name: '글', item: `${siteUrl}/posts/` }]
        : []),
      ...(pathname && pathname !== '/'
        ? [{ '@type': 'ListItem', position: isArticle ? 3 : 2, name: title, item: canonicalUrl }]
        : []),
    ],
  };

  const page = isArticle
    ? {
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        headline: title,
        description: metaDescription,
        image: ogImage,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        isPartOf: { '@id': websiteId },
        author: { '@id': personId },
        publisher: { '@id': personId },
        datePublished: article?.publishedTime,
        dateModified: article?.modifiedTime || article?.publishedTime,
        articleSection: article?.category,
        keywords: article?.tags?.join(', '),
        wordCount: article?.words,
        inLanguage: 'ko-KR',
      }
    : {
        '@type': PAGE_TYPES[type],
        '@id': `${canonicalUrl}#webpage`,
        name: title,
        description: metaDescription,
        url: canonicalUrl,
        isPartOf: { '@id': websiteId },
        // 소개 페이지는 이 사람에 대한 페이지임을, 그 밖의 페이지는 이 사람이 쓴 것임을 밝힌다.
        ...(type === 'profile'
          ? { mainEntity: { '@id': personId } }
          : { about: { '@id': personId } }),
        ...(list?.length
          ? {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: list.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: item.name,
                  url: `${siteUrl}${item.path}`,
                })),
              },
            }
          : {}),
        inLanguage: 'ko-KR',
      };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [website, person, page, breadcrumb],
  };

  return (
    <>
      <title key="title">{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      {/* 기본 메타 */}
      <meta key="description" name="description" content={metaDescription} />
      <meta key="author" name="author" content={authorName} />
      <meta
        key="robots"
        name="robots"
        content={
          noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
        }
      />
      <link
        key="rss"
        rel="alternate"
        type="application/rss+xml"
        title={`${defaultTitle} RSS`}
        href={`${siteUrl}/rss.xml`}
      />

      {/* Open Graph */}
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={metaDescription} />
      <meta key="og:type" property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta key="og:site_name" property="og:site_name" content={defaultTitle} />
      <meta key="og:image" property="og:image" content={ogImage} />
      <meta key="og:image:alt" property="og:image:alt" content={title} />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:locale" property="og:locale" content="ko_KR" />

      {/* Article 메타 */}
      {isArticle && article?.publishedTime && (
        <meta
          key="article:published_time"
          property="article:published_time"
          content={article.publishedTime}
        />
      )}
      {isArticle && (article?.modifiedTime || article?.publishedTime) && (
        <meta
          key="article:modified_time"
          property="article:modified_time"
          content={article.modifiedTime || article.publishedTime}
        />
      )}
      {isArticle && <meta key="article:author" property="article:author" content={authorName} />}
      {isArticle && (
        <meta
          key="article:section"
          property="article:section"
          content={article?.category || 'Technology'}
        />
      )}
      {isArticle &&
        article?.tags?.map((tag) => (
          <meta key={`article:tag:${tag}`} property="article:tag" content={tag} />
        ))}

      {/* Twitter Card */}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={metaDescription} />
      <meta key="twitter:image" name="twitter:image" content={ogImage} />
      {site.siteMetadata?.social?.twitter && (
        <meta
          key="twitter:creator"
          name="twitter:creator"
          content={`@${site.siteMetadata.social.twitter}`}
        />
      )}

      {/* JSON-LD 구조화 데이터 */}
      <script
        key="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
};

export default Seo;
