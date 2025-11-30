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
  children?: React.ReactNode;
};

type SeoQuery = {
  site: {
    siteMetadata: {
      title?: string;
      description?: string;
      siteUrl?: string;
      social?: {
        twitter?: string;
      } | null;
    };
  };
};

const Seo: React.FC<SeoProps> = ({ description, title, children }) => {
  const { site } = useStaticQuery<SeoQuery>(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
          social {
            twitter
          }
        }
      }
    }
  `);

  const metaDescription = description || site.siteMetadata.description;
  const defaultTitle = site.siteMetadata?.title;

  return (
    <>
      <title key="title">{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <meta key="description" name="description" content={metaDescription} />
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={metaDescription} />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="twitter:card" name="twitter:card" content="summary" />
      <meta
        key="twitter:creator"
        name="twitter:creator"
        content={site.siteMetadata?.social?.twitter || ``}
      />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={metaDescription} />
      <meta
        key="og:image"
        property="og:image"
        content={`${site.siteMetadata?.siteUrl}/og-image.svg`}
      />
      <meta
        key="twitter:image"
        name="twitter:image"
        content={`${site.siteMetadata?.siteUrl}/og-image.svg`}
      />
      {children}
    </>
  );
};

export default Seo;
