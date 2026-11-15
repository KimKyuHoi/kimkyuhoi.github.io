import React, { useEffect, useRef } from 'react';
import { Global, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { systemModeAtom, themeModeAtom } from '@/atoms/theme';
import { theme, globalStyles } from '@/styles/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useAtomValue(themeModeAtom);
  const setSystemMode = useSetAtom(systemModeAtom);
  const adopted = useRef(false);

  // 상태 → body 클래스. 첫 실행은 건너뛴다. 그 시점의 mode는 저장값을 읽기 전의 기본값(light)이라,
  // 초기화 스크립트(gatsby-ssr.js)가 이미 켜 둔 다크 테마를 꺼 버려 화면이 깜빡이기 때문이다.
  useEffect(() => {
    if (!adopted.current) return;
    document.body.classList.toggle('dark', mode === 'dark');
    // 모바일 브라우저의 주소 표시줄 색도 테마의 바탕색을 따라가게 한다 (gatsby-ssr.js의 theme-color).
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'dark' ? '#191f28' : '#ffffff');
  }, [mode]);

  // 첫 렌더 뒤, 초기화 스크립트가 정한 테마(저장값, 없으면 시스템 설정)를 상태로 가져온다.
  // 사용자가 고른 것이 아니므로 저장하지 않고, 이후 시스템 설정이 바뀌면 그대로 따라간다.
  useEffect(() => {
    adopted.current = true;
    setSystemMode(document.body.classList.contains('dark') ? 'dark' : 'light');

    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = (event: MediaQueryListEvent) => setSystemMode(event.matches ? 'dark' : 'light');
    system.addEventListener('change', follow);
    return () => system.removeEventListener('change', follow);
  }, [setSystemMode]);

  return (
    <EmotionThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      {children}
    </EmotionThemeProvider>
  );
};
