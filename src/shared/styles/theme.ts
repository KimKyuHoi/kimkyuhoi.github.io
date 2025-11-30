import { css, Theme } from '@emotion/react';

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

// Define the values for light and dark modes
const lightValues = {
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
  accent: '#3182f6',
  accent2: '#6b7684',
  shadow: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
    card: '0 10px 30px rgba(0, 0, 0, 0.08)',
    hover: '0 20px 40px rgba(0, 0, 0, 0.12)',
  },
};

const darkValues = {
  bg: {
    page: '#191f28',
    surface: '#191f28',
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

// The theme object that uses CSS variables
export const theme: Theme = {
  ...baseTheme,
  mode: 'light', // This is just a placeholder type, actual mode is handled by CSS
  bg: {
    page: 'var(--bg-page)',
    surface: 'var(--bg-surface)',
    muted: 'var(--bg-muted)',
    code: 'var(--bg-code)',
    codeInline: 'var(--bg-code-inline)',
  },
  text: {
    primary: 'var(--text-primary)',
    muted: 'var(--text-muted)',
    caption: 'var(--text-caption)',
    inverse: 'var(--text-inverse)',
  },
  border: 'var(--border)',
  accent: 'var(--accent)',
  accent2: 'var(--accent2)',
  shadow: {
    soft: 'var(--shadow-soft)',
    card: 'var(--shadow-card)',
    hover: 'var(--shadow-hover)',
  },
};

// Helper to generate CSS variables
const toVars = (obj: any, prefix = '-'): string => {
  return Object.entries(obj)
    .map(([key, value]) => {
      const varName = `${prefix}-${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`;
      if (typeof value === 'object') {
        return toVars(value, varName);
      }
      return `${varName}: ${value}`;
    })
    .join(';');
};

export const globalStyles = css`
  :root {
    --bg-page: ${lightValues.bg.page};
    --bg-surface: ${lightValues.bg.surface};
    --bg-muted: ${lightValues.bg.muted};
    --bg-code: ${lightValues.bg.code};
    --bg-code-inline: ${lightValues.bg.codeInline};
    --text-primary: ${lightValues.text.primary};
    --text-muted: ${lightValues.text.muted};
    --text-caption: ${lightValues.text.caption};
    --text-inverse: ${lightValues.text.inverse};
    --border: ${lightValues.border};
    --accent: ${lightValues.accent};
    --accent2: ${lightValues.accent2};
    --shadow-soft: ${lightValues.shadow.soft};
    --shadow-card: ${lightValues.shadow.card};
    --shadow-hover: ${lightValues.shadow.hover};
  }

  body.dark {
    --bg-page: ${darkValues.bg.page};
    --bg-surface: ${darkValues.bg.surface};
    --bg-muted: ${darkValues.bg.muted};
    --bg-code: ${darkValues.bg.code};
    --bg-code-inline: ${darkValues.bg.codeInline};
    --text-primary: ${darkValues.text.primary};
    --text-muted: ${darkValues.text.muted};
    --text-caption: ${darkValues.text.caption};
    --text-inverse: ${darkValues.text.inverse};
    --border: ${darkValues.border};
    --accent: ${darkValues.accent};
    --accent2: ${darkValues.accent2};
    --shadow-soft: ${darkValues.shadow.soft};
    --shadow-card: ${darkValues.shadow.card};
    --shadow-hover: ${darkValues.shadow.hover};
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
    transition:
      background 0.3s ease,
      color 0.3s ease;
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

// Export for backward compatibility if needed, but they now point to the same object
export const lightTheme = theme;
export const darkTheme = theme;
