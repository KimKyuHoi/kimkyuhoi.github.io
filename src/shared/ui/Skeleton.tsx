import styled from "@emotion/styled"
import { keyframes } from "@emotion/react"

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

export const Skeleton = styled.div<{ height?: string; width?: string }>`
  height: ${({ height }) => height || "20px"};
  width: ${({ width }) => width || "100%"};
  background: ${({ theme }) => theme.bg.muted};
  background-image: linear-gradient(
    90deg,
    ${({ theme }) => theme.bg.muted} 25%,
    ${({ theme }) => theme.bg.surface} 50%,
    ${({ theme }) => theme.bg.muted} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${({ theme }) => theme.radius.md};
`
