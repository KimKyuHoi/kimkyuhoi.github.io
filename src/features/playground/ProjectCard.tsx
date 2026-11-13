import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { withPrefix } from 'gatsby';
import useExcerptFit from '@/hooks/useExcerptFit';
import TiltCard from '@/motion/TiltCard';
import {
  budgetBlock,
  budgetExcerpt,
  budgetLines,
  budgetTitle,
  budgetType,
} from '@/styles/lineBudget';
import type { Project } from '@/features/playground/projects';

type ProjectCardProps = {
  project: Project;
  /** 카드 제목의 제목 수준. 놓이는 섹션의 문서 구조에 맞춘다. */
  headingLevel?: 'h2' | 'h3';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, headingLevel = 'h3' }) => {
  const external = project.link.startsWith('http');
  const textRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  useExcerptFit(textRef, nameRef, descriptionRef);

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
            <Text ref={textRef}>
              <Name as={headingLevel} ref={nameRef}>
                {project.name}
              </Name>
              <Description ref={descriptionRef}>{project.description}</Description>
            </Text>
            <Tags>
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Tags>
          </Body>
        </Card>
      </TiltCard>
    </Reveal>
  );
};

export default ProjectCard;

// 카드 자신의 폭으로 줄 수를 고른다. 한 단으로 놓일 때와 두 단으로 놓일 때 폭이 크게 달라서다.
const NARROW_CARD = '(max-width: 439px)';
const WIDE_CARD = '(min-width: 700px)';

const Reveal = styled.div`
  container: project-card / inline-size;
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
  gap: 14px;
  padding: 20px;
`;

// 이름과 설명이 함께 쓰는 자리. 설명의 길이와 상관없이 카드 높이가 같도록 줄 수를 정해 둔다 (lineBudget.ts).
// 이름은 두 줄까지 쓰고, 설명은 카드가 좁을수록 여러 줄로 접히므로 좁은 카드일수록 줄을 더 잡는다.
const Text = styled.div`
  ${budgetBlock}
  ${budgetType({ title: 20, titleLine: 28, excerpt: 15, excerptLine: 24, gap: 10 })}
  ${budgetLines(2, 2)}

  @container project-card ${NARROW_CARD} {
    ${budgetLines(2, 3)}
  }

  @container project-card ${WIDE_CARD} {
    ${budgetLines(2, 1)}
  }
`;

const Name = styled.h3`
  ${budgetTitle}

  font-weight: 700;
  color: ${({ theme }) => theme.text.primary};
`;

const Description = styled.p`
  ${budgetExcerpt}

  color: ${({ theme }) => theme.text.muted};
`;

// 태그는 한 줄만 보여 준다. 줄을 바꾼 칩은 통째로 가려지므로 칩이 반쯤 잘려 보이지 않는다.
const Tags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  height: 28px;
  overflow: hidden;
  overflow: clip;
`;

const Tag = styled.span`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
`;
