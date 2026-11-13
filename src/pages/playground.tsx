import React from 'react';
import styled from '@emotion/styled';
import type { PageProps } from 'gatsby';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/features/playground/ProjectCard';
import { projects } from '@/features/playground/projects';

const PlaygroundPage: React.FC<PageProps> = ({ location }) => {
  return (
    <Layout location={location}>
      <PageHeader title="Playground" description="프로젝트와 실험 모음" />
      <Grid>
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} headingLevel="h2" />
        ))}
      </Grid>
    </Layout>
  );
};

export default PlaygroundPage;

export const Head = () => (
  <Seo
    title="Playground"
    pathname="/playground/"
    description="프론트엔드 실험과 사이드 프로젝트 모음. UI 프로토타입, 데이터 시각화 등 다양한 실험을 확인하세요."
  />
);

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, 1fr);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
