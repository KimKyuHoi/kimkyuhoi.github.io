/**
 * 화면 폭 기준. 여러 컴포넌트가 같은 지점에서 함께 모양을 바꾸도록 한곳에 둔다.
 *
 * - 폰: 상단 메뉴 대신 하단 독으로 이동하고, 홈 히어로가 세로형 플레이어가 된다.
 * - 태블릿: 사이드바(홈의 위젯, 글의 목차)가 본문 아래·시트로 옮겨 간다.
 */
export const PHONE_MAX = 640;
export const TABLET_MAX = 1023;

export const media = {
  phone: `@media (max-width: ${PHONE_MAX}px)`,
  abovePhone: `@media (min-width: ${PHONE_MAX + 1}px)`,
  tablet: `@media (max-width: ${TABLET_MAX}px)`,
  desktop: `@media (min-width: ${TABLET_MAX + 1}px)`,
  /** 손가락으로 조작하는 기기. 마우스를 전제로 한 효과(hover)를 끄는 데 쓴다. */
  touch: '@media (hover: none)',
};

/** 폰에서 화면 아래에 떠 있는 독의 높이와, 그 아래 여백 */
export const DOCK_HEIGHT = 64;
export const DOCK_GAP = 12;
