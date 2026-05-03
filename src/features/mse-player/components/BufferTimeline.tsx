import React from 'react';
import styled from '@emotion/styled';

type Props = {
  duration: number;
  currentTime: number;
  bufferedRanges: Array<{ start: number; end: number }>;
};

const BufferTimeline: React.FC<Props> = ({ duration, currentTime, bufferedRanges }) => {
  if (duration <= 0) return null;
  return (
    <Wrap>
      <Label>
        buffered ranges · 재생 위치 {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
      </Label>
      <Track>
        {bufferedRanges.map((r, i) => (
          <Fill
            key={`${r.start}-${r.end}-${i}`}
            style={{
              left: `${(r.start / duration) * 100}%`,
              width: `${((r.end - r.start) / duration) * 100}%`,
            }}
          />
        ))}
        <Pointer style={{ left: `${(currentTime / duration) * 100}%` }} />
      </Track>
    </Wrap>
  );
};

export default BufferTimeline;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.div`
  font-size: 11.5px;
  color: ${({ theme }) => theme.text.muted};
  font-family: ${({ theme }) => theme.font.mono};
`;

const Track = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.bg.muted};
  overflow: hidden;
`;

const Fill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  background: ${({ theme }) => theme.accent};
  opacity: 0.5;
  border-radius: 999px;
`;

const Pointer = styled.div`
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: ${({ theme }) => theme.accent};
  border-radius: 1px;
`;
