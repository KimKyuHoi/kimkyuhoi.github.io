// 히어로 영상의 자막. 넷플릭스 자막의 소리 설명처럼, 화면에서 일어나는 일과 보는 사람의 조작에 반응한다.
// 문구를 바꾸고 싶으면 여기만 고치면 된다.
export const CAPTIONS = {
  walk: '[뚜벅뚜벅 걸어 들어오는 소리]',
  run: '[다급하게 뛰어 들어오는 소리]',
  stroll: '[느긋하게 걸어 들어오는 소리]',
  settle: '[자리 잡는 소리]',
  idle: '[잔잔한 키보드 소리]',
  paused: '[멈칫]',
  rewind: '[되감는 소리]',
  forward: '[빨리 감는 소리]',
  qualityDown: '[화질 깨지는 소리]',
  qualityUp: '[다시 선명해지는 소리]',
  stats: '[숫자 세는 소리]',
  github: '[커밋 쌓이는 소리]',
  linkedin: '[명함 건네는 소리]',
  velog: '[예전 글 넘겨 보는 소리]',
  offline: '[인터넷 끊기는 소리]',
  online: '[다시 이어지는 소리]',
} as const;

export type CaptionKey = keyof typeof CAPTIONS;
