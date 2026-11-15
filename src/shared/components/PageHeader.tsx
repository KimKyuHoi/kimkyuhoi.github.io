import React from 'react';
import styled from '@emotion/styled';
import RevealText from '@/motion/RevealText';

/** 목록형 페이지(글, 방명록, 플레이그라운드)의 공통 머리말 */
const PageHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <Header>
    <Title>
      <RevealText text={title} />
    </Title>
    <Description>{description}</Description>
  </Header>
);

export default PageHeader;

const Header = styled.header`
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.text.primary};
`;

const Description = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
`;
