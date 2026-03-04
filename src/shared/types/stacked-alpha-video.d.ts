import React from 'react';
declare module 'stacked-alpha-video' {
  export default class StackedAlphaVideo extends HTMLElement {
    premultipliedAlpha: boolean;
  }
}

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
