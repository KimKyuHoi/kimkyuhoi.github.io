import React, { Suspense } from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import { Skeleton } from '@/ui/Skeleton';
import { useMounted } from '@/hooks/useMounted';

const Utterances = React.lazy(() => import('@/features/blog/components/Utterances'));

const GuestbookPage: React.FC<PageProps> = ({ location }) => {
  const isMounted = useMounted();

  return (
    <Layout location={location}>
      <Header>
        <Title>Guestbook</Title>
        <Desc>자유롭게 방명록을 남겨주세요.</Desc>
      </Header>
      <Card>
        {isMounted ? (
          <Suspense fallback={<Skeleton height="300px" />}>
            <Utterances issueTerm="guestbook" />
          </Suspense>
        ) : (
          <Skeleton height="300px" />
        )}
      </Card>
    </Layout>
  );
};

export default GuestbookPage;

export const Head = () => <Seo title="Guestbook" />;

const Header = styled.header`
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

const Card = styled.div`
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 12px;
`;
