import * as React from 'react';
import { Link } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import LogoStage, { ScreenPanel } from '@/features/home/LogoStage';

const NotFoundPage: React.FC<PageProps> = ({ location }) => {
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
    <Layout location={location}>
      {/* 홈 화면의 플레이어와 같은 패널. 여기서는 영상이 끝내 로드되지 않은 것처럼 가장 낮은 화질에 머문다. */}
      <ScreenPanel aria-labelledby="not-found-title">
        <LogoStage block={40} hideOriginal />
        <Body>
          <Code>404</Code>
          <Title id="not-found-title">페이지를 찾을 수 없습니다</Title>
          <Description>주소가 바뀌었거나 없어진 페이지입니다.</Description>
          <Actions>
            <Action to="/">홈으로 가기</Action>
            <Action to="/posts/">글 목록 보기</Action>
          </Actions>
        </Body>
      </ScreenPanel>
    </Layout>
  );
};

export const Head = () => <Seo title="페이지를 찾을 수 없습니다" pathname="/404" noindex />;

export default NotFoundPage;

const Body = styled.div`
  padding: 48px;

  @media (max-width: 768px) {
    padding: 28px 24px;
  }
`;

const Code = styled.p`
  margin: 0 0 14px;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: clamp(32px, 5.6vw, 54px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
  word-break: keep-all;
  color: #ffffff;
`;

const Description = styled.p`
  margin: 0 0 28px;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(249, 250, 251, 0.82);
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Action = styled(Link)`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(11, 16, 32, 0.55);
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;
