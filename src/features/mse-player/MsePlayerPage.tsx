import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import ControlPanel from './components/ControlPanel';
import Player from './components/Player';
import { Desc, EmbedRoot, Header, Section, SectionTitle, Title } from './components/styled';
import { PRESETS } from './presets';
import type { Preset } from './types';

const MsePlayerPage: React.FC<PageProps> = ({ location }) => {
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isEmbed = params.get('embed') === '1';
  const initialPresetId = params.get('preset');
  const initialAsset = params.get('asset') ?? PRESETS[0].asset;
  const initialCodec = params.get('codec') ?? PRESETS[0].codec;

  // null = SSR/판정 전, true = MSE 가능, false = iOS 등 MSE 불가
  const [mseSupported, setMseSupported] = useState<boolean | null>(null);
  const [assetInput, setAssetInput] = useState(initialAsset);
  const [codecInput, setCodecInput] = useState(initialCodec);
  const [appliedAsset, setAppliedAsset] = useState(initialAsset);
  const [appliedCodec, setAppliedCodec] = useState(initialCodec);
  const [runId, setRunId] = useState(0);
  const [preferredVariantId, setPreferredVariantId] = useState<string | undefined>();
  const playerSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMseSupported(typeof window !== 'undefined' && !!window.MediaSource);
  }, []);

  // iOS에서는 HLS 프리셋만 노출
  const availablePresets = useMemo(
    () => (mseSupported === false ? PRESETS.filter((p) => p.asset.endsWith('.m3u8')) : PRESETS),
    [mseSupported]
  );

  // MSE 미지원 감지 시 기본 프리셋을 HLS로 교체
  useEffect(() => {
    if (mseSupported !== false) return;
    const hlsPreset = availablePresets[0];
    if (!hlsPreset) return;
    setAssetInput(hlsPreset.asset);
    setCodecInput(hlsPreset.codec);
    setAppliedAsset(hlsPreset.asset);
    setAppliedCodec(hlsPreset.codec);
  }, [mseSupported, availablePresets]);

  const scrollToPlayer = () => {
    requestAnimationFrame(() => {
      playerSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  useEffect(() => {
    if (!initialPresetId) return;
    const p = PRESETS.find((x) => x.id === initialPresetId);
    if (!p) return;
    setAssetInput(p.asset);
    setCodecInput(p.codec);
    setAppliedAsset(p.asset);
    setAppliedCodec(p.codec);
  }, [initialPresetId]);

  const applyPreset = (p: Preset) => {
    setAssetInput(p.asset);
    setCodecInput(p.codec);
    setAppliedAsset(p.asset);
    setAppliedCodec(p.codec);
    setPreferredVariantId(undefined);
    setRunId((n) => n + 1);
    scrollToPlayer();
  };

  const runWithInputs = () => {
    setAppliedAsset(assetInput.trim());
    setAppliedCodec(codecInput.trim());
    setPreferredVariantId(undefined);
    setRunId((n) => n + 1);
    scrollToPlayer();
  };

  const restart = () => setRunId((n) => n + 1);

  const onVariantChange = (id: string) => {
    setPreferredVariantId(id);
    setRunId((n) => n + 1);
  };

  // SSR/판정 전에는 헤더만 렌더 (레이아웃 점프 방지)
  if (mseSupported === null) {
    const shell = (
      <>
        {!isEmbed && (
          <Header>
            <Title>MSE 미니 플레이어</Title>
            <Desc>로딩 중…</Desc>
          </Header>
        )}
      </>
    );
    if (isEmbed) return <EmbedRoot>{shell}</EmbedRoot>;
    return <Layout location={location}>{shell}</Layout>;
  }

  const content = (
    <>
      {!isEmbed && (
        <Header>
          <Title>MSE 미니 플레이어</Title>
          <Desc>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Media Source Extensions
            </a>{' '}
            만으로 만든 streaming player. <strong>외부 라이브러리 없이</strong> m3u8 / mpd
            매니페스트를 직접 파싱해서 init+segment를 fetch한 뒤 SourceBuffer에 부어 넣습니다.
            {mseSupported ? ' URL을 직접 바꿔보면서 6단계가 어떻게 흘러가는지 확인해보세요.' : ''}
          </Desc>
        </Header>
      )}

      {!mseSupported && (
        <IOSNotice>
          <NoticeIcon>📱</NoticeIcon>
          <NoticeTitle>iOS 모드 (네이티브 재생)</NoticeTitle>
          <NoticeDesc>
            iOS의 모든 브라우저는 Apple 정책상 WebKit 엔진을 사용하며,{' '}
            <strong>MSE API를 지원하지 않습니다.</strong> MSE 단계별 시각화는 데스크톱에서만
            가능하지만, <strong>HLS(m3u8)는 iOS가 네이티브로 지원</strong>하므로 아래에서 재생해볼
            수 있습니다. DASH(mpd)·단일 MP4(MSE 코덱 지정) 프리셋은 비활성됩니다.
          </NoticeDesc>
        </IOSNotice>
      )}

      {!isEmbed && (
        <Section>
          <ControlPanel
            assetInput={assetInput}
            codecInput={codecInput}
            onAssetChange={setAssetInput}
            onCodecChange={setCodecInput}
            onRun={runWithInputs}
            onRestart={restart}
            onPickPreset={applyPreset}
            presets={availablePresets}
          />
        </Section>
      )}

      <Section ref={playerSectionRef}>
        {!isEmbed && <SectionTitle>2. 동작</SectionTitle>}
        <Player
          asset={appliedAsset}
          codec={appliedCodec}
          runId={runId}
          preferredVariantId={preferredVariantId}
          onVariantChange={onVariantChange}
          nativeMode={!mseSupported}
        />
      </Section>
    </>
  );

  if (isEmbed) {
    return <EmbedRoot>{content}</EmbedRoot>;
  }

  return <Layout location={location}>{content}</Layout>;
};

export default MsePlayerPage;

const IOSNotice = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 20px;
  margin: 0 0 24px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg.muted};
`;

const NoticeIcon = styled.span`
  font-size: 36px;
  margin-bottom: 12px;
`;

const NoticeTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 17px;
  color: ${({ theme }) => theme.text.primary};
`;

const NoticeDesc = styled.p`
  margin: 0;
  max-width: 480px;
  font-size: 13.5px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text.muted};

  strong {
    color: ${({ theme }) => theme.text.primary};
  }
`;
