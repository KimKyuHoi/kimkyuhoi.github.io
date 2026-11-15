import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ThemeMode = 'light' | 'dark';

// 사용자가 버튼으로 직접 고른 테마만 localStorage('theme-mode')에 남긴다. 고른 적이 없으면 null이다.
const chosenModeAtom = atomWithStorage<ThemeMode | null>('theme-mode', null);

// 고른 적이 없을 때 따르는 시스템 설정의 테마. 저장하지 않으므로 시스템이 바뀌면 화면도 따라 바뀐다.
export const systemModeAtom = atom<ThemeMode>('light');

// 화면에 쓰는 테마. 여기에 값을 쓰면 사용자가 고른 것으로 보고 저장한다.
export const themeModeAtom = atom(
  (get) => get(chosenModeAtom) ?? get(systemModeAtom),
  (get, set, next: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    const prev = get(chosenModeAtom) ?? get(systemModeAtom);
    set(chosenModeAtom, typeof next === 'function' ? next(prev) : next);
  }
);
