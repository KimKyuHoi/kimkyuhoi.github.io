import React from 'react';
import styled from '@emotion/styled';
import { withPrefix } from 'gatsby';
import TiltCard from '@/motion/TiltCard';
import type { Project } from '@/features/playground/projects';

type ProjectCardProps = {
  project: Project;
  /** 카드 제목의 제목 수준. 놓이는 섹션의 문서 구조에 맞춘다. */
  headingLevel?: 'h2' | 'h3';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, headingLevel = 'h3' }) => {
  const external = project.link.startsWith('http');

  return (
    <Reveal className="reveal-on-scroll">
      <TiltCard>
        <Card
          href={external ? project.link : withPrefix(project.link)}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          <Thumbnail>
            {project.thumbnail ? (
              <img src={withPrefix(project.thumbnail)} alt="" loading="lazy" decoding="async" />
            ) : (
              <Placeholder />
            )}
          </Thumbnail>
          <Body>
            <Tags>
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Tags>
            <Name as={headingLevel}>{project.name}</Name>
            <p>{project.description}</p>
          </Body>
        </Card>
      </TiltCard>
    </Reveal>
  );
};

export default ProjectCard;

const Reveal = styled.div`
  display: grid;
`;

const Card = styled.a`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.bg.surface};
  color: inherit;
  transition: box-shadow 0.3s ease;

  @media (hover: hover) {
    &:hover {
      box-shadow: ${({ theme }) => theme.shadow.hover};
    }

    &:hover img {
      transform: scale(1.06);
    }
  }
`;

const Thumbnail = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: ${({ theme }) => theme.bg.muted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: ${({ theme }) => theme.text.muted};
  }
`;

const Name = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ theme }) => theme.text.primary};
`;

const Tags = styled.div`
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
