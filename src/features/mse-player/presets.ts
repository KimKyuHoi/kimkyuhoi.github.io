import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'bbb-mp4',
    label: '🐰 Big Buck Bunny · 단일 fMP4',
    description: 'MDN 공식 MSE 예제 자산. 단일 fragmented MP4를 그대로 fetch + appendBuffer.',
    asset: 'https://nickdesaulniers.github.io/netfix/demo/frag_bunny.mp4',
    codec: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    category: 'works',
  },
  {
    id: 'shaka-bbb-hls',
    label: '🎬 Shaka · BBB Dark Truths (HLS · byte-range)',
    description:
      'Shaka 공식 데모 자산 중 하나. 단일 fMP4 파일에 #EXT-X-BYTERANGE로 segment 위치를 지정하는 방식이라, fetch에 Range 헤더를 넣어 부분만 가져옵니다. 화질 chip을 클릭해서 다른 비트레이트로 갈아끼울 수 있습니다.',
    asset: 'https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8',
    codec: '',
    category: 'works',
  },
  {
    id: 'akamai-bbb-dash',
    label: '📺 Akamai · Big Buck Bunny (DASH)',
    description:
      'Akamai에서 호스팅하는 공개 BBB DASH 스트림. SegmentTemplate $Number$ 방식이라 raw MSE로 직접 파싱·재생할 수 있습니다.',
    asset: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    codec: '',
    category: 'works',
  },
  {
    id: 'dashif-testpic',
    label: '🎬 DASH-IF · testpic VOD',
    description:
      'DASH Industry Forum의 reference VOD 스트림. 동일하게 SegmentTemplate 방식으로 동작합니다.',
    asset: 'https://livesim.dashif.org/dash/vod/testpic_2s/multi_subs.mpd',
    codec: '',
    category: 'works',
  },
  {
    id: 'wrong-codec',
    label: '⚠️ 자산은 H.264, 코덱 문자열은 VP9',
    description:
      '자산은 H.264 MP4인데 코덱 문자열을 VP9/WebM으로 적은 케이스. 3단계 isTypeSupported가 false를 반환합니다.',
    asset: 'https://nickdesaulniers.github.io/netfix/demo/frag_bunny.mp4',
    codec: 'video/webm; codecs="vp9"',
    category: 'edu',
  },
  {
    id: 'not-found',
    label: '❌ 존재하지 않는 URL (404)',
    description: '5단계 fetch에서 HTTP 404로 실패하는 네트워크 에러 케이스.',
    asset: 'https://nickdesaulniers.github.io/netfix/demo/does-not-exist.mp4',
    codec: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    category: 'edu',
  },
];
