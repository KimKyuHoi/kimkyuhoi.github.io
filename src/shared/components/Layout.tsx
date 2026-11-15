import React, { ReactNode } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import type { WindowLocation } from '@reach/router';
import { useThemeMode } from '@/hooks/useThemeMode';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Search, Sun } from 'lucide-react';
import Toast from '@/components/Toast';
import Dock from '@/components/Dock';
import { isActivePath, navItems } from '@/components/navigation';
import { DOCK_GAP, DOCK_HEIGHT, PHONE_MAX, media } from '@/styles/media';

interface LayoutProps {
  location?: WindowLocation;
  title?: string;
  /** 이 화면이 속한 메뉴의 주소. 주소만으로는 알 수 없는 화면(글 본문은 /posts/ 아래에 있지 않다)에서 넘긴다. */
  section?: string;
  children: ReactNode;
}

// 검색 팔레트(cmdk)는 처음 열 때 내려받는다.
const CommandPalette = React.lazy(() => import('@/components/CommandPalette'));

const Layout: React.FC<LayoutProps> = ({ location, section, children }) => {
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
  const activeTo = section ?? navItems.find((item) => isActivePath(pathname, item.to))?.to ?? null;
  const pillTarget = hovered ?? activeTo;
  const collapsed = useCollapseOnScroll();

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
        <TopBar className="site-header" data-collapsed={collapsed || undefined}>
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
              {/* 폰에서는 상단 메뉴가 하단 독으로 내려가므로, 빈 자리에 블로그 이름을 보여 준다. */}
              <BrandName aria-hidden="true">Andy Tech Blog</BrandName>
            </Link>
          </Brand>
          <Nav onMouseLeave={() => setHovered(null)}>
            {navItems.map((item) => {
              const active = activeTo === item.to;
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
      <Dock pathname={pathname} activeTo={activeTo} />
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

// 이만큼 내려간 뒤부터 헤더를 접는다. 맨 위 근처에서는 늘 보인다.
const COLLAPSE_AFTER = 160;
// 스크롤 방향이 바뀌었다고 보려면 이만큼은 움직여야 한다. 손가락이 살짝 떨리는 정도로 헤더가 오르내리지 않게 한다.
const DIRECTION_SLOP = 12;

/**
 * 아래로 읽어 내려가는 동안에는 헤더를 접고, 위로 되돌아오면 다시 편다 (폰에서만 쓰인다).
 * 접힌 상태를 실제로 숨기는 것은 CSS가 화면 폭을 보고 정한다.
 */
const useCollapseOnScroll = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    let anchor = window.scrollY;
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < COLLAPSE_AFTER) {
        anchor = y;
        setCollapsed(false);
      } else if (y - anchor > DIRECTION_SLOP) {
        anchor = y;
        setCollapsed(true);
      } else if (anchor - y > DIRECTION_SLOP) {
        anchor = y;
        setCollapsed(false);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return collapsed;
};

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.bg.page};
  color: ${({ theme }) => theme.text.primary};
`;

// 좌우 여백은 노치가 있는 기기를 가로로 눕혔을 때 안전 영역만큼 넓어진다.
const Shell = styled.div`
  --gutter-left: max(20px, env(safe-area-inset-left, 0px));
  --gutter-right: max(20px, env(safe-area-inset-right, 0px));

  max-width: 1000px;
  margin: 0 auto;
  padding: 0 var(--gutter-right) 80px var(--gutter-left);
  width: 100%;

  /* 화면 아래에 떠 있는 독이 마지막 내용을 가리지 않도록 그만큼 비워 둔다. */
  ${media.phone} {
    padding-bottom: calc(${DOCK_HEIGHT + DOCK_GAP + 32}px + env(safe-area-inset-bottom, 0px));
  }
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
  padding: 0 var(--gutter-right) 0 var(--gutter-left);
  margin: 0 calc(-1 * var(--gutter-right)) 32px calc(-1 * var(--gutter-left));

  @media (max-width: 768px) {
    margin-bottom: 20px;
    gap: 12px;
  }

  ${media.phone} {
    justify-content: space-between;
    height: 56px;
    margin-bottom: 0;
    padding-right: calc(var(--gutter-right) - 10px);
  }

  /* 폰, 그리고 폰을 가로로 눕힌 것처럼 세로가 짧은 화면: 읽어 내려가는 동안에는 화면을 넓게 쓰도록 헤더를 위로 접는다. */
  @media (max-width: ${PHONE_MAX}px), (max-height: 500px) {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    &[data-collapsed] {
      transform: translateY(-100%);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;

  a {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  ${media.phone} {
    margin-left: -6px;

    a:hover {
      transform: none;
    }
  }
`;

const BrandName = styled.span`
  display: none;

  ${media.phone} {
    display: block;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.text.primary};
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

  /* 폰에서는 하단 독(Dock.tsx)이 메뉴를 맡는다. */
  ${media.phone} {
    display: none;
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

  ${media.phone} {
    gap: 0;
  }
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

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.text.primary};
      border-color: ${({ theme }) => theme.text.muted};
    }
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

  ${media.phone} {
    width: 44px;
    height: 44px;

    svg {
      width: 20px;
      height: 20px;
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

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) => theme.bg.muted};
    }
  }

  /* 폰과 터치 기기(태블릿)에서는 손가락으로 누르기 쉬운 크기로 */
  ${media.phone} {
    width: 44px;
    height: 44px;
    padding: 0;
  }

  ${media.touch} {
    width: 44px;
    height: 44px;
    padding: 0;
  }
`;
const ThemeButton = motion.create(ThemeButtonBase);

// 한 칸짜리 그리드. minmax(0, 1fr)로 두어, 줄바꿈되지 않는 긴 내용이 칸을 화면 밖으로 밀어내지 못하게 한다.
const Content = styled.main`
  margin-top: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;

  ${media.phone} {
    margin-top: 16px;
  }
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

  /* 폰과 터치 기기(태블릿)에서는 손가락으로 누르기 쉽게 누르는 영역을 키운다. */
  ${media.phone}, (hover: none) {
    gap: 4px;
    margin-right: -10px;

    a,
    button {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding: 0 10px;
    }
  }
`;
