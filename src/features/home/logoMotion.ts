/**
 * 히어로에서 재생되는 짧은 "영상"의 내용. 로고(A)가 두 다리로 걸어 들어와 제자리에 선다.
 * 시간(초)을 넣으면 그 순간의 로고 모양이 나오는 순수 함수라서, 탐색 바로 앞뒤 어디든 바로 그릴 수 있다.
 */

export const HERO_BASE = '#0b1020';

/** 영상 전체 길이(초) */
export const DURATION = 4;
/** 걸어 들어오는 구간이 끝나는 시각 */
export const WALK_END = 3;
/** 자리를 잡는 구간이 끝나는 시각 */
export const SETTLE_END = 3.6;

// 획 굵기를 포함한 로고의 전체 크기와 세로 중심. 좌표는 src/images/logo.svg와 같다.
export const LOGO_BOX = { width: 235, height: 315, centerY: 10 };

type Point = readonly [number, number];
export type Stroke = { from: Point; to: Point; width: number; color: string };
export type Pose = { offsetX: number; offsetY: number; swing: number };

const APEX: Point = [0, -110];
const LEFT_FOOT: Point = [-80, 130];
const RIGHT_FOOT: Point = [80, 130];
// 가로획은 꼭짓점에서 발까지의 이 비율 지점을 잇고, 양 끝을 조금 안쪽으로 들인다.
const BAR_AT = 0.625;
const BAR_INSET = 0.9;

// 한 걸음(양발 한 번씩)에 나아가는 거리
const STRIDE = 72;
const SWING_DEGREES = 10;
const BOB = 7;
const LANDING_DIP = 10;

/** 제자리에 가만히 선 모양. 서버 렌더링과 영상의 마지막 장면이 이것이다. */
export const REST_POSE: Pose = { offsetX: 0, offsetY: 0, swing: 0 };

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

/**
 * @param startOffset 출발 지점이 제자리에서 오른쪽으로 얼마나 떨어져 있는지(로고 좌표 단위).
 *   화면 오른쪽 가장자리 바로 밖이 되도록 화면 크기에서 계산해 넘긴다. 더 멀리서 출발하면
 *   화질이 가장 낮은 첫 구간이 지나갈 때까지 로고가 보이지 않는다.
 */
export const poseAt = (time: number, startOffset: number): Pose => {
  if (time >= SETTLE_END) return REST_POSE;

  const walk = Math.min(1, Math.max(0, time / WALK_END));
  const travelled = easeOutCubic(walk);
  // 걸음은 시간에 맞추지 않고 이동한 거리에 맞춘다. 그래야 속도가 줄어들 때 발이 미끄러지지 않는다.
  const steps = Math.max(2, Math.round(startOffset / STRIDE));
  const phase = travelled * steps * 2 * Math.PI;

  // 다 걸어온 뒤에는 살짝 내려앉았다가 올라오며 자리를 잡는다.
  const settle = time > WALK_END ? (time - WALK_END) / (SETTLE_END - WALK_END) : 0;
  const landing = time > WALK_END ? LANDING_DIP * Math.sin(Math.PI * settle) * (1 - settle) : 0;

  return {
    offsetX: startOffset * (1 - travelled),
    offsetY: -BOB * Math.abs(Math.sin(phase)) + landing,
    swing: SWING_DEGREES * Math.sin(phase),
  };
};

const rotate = ([x, y]: Point, [cx, cy]: Point, degrees: number): Point => {
  const radians = (degrees * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(radians) - dy * Math.sin(radians),
    cy + dx * Math.sin(radians) + dy * Math.cos(radians),
  ];
};

const between = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** 주어진 모양에서 로고를 이루는 세 획의 좌표 */
export const strokesFor = ({ offsetX, offsetY, swing }: Pose): Stroke[] => {
  const apex: Point = [APEX[0] + offsetX, APEX[1] + offsetY];
  // 두 다리는 꼭짓점을 축으로 서로 반대 방향으로 흔들린다.
  const left = rotate([LEFT_FOOT[0] + offsetX, LEFT_FOOT[1] + offsetY], apex, swing);
  const right = rotate([RIGHT_FOOT[0] + offsetX, RIGHT_FOOT[1] + offsetY], apex, -swing);

  const barLeft = between(apex, left, BAR_AT);
  const barRight = between(apex, right, BAR_AT);
  const barMiddle = between(barLeft, barRight, 0.5);

  return [
    { from: left, to: apex, width: 75, color: '#2563eb' },
    { from: apex, to: right, width: 75, color: '#3b82f6' },
    {
      from: between(barMiddle, barLeft, BAR_INSET),
      to: between(barMiddle, barRight, BAR_INSET),
      width: 60,
      color: '#60a5fa',
    },
  ];
};

export const pathData = ({ from, to }: Stroke) =>
  `M${from[0].toFixed(2)} ${from[1].toFixed(2)} L${to[0].toFixed(2)} ${to[1].toFixed(2)}`;
