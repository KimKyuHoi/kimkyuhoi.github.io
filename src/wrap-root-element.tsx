import type { WrapRootElementNodeArgs } from 'gatsby';
import { ThemeProvider } from '@/providers/ThemeProvider';

export const wrapRootElement = ({ element }: WrapRootElementNodeArgs) => (
  <ThemeProvider>{element}</ThemeProvider>
);
