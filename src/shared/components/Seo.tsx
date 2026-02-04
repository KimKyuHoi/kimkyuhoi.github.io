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
      } | null;
      social?: {
        twitter?: string;
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
          }
          social {
            twitter
          }
        }
      }
    }
  `);

  const metaDescription = description || site.siteMetadata.description;
  const defaultTitle = site.siteMetadata?.title;
  const siteUrl = site.siteMetadata?.siteUrl || '';
  const canonicalUrl = pathname ? `${siteUrl}${pathname}` : siteUrl;
  const ogImage = image || `${siteUrl}/og-image.png`;
  const isArticle = !!article;

  const jsonLd = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: metaDescription,
        image: ogImage,
        author: {
          '@type': 'Person',
          name: site.siteMetadata?.author?.name || '앤디',
        },
        publisher: {
          '@type': 'Person',
          name: site.siteMetadata?.author?.name || '앤디',
        },
        url: canonicalUrl,
        datePublished: article?.publishedTime,
        dateModified: article?.modifiedTime || article?.publishedTime,
        keywords: article?.tags?.join(', '),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: defaultTitle,
        description: metaDescription,
        url: siteUrl,
        author: {
          '@type': 'Person',
          name: site.siteMetadata?.author?.name || '앤디',
        },
      };

  return (
    <>
      <title key="title">{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link key="canonical" rel="canonical" href={canonicalUrl} />
      <meta key="description" name="description" content={metaDescription} />
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={metaDescription} />
      <meta key="og:type" property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta key="og:site_name" property="og:site_name" content={defaultTitle} />
      <meta key="og:image" property="og:image" content={ogImage} />
      <meta key="og:image:alt" property="og:image:alt" content={title} />
      <meta key="og:locale" property="og:locale" content="ko_KR" />
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
      {isArticle && (
        <meta
          key="article:author"
          property="article:author"
          content={site.siteMetadata?.author?.name || '앤디'}
        />
      )}
      {isArticle &&
        article?.tags?.map((tag) => (
          <meta key={`article:tag:${tag}`} property="article:tag" content={tag} />
        ))}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta
        key="twitter:creator"
        name="twitter:creator"
        content={site.siteMetadata?.social?.twitter || ``}
      />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={metaDescription} />
      <meta key="twitter:image" name="twitter:image" content={ogImage} />
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
