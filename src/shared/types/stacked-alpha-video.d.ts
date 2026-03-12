import React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'stacked-alpha-video': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
