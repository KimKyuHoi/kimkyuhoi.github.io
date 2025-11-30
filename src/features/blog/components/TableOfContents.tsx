import React from 'react';
import styled from '@emotion/styled';

interface TocProps {
  tableOfContents?: string | null;
}

const Toc: React.FC<TocProps> = ({ tableOfContents }) => {
  if (!tableOfContents) return null;
  return (
    <Wrapper>
      <Title>목차</Title>
      <div dangerouslySetInnerHTML={{ __html: tableOfContents }} />
    </Wrapper>
  );
};

export default Toc;

const Wrapper = styled.aside`
  position: sticky;
  top: 120px;
  padding: 16px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.soft};
  max-height: calc(100vh - 160px);
  overflow: auto;

  /* Reset all list styles inside TOC */
  ul,
  li,
  p {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ul {
    margin-bottom: 0;
  }

  li {
    margin-bottom: 6px;
    line-height: 1.6;
  }

  /* Visual hierarchy for nested lists */
  li > ul {
    margin-left: 8px;
    padding-left: 12px;
    border-left: 1px solid ${({ theme }) => theme.border};
    margin-top: 6px;
    margin-bottom: 6px;
  }

  a {
    color: ${({ theme }) => theme.text.muted};
    font-size: 14px;
    text-decoration: none;
    display: block;
    transition: all 0.2s ease;

    /* Text truncation */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: ${({ theme }) => theme.text.primary};
      transform: translateX(4px);
      color: ${({ theme }) => theme.accent};
    }
  }
`;

const Title = styled.div`
  font-weight: 800;
  margin-bottom: 10px;
`;
