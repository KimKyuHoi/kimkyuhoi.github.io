import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from 'gatsby';
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

  const [assetInput, setAssetInput] = useState(initialAsset);
  const [codecInput, setCodecInput] = useState(initialCodec);
  const [appliedAsset, setAppliedAsset] = useState(initialAsset);
  const [appliedCodec, setAppliedCodec] = useState(initialCodec);
  const [runId, setRunId] = useState(0);
  const [preferredVariantId, setPreferredVariantId] = useState<string | undefined>();
  const playerSectionRef = useRef<HTMLElement | null>(null);

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
            presets={PRESETS}
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
