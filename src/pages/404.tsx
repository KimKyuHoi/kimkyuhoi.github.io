import * as React from 'react';
import { graphql } from 'gatsby';

import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

import { PageProps } from 'gatsby';

interface NotFoundPageProps extends PageProps {
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
  };
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title;

  React.useEffect(() => {
    const { pathname, search, hash } = window.location;
    // 구 블로그 URL (/blog/...) -> 새 URL (/..) 리다이렉트
    if (pathname.startsWith('/blog/')) {
      const newPath = pathname.replace(/^\/blog/, '') || '/';
      window.location.replace(newPath + search + hash);
    } else if (pathname === '/blog' || pathname === '/blog/') {
      window.location.replace('/' + search + hash);
    }
  }, []);

  return (
    <Layout location={location} title={siteTitle}>
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Layout>
  );
};

export const Head = () => <Seo title="404: Not Found" pathname="/404" />;

export default NotFoundPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
