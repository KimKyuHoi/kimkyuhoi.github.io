import React, { useEffect, useRef } from 'react';
import { graphql, navigate, useStaticQuery } from 'gatsby';
import styled from '@emotion/styled';
import { Command } from 'cmdk';
import { Compass, FileText, Moon } from 'lucide-react';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleTheme: () => void;
};

type PaletteQuery = {
  allMarkdownRemark: {
    nodes: {
      fields: { slug: string | null } | null;
      frontmatter: {
        title: string | null;
        description: string | null;
        category: string | null;
        tags: (string | null)[] | null;
      } | null;
    }[];
  };
};

const pages = [
  { label: '홈', to: '/' },
  { label: '글 목록', to: '/posts/' },
  { label: '소개', to: '/about/' },
  { label: '방명록', to: '/guestbook/' },
  { label: '플레이그라운드', to: '/playground/' },
];

/**
 * ⌘K로 여는 검색 팔레트. 목록과 검색은 cmdk가, 창(포커스 가두기, Esc, 배경)은 브라우저의 <dialog>가 맡는다.
 * 글 제목·설명·태그로 찾고 페이지 이동과 테마 전환도 할 수 있다.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange, onToggleTheme }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const data = useStaticQuery<PaletteQuery>(graphql`
    query CommandPalette {
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
        nodes {
          fields {
            slug
          }
          frontmatter {
            title
            description
            category
            tags
          }
        }
      }
    }
  `);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal은 창 안의 첫 요소에 포커스를 주므로, 바로 입력할 수 있게 검색창으로 옮긴다.
      dialog.querySelector<HTMLInputElement>('[cmdk-input]')?.focus();
      // 팔레트가 열려 있는 동안에는 뒤의 페이지가 스크롤되지 않게 한다.
      window.__lenis?.stop();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // 팔레트가 열린 채 페이지가 바뀌어 컴포넌트가 사라지는 경우에도 스크롤을 풀어 준다.
  useEffect(() => () => window.__lenis?.start(), []);

  const run = (action: () => void) => {
    dialogRef.current?.close();
    action();
  };

  return (
    <Dialog
      ref={dialogRef}
      aria-label="검색"
      onClose={() => {
        window.__lenis?.start();
        onOpenChange(false);
      }}
      // 창 바깥(배경)을 누르면 닫는다. 안쪽 내용을 누르면 target이 dialog가 아니다.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      {open ? (
        <Command label="검색" loop>
          <Command.Input placeholder="글 제목, 태그로 검색" />
          <Command.List data-lenis-prevent="">
            <Command.Empty>일치하는 글이 없습니다. 다른 단어로 찾아보세요.</Command.Empty>
            <Command.Group heading="글">
              {data.allMarkdownRemark.nodes.map(({ fields, frontmatter }) => (
                <Command.Item
                  key={fields?.slug}
                  value={`${frontmatter?.title} ${frontmatter?.category} ${frontmatter?.tags?.join(' ')}`}
                  keywords={[frontmatter?.description || '']}
                  onSelect={() => run(() => navigate(fields?.slug || '/'))}
                >
                  <FileText aria-hidden="true" />
                  <span>{frontmatter?.title}</span>
                  <small>{frontmatter?.category}</small>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="이동">
              {pages.map((page) => (
                <Command.Item
                  key={page.to}
                  value={page.label}
                  onSelect={() => run(() => navigate(page.to))}
                >
                  <Compass aria-hidden="true" />
                  <span>{page.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="설정">
              <Command.Item value="테마 전환 다크 라이트" onSelect={() => run(onToggleTheme)}>
                <Moon aria-hidden="true" />
                <span>테마 전환</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      ) : null}
    </Dialog>
  );
};

export default CommandPalette;

const Dialog = styled.dialog`
  width: min(600px, calc(100vw - 24px));
  max-height: none;
  margin: 14vh auto 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.bg.surface};
  box-shadow: ${({ theme }) => theme.shadow.hover};
  font-family: ${({ theme }) => theme.font.body};
  color: ${({ theme }) => theme.text.primary};

  &::backdrop {
    background: rgba(9, 12, 19, 0.5);
    backdrop-filter: blur(4px);
  }

  @media (prefers-reduced-motion: no-preference) {
    &[open] {
      animation: palette-in 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }
  }

  @keyframes palette-in {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
  }

  [cmdk-input] {
    width: 100%;
    padding: 18px 20px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.border};
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 17px;
    color: inherit;
  }

  [cmdk-input]::placeholder {
    color: ${({ theme }) => theme.text.muted};
  }

  [cmdk-list] {
    max-height: min(56vh, 420px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px;
  }

  [cmdk-group-heading] {
    padding: 10px 12px 6px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.text.muted};
  }

  [cmdk-item] {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 15px;
    line-height: 1.4;
    word-break: keep-all;
    cursor: pointer;
  }

  [cmdk-item] svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.text.muted};
  }

  [cmdk-item] small {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.text.muted};
  }

  [cmdk-item][data-selected='true'] {
    background: ${({ theme }) => theme.bg.muted};
  }

  [cmdk-empty] {
    padding: 32px 12px;
    text-align: center;
    font-size: 15px;
    color: ${({ theme }) => theme.text.muted};
  }
`;
