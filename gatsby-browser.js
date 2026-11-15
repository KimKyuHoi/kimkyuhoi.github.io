import './src/fonts.css';
import './src/style.css';
import 'lenis/dist/lenis.css';
import 'prismjs/themes/prism-tomorrow.css';

import { installPageTransitions, completePageTransition } from './src/shared/motion/pageTransition';

export { wrapRootElement } from './src/wrap-root-element';

export const onInitialClientRender = () => {
  installPageTransitions();
};

// 쿼리만 바뀐 이동(글 목록의 카테고리·태그 필터)은 같은 페이지이므로 스크롤을 건드리지 않는다.
const isSamePage = (location, prevLocation) =>
  Boolean(prevLocation) && prevLocation.pathname === location.pathname;

export const shouldUpdateScroll = ({ routerProps: { location }, prevRouterProps }) => {
  if (location.hash) return false;
  if (isSamePage(location, prevRouterProps?.location)) return false;
  return [0, 0];
};

// Lenis는 자신이 기억하는 스크롤 목표로 되돌아가려 하므로, 페이지가 바뀌면 맨 위로 즉시 맞춘다.
export const onRouteUpdate = ({ location, prevLocation }) => {
  if (!location.hash && !isSamePage(location, prevLocation)) {
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
  }
  completePageTransition();
};
