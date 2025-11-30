import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <ToastContainer
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </ToastContainer>
      )}
    </AnimatePresence>
  );
};

export default Toast;

const ToastContainer = styled(motion.div)`
  position: fixed;
  bottom: 40px;
  left: 50%;
  background: ${({ theme }) =>
    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
  color: ${({ theme }) => (theme.mode === 'dark' ? '#000' : '#fff')};
  padding: 12px 24px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  pointer-events: none;
`;
