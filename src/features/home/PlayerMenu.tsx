import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';

export type PlayerMenuOption = { value: string; label: string };

type PlayerMenuProps = {
  /** 메뉴를 여는 버튼. 열림 상태와 키보드 동작은 Radix가 이 요소에 붙인다. */
  trigger: React.ReactElement;
  /** 메뉴의 이름 (보조 기술이 읽는다) */
  label: string;
  value: string;
  options: PlayerMenuOption[];
  onChange: (value: string) => void;
  /** 처음부터 열어 둔다. 이 메뉴의 코드를 내려받는 사이에 사용자가 이미 버튼을 누른 경우에 쓴다. */
  defaultOpen?: boolean;
};

/**
 * 플레이어 조작부의 선택 메뉴(화질, 재생 속도). 버튼 바로 위에 뜬다.
 * 브라우저 기본 <select>는 팝업의 위치와 모양을 정할 수 없어, 기기에 따라 조작부와 동떨어진 곳에 뜨거나
 * 플레이어와 어울리지 않는 모양으로 나온다. 그래서 위치·포커스·키보드 조작을 Radix에 맡긴 메뉴를 쓴다.
 */
const PlayerMenu: React.FC<PlayerMenuProps> = ({
  trigger,
  label,
  value,
  options,
  onChange,
  defaultOpen,
}) => (
  <DropdownMenu.Root defaultOpen={defaultOpen}>
    <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      {/* 메뉴는 문서 맨 끝에 그려지지만 이벤트는 히어로로 올라온다. 화면 조작(탭·끌기)으로 치지 않게 표시해 둔다. */}
      <Content
        side="top"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label={label}
        data-not-screen=""
      >
        <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <Item key={option.value} value={option.value}>
              <DropdownMenu.ItemIndicator asChild>
                <Check aria-hidden="true" />
              </DropdownMenu.ItemIndicator>
              {option.label}
            </Item>
          ))}
        </DropdownMenu.RadioGroup>
      </Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export default PlayerMenu;

const menuIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
  }
`;

const Content = styled(DropdownMenu.Content)`
  z-index: 60;
  min-width: 148px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(17, 22, 38, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
  font-family: ${({ theme }) => theme.font.body};
  font-size: 14px;
  color: #ffffff;
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);
  animation: ${menuIn} 0.16s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Item = styled(DropdownMenu.RadioItem)`
  position: relative;
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px 0 36px;
  border-radius: 9px;
  line-height: 1.4;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  user-select: none;

  /* 키보드로 고르는 중이거나 포인터가 올라간 항목 */
  &[data-highlighted] {
    background: rgba(255, 255, 255, 0.14);
  }

  &[data-state='checked'] {
    font-weight: 700;
  }

  /* 지금 선택된 항목의 체크 표시 */
  svg {
    position: absolute;
    left: 11px;
    width: 16px;
    height: 16px;
    color: #60a5fa;
  }

  /* 손가락으로 누르기 쉬운 높이 */
  @media (hover: none) {
    min-height: 44px;
  }
`;
