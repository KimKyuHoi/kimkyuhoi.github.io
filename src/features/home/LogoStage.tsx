import React, { useEffect, useImperativeHandle, useRef } from 'react';
import styled from '@emotion/styled';
import {
  DURATION,
  HERO_BASE,
  LOGO_BOX,
  REST_POSE,
  pathData,
  poseAt,
  strokesFor,
} from '@/features/home/logoMotion';

export type LogoStageHandle = {
  /** 영상의 주어진 시각(초)에 해당하는 장면을 그린다. 재생 중에는 매 프레임 호출된다. */
  drawAt: (time: number) => void;
  /** 영상 화면의 크기(CSS 픽셀) */
  size: () => { width: number; height: number } | null;
};

type LogoStageProps = {
  /** 블록 크기(px). 1이면 원본 로고(SVG)를 그대로 보여 주고, 클수록 저화질 영상처럼 거칠어진다. */
  block: number;
  /** 첫 로드 때 CSS 애니메이션(.hero-logo)으로 원본 로고를 잠시 숨겨, 화질이 올라오는 것처럼 보이게 한다. */
  warmup?: boolean;
  /** 원본 로고를 끝까지 숨긴다. 저화질 화면만 보여 줄 때 쓴다. */
  hideOriginal?: boolean;
  /** 좁은 화면에서 화면 바로 아래에 조작부가 붙는다. 그때는 화면의 아래 모서리를 둥글리지 않는다. */
  attached?: boolean;
  ref?: React.Ref<LogoStageHandle>;
};

/** 이 폭 이하에서는 영상 화면과 글을 위아래로 쌓는다 (그보다 넓으면 글 오른쪽에 로고를 둔다). */
export const STACKED_BELOW = 1000;

// 로고가 화면 오른쪽 가장자리 바로 밖에서 출발하도록 둘 여유(로고 좌표 단위)
const START_MARGIN = 8;

/**
 * 영상 플레이어의 화면. 블로그 로고를 지정한 화질로 그린다.
 * 원본은 SVG이고, 그보다 낮은 화질에서는 로고를 낮은 해상도 캔버스에 그린 뒤 확대해 매크로블록처럼 보이게 한다.
 * 캔버스 해상도가 곧 화질이라, 블록이 클수록 그리는 비용은 오히려 줄어든다.
 */
const LogoStage: React.FC<LogoStageProps> = ({
  block,
  warmup = false,
  hideOriginal = false,
  attached = false,
  ref,
}) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 따로 재생하지 않으면 다 재생된 마지막 장면(제자리에 선 로고)을 보여 준다.
  const timeRef = useRef(DURATION);
  const blockRef = useRef(block);
  blockRef.current = block;

  const paint = () => {
    const screen = screenRef.current;
    const logo = logoRef.current;
    if (!screen || !logo) return;

    const host = screen.getBoundingClientRect();
    const rect = logo.getBoundingClientRect();
    if (!host.width || !rect.height) return;

    // 로고 좌표 1단위가 화면에서 몇 px인지와, 로고 중심의 위치
    const scale = rect.height / LOGO_BOX.height;
    const centerX = rect.left - host.left + rect.width / 2;
    const centerY = rect.top - host.top + rect.height / 2;

    // 걸어 들어오는 출발점: 로고 전체가 화면 오른쪽 가장자리 바로 밖에 있는 위치
    const startOffset = (host.width - centerX) / scale + LOGO_BOX.width / 2 + START_MARGIN;
    const pose = timeRef.current >= DURATION ? REST_POSE : poseAt(timeRef.current, startOffset);
    const strokes = strokesFor(pose);

    logo.querySelectorAll('path').forEach((path, index) => {
      path.setAttribute('d', pathData(strokes[index]));
    });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const cols = Math.max(2, Math.round(host.width / blockRef.current));
    const rows = Math.max(2, Math.round(host.height / blockRef.current));
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols;
      canvas.height = rows;
    }

    // 이후 좌표는 CSS 픽셀 기준으로 쓴다. 캔버스는 같은 자리의 SVG 로고를 그대로 따라 그린다.
    ctx.setTransform(cols / host.width, 0, 0, rows / host.height, 0, 0);
    ctx.fillStyle = HERO_BASE;
    ctx.fillRect(0, 0, host.width, host.height);

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
    drawAt: (time) => {
      timeRef.current = time;
      paint();
    },
    size: () => {
      const rect = screenRef.current?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : null;
    },
  }));

  // 화질이 바뀌거나 화면 크기가 달라지면 지금 장면 그대로 다시 그린다.
  useEffect(() => {
    paint();
    const screen = screenRef.current;
    if (!screen) return undefined;
    const observer = new ResizeObserver(paint);
    observer.observe(screen);
    return () => observer.disconnect();
    // paint는 ref만 읽으므로 의존성에 넣지 않는다.
  }, [block]);

  return (
    <Screen ref={screenRef} aria-hidden="true" data-attached={attached || undefined}>
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

/**
 * 영상 화면과 그 위·아래에 놓이는 글을 담는 틀.
 * 넓은 화면에서는 틀 전체가 어두운 영상 화면이고 글이 그 위에 놓인다.
 * 좁은 화면에서는 영상 화면만 어둡고, 글은 그 아래 페이지 바탕 위에 놓인다.
 * 안에 놓이는 글은 아래의 --screen-* 변수로 색을 정하면 두 경우 모두에 맞는다.
 */
export const ScreenPanel = styled.section`
  --screen-text: #ffffff;
  --screen-text-soft: rgba(249, 250, 251, 0.82);
  --screen-line: rgba(255, 255, 255, 0.22);
  --screen-chip: rgba(11, 16, 32, 0.55);
  --screen-chip-hover: rgba(255, 255, 255, 0.16);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 500px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${HERO_BASE};

  @media (max-width: ${STACKED_BELOW}px) {
    --screen-text: ${({ theme }) => theme.text.primary};
    --screen-text-soft: ${({ theme }) => theme.text.muted};
    --screen-line: ${({ theme }) => theme.border};
    --screen-chip: transparent;
    --screen-chip-hover: ${({ theme }) => theme.bg.muted};

    overflow: visible;
    justify-content: flex-start;
    min-height: 0;
    border-radius: 0;
    background: transparent;
  }
`;

const Screen = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;

  @media (max-width: ${STACKED_BELOW}px) {
    position: relative;
    inset: auto;
    z-index: 0;
    order: 0;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    max-height: 380px;
    border-radius: ${({ theme }) => theme.radius.xl};
    background: ${HERO_BASE};

    &[data-attached] {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`;

// 넓은 화면에서는 글 오른쪽에 로고를 크게 두고 위아래를 잘라 낸다. 좁은 화면에서는 화면 한가운데에 둔다.
// 걸어 들어올 때는 로고가 자기 영역 밖에서 출발하므로 넘친 부분도 그려지게 둔다 (화면이 잘라 낸다).
const Logo = styled.svg`
  position: absolute;
  top: 50%;
  right: -3%;
  height: 112%;
  overflow: visible;
  transform: translateY(-50%);

  @media (max-width: ${STACKED_BELOW}px) {
    right: auto;
    left: 50%;
    height: 78%;
    transform: translate(-50%, -50%);
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;
