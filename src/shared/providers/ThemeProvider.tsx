import React, { useEffect, useState } from "react"
import { Global, ThemeProvider as EmotionThemeProvider } from "@emotion/react"
import { useAtom } from "jotai"
import { themeModeAtom } from "@/atoms/theme"
import { darkTheme, globalStyles, lightTheme } from "@/styles/theme"

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode] = useAtom(themeModeAtom)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by rendering only after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to light theme during SSR/initial render to match server HTML
  // or handle it gracefully. For static sites, it's often better to render
  // a placeholder or the default theme.
  const theme = mounted && mode === "dark" ? darkTheme : lightTheme

  return (
    <EmotionThemeProvider theme={theme}>
      <Global styles={globalStyles(theme)} />
      {/* 
        Optionally hide content until mounted to prevent flash, 
        but for SEO/UX it's usually better to show default (light) 
        and swap. 
      */}
      {children}
    </EmotionThemeProvider>
  )
}
