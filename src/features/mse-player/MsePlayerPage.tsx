import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from 'gatsby';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import ControlPanel from './components/ControlPanel';
import Player from './components/Player';
import { Desc, EmbedRoot, Header, Section, SectionTitle, Title } from './components/styled';
import { isMseAvailable, isManagedMediaSource } from './mse-compat';
import { PRESETS } from './presets';
import type { Preset } from './types';

const MsePlayerPage: React.FC<PageProps> = ({ location }) => {
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isEmbed = params.get('embed') === '1';
  const initialPresetId = params.get('preset');
  const initialAsset = params.get('asset') ?? PRESETS[0].asset;
  const initialCodec = params.get('codec') ?? PRESETS[0].codec;

  // null = SSR/판정 전, 'mse' | 'managed' | 'none'
  const [support, setSupport] = useState<'mse' | 'managed' | 'none' | null>(null);
  const [assetInput, setAssetInput] = useState(initialAsset);
  const [codecInput, setCodecInput] = useState(initialCodec);
  const [appliedAsset, setAppliedAsset] = useState(initialAsset);
  const [appliedCodec, setAppliedCodec] = useState(initialCodec);
  const [runId, setRunId] = useState(0);
  const [preferredVariantId, setPreferredVariantId] = useState<string | undefined>();
  const playerSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMseAvailable()) {
      setSupport('none');
    } else if (isManagedMediaSource()) {
      setSupport('managed');
    } else {
      setSupport('mse');
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

  // SSR / 판정 전 → 헤더만 렌더 (레이아웃 점프 방지)
  if (support === null) {
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
            매니페스트를 직접 파싱해서 init+segment를 fetch한 뒤 SourceBuffer에 부어 넣습니다. URL을
            직접 바꿔보면서 6단계가 어떻게 흘러가는지 확인해보세요.
          </Desc>
        </Header>
      )}

      {support === 'managed' && (
        <ManagedNotice>
          <span>📱</span> iOS <strong>ManagedMediaSource</strong> 모드로 동작 중 — 데스크톱과 동일한
          MSE 파이프라인이 실행됩니다.
        </ManagedNotice>
      )}

      {support === 'none' && (
        <UnsupportedNotice>
          <NoticeIcon>🚫</NoticeIcon>
          <NoticeTitle>이 플레이그라운드는 사용할 수 없습니다</NoticeTitle>
          <NoticeDesc>
            이 브라우저는 <strong>MediaSource API</strong>를 지원하지 않습니다. 데스크톱
            브라우저(Chrome, Firefox, Edge 등) 또는 iOS 17.1 이상으로 업데이트 후 접속해 주세요.
          </NoticeDesc>
        </UnsupportedNotice>
      )}

      {support !== 'none' && !isEmbed && (
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

      {support !== 'none' && (
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

const ManagedNotice = styled.div`
  padding: 12px 16px;
  margin: 0 0 20px;
  border-radius: 8px;
  font-size: 13.5px;
  line-height: 1.6;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.bg.muted};
  color: ${({ theme }) => theme.text.muted};

  strong {
    color: ${({ theme }) => theme.text.primary};
  }
`;

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
