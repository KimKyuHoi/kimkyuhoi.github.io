/**
 * 문서의 주어진 위치로 부드럽게 스크롤한다.
 * Lenis가 켜져 있으면 Lenis로 움직이고(그래야 Lenis가 기억하는 목표 위치와 어긋나지 않는다),
 * 모션 줄이기 설정에서는 곧바로 이동한다.
 */
export const scrollToY = (y: number) => {
  if (window.__lenis) {
    window.__lenis.scrollTo(y, { duration: 1 });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
};
