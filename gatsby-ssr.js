/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
              }
            } catch (e) {}
          })();
        `,
      },
    }),
  ]);
};
