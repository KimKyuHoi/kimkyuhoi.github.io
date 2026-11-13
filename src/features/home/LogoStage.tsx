import React, { useEffect, useImperativeHandle, useRef } from 'react';
import styled from '@emotion/styled';
import {
  HERO_BASE,
  LOGO_BOX,
  REST_POSE,
  pathData,
  strokesFor,
  type Pose,
} from '@/features/home/logoMotion';

export type LogoStageHandle = {
  /** 로고를 주어진 모양으로 다시 그린다. 재생 중에는 매 프레임 호출된다. */
  draw: (pose: Pose) => void;
};

type LogoStageProps = {
  /** 블록 크기(px). 1이면 원본 로고(SVG)를 그대로 보여 주고, 클수록 저화질 영상처럼 거칠어진다. */
  block: number;
  /** 첫 로드 때 CSS 애니메이션(.hero-logo)으로 원본 로고를 잠시 숨겨, 화질이 올라오는 것처럼 보이게 한다. */
  warmup?: boolean;
  /** 원본 로고를 끝까지 숨긴다. 저화질 화면만 보여 줄 때 쓴다. */
  hideOriginal?: boolean;
  ref?: React.Ref<LogoStageHandle>;
};

/**
 * 영상 플레이어의 화면처럼 쓰는 어두운 패널의 배경. 블로그 로고를 지정한 화질로 그린다.
 * 원본은 SVG이고, 그보다 낮은 화질에서는 로고를 낮은 해상도 캔버스에 그린 뒤 확대해 매크로블록처럼 보이게 한다.
 * 캔버스 해상도가 곧 화질이라, 블록이 클수록 그리는 비용은 오히려 줄어든다.
 */
const LogoStage: React.FC<LogoStageProps> = ({
  block,
  warmup = false,
  hideOriginal = false,
  ref,
}) => {
  const logoRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose>(REST_POSE);
  const blockRef = useRef(block);
  blockRef.current = block;

  const paint = () => {
    const logo = logoRef.current;
    if (!logo) return;
    const strokes = strokesFor(poseRef.current);

    logo.querySelectorAll('path').forEach((path, index) => {
      path.setAttribute('d', pathData(strokes[index]));
    });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const host = canvas.getBoundingClientRect();
    if (!host.width || !host.height) return;
    const cols = Math.max(2, Math.round(host.width / blockRef.current));
    const rows = Math.max(2, Math.round(host.height / blockRef.current));
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols;
      canvas.height = rows;
    }

    // 이후 좌표는 CSS 픽셀 기준으로 쓴다.
    ctx.setTransform(cols / host.width, 0, 0, rows / host.height, 0, 0);
    ctx.fillStyle = HERO_BASE;
    ctx.fillRect(0, 0, host.width, host.height);

    // 캔버스는 같은 자리에 놓인 SVG 로고의 위치와 크기를 그대로 따라 그린다.
    const rect = logo.getBoundingClientRect();
    const scale = rect.height / LOGO_BOX.height;
    const centerX = rect.left - host.left + rect.width / 2;
    const centerY = rect.top - host.top + rect.height / 2;

    ctx.lineCap = 'round';
    strokes.forEach(({ from, to, width, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * scale;
      ctx.beginPath();
      ctx.moveTo(centerX + from[0] * scale, centerY + (from[1] - LOGO_BOX.centerY) * scale);
      ctx.lineTo(centerX + to[0] * scale, centerY + (to[1] - LOGO_BOX.centerY) * scale);
      ctx.stroke();
    });
  };

  useImperativeHandle(ref, () => ({
    draw: (pose) => {
      poseRef.current = pose;
      paint();
    },
  }));

  // 화질이 바뀌거나 패널 크기가 달라지면 지금 모양 그대로 다시 그린다.
  useEffect(() => {
    paint();
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
    // paint는 ref만 읽으므로 의존성에 넣지 않는다.
  }, [block]);

  return (
    <Screen aria-hidden="true">
      <Logo
        ref={logoRef}
        className={warmup ? 'hero-logo' : undefined}
        style={hideOriginal ? { visibility: 'hidden' } : undefined}
        viewBox={`${-LOGO_BOX.width / 2} ${LOGO_BOX.centerY - LOGO_BOX.height / 2} ${LOGO_BOX.width} ${LOGO_BOX.height}`}
      >
        {strokesFor(REST_POSE).map((stroke) => (
          <path
            key={stroke.color}
            d={pathData(stroke)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Logo>
      {block > 1 ? <Canvas ref={canvasRef} /> : null}
    </Screen>
  );
};

export default LogoStage;

// 테마와 무관하게 어두운 화면이다. 영상 플레이어의 화면처럼 보이게 하려는 의도다.
export const ScreenPanel = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 500px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${HERO_BASE};
  color: #f9fafb;

  @media (max-width: 768px) {
    min-height: 480px;
  }
`;

const Screen = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;

  /* 좁은 화면에서는 로고가 글자 뒤로 들어가므로, 글자가 놓이는 아래쪽을 어둡게 눌러 대비를 확보한다. */
  @media (max-width: 860px) {
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(11, 16, 32, 0.3), rgba(11, 16, 32, 0.93) 56%);
    }
  }
`;

// 넓은 화면에서는 글 오른쪽에 로고를 크게 두고 위아래를 잘라 낸다.
// 걸어 들어올 때는 로고가 자기 영역 밖에서 출발하므로 넘친 부분도 그려지게 둔다 (패널이 잘라 낸다).
const Logo = styled.svg`
  position: absolute;
  top: 50%;
  right: -3%;
  height: 112%;
  overflow: visible;
  transform: translateY(-50%);

  @media (max-width: 860px) {
    top: 28%;
    right: -10%;
    height: 76%;
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;
