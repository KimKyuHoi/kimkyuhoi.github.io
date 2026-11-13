import type { WrapRootElementNodeArgs } from 'gatsby';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/providers/ThemeProvider';
import SmoothScroll from '@/motion/SmoothScroll';

export const wrapRootElement = ({ element }: WrapRootElementNodeArgs) => (
  <ThemeProvider>
    <MotionConfig reducedMotion="user">
      <SmoothScroll>{element}</SmoothScroll>
    </MotionConfig>
  </ThemeProvider>
);
