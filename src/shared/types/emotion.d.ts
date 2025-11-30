import "@emotion/react"

type RadiusScale = {
  xs: string
  sm: string
  md: string
  lg: string
}

type ShadowScale = {
  soft: string
  card: string
}

type FontScale = {
  heading: string
  body: string
  mono: string
}

type BackgroundScale = {
  page: string
  surface: string
  muted: string
  code: string
  codeInline: string
}

type TextScale = {
  primary: string
  muted: string
  caption: string
  inverse: string
}

declare module "@emotion/react" {
  export interface Theme {
    mode: "light" | "dark"
    bg: BackgroundScale
    text: TextScale
    border: string
    accent: string
    accent2: string
    radius: RadiusScale & { xl: string; full: string }
    shadow: ShadowScale & { hover: string }
    font: FontScale
  }
}
