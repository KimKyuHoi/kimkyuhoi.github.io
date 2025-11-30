import { atomWithStorage } from "jotai/utils"

export type ThemeMode = "light" | "dark"

// Persist theme mode in localStorage with key 'theme-mode'
export const themeModeAtom = atomWithStorage<ThemeMode>("theme-mode", "light")
