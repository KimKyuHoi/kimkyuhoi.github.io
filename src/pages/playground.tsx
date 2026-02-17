import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import { withPrefix } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';

const projects = [
  {
    name: 'Stacked Alpha Video',
    description: 'AV1 stacked alpha 방식과 VP9+HEVC 네이티브 방식의 투명 영상 비교',
    link: '/playground/stacked-alpha-video',
    tags: ['Video', 'Alpha Channel', 'AV1'],
    thumbnail: '/playground/stacked-alpha-video-thumb.png',
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
