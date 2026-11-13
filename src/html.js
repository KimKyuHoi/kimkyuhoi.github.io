import React from 'react';

/**
 * Gatsby의 기본 HTML 틀(.cache/default-html.js)에서 viewport만 바꾼 것.
 * viewport-fit=cover를 주어야 노치·홈 인디케이터 영역의 크기(env(safe-area-inset-*))를 CSS에서 쓸 수 있다.
 * 화면 아래에 떠 있는 독과 플레이어 바를 홈 인디케이터 위에 놓는 데 필요하다.
 */
export default function HTML(props) {
  return (
    <html {...props.htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {props.headComponents}
      </head>
      <body {...props.bodyAttributes}>
        {props.preBodyComponents}
        <div key={`body`} id="___gatsby" dangerouslySetInnerHTML={{ __html: props.body }} />
        {props.postBodyComponents}
      </body>
    </html>
  );
}
