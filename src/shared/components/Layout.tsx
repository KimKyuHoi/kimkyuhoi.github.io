import React, { ReactNode } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import type { WindowLocation } from '@reach/router';
import { useThemeMode } from '@/hooks/useThemeMode';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Search, Sun } from 'lucide-react';

const navItems = [
  { label: '홈', to: '/' },
  { label: '글', to: '/posts' },
  { label: '소개', to: '/about' },
  { label: '방명록', to: '/guestbook' },
  { label: '플레이그라운드', to: '/playground' },
];

interface LayoutProps {
  location?: WindowLocation;
  title?: string;
  children: ReactNode;
}

import Toast from '@/components/Toast';

// 검색 팔레트(cmdk)는 처음 열 때 내려받는다.
const CommandPalette = React.lazy(() => import('@/components/CommandPalette'));

const Layout: React.FC<LayoutProps> = ({ location, children }) => {
  const { mode, toggle } = useThemeMode();
  const [showToast, setShowToast] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [paletteLoaded, setPaletteLoaded] = React.useState(false);

  const openPalette = React.useCallback((next: boolean) => {
    if (next) setPaletteLoaded(true);
    setPaletteOpen(next);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteLoaded(true);
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  // 단축키 표기는 Apple 기기가 아니면 Ctrl로 바꾼다. 서버 렌더링과 어긋나지 않게 마운트 뒤에 맞춘다.
  const [shortcut, setShortcut] = React.useState('⌘K');
  React.useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut('Ctrl K');
  }, []);

  const pathname = location?.pathname || '';
  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to));
  const pillTarget = hovered ?? navItems.find((item) => isActive(item.to))?.to ?? null;

  // 테마를 바꿀 때 클릭한 지점에서 새 테마가 원형으로 번져 나가게 한다 (View Transitions API).
  const handleToggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) {
      toggle();
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const root = document.documentElement;
    const nextIsDark = mode !== 'dark';

    root.classList.add('theme-switching');
    const transition = document.startViewTransition(() => {
      // body 클래스를 직접 바꿔 새 테마 스냅샷이 바로 찍히게 하고, 상태는 React가 뒤따라 맞춘다.
      document.body.classList.toggle('dark', nextIsDark);
      toggle();
    });
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => undefined);
    transition.finished.finally(() => root.classList.remove('theme-switching'));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('k546kh@gmail.com');
    setShowToast(true);
  };

  return (
    <Page>
      <Shell>
        <TopBar className="site-header">
          <Brand>
            <Link to="/" aria-label="Andy Tech Blog 홈">
              <svg
                aria-hidden="true"
                width={40}
                height={40}
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
                    <feOffset dx="0" dy="8" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <g transform="translate(256, 246)" filter="url(#softShadow)">
                  <path
                    d="M-80 130 L0 -110"
                    stroke="#2563eb"
                    strokeWidth="75"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M0 -110 L80 130"
                    stroke="#3b82f6"
                    strokeWidth="75"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M-45 40 L45 40"
                    stroke="#60a5fa"
                    strokeWidth="60"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </svg>
            </Link>
          </Brand>
          <Nav onMouseLeave={() => setHovered(null)}>
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <NavItem
                  key={item.to}
                  active={active}
                  onMouseEnter={() => setHovered(item.to)}
                  onFocus={() => setHovered(item.to)}
                  onBlur={() => setHovered(null)}
                >
                  {pillTarget === item.to ? (
                    <NavPill
                      className="nav-pill"
                      layoutId="nav-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <Link to={item.to} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </NavItem>
              );
            })}
          </Nav>
          <ActionRow>
            <SearchButton type="button" onClick={() => openPalette(true)} aria-label="검색 열기">
              <Search size={16} aria-hidden="true" />
              <span>검색</span>
              <Shortcut aria-hidden="true">{shortcut}</Shortcut>
            </SearchButton>
            <ThemeButton
              onClick={handleToggleTheme}
              aria-label="테마 전환"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <ThemeIcon
                  key={mode}
                  initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </ThemeIcon>
              </AnimatePresence>
            </ThemeButton>
          </ActionRow>
        </TopBar>
        <Content>{children}</Content>
        <Footer>
          <span>© {new Date().getFullYear()} Andy Tech Blog</span>
          <FooterLinks>
            <a href="https://github.com/kimkyuhoi" target="_blank" rel="noreferrer">
              Github
            </a>
            <button onClick={handleCopyEmail}>Contact</button>
          </FooterLinks>
        </Footer>
      </Shell>
      {paletteLoaded ? (
        <React.Suspense fallback={null}>
          <CommandPalette
            open={paletteOpen}
            onOpenChange={openPalette}
            onToggleTheme={() => handleToggleTheme()}
          />
        </React.Suspense>
      ) : null}
      <Toast
        message="이메일 주소가 복사되었습니다"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </Page>
  );
};

export default Layout;

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.bg.page};
  color: ${({ theme }) => theme.text.primary};
`;

const Shell = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px 80px;
  width: 100%;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  gap: 24px;
  height: 64px;
  background: ${({ theme }) => theme.bg.header};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 0 20px;
  margin: 0 -20px 32px;
  width: calc(100% + 40px);

  @media (max-width: 768px) {
    margin-bottom: 20px;
    gap: 12px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;

  a {
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;

  /* Hide scrollbar */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  /* 좁은 화면에서는 메뉴가 가로로 넘친다. 오른쪽 끝을 흐리게 해 옆으로 밀 수 있음을 알린다. */
  @media (max-width: 640px) {
    mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent);
    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent);

    &::after {
      content: '';
      flex: 0 0 24px;
    }
  }
`;

const NavItem = styled.span<{ active: boolean }>`
  position: relative;

  a {
    position: relative;
    padding: 8px 16px;
    border-radius: 999px;
    color: ${({ active, theme }) => (active ? theme.text.primary : theme.text.muted)};
    font-weight: 600;
    font-size: 14px;
    transition: color 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    height: 100%;
  }
  a:hover {
    color: ${({ theme }) => theme.text.primary};
  }
`;

const NavPill = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.bg.muted};
`;

const ThemeIcon = styled(motion.span)`
  display: flex;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: ${({ theme }) => theme.text.muted};
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.text.primary};
    border-color: ${({ theme }) => theme.text.muted};
  }

  @media (max-width: 768px) {
    width: 40px;
    padding: 0;
    justify-content: center;
    border: none;
    color: ${({ theme }) => theme.text.primary};

    span {
      display: none;
    }
  }
`;

const Shortcut = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
`;

const ThemeButtonBase = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text.primary};
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.bg.muted};
  }
`;
const ThemeButton = motion.create(ThemeButtonBase);

const Content = styled.main`
  margin-top: 28px;
  display: grid;
  gap: 28px;
`;

const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.text.muted};
  font-size: 14px;
  margin-top: 48px;
  padding: 24px 0 0;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 12px;
  a,
  button {
    color: ${({ theme }) => theme.text.muted};
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }
`;
