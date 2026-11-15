import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

type TiltCardProps = {
  /** 최대 기울기(도) */
  max?: number;
  children: React.ReactNode;
};

const SPRING = { stiffness: 220, damping: 24, mass: 0.6 };

/** 포인터 위치를 따라 카드를 3D로 살짝 기울인다. 마우스로 조작할 때만 반응한다. */
const TiltCard: React.FC<TiltCardProps> = ({ max = 6, children }) => {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max * 2);
    rotateX.set(-py * max * 2);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
