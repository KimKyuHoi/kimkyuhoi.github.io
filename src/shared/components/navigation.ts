import { FileText, FlaskConical, House, MessageCircle, UserRound } from 'lucide-react';

/** 사이트의 최상위 메뉴. 상단 메뉴(넓은 화면)와 하단 독(폰)이 함께 쓴다. */
export const navItems = [
  { label: '홈', to: '/', Icon: House },
  { label: '글', to: '/posts/', Icon: FileText },
  { label: '소개', to: '/about/', Icon: UserRound },
  { label: '방명록', to: '/guestbook/', Icon: MessageCircle },
  { label: '플레이그라운드', to: '/playground/', Icon: FlaskConical },
];

export type NavItem = (typeof navItems)[number];

// 독은 다섯 칸을 똑같이 나눈다. 이름이 가장 긴 플레이그라운드를 가운데에 두면
// 양옆 이름이 짧아서, 좁은 폰에서도 이름이 옆 칸과 부딪히지 않는다.
export const dockItems = [0, 1, 4, 2, 3].map((index) => navItems[index]);

const trim = (path: string) => path.replace(/\/+$/, '') || '/';

/** 주소가 메뉴 항목(또는 그 하위 페이지)에 해당하는지 */
export const isActivePath = (pathname: string, to: string) => {
  const current = trim(pathname);
  const base = trim(to);
  return current === base || (base !== '/' && current.startsWith(`${base}/`));
};

/** 주소가 메뉴 항목의 화면 그 자체인지 (하위 페이지는 제외) */
export const isSamePath = (pathname: string, to: string) => trim(pathname) === trim(to);
