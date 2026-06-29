import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import { withPrefix } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

const projects = [
  {
    name: 'ASIS — macOS 캡처 & 어노테이션 도구',
    description:
      '도형·화살표·블러·텍스트 주석부터 GIF 녹화까지, 맥 화면 캡처를 빠르게 처리하기 위해 직접 만든 도구입니다. 다운로드와 버그 제보는 ASIS 페이지에서 받고 있어요.',
    link: 'https://kimkyuhoi.github.io/ASIS/',
    tags: ['macOS', 'Electron', 'Annotation', 'GIF'],
    thumbnail: '/playground/asis-thumb.png',
  },
  {
    name: 'Stacked Alpha Video',
    description: 'AV1 stacked alpha 방식과 VP9+HEVC 네이티브 방식의 투명 영상 비교',
    link: '/playground/stacked-alpha-video',
    tags: ['Video', 'Alpha Channel', 'AV1'],
    thumbnail: '/playground/stacked-alpha-video-thumb.png',
  },
  {
    name: 'MSE 미니 플레이어',
    description:
      'Media Source Extensions만으로 만든 가장 단순한 비디오 플레이어. 자산 URL을 직접 넣어보고 6단계 동작 흐름을 로그로 확인할 수 있습니다.',
    link: '/playground/mse-mini-player',
    tags: ['Video', 'MSE', 'Streaming'],
    thumbnail: '/playground/mse-mini-player-thumb.png',
  },
];

const PlaygroundPage: React.FC<PageProps> = ({ location }) => {
  return (
    <Layout location={location}>
      <Header>
        <Title>Playground</Title>
        <Desc>프로젝트와 실험 모음</Desc>
      </Header>
      <Grid>
        {projects.map((p) => (
          <Card
            key={p.name}
            href={p.link.startsWith('http') ? p.link : withPrefix(p.link)}
            target={p.link.startsWith('http') ? '_blank' : undefined}
          >
            <Thumbnail>
              {p.thumbnail ? <img src={withPrefix(p.thumbnail)} alt={p.name} /> : <Placeholder />}
            </Thumbnail>
            <CardBody>
              <TagWrap>
                {p.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagWrap>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Layout>
  );
};

export default PlaygroundPage;

export const Head = () => (
  <Seo
    title="Playground"
    pathname="/playground"
    description="프론트엔드 실험과 사이드 프로젝트 모음. UI 프로토타입, 데이터 시각화 등 다양한 실험을 확인하세요."
  />
);

const Header = styled.header`
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, 1fr);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.a`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.xl};
  color: inherit;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => (theme.mode === 'dark' ? theme.bg.muted : theme.bg.surface)};
    box-shadow: ${({ theme }) => theme.shadow.hover};
    transform: translateY(-4px);
  }
`;

const Thumbnail = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.bg.muted};
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.4;
    color: ${({ theme }) => theme.text.primary};
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: ${({ theme }) => theme.text.muted};
  }
`;

const TagWrap = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};
  font-size: 13px;
  font-weight: 500;
`;
