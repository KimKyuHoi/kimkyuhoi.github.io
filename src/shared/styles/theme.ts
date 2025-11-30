import { css, Theme } from '@emotion/react';

export const palette = {
  ink: '#0b1021',
  navy: '#0f172a',
  ink80: '#1f2937',
  gray70: '#4b5563',
  gray50: '#9ca3af',
  gray30: '#d1d5db',
  gray20: '#e6ebf2',
  gray10: '#f7f9fc',
  white: '#ffffff',
  blue: '#2f6bff',
  blueDeep: '#1f54d9',
  purple: '#6366f1',
  pink: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
};

const baseTheme = {
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
    full: '9999px',
  },
  shadow: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
    card: '0 10px 30px rgba(0, 0, 0, 0.08)',
    hover: '0 20px 40px rgba(0, 0, 0, 0.12)',
  },
  font: {
    heading: "'D2Coding', 'Pretendard', 'Noto Sans KR', sans-serif",
    body: "'D2Coding', 'Pretendard', 'Noto Sans KR', sans-serif",
    mono: "'D2Coding', 'JetBrains Mono', 'Fira Code', monospace",
  },
};

export const lightTheme: Theme = {
  ...baseTheme,
  mode: 'light',
  bg: {
    page: '#ffffff',
    surface: '#ffffff',
    muted: '#f2f4f6',
    code: '#191f28',
    codeInline: '#f2f4f6',
  },
  text: {
    primary: '#191f28',
    muted: '#8b95a1',
    caption: '#b0b8c1',
    inverse: '#ffffff',
  },
  border: '#e5e8eb',
  accent: '#3182f6', // Toss Blue
  accent2: '#6b7684',
};

export const darkTheme: Theme = {
  ...baseTheme,
  mode: 'dark',
  bg: {
    page: '#191f28',
    surface: '#191f28', // Match page for flat look
    muted: '#333d4b',
    code: '#101317',
    codeInline: '#333d4b',
  },
  text: {
    primary: '#f9fafb',
    muted: '#b0b8c1',
    caption: '#6b7684',
    inverse: '#ffffff',
  },
  border: '#333d4b',
  accent: '#3182f6',
  accent2: '#9ca3af',
  shadow: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.4)',
    card: '0 10px 30px rgba(0, 0, 0, 0.4)',
    hover: '0 20px 40px rgba(0, 0, 0, 0.6)',
  },
};

export const globalStyles = (theme: Theme) => css`
  :root {
    color-scheme: ${theme.mode};
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    background: ${theme.bg.page};
    color: ${theme.text.primary};
    font-family: ${theme.font.body};
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  code,
  pre {
    font-family: ${theme.font.mono};
  }
  pre {
    border-radius: ${theme.radius.md};
    background: ${theme.bg.code};
    padding: 1.25rem;
    overflow: auto;
  }
  code {
    background: ${theme.bg.codeInline};
    padding: 0.2rem 0.35rem;
    border-radius: ${theme.radius.xs};
  }
  blockquote {
    border-left: 3px solid ${theme.accent};
    padding-left: 1rem;
    margin-left: 0;
    color: ${theme.text.muted};
  }
  img {
    max-width: 100%;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    scroll-margin-top: 96px;
  }
`;
