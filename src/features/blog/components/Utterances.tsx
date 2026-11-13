import React, { useEffect, useRef, useState } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import styled from '@emotion/styled';
import { media } from '@/styles/media';
import { useThemeMode } from '@/hooks/useThemeMode';

type UtterancesQuery = {
  site: {
    siteMetadata: {
      utterancesRepo?: string | null;
    } | null;
  } | null;
};

interface UtterancesProps {
  issueTerm?: string;
}

import { Skeleton } from '@/ui/Skeleton';

const Utterances: React.FC<UtterancesProps> = ({ issueTerm = 'pathname' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useThemeMode();
  const [isLoading, setIsLoading] = useState(true);
  const data = useStaticQuery<UtterancesQuery>(graphql`
    query UtterancesRepoQuery {
      site {
        siteMetadata {
          utterancesRepo
        }
      }
    }
  `);

  useEffect(() => {
    if (!containerRef.current) return;
    const repo = data?.site?.siteMetadata?.utterancesRepo;
    if (!repo) return;

    // Clear existing children
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Reset loading state when props change
    setIsLoading(true);

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', repo);
    script.setAttribute('issue-term', issueTerm);
    script.setAttribute('theme', mode === 'dark' ? 'github-dark' : 'github-light');
    script.setAttribute('label', 'comment');

    containerRef.current.appendChild(script);
  }, [data, issueTerm, mode]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://utteranc.es') return;
      if (event.data && event.data.type === 'resize') {
        setIsLoading(false);
      }
    };
    window.addEventListener('message', handler);

    // Fallback: Force show comments after 2 seconds if no resize event received
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Comments>
      {isLoading && <Skeleton height="300px" />}
      <div
        ref={containerRef}
        style={isLoading ? { height: 0, overflow: 'hidden', visibility: 'hidden' } : {}}
      />
    </Comments>
  );
};

export default Utterances;

const Comments = styled.section`
  margin: 40px 0 10px;
  background: ${({ theme }) => theme.bg.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: ${({ theme }) => theme.shadow.soft};

  /* 폰에서는 상자를 벗겨 댓글이 화면 폭을 다 쓰게 한다. 댓글 위젯 안에도 여백이 있어, 상자까지 두르면 글 쓰는 칸이 너무 좁아진다. */
  ${media.phone} {
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
`;
