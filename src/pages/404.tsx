import * as React from 'react';
import { Link } from 'gatsby';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import LogoStage, { COMPACT, ScreenPanel } from '@/features/home/LogoStage';
import { media } from '@/styles/media';

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

// 글자색은 ScreenPanel이 정한 변수를 쓴다 (LogoStage.tsx).
// 폰에서는 이 상자가 사라지고, 안의 요소들이 포스터 격자의 제 줄에 직접 놓인다:
// 404(2)와 제목(3)은 영상 화면 위에, 설명(6)과 버튼(7)은 그 아래 페이지 바탕에.
const Body = styled.div`
  padding: 48px;

  ${COMPACT} {
    padding: 40px 36px;
  }

  ${media.phone} {
    display: contents;
  }
`;

const Code = styled.p`
  margin: 0 0 14px;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 16px;
  font-weight: 600;
  color: var(--screen-text);

  ${media.phone} {
    grid-area: 2 / 1;
    position: relative;
    z-index: 1;
    margin: 0 0 8px;
    padding: 0 20px;
    color: var(--screen-text-soft);
  }
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: clamp(32px, 5.6vw, 54px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
  word-break: keep-all;
  color: var(--screen-text);

  ${COMPACT} {
    max-width: 8.6em;
  }

  ${media.phone} {
    grid-area: 3 / 1;
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 0 20px 28px;
    font-size: clamp(30px, 8.8vw, 42px);
    line-height: 1.18;
  }
`;

const Description = styled.p`
  margin: 0 0 28px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--aside-text-soft);

  ${media.phone} {
    grid-area: 6 / 1;
    margin: 20px 8px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  ${media.phone} {
    grid-area: 7 / 1;
    margin: 0 8px;

    a {
      flex: 1 1 0;
      justify-content: center;
      min-height: 48px;
    }
  }
`;

const Action = styled(Link)`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid var(--aside-line);
  background: var(--aside-chip);
  font-size: 15px;
  font-weight: 600;
  color: var(--aside-text);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: var(--aside-chip-hover);
    border-color: var(--aside-text-soft);
  }
`;
