import React, { useEffect, useId, useRef } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

// 이만큼 끌어내리거나 이보다 빠르게 쓸어내리면 닫는다.
const CLOSE_DISTANCE = 96;
const CLOSE_VELOCITY = 600;

/**
 * 화면 아래에서 올라오는 시트. 창의 동작(포커스 가두기, Esc, 뒤 화면 비활성화)은 브라우저의 <dialog>가 맡고,
 * 올라오고 내려가는 움직임과 끌어서 닫기는 framer-motion이 맡는다.
 * 닫는 방법은 세 가지다: 닫기 버튼, 바깥 누르기, 머리 부분을 아래로 끌기.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dragControls = useDragControls();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      // 시트가 열려 있는 동안에는 뒤의 페이지가 스크롤되지 않게 한다.
      window.__lenis?.stop();
    }
  }, [open]);

  // 시트가 열린 채 페이지가 바뀌어 컴포넌트가 사라지는 경우에도 스크롤을 풀어 준다.
  useEffect(() => () => window.__lenis?.start(), []);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) onClose();
  };

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc를 누르면 브라우저가 곧바로 닫으려 한다. 내려가는 움직임을 보여 준 뒤 닫도록 가로챈다.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => window.__lenis?.start()}
    >
      {/* 내려가는 움직임이 끝난 뒤에 창을 실제로 닫는다. */}
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {open ? (
          <React.Fragment key="sheet">
            <Backdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <Panel
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={handleDragEnd}
            >
              {/* 목록은 자체 스크롤이 있으므로, 끌어서 닫는 동작은 머리 부분에서만 시작한다. */}
              <Head onPointerDown={(event) => dragControls.start(event)}>
                <Grabber aria-hidden="true" />
                <Title id={titleId}>{title}</Title>
                <CloseButton
                  type="button"
                  onClick={onClose}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label="닫기"
                >
                  <X aria-hidden="true" />
                </CloseButton>
              </Head>
              <Body data-lenis-prevent="">{children}</Body>
            </Panel>
          </React.Fragment>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
};

export default BottomSheet;

// 창 자체는 화면 전체를 덮는 투명한 틀이다. 어두운 배경과 시트는 안에서 따로 그려 각자 움직이게 한다.
const Dialog = styled.dialog`
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  /* hidden이 아니라 clip이다. hidden은 스크립트로는 스크롤이 되어서, 안의 항목에 scrollIntoView를 쓰면
     창이 통째로 밀려 올라가 시트 아래에 이어 붙인 여분(::after)이 빈 공간으로 드러난다. */
  overflow: hidden;
  overflow: clip;

  &::backdrop {
    background: transparent;
  }
`;

const Backdrop = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
`;

const Panel = styled(motion.div)`
  position: absolute;
  left: 50%;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  max-height: min(72dvh, 620px);
  margin-left: calc(min(560px, 100%) / -2);
  border-radius: 24px 24px 0 0;
  background: ${({ theme }) => theme.bg.surface};
  color: ${({ theme }) => theme.text.primary};
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.2);

  /* 끌어올렸을 때 시트 아래로 뒤 화면이 비치지 않게 같은 색을 이어 붙인다. */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 120px;
    background: inherit;
  }
`;

const Head = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 22px 12px 8px 24px;
  touch-action: none;
  cursor: grab;
`;

const Grabber = styled.i`
  position: absolute;
  top: 8px;
  left: 50%;
  width: 40px;
  height: 4px;
  margin-left: -20px;
  border-radius: 2px;
  background: ${({ theme }) => theme.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${({ theme }) => theme.text.muted};
  cursor: pointer;

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) => theme.bg.muted};
      color: ${({ theme }) => theme.text.primary};
    }
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Body = styled.div`
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 12px calc(16px + env(safe-area-inset-bottom, 0px));
`;
