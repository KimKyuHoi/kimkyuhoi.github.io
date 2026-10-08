import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import { OptimisticLabPage } from '@/features/optimistic-lab/OptimisticLabPage';

const OptimisticUiPage: React.FC<PageProps> = ({ location }) => (
  <Layout location={location}>
    <Header>
      <Title>Optimistic UI Lab</Title>
      <Desc>
        찜 하트 하나를 다섯 가지 방식으로 구현해 나란히 놓았습니다. 서버 지연을 조절하고, 연타나 “반영
        중 반대 클릭” 시나리오를 다섯 카드에 동시에 쏴서 화면 전이와 요청 로그를 비교해 보세요.
      </Desc>
    </Header>

    <Section>
      <OptimisticLabPage />
    </Section>
  </Layout>
);

export default OptimisticUiPage;

export const Head = () => (
  <Seo
    title="Optimistic UI Lab"
    pathname="/playground/optimistic-ui"
    description="찜 하트를 차단형·즉시 반영·useOptimistic·debounce 등 다섯 가지로 구현해 연타와 요청 취소 동작을 비교하는 실험실."
  />
);

const Header = styled.header`
  margin-bottom: 28px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 44px;
`;
