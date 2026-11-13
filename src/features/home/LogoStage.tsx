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
import { PHONE_MAX, media } from '@/styles/media';

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
  /** 폰에서 화면 바로 아래에 조작부가 붙는다. 그때는 화면의 아래 모서리를 둥글리지 않는다. */
  attached?: boolean;
  ref?: React.Ref<LogoStageHandle>;
};

/** 폰보다는 넓지만 글과 로고를 나란히 두기에는 빠듯한 폭(태블릿). 로고를 더 잘라 글에 자리를 내준다. */
export const COMPACT = `@media (min-width: ${PHONE_MAX + 1}px) and (max-width: 999px)`;

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

    // 원본 화질에서는 캔버스를 숨겨 두므로 그릴 필요가 없다.
    if (blockRef.current <= 1) return;
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
      {/* 원본 화질에서도 캔버스를 없애지 않고 숨기기만 한다. 손가락이 캔버스 위에서 화면을 끄는 도중에
          화질이 바뀌어 캔버스가 사라지면, 그 뒤의 터치 이벤트가 전달되지 않아 끌기가 끝나지 않은 채로 남는다. */}
      <Canvas ref={canvasRef} hidden={block <= 1} />
    </Screen>
  );
};

export default LogoStage;

/**
 * 영상 화면과 그 위·아래에 놓이는 글을 담는 틀.
 *
 * 넓은 화면에서는 틀 전체가 어두운 영상 화면이고 모든 글이 그 위에 놓인다.
 * 폰에서는 세로로 긴 포스터가 된다. 격자의 1~4번째 줄이 영상 화면이고(첫 줄은 로고가 보일 빈자리),
 * 그 안에 직함·제목처럼 짧은 글만 겹쳐 놓는다. 5번째 줄부터는 화면 아래, 페이지 바탕 위다.
 * 안에 놓이는 요소는 grid-area로 자기 줄을 고른다 (예: 2 / 1). 칸까지 적어야 한다.
 * 줄만 적으면 격자의 자동 배치가 영상 화면과 겹치지 않게 옆 칸으로 밀어낸다.
 *
 * 글자색은 두 벌의 변수로 정한다.
 * --screen-*: 언제나 영상 화면 위에 있는 글
 * --aside-*: 넓은 화면에서는 영상 위에, 폰에서는 화면 아래 페이지 바탕에 놓이는 글
 */
export const ScreenPanel = styled.section`
  --screen-text: #ffffff;
  --screen-text-soft: rgba(249, 250, 251, 0.82);
  --aside-text: #ffffff;
  --aside-text-soft: rgba(249, 250, 251, 0.82);
  --aside-line: rgba(255, 255, 255, 0.22);
  --aside-chip: rgba(11, 16, 32, 0.55);
  --aside-chip-hover: rgba(255, 255, 255, 0.16);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 500px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${HERO_BASE};

  ${COMPACT} {
    min-height: 460px;
  }

  ${media.phone} {
    --aside-text: ${({ theme }) => theme.text.primary};
    --aside-text-soft: ${({ theme }) => theme.text.muted};
    --aside-line: ${({ theme }) => theme.border};
    --aside-chip: transparent;
    --aside-chip-hover: ${({ theme }) => theme.bg.muted};

    overflow: visible;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    /* 첫 줄: 로고가 드러나는 자리. 화면 폭에 비례해 커지되 너무 길어지지는 않게 한다.
       로고의 가로획이 이 줄 안에서 끝나도록 아래 Logo의 크기와 함께 맞춘 값이다. */
    grid-template-rows: clamp(200px, 60vw, 320px);
    grid-auto-rows: auto;
    min-height: 0;
    /* 좌우 여백을 조금 넘겨, 영상 화면이 본문보다 넓게 보이게 한다. */
    margin: 0 -8px;
    border-radius: 0;
    background: transparent;
  }
`;

const Screen = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;

  ${media.phone} {
    position: relative;
    inset: auto;
    grid-area: 1 / 1 / 5 / 2;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radius.xl};
    background: ${HERO_BASE};

    &[data-attached] {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    /* 로고의 아랫부분을 어둡게 눌러, 그 위에 겹치는 글이 또렷하게 읽히게 한다. */
    &::after {
      content: '';
      position: absolute;
      inset: 42% 0 0;
      background: linear-gradient(
        180deg,
        rgba(11, 16, 32, 0) 0%,
        rgba(11, 16, 32, 0.82) 52%,
        ${HERO_BASE} 100%
      );
    }
  }
`;

// 넓은 화면에서는 글 오른쪽에 로고를 크게 두고 위아래를 잘라 낸다.
// 폰에서는 화면 오른쪽 위에 크게 두고 위와 오른쪽을 잘라 낸다. 로고의 발치는 글 뒤로 들어간다.
// 걸어 들어올 때는 로고가 자기 영역 밖에서 출발하므로 넘친 부분도 그려지게 둔다 (화면이 잘라 낸다).
const Logo = styled.svg`
  position: absolute;
  top: 50%;
  right: -3%;
  height: 112%;
  overflow: visible;
  transform: translateY(-50%);

  ${COMPACT} {
    right: -17%;
    height: 106%;
  }

  ${media.phone} {
    top: -5%;
    right: -9%;
    height: min(92vw, 420px);
    transform: none;
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;
