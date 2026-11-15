import React, { useEffect } from 'react';
import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Lenis 부드러운 스크롤. 실제 스크롤 위치를 움직이는 방식이라 sticky, 앵커, ScrollTrigger가 그대로 동작한다.
 * 모션 줄이기를 켠 사용자에게는 네이티브 스크롤을 그대로 둔다.
 */
const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      // 같은 페이지의 #앵커 링크(목차 등)를 부드럽게 이동시킨다.
      // 제목의 scroll-margin-top(96px)은 Lenis가 알아서 반영하므로 따로 오프셋을 주지 않는다.
      anchors: true,
      // 코드 블록, 로그 패널처럼 자체 스크롤이 있는 요소 안에서는 그 요소가 스크롤되게 둔다.
      allowNestedScroll: true,
    });
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
