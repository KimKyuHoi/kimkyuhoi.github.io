/* eslint-disable @typescript-eslint/no-require-imports */
const React = require('react');
const { wrapRootElement } = require('./src/wrap-root-element');

exports.wrapRootElement = wrapRootElement;

exports.onRenderBody = ({ setHtmlAttributes, setHeadComponents, setPreBodyComponents }) => {
  setHtmlAttributes({ lang: `ko` });
  // 웹폰트를 내려받는 CDN과 미리 연결해 글꼴 교체로 인한 레이아웃 흔들림을 줄인다.
  setHeadComponents([
    React.createElement('link', {
      key: 'preconnect-fonts',
      rel: 'preconnect',
      href: 'https://cdn.jsdelivr.net',
      crossOrigin: 'anonymous',
    }),
    // 모바일 브라우저의 주소 표시줄·상태 표시줄 색. 페이지 바탕색과 맞춘다.
    // 다크 테마일 때는 아래 초기화 스크립트와 ThemeProvider가 값을 바꾼다.
    React.createElement('meta', {
      key: 'theme-color',
      name: 'theme-color',
      content: '#ffffff',
    }),
  ]);
  setPreBodyComponents([
    React.createElement('script', {
      key: 'theme-init',
      dangerouslySetInnerHTML: {
        __html: `
          (function() {
            try {
              var mode = localStorage.getItem('theme-mode');
              var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
              if (!mode && supportDarkMode) mode = '"dark"';
              if (!mode) mode = '"light"';
              if (mode === '"dark"') {
                document.body.classList.add('dark');
                var themeColor = document.querySelector('meta[name="theme-color"]');
                if (themeColor) themeColor.setAttribute('content', '#191f28');
              }
            } catch (e) {}
          })();
        `,
      },
    }),
  ]);
};
