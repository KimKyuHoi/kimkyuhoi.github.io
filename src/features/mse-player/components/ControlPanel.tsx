import React from 'react';
import styled from '@emotion/styled';
import type { Preset } from '../types';
import { SectionDesc, SectionTitle, SubLabel } from './styled';

type Props = {
  assetInput: string;
  codecInput: string;
  onAssetChange: (v: string) => void;
  onCodecChange: (v: string) => void;
  onRun: () => void;
  onRestart: () => void;
  onPickPreset: (p: Preset) => void;
  presets: Preset[];
};

const ControlPanel: React.FC<Props> = ({
  assetInput,
  codecInput,
  onAssetChange,
  onCodecChange,
  onRun,
  onRestart,
  onPickPreset,
  presets,
}) => {
  const works = presets.filter((p) => p.category === 'works');
  const edu = presets.filter((p) => p.category === 'edu');

  return (
    <>
      <SectionTitle>1. 자산 / 코덱 설정</SectionTitle>
      <SectionDesc>
        URL 끝의 확장자(.mp4 / .m3u8 / .mpd)로 포맷을 자동 감지합니다. HLS/DASH는
        manifest에서 코덱을 추출해 자동으로 채우므로 코덱 입력란은 비워두셔도 됩니다.
      </SectionDesc>

      <FieldRow>
        <FieldLabel>자산 URL</FieldLabel>
        <Input
          value={assetInput}
          onChange={(e) => onAssetChange(e.target.value)}
          placeholder="https://example.com/master.m3u8"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRun();
          }}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>MIME codec</FieldLabel>
        <Input
          value={codecInput}
          onChange={(e) => onCodecChange(e.target.value)}
          placeholder='(.mp4만 필수) video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRun();
          }}
        />
      </FieldRow>

      <ActionRow>
        <PrimaryButton onClick={onRun}>▶ 실행</PrimaryButton>
        <SecondaryButton onClick={onRestart}>↻ 다시 실행</SecondaryButton>
      </ActionRow>

      <SubLabel>Preset · 정상 케이스</SubLabel>
      <Chips>
        {works.map((p) => (
          <Chip
            key={p.id}
            onClick={() => onPickPreset(p)}
            title={p.description}
            tone="works"
          >
            {p.label}
          </Chip>
        ))}
      </Chips>

      <SubLabel style={{ marginTop: 14 }}>Preset · 일부러 망가뜨린 케이스</SubLabel>
      <Chips>
        {edu.map((p) => (
          <Chip
            key={p.id}
            onClick={() => onPickPreset(p)}
            title={p.description}
            tone="edu"
          >
            {p.label}
          </Chip>
        ))}
      </Chips>
    </>
  );
};

export default ControlPanel;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
`;

const FieldLabel = styled.label`
  flex: 0 0 110px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.text.muted};
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 13px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.bg.surface};
  color: ${({ theme }) => theme.text.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  margin-bottom: 18px;
`;

const PrimaryButton = styled.button`
  padding: 8px 18px;
  font-size: 13.5px;
  font-weight: 600;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.text.inverse};
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled.button`
  padding: 8px 14px;
  font-size: 13.5px;
  background: ${({ theme }) => theme.bg.surface};
  color: ${({ theme }) => theme.text.primary};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.bg.muted};
  }
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ tone?: 'works' | 'edu' }>`
  padding: 6px 12px;
  font-size: 12.5px;
  border: 1px solid
    ${({ theme, tone }) => (tone === 'edu' ? 'rgba(248, 113, 113, 0.4)' : theme.border)};
  background: ${({ theme, tone }) =>
    tone === 'edu' ? 'rgba(248, 113, 113, 0.08)' : theme.bg.surface};
  color: ${({ theme, tone }) => (tone === 'edu' ? '#dc2626' : theme.text.primary)};
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme, tone }) => (tone === 'edu' ? '#dc2626' : theme.accent)};
    color: ${({ theme, tone }) => (tone === 'edu' ? '#dc2626' : theme.accent)};
  }
`;
