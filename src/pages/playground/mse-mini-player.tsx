import React from 'react';
import type { PageProps } from 'gatsby';
import Seo from '@/components/Seo';
import MsePlayerPage from '@/features/mse-player/MsePlayerPage';

const MseMiniPlayerRoute: React.FC<PageProps> = (props) => <MsePlayerPage {...props} />;

export default MseMiniPlayerRoute;

export const Head = () => (
  <Seo
    title="MSE 미니 플레이어"
    pathname="/playground/mse-mini-player"
    description="외부 라이브러리 없이 raw MSE만으로 mp4 / m3u8 / mpd를 직접 파싱·재생하는 미니 streaming player 데모. 화질 선택과 다양한 자산 URL을 자유롭게 시도해볼 수 있습니다."
  />
);
