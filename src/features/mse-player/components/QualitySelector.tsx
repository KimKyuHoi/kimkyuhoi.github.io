import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import type { Variant } from '../types';

type Props = {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type ResolutionGroup = {
  label: string; // '720p' or 'auto'
  height: number;
  variants: Variant[];
};

const groupByResolution = (variants: Variant[]): ResolutionGroup[] => {
  const map = new Map<number, Variant[]>();
  for (const v of variants) {
    const key = v.height ?? 0;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return Array.from(map.entries())
    .map(([height, vs]) => ({
      height,
      label: height > 0 ? `${height}p` : '기본',
      variants: vs.sort((a, b) => b.bandwidth - a.bandwidth), // 비트레이트 내림차순
    }))
    .sort((a, b) => b.height - a.height); // 해상도 내림차순 (1080p 먼저)
};

const QualitySelector: React.FC<Props> = ({ variants, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (variants.length === 0) return null;

  const groups = groupByResolution(variants);
  const selected = variants.find((v) => v.id === selectedId);
  const currentLabel = selected
    ? `${selected.height ? `${selected.height}p` : '기본'} · ${(selected.bandwidth / 1000).toFixed(0)} kbps`
    : '화질 선택';

  return (
    <Wrap ref={wrapRef}>
      <Trigger onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>⚙ 화질</span>
        <Current>{currentLabel}</Current>
        <Caret open={open}>▾</Caret>
      </Trigger>
      {open && (
        <Menu>
          {groups.map((g) => (
            <Group key={g.label}>
              <GroupLabel>{g.label}</GroupLabel>
              {g.variants.map((v) => (
                <Item
                  key={v.id}
                  active={v.id === selectedId}
                  onClick={() => {
                    onSelect(v.id);
                    setOpen(false);
                  }}
                >
                  <ItemMain>
                    <Bitrate>{(v.bandwidth / 1000).toFixed(0)} kbps</Bitrate>
                    {v.codec && <Codec>{v.codec}</Codec>}
                  </ItemMain>
                  {v.id === selectedId && <Check>✓</Check>}
                </Item>
              ))}
            </Group>
          ))}
        </Menu>
      )}
    </Wrap>
  );
};

export default QualitySelector;

const Wrap = styled.div`
  position: relative;
  align-self: flex-start;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12.5px;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.text.primary};

  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const Current = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.text.muted};
`;

const Caret = styled.span<{ open: boolean }>`
  font-size: 11px;
  color: ${({ theme }) => theme.text.muted};
  transition: transform 0.15s ease;
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  max-height: 360px;
  overflow-y: auto;
  background: ${({ theme }) => theme.bg.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
  padding: 6px 0;
`;

const Group = styled.div`
  & + & {
    border-top: 1px solid ${({ theme }) => theme.border};
    margin-top: 4px;
    padding-top: 4px;
  }
`;

const GroupLabel = styled.div`
  padding: 6px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.text.muted};
`;

const Item = styled.button<{ active: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  background: ${({ active }) => (active ? 'rgba(96, 165, 250, 0.08)' : 'transparent')};
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  color: ${({ theme }) => theme.text.primary};

  &:hover {
    background: ${({ theme }) => theme.bg.muted};
  }
`;

const ItemMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Bitrate = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
`;

const Codec = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 10.5px;
  color: ${({ theme }) => theme.text.muted};
`;

const Check = styled.span`
  color: ${({ theme }) => theme.accent};
  font-weight: 700;
`;
