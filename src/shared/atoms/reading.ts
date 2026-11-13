import { atom } from 'jotai';

/**
 * 글 본문을 읽는 중인지. 글 페이지의 플레이어 바가 켜고 끈다.
 * 폰에서는 하단 독과 플레이어 바가 같은 자리를 쓰므로, 읽는 동안에는 독이 자리를 내준다.
 */
export const readingAtom = atom(false);
