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
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
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
      } | null;
    };
  };
};

const Seo: React.FC<SeoProps> = ({ description, title, pathname, image, article, children }) => {
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

  const jsonLd = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: metaDescription,
        image: ogImage,
        author: {
          '@type': 'Person',
          name: authorName,
          url: `https://github.com/${site.siteMetadata?.social?.github || 'KimKyuHoi'}`,
        },
        publisher: {
          '@type': 'Person',
          name: authorName,
        },
        url: canonicalUrl,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        datePublished: article?.publishedTime,
        dateModified: article?.modifiedTime || article?.publishedTime,
        keywords: article?.tags?.join(', '),
        inLanguage: 'ko-KR',
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: defaultTitle,
        description: metaDescription,
        url: siteUrl,
        author: {
          '@type': 'Person',
          name: authorName,
          url: `https://github.com/${site.siteMetadata?.social?.github || 'KimKyuHoi'}`,
        },
        inLanguage: 'ko-KR',
      };

  return (
    <>
      <title key="title">{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      {/* 기본 메타 */}
      <meta key="description" name="description" content={metaDescription} />
      <meta key="author" name="author" content={authorName} />

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
      {isArticle && <meta key="article:section" property="article:section" content="Technology" />}
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
