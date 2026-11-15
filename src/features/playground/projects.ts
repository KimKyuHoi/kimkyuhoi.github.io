export type Project = {
  name: string;
  description: string;
  link: string;
  tags: string[];
  thumbnail?: string;
};

export const projects: Project[] = [
  {
    name: 'Optimistic UI Lab',
    description:
      '찜 하트를 차단형·즉시 반영·useOptimistic·debounce 등 다섯 가지로 구현해 나란히 놓고, 연타와 "반영 중 반대 클릭"에서 화면이 어떻게 깜빡이는지 비교합니다.',
    link: '/playground/optimistic-ui',
    tags: ['React', 'useOptimistic', 'Optimistic UI'],
    thumbnail: '/playground/optimistic-ui-thumb.png',
  },
  {
    name: 'ASIS — macOS 캡처 & 어노테이션 도구',
    description:
      '도형·화살표·블러·텍스트 주석부터 GIF 녹화까지, 맥 화면 캡처를 빠르게 처리하기 위해 직접 만든 도구입니다. 다운로드와 버그 제보는 ASIS 페이지에서 받고 있어요.',
    link: 'https://kimkyuhoi.github.io/ASIS/',
    tags: ['macOS', 'Electron', 'Annotation', 'GIF'],
    thumbnail: '/playground/asis-thumb.png',
  },
  {
    name: 'Stacked Alpha Video',
    description: 'AV1 stacked alpha 방식과 VP9+HEVC 네이티브 방식의 투명 영상 비교',
    link: '/playground/stacked-alpha-video',
    tags: ['Video', 'Alpha Channel', 'AV1'],
    thumbnail: '/playground/stacked-alpha-video-thumb.png',
  },
  {
    name: 'MSE 미니 플레이어',
    description:
      'Media Source Extensions만으로 만든 가장 단순한 비디오 플레이어. 자산 URL을 직접 넣어보고 6단계 동작 흐름을 로그로 확인할 수 있습니다.',
    link: '/playground/mse-mini-player',
    tags: ['Video', 'MSE', 'Streaming'],
    thumbnail: '/playground/mse-mini-player-thumb.png',
  },
];
