/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const React = require('react');
const { wrapRootElement } = require('./src/wrap-root-element');

exports.wrapRootElement = wrapRootElement;

exports.onRenderBody = ({ setHtmlAttributes, setPreBodyComponents }) => {
  setHtmlAttributes({ lang: `ko` });
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
