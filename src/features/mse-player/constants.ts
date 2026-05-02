// 로그 한 줄씩 출력 간격 (ms)
export const LOG_INTERVAL_MS = 220;

// 한 번 실행 시 최대로 받을 segment 개수 (데모 용량 보호)
export const SEGMENT_LIMIT = 12;

// 재생 시작 전 미리 채울 버퍼 길이 (초)
export const PREBUFFER_SECONDS = 8;

// 재생 중 유지하려는 버퍼 길이 (초). 이 값 미만으로 떨어지면 다음 segment fetch
export const KEEP_AHEAD_SECONDS = 12;

// 버퍼 부족 폴링 간격 (ms)
export const BUFFER_POLL_MS = 400;
