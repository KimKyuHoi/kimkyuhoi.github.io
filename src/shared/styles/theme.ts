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
    // Pretendard 다음의 두 이름은 기기 글꼴을 Pretendard와 같은 치수로 맞춘 것이다 (src/fonts.css).
    heading:
      "'Pretendard', 'Pretendard Fallback Noto', 'Pretendard Fallback Apple', 'Noto Sans KR', sans-serif",
    body: "'Pretendard', 'Pretendard Fallback Noto', 'Pretendard Fallback Apple', 'Noto Sans KR', sans-serif",
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
    header: 'rgba(255, 255, 255, 0.8)',
    // 화면 위에 떠 있는 막대(하단 독, 플레이어 바). 뒤의 글이 비치되 글자를 방해하지 않을 만큼만 투명하다.
    float: 'rgba(255, 255, 255, 0.88)',
  },
  text: {
    primary: '#191f28',
    // 흰 배경과 muted 배경(#f2f4f6) 위에서 모두 4.5:1 이상이 되도록 고른 값
    muted: '#5c6775',
    caption: '#6b7684',
    inverse: '#ffffff',
  },
  border: '#e5e8eb',
  // 흰 배경 위 글자색으로도 쓰이므로 4.5:1을 넘는 파랑을 쓴다
  accent: '#1b64da',
  // 흰 글자를 올리는 채움색(버튼, 선택된 탭). 흰 글자와 4.5:1을 넘어야 한다.
  accentSolid: '#1b64da',
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
    header: 'rgba(25, 31, 40, 0.8)',
    float: 'rgba(38, 46, 57, 0.9)',
  },
  text: {
    primary: '#f9fafb',
    muted: '#b0b8c1',
    caption: '#8b95a1',
    inverse: '#ffffff',
  },
  border: '#333d4b',
  accent: '#3182f6',
  // 다크의 강조색(#3182f6)은 어두운 바탕 위의 글자용이라 밝다. 그 위에 흰 글자를 올리면 3.7:1에 그치므로
  // 채움색은 라이트와 같은 진한 파랑을 쓴다.
  accentSolid: '#1b64da',
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
    header: 'var(--bg-header)',
    float: 'var(--bg-float)',
  },
  text: {
    primary: 'var(--text-primary)',
    muted: 'var(--text-muted)',
    caption: 'var(--text-caption)',
    inverse: 'var(--text-inverse)',
  },
  border: 'var(--border)',
  accent: 'var(--accent)',
  accentSolid: 'var(--accent-solid)',
  accent2: 'var(--accent2)',
  shadow: {
    soft: 'var(--shadow-soft)',
    card: 'var(--shadow-card)',
    hover: 'var(--shadow-hover)',
  },
};

export const globalStyles = css`
  :root {
    --bg-page: ${lightValues.bg.page};
    --bg-surface: ${lightValues.bg.surface};
    --bg-muted: ${lightValues.bg.muted};
    --bg-code: ${lightValues.bg.code};
    --bg-code-inline: ${lightValues.bg.codeInline};
    --bg-header: ${lightValues.bg.header};
    --bg-float: ${lightValues.bg.float};
    --text-primary: ${lightValues.text.primary};
    --text-muted: ${lightValues.text.muted};
    --text-caption: ${lightValues.text.caption};
    --text-inverse: ${lightValues.text.inverse};
    --border: ${lightValues.border};
    --accent: ${lightValues.accent};
    --accent-solid: ${lightValues.accentSolid};
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
    --bg-header: ${darkValues.bg.header};
    --bg-float: ${darkValues.bg.float};
    --text-primary: ${darkValues.text.primary};
    --text-muted: ${darkValues.text.muted};
    --text-caption: ${darkValues.text.caption};
    --text-inverse: ${darkValues.text.inverse};
    --border: ${darkValues.border};
    --accent: ${darkValues.accent};
    --accent-solid: ${darkValues.accentSolid};
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
    /* 한글이 단어 중간에서 끊기지 않게 하고, 공백 없는 긴 영문(URL 등)은 넘치지 않게 꺾는다. */
    word-break: keep-all;
    overflow-wrap: break-word;
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
