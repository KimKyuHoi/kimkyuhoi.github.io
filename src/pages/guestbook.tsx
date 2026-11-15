import React, { Suspense } from 'react';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import { Skeleton } from '@/ui/Skeleton';
import { useMounted } from '@/hooks/useMounted';
import PageHeader from '@/components/PageHeader';

const Utterances = React.lazy(() => import('@/features/blog/components/Utterances'));

const GuestbookPage: React.FC<PageProps> = ({ location }) => {
  const isMounted = useMounted();

  return (
    <Layout location={location}>
      <PageHeader title="Guestbook" description="자유롭게 방명록을 남겨주세요." />
      <Comments>
        {isMounted ? (
          <Suspense fallback={<Skeleton height="300px" />}>
            <Utterances issueTerm="guestbook" />
          </Suspense>
        ) : (
          <Skeleton height="300px" />
        )}
      </Comments>
    </Layout>
  );
};

export default GuestbookPage;

export const Head = () => (
  <Seo
    title="Guestbook"
    pathname="/guestbook/"
    description="앤디의 기술 블로그 방명록. 자유롭게 메시지를 남겨주세요."
  />
);

// 댓글 영역은 글 본문 아래에 놓일 것을 전제로 위쪽 여백이 크다. 방명록에서는 머리말 바로 아래에 오므로 줄인다.
const Comments = styled.div`
  & > section {
    margin-top: 0;
  }
`;
