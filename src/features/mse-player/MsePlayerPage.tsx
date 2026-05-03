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

  const [mseSupported, setMseSupported] = useState(true);
  const [assetInput, setAssetInput] = useState(initialAsset);
  const [codecInput, setCodecInput] = useState(initialCodec);
  const [appliedAsset, setAppliedAsset] = useState(initialAsset);
  const [appliedCodec, setAppliedCodec] = useState(initialCodec);
  const [runId, setRunId] = useState(0);
  const [preferredVariantId, setPreferredVariantId] = useState<string | undefined>();
  const playerSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MediaSource) {
      setMseSupported(false);
    }
  }, []);

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
            매니페스트를 직접 파싱해서 init+segment를 fetch한 뒤 SourceBuffer에 부어 넣습니다. URL을
            직접 바꿔보면서 6단계가 어떻게 흘러가는지 확인해보세요.
          </Desc>
        </Header>
      )}

      {!mseSupported && (
        <UnsupportedNotice>
          <NoticeIcon>🚫</NoticeIcon>
          <NoticeTitle>이 플레이그라운드는 iOS에서 사용할 수 없습니다</NoticeTitle>
          <NoticeDesc>
            iOS의 모든 브라우저(Safari, Chrome, Firefox 등)는 Apple 정책상 WebKit 엔진을 사용하며,
            WebKit은 <strong>Media Source Extensions(MSE) API</strong>를 지원하지 않습니다. 이
            데모는 MSE를 직접 활용하는 플레이그라운드이므로, 데스크톱 브라우저(Chrome, Firefox, Edge
            등)에서 접속해 주세요.
          </NoticeDesc>
        </UnsupportedNotice>
      )}

      {mseSupported && !isEmbed && (
        <Section>
          <ControlPanel
            assetInput={assetInput}
            codecInput={codecInput}
            onAssetChange={setAssetInput}
            onCodecChange={setCodecInput}
            onRun={runWithInputs}
            onRestart={restart}
            onPickPreset={applyPreset}
            presets={PRESETS}
          />
        </Section>
      )}

      {mseSupported && (
        <Section ref={playerSectionRef}>
          {!isEmbed && <SectionTitle>2. 동작</SectionTitle>}
          <Player
            asset={appliedAsset}
            codec={appliedCodec}
            runId={runId}
            preferredVariantId={preferredVariantId}
            onVariantChange={onVariantChange}
          />
        </Section>
      )}
    </>
  );

  if (isEmbed) {
    return <EmbedRoot>{content}</EmbedRoot>;
  }

  return <Layout location={location}>{content}</Layout>;
};

export default MsePlayerPage;

const UnsupportedNotice = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  margin: 24px 0;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg.muted};
`;

const NoticeIcon = styled.span`
  font-size: 48px;
  margin-bottom: 16px;
`;

const NoticeTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 20px;
  color: ${({ theme }) => theme.text.primary};
`;

const NoticeDesc = styled.p`
  margin: 0;
  max-width: 480px;
  font-size: 14px;
  line-height: 1.7;
  color: ${({ theme }) => theme.text.muted};

  strong {
    color: ${({ theme }) => theme.text.primary};
  }
`;
