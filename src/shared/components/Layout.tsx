import React, { ReactNode } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import type { WindowLocation } from '@reach/router';
import { useThemeMode } from '@/hooks/useThemeMode';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

const navItems = [
  { label: '홈', to: '/' },
  { label: '글', to: '/posts' },
  { label: '소개', to: '/about' },
  { label: '방명록', to: '/guestbook' },
  // { label: "플레이그라운드", to: "/playground" },
];

interface LayoutProps {
  location?: WindowLocation;
  title?: string;
  children: ReactNode;
}

import Toast from '@/components/Toast';

const Layout: React.FC<LayoutProps> = ({ location, children }) => {
  const { mode, toggle } = useThemeMode();
  const [showToast, setShowToast] = React.useState(false);
  const pathname = location?.pathname || '';

  const isDark = mode === 'dark';
  const primaryColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? '#60a5fa' : '#3b82f6';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('k546kh@gmail.com');
    setShowToast(true);
  };

  return (
    <Page>
      <Shell>
        <TopBar>
          <Brand>
            <Link to="/">
              <svg
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
          <Nav>
            {navItems.map((item) => {
              const active =
                pathname === item.to || (item.to !== '/' && pathname?.startsWith(item.to));
              return (
                <NavItem key={item.to} active={active}>
                  <Link to={item.to}>{item.label}</Link>
                </NavItem>
              );
            })}
          </Nav>
          <ActionRow>
            <ThemeButton
              onClick={toggle}
              aria-label="Toggle theme"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              {mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
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
  background: ${({ theme }) =>
    theme.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(25, 31, 40, 0.8)'};
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
`;

const NavItem = styled.span<{ active: boolean }>`
  a {
    padding: 8px 16px;
    border-radius: 999px;
    background: ${({ active, theme }) => (active ? theme.bg.muted : 'transparent')};
    color: ${({ active, theme }) => (active ? theme.text.primary : theme.text.muted)};
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    height: 100%;
  }
  a:hover {
    background: ${({ theme, active }) => (active ? theme.bg.muted : theme.bg.surface)};
    color: ${({ theme }) => theme.text.primary};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
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
