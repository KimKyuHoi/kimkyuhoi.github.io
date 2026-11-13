import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';

type StatsPanelProps = {
  id: string;
  /** 현재 화질 표기 (예: "1080p (1920×1000)") */
  quality: string;
  onClose: () => void;
};

type Row = { label: string; value: string };

type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
type NetworkInfo = { downlink?: number; effectiveType?: string };

const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1];
const kilobytes = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString('ko-KR')} KB`;

/**
 * 영상 플레이어의 "전문 통계"처럼, 이 페이지가 실제로 어떻게 로드되고 그려지는지 보여 준다.
 * 모든 값은 브라우저 성능 API로 지금 측정한 것이고, 브라우저가 지원하지 않는 항목은 표시하지 않는다.
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ id, quality, onClose }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  useEffect(() => {
    const supported = PerformanceObserver.supportedEntryTypes || [];
    const observers: PerformanceObserver[] = [];
    let lcp: number | null = null;
    let cls: number | null = null;

    if (supported.includes('largest-contentful-paint')) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries[entries.length - 1].startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(observer);
    }

    if (supported.includes('layout-shift')) {
      cls = 0;
      const observer = new PerformanceObserver((list) => {
        (list.getEntries() as LayoutShift[]).forEach((entry) => {
          if (!entry.hadRecentInput) cls = (cls || 0) + entry.value;
        });
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      observers.push(observer);
    }

    // 프레임 간격을 직접 재서, 화면 주사율보다 늦게 그려진 프레임을 "누락"으로 센다.
    const samples: number[] = [];
    let interval = 0;
    let frames = 0;
    let dropped = 0;
    let last = 0;
    let raf = requestAnimationFrame(function tick(now) {
      if (last) {
        const delta = now - last;
        if (!interval) {
          samples.push(delta);
          if (samples.length === 30) interval = median(samples);
        } else {
          frames += 1;
          dropped += Math.max(0, Math.round(delta / interval) - 1);
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    });

    const collect = () => {
      const next: Row[] = [
        { label: '화질', value: qualityRef.current },
        {
          label: '뷰포트',
          value: `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
        },
        {
          label: '프레임',
          value: interval
            ? `${Math.round(1000 / interval)}Hz, 누락 ${dropped} / ${frames.toLocaleString('ko-KR')}`
            : '측정 중',
        },
      ];

      const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
      if (connection?.downlink) {
        next.push({
          label: '연결 속도',
          value: `${connection.downlink} Mbps${connection.effectiveType ? ` (${connection.effectiveType})` : ''}`,
        });
      }

      const [navigation] = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const transferred = [navigation, ...resources].reduce(
        (sum, entry) => sum + (entry?.transferSize || 0),
        0
      );
      next.push({
        label: '받은 데이터',
        value: `${kilobytes(transferred)}, 요청 ${resources.length + 1}개`,
      });

      if (navigation) {
        next.push({ label: 'TTFB', value: `${Math.round(navigation.responseStart)}ms` });
      }
      if (lcp !== null) next.push({ label: 'LCP', value: `${(lcp / 1000).toFixed(2)}초` });
      if (cls !== null) next.push({ label: 'CLS', value: cls.toFixed(3) });

      setRows(next);
    };

    collect();
    const timer = window.setInterval(collect, 500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <Panel id={id} role="region" aria-label="전문 통계" data-not-screen="">
      <CloseButton type="button" onClick={onClose} aria-label="전문 통계 닫기">
        <X size={16} aria-hidden="true" />
      </CloseButton>
      <dl>
        {rows.map(({ label, value }) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </Panel>
  );
};

export default StatsPanel;

const Panel = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 3;
  max-width: calc(100% - 32px);
  padding: 14px 44px 14px 16px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: rgba(8, 10, 16, 0.9);
  font-size: 13px;
  line-height: 1.7;
  color: #f9fafb;

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 16px;
    margin: 0;
  }

  dt {
    color: rgba(249, 250, 251, 0.7);
    white-space: nowrap;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #f9fafb;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
`;
