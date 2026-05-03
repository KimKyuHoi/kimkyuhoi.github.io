/**
 * MSE 호환 레이어
 *
 * 데스크톱: window.MediaSource
 * iOS 17.1+: window.ManagedMediaSource (MSE의 모바일 최적화 버전)
 *
 * 두 API의 인터페이스(addSourceBuffer, endOfStream 등)는 동일하므로
 * 적절한 생성자를 골라서 반환한다.
 */

declare global {
  interface Window {
    ManagedMediaSource?: typeof MediaSource;
  }
}

export type MediaSourceCompat = MediaSource;

/**
 * 사용 가능한 MediaSource 생성자를 반환한다.
 * MediaSource → ManagedMediaSource 순으로 탐색.
 * 둘 다 없으면 null.
 */
export function getMediaSourceClass(): typeof MediaSource | null {
  if (typeof window === 'undefined') return null;
  if (window.MediaSource) return window.MediaSource;
  if (window.ManagedMediaSource) return window.ManagedMediaSource;
  return null;
}

/**
 * MSE 또는 MMS 중 하나라도 지원하는지 확인
 */
export function isMseAvailable(): boolean {
  return getMediaSourceClass() !== null;
}

/**
 * ManagedMediaSource를 사용하는지 여부
 */
export function isManagedMediaSource(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.MediaSource && !!window.ManagedMediaSource;
}

/**
 * MediaSource.isTypeSupported 호환 래퍼
 * MediaSource 또는 ManagedMediaSource 중 사용 가능한 쪽으로 확인한다.
 */
export function isTypeSupportedCompat(mimeCodec: string): boolean {
  const MSClass = getMediaSourceClass();
  if (!MSClass) return false;
  return MSClass.isTypeSupported(mimeCodec);
}
