import React, { useEffect, useState } from 'react';
import { Global, ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { useAtom } from 'jotai';
import { themeModeAtom } from '@/atoms/theme';
import { theme, globalStyles } from '@/styles/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode] = useAtom(themeModeAtom);

  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [mode]);

  return (
    <EmotionThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      {children}
    </EmotionThemeProvider>
  );
};
