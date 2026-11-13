import React, { useEffect, useRef } from 'react';
import { Global, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { useAtom } from 'jotai';
import { themeModeAtom } from '@/atoms/theme';
import { theme, globalStyles } from '@/styles/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useAtom(themeModeAtom);
  const adopted = useRef(false);

  // 상태 → body 클래스. 첫 실행은 건너뛴다. 그 시점의 mode는 저장값을 읽기 전의 기본값(light)이라,
  // 초기화 스크립트(gatsby-ssr.js)가 이미 켜 둔 다크 테마를 꺼 버려 화면이 깜빡이기 때문이다.
  useEffect(() => {
    if (!adopted.current) return;
    document.body.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  // 첫 렌더 뒤, 초기화 스크립트가 정한 테마(저장값, 없으면 시스템 설정)를 상태로 가져온다.
  useEffect(() => {
    adopted.current = true;
    if (document.body.classList.contains('dark')) setMode('dark');
  }, [setMode]);

  return (
    <EmotionThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      {children}
    </EmotionThemeProvider>
  );
};
