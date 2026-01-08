import { useAtom } from 'jotai';
import { themeModeAtom, ThemeMode } from '@/atoms/theme';

export const useThemeMode = () => {
  const [mode, setMode] = useAtom(themeModeAtom);

  const toggle = () => {
    setMode((prev: ThemeMode) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { mode, toggle };
};
