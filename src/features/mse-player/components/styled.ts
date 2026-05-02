import styled from '@emotion/styled';

export const EmbedRoot = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
`;

export const Header = styled.header`
  margin-bottom: 32px;

  a {
    color: ${({ theme }) => theme.accent};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

export const Desc = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;

  strong {
    color: ${({ theme }) => theme.text.primary};
  }
`;

export const Section = styled.section`
  margin-bottom: 36px;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
`;

export const SectionDesc = styled.p`
  margin: 0 0 16px;
  color: ${({ theme }) => theme.text.muted};
  line-height: 1.6;

  strong {
    color: ${({ theme }) => theme.text.primary};
  }

  code {
    background: ${({ theme }) => theme.bg.muted};
    padding: 1px 5px;
    border-radius: 4px;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12.5px;
  }

  a {
    color: ${({ theme }) => theme.accent};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  kbd {
    padding: 2px 6px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 4px;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    background: ${({ theme }) => theme.bg.muted};
  }
`;

export const SubLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
`;

export const CodeBlock = styled.pre`
  margin: 0;
  padding: 16px;
  background: ${({ theme }) => theme.bg.code};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  color: ${({ theme }) => theme.text.inverse};
`;
