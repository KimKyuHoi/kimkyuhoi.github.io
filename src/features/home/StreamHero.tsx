import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useDrag } from '@use-gesture/react';
import {
  Captions,
  ChartNoAxesColumn,
  Link as LinkIcon,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Github, Linkedin } from '@/ui/BrandIcons';
import Magnet from '@/reactbits/Magnet';
import LogoStage, { COMPACT, ScreenPanel, type LogoStageHandle } from '@/features/home/LogoStage';
import { media } from '@/styles/media';
import { DURATION, HERO_BASE, SETTLE_END, WALK_END } from '@/features/home/logoMotion';
import { CAPTIONS, type CaptionKey } from '@/features/home/captions';

// 전문 통계는 열 때만 내려받는다.
const StatsPanel = React.lazy(() => import('@/features/home/StatsPanel'));

// 화질 사다리. 적응형 스트리밍(ABR)이 낮은 화질에서 시작해 올라가는 과정을 그대로 흉내 낸다.
// blur 값은 style.css의 stream-warmup 키프레임과 같아야 한다.
const LADDER = [
  { label: '144p', block: 40, blur: 5 },
  { label: '360p', block: 20, blur: 2.2 },
  { label: '720p', block: 8, blur: 0.7 },
  { label: '1080p', block: 1, blur: 0 },
];
const TOP = LADDER.length - 1;
// 자동 화질은 영상이 시작되고 이 간격마다 한 단계씩 오른다 (stream-warmup 1.35초를 3등분).
const STEP_SECONDS = 0.45;
const RATES = [0.5, 1, 2];
const EVENT_CAPTION_MS = 2400;
// 화면을 손가락으로 끌어 되감을 때, 화면 폭만큼 끌면 영상 전체보다 조금 더 넘어가게 해 끝까지 닿기 쉽게 한다.
const SCRUB_REACH = 1.15;
// 화면 조작(탭·끌기)으로 치지 않는 곳: 링크와 조작부, 그리고 폰에서 화면 아래로 내려가는 글
const NOT_SCREEN = 'a, button, input, select, [data-not-screen]';

const socials = [
  { href: 'https://github.com/KimKyuHoi', label: 'GitHub', Icon: Github, caption: 'github' },
  {
    href: 'https://www.linkedin.com/in/%EA%B7%9C%ED%9A%8C-%EA%B9%80-2ba0a5254/',
    label: 'LinkedIn',
    Icon: Linkedin,
    caption: 'linkedin',
  },
  {
    href: 'https://velog.io/@k_gu_wae123/posts',
    label: 'Velog',
    Icon: LinkIcon,
    caption: 'velog',
  },
] as const;

const autoLevelAt = (time: number) => Math.min(TOP, Math.floor(time / STEP_SECONDS));

const timecode = (time: number) => `0:0${Math.min(DURATION, Math.floor(time))} / 0:0${DURATION}`;

/** 지금 화면에서 나고 있을 법한 소리. 영상의 진행 상태로 정해진다. */
const sceneCaption = (time: number, playing: boolean, rate: number): CaptionKey => {
  if (time >= SETTLE_END) return 'idle';
  if (!playing) return 'paused';
  if (time >= WALK_END) return 'settle';
  if (rate > 1) return 'run';
  return rate < 1 ? 'stroll' : 'walk';
};

/**
 * 홈 화면의 히어로. 영상 플레이어처럼 생겼고 실제로 그렇게 동작한다.
 * 재생되는 "영상"은 로고가 걸어 들어와 자리를 잡는 4초짜리 장면이고(logoMotion.ts),
 * 재생/일시정지, 탐색, 배속, 화질, 자막을 모두 조작할 수 있다. 다 재생되면 멈춘다.
 */
const StreamHero: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<LogoStageHandle>(null);
  const seekRef = useRef<HTMLInputElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);

  // 재생 위치처럼 매 프레임 바뀌는 값은 ref에 두고 DOM을 직접 고친다. 화면 구성이 달라지는 값만 state로 둔다.
  const clock = useRef({ time: DURATION, rate: 1, playing: false, raf: 0, last: 0 });
  const eventTimer = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(true);
  const [rate, setRate] = useState(1);
  const [quality, setQuality] = useState<'auto' | number>('auto');
  const [level, setLevel] = useState(TOP);
  const [scene, setScene] = useState<CaptionKey>('idle');
  const [eventCaption, setEventCaption] = useState<CaptionKey | null>(null);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  // 첫 로드의 제목 선명도는 CSS 애니메이션(.stream-warmup)이 맡는다. 사용자가 영상을 조작한 뒤부터 JS가 맡는다.
  const [userDriven, setUserDriven] = useState(false);

  // 화면을 눌러 재생·일시정지했을 때 화면 가운데에 잠깐 뜨는 표시
  const [bezel, setBezel] = useState<{ kind: 'play' | 'pause'; key: number } | null>(null);

  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  /** 다른 자막을 잠깐 띄웠다가 원래 장면 자막으로 돌아간다. */
  const flash = (key: CaptionKey) => {
    window.clearTimeout(eventTimer.current);
    setEventCaption(key);
    eventTimer.current = window.setTimeout(() => setEventCaption(null), EVENT_CAPTION_MS);
  };

  /** 재생 위치에 맞춰 화면 전체를 맞춘다: 로고의 모양, 탐색 바, 시간 표시, 자동 화질, 장면 자막. */
  const renderFrame = () => {
    const { time, playing: isPlaying, rate: currentRate } = clock.current;
    stageRef.current?.drawAt(time);

    const seek = seekRef.current;
    if (seek) {
      seek.value = String(time);
      seek.style.setProperty('--progress', `${(time / DURATION) * 100}%`);
      seek.setAttribute('aria-valuetext', timecode(time));
    }
    if (timecodeRef.current) timecodeRef.current.textContent = timecode(time);

    if (qualityRef.current === 'auto') setLevel(autoLevelAt(time));
    setScene(sceneCaption(time, isPlaying, currentRate));
  };

  const stop = () => {
    cancelAnimationFrame(clock.current.raf);
    clock.current.playing = false;
    setPlaying(false);
  };

  const tick = (now: number) => {
    const state = clock.current;
    const delta = state.last ? Math.min((now - state.last) / 1000, 0.1) : 0;
    state.last = now;
    state.time = Math.min(DURATION, state.time + delta * state.rate);

    if (state.time >= DURATION) {
      stop();
      setEnded(true);
      renderFrame();
      return;
    }
    renderFrame();
    state.raf = requestAnimationFrame(tick);
  };

  const play = () => {
    const state = clock.current;
    if (state.time >= DURATION) state.time = 0;
    cancelAnimationFrame(state.raf);
    state.playing = true;
    state.last = 0;
    setPlaying(true);
    setEnded(false);
    state.raf = requestAnimationFrame(tick);
  };

  useEffect(() => {
    // 서버가 그려 둔 제목의 CSS 애니메이션이 아직 재생 중일 때만, 그 시각에 맞춰 영상을 이어서 재생한다.
    // 하이드레이션이 늦어 애니메이션이 이미 끝났거나 모션 줄이기 상태라면, 다 재생된 마지막 장면으로 둔다.
    const warmup = titleRef.current
      ?.getAnimations?.()
      .find((animation) => (animation as CSSAnimation).animationName === 'stream-warmup');
    if (warmup?.playState === 'running') {
      clock.current.time = (Number(warmup.currentTime) || 0) / 1000;
      play();
    }

    const state = clock.current;
    return () => {
      cancelAnimationFrame(state.raf);
      window.clearTimeout(eventTimer.current);
    };
    // 마운트할 때 한 번만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 실제로 인터넷이 끊기면 영상도 버퍼링에 걸린 것처럼 가장 낮은 화질로 떨어진다.
  useEffect(() => {
    const sync = () => {
      setOffline(!navigator.onLine);
      flash(navigator.onLine ? 'online' : 'offline');
    };
    if (!navigator.onLine) sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const handleToggle = () => {
    setUserDriven(true);
    if (clock.current.playing) {
      stop();
      renderFrame();
    } else {
      play();
    }
  };

  const seekTo = (next: number) => {
    flash(next < clock.current.time ? 'rewind' : 'forward');
    setUserDriven(true);
    clock.current.time = next;
    clock.current.last = 0;
    setEnded(next >= DURATION);
    renderFrame();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(event.target.value));
  };

  // 탐색 바는 끌 때 부드럽도록 0.01초 단위로 움직인다. 방향키로는 그 단위가 너무 잘아서 0.25초씩 건너뛰게 한다.
  const handleSeekKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    if (!forward && !backward) return;
    event.preventDefault();
    seekTo(Math.min(DURATION, Math.max(0, clock.current.time + (forward ? 0.25 : -0.25))));
  };

  const handleRate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number(event.target.value);
    clock.current.rate = next;
    setRate(next);
    renderFrame();
  };

  const handleQuality = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value === 'auto' ? 'auto' : Number(event.target.value);
    const nextLevel = next === 'auto' ? autoLevelAt(clock.current.time) : next;
    flash(nextLevel < level ? 'qualityDown' : 'qualityUp');
    setUserDriven(true);
    setQuality(next);
    setLevel(nextLevel);
  };

  const handleStats = () => {
    if (!statsOpen) flash('stats');
    setStatsOpen((open) => !open);
  };

  // 화면을 직접 만지는 조작. 누르면 재생·일시정지하고, 손가락으로 좌우로 끌면 그만큼 영상을 되감거나 넘긴다.
  // 같은 조작은 아래 조작부(재생 버튼, 탐색 바)로도 할 수 있다.
  const scrub = useRef({ from: 0, resume: false });
  const bindScreen = useDrag(
    ({ event, first, last, tap, movement: [moved] }) => {
      // 처음 닿은 곳이 링크나 조작부라면 화면 조작이 아니다. (터치와 포인터 캡처 덕분에 target은 처음 닿은 요소로 유지된다.)
      const target = event.target as Element | null;
      if (target?.closest(NOT_SCREEN)) return;

      if (tap) {
        setBezel((prev) => ({
          kind: clock.current.playing ? 'pause' : 'play',
          key: (prev?.key ?? 0) + 1,
        }));
        handleToggle();
        return;
      }

      // 끌어서 탐색하는 것은 손가락으로만 한다. 마우스로 끄는 동작은 글자 선택에 양보한다.
      const byFinger = 'touches' in event || (event as PointerEvent).pointerType === 'touch';
      if (!byFinger) return;

      if (first) {
        scrub.current = { from: clock.current.time, resume: clock.current.playing };
        if (clock.current.playing) stop();
      }
      const width = rootRef.current?.clientWidth || 1;
      const next = scrub.current.from + (moved / width) * DURATION * SCRUB_REACH;
      seekTo(Math.min(DURATION, Math.max(0, next)));

      if (last && scrub.current.resume && clock.current.time < DURATION) play();
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 10,
      pointer: { touch: true },
    }
  );

  const shown = LADDER[offline ? 0 : level];

  const describeQuality = () => {
    const size = stageRef.current?.size();
    if (!size) return shown.label;
    const scale = shown.block === 1 ? window.devicePixelRatio : 1 / shown.block;
    return `${shown.label} (${Math.round(size.width * scale)}×${Math.round(size.height * scale)})`;
  };

  return (
    <ScreenPanel ref={rootRef} aria-label="소개" {...bindScreen()} style={{ touchAction: 'pan-y' }}>
      <LogoStage ref={stageRef} block={shown.block} warmup attached />

      {bezel ? (
        <Bezel key={bezel.key} aria-hidden="true">
          {bezel.kind === 'play' ? <Play /> : <Pause />}
        </Bezel>
      ) : null}

      {offline ? <Buffering role="status">인터넷 연결을 기다리는 중입니다</Buffering> : null}

      {statsOpen ? (
        <React.Suspense fallback={null}>
          <StatsPanel
            id="hero-stats"
            quality={describeQuality()}
            onClose={() => setStatsOpen(false)}
          />
        </React.Suspense>
      ) : null}

      <Body>
        <Role>Software Engineer 김규회</Role>
        <Title
          ref={titleRef}
          className="stream-warmup"
          style={userDriven ? { filter: shown.blur ? `blur(${shown.blur}px)` : 'none' } : undefined}
        >
          제품을 좋아하는 개발자입니다
        </Title>
        <Intro data-not-screen="">
          그래서 불편한 UI는 못 참고, 엉킨 구조도 그냥 못 넘어가고, 기능은 먼저 제안합니다. 직접
          써보며 불편한 점과 필요한 기능을 찾고, 사용자를 만나 묻고, 지표로 확인해 우선순위를
          정합니다.
        </Intro>
        <Socials data-not-screen="">
          {socials.map(({ href, label, Icon, caption }) => (
            <Magnet key={label} padding={36} magnetStrength={3} wrapperClassName="hero-social">
              <SocialLink
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => flash(caption)}
                onFocus={() => flash(caption)}
              >
                <Icon aria-hidden="true" /> {label}
              </SocialLink>
            </Magnet>
          ))}
        </Socials>
      </Body>

      {/* 자막은 눈으로 즐기는 장식이라 보조 기술에는 읽어 주지 않는다. */}
      <CaptionRow aria-hidden="true">
        {captionsOn ? <Caption>{CAPTIONS[eventCaption ?? scene]}</Caption> : null}
      </CaptionRow>

      <Controls data-not-screen="">
        <Seek
          ref={seekRef}
          type="range"
          min={0}
          max={DURATION}
          step={0.01}
          defaultValue={DURATION}
          aria-label="재생 위치"
          onChange={handleSeek}
          onKeyDown={handleSeekKey}
        />
        <Buttons>
          <IconButton
            type="button"
            onClick={handleToggle}
            aria-label={playing ? '일시정지' : ended ? '다시 재생' : '재생'}
            title={playing ? '일시정지' : ended ? '다시 재생' : '재생'}
          >
            {playing ? <Pause /> : ended ? <RotateCcw data-outline="" /> : <Play />}
          </IconButton>
          <Timecode ref={timecodeRef}>{timecode(DURATION)}</Timecode>

          <Spacer />

          <IconButton
            type="button"
            onClick={() => setCaptionsOn((on) => !on)}
            aria-pressed={captionsOn}
            aria-label="자막"
            title="자막"
          >
            <Captions data-outline="" />
          </IconButton>
          <Select aria-label="재생 속도" value={rate} onChange={handleRate} data-optional="">
            {RATES.map((value) => (
              <option key={value} value={value}>
                {value}배속
              </option>
            ))}
          </Select>
          <Select aria-label="화질" value={quality} onChange={handleQuality}>
            <option value="auto">자동 ({shown.label})</option>
            {LADDER.map((rung, index) => (
              <option key={rung.label} value={index}>
                {rung.label}
              </option>
            )).reverse()}
          </Select>
          <IconButton
            type="button"
            onClick={handleStats}
            aria-expanded={statsOpen}
            aria-controls="hero-stats"
            aria-label="전문 통계"
            title="전문 통계"
          >
            <ChartNoAxesColumn data-outline="" />
          </IconButton>
        </Buttons>
      </Controls>
    </ScreenPanel>
  );
};

export default StreamHero;

// 글자색은 ScreenPanel이 정한 변수를 쓴다 (LogoStage.tsx).
// 폰에서는 이 상자가 사라지고(display: contents), 안의 요소들이 포스터 격자의 제 줄에 직접 놓인다:
// 직함(2)·제목(3)·자막(4)은 영상 화면 위에, 조작부(5)는 화면 바로 아래에, 소개(6)·링크(7)는 그 아래 페이지 바탕에.
const Body = styled.div`
  padding: 48px 48px 12px;

  ${COMPACT} {
    padding: 40px 36px 12px;
  }

  ${media.phone} {
    display: contents;
  }
`;

const Role = styled.p`
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: var(--screen-text);

  ${media.phone} {
    grid-area: 2 / 1;
    position: relative;
    z-index: 1;
    margin: 0 0 8px;
    padding: 0 20px;
    font-size: 15px;
    color: var(--screen-text-soft);
  }
`;

const Title = styled.h1`
  margin: 0 0 20px;
  max-width: 11.4em;
  font-size: clamp(32px, 5.6vw, 54px);
  font-weight: 800;
  line-height: 1.2;
  text-wrap: balance;
  letter-spacing: -0.035em;
  word-break: keep-all;
  color: var(--screen-text);

  /* 태블릿에서는 로고에 닿기 전에 두 줄로 나눈다. */
  ${COMPACT} {
    max-width: 8.6em;
  }

  ${media.phone} {
    grid-area: 3 / 1;
    position: relative;
    z-index: 1;
    max-width: none;
    margin: 0;
    padding: 0 20px;
    font-size: clamp(30px, 8.8vw, 42px);
    line-height: 1.18;
  }
`;

const Intro = styled.p`
  margin: 0 0 28px;
  max-width: 31em;
  font-size: 16px;
  line-height: 1.8;
  color: var(--aside-text-soft);
  word-break: keep-all;

  ${COMPACT} {
    max-width: min(31em, 55%);
  }

  ${media.phone} {
    grid-area: 6 / 1;
    max-width: none;
    margin: 20px 8px;
  }
`;

const Socials = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  ${media.phone} {
    grid-area: 7 / 1;
    margin: 0 8px;
  }

  /* 폰에서는 세 링크가 한 줄을 똑같이 나눠 갖는다 (둘 + 하나로 줄바꿈되지 않게). */
  @media (max-width: 480px) {
    gap: 8px;
    flex-wrap: nowrap;

    .hero-social {
      flex: 1 1 0;
      min-width: 0;
    }
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid var(--aside-line);
  background: var(--aside-chip);
  font-size: 15px;
  font-weight: 600;
  color: var(--aside-text);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: var(--aside-chip-hover);
    border-color: var(--aside-text-soft);
  }

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  @media (max-width: 480px) {
    gap: 6px;
    min-height: 48px;
    padding: 0 8px;
    font-size: 14px;
  }
`;

// 자막이 놓이는 띠. 자막을 꺼도 높이는 그대로 두어 화면이 출렁이지 않게 한다.
const CaptionRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 56px;
  padding: 0 16px;

  /* 폰에서는 제목 바로 아래, 영상 화면의 맨 아랫줄이다. 눌러도 화면을 누른 것으로 친다. */
  ${media.phone} {
    grid-area: 4 / 1;
    position: relative;
    z-index: 1;
    min-height: 60px;
    padding-top: 6px;
    pointer-events: none;
  }
`;

const Caption = styled.span`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.xs};
  background: rgba(0, 0, 0, 0.72);
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
  color: #ffffff;
`;

const bezelPop = keyframes`
  from {
    opacity: 0.95;
    transform: scale(0.82);
  }
  to {
    opacity: 0;
    transform: scale(1.25);
  }
`;

// 화면을 눌러 재생·일시정지했을 때 가운데에 잠깐 떴다 사라지는 표시
const Bezel = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin: -36px 0 0 -36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  pointer-events: none;
  animation: ${bezelPop} 0.55s ease-out both;

  svg {
    width: 30px;
    height: 30px;
    fill: currentColor;
  }

  /* 폰에서는 로고가 보이는 첫 줄의 한가운데에 띄운다. */
  ${media.phone} {
    position: relative;
    top: auto;
    left: auto;
    grid-area: 1 / 1;
    place-self: center;
    margin: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01s;
  }
`;

const Buffering = styled.p`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  margin: 0;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(0, 0, 0, 0.72);
  font-size: 13px;
  color: #ffffff;
`;

const Controls = styled.div`
  padding: 0 36px 6px 48px;
  background: linear-gradient(180deg, rgba(11, 16, 32, 0), rgba(11, 16, 32, 0.78));
  font-size: 13px;
  color: rgba(249, 250, 251, 0.85);

  ${COMPACT} {
    padding: 0 24px 6px 36px;
  }

  /* 폰에서는 영상 화면 바로 아래에 붙어, 화면과 함께 하나의 플레이어를 이룬다.
     화면과의 경계에 실금이 보이지 않게 1px 겹친다. */
  ${media.phone} {
    grid-area: 5 / 1;
    position: relative;
    z-index: 1;
    margin-top: -1px;
    padding: 0 8px 6px 20px;
    border-radius: 0 0 ${({ theme }) => theme.radius.xl} ${({ theme }) => theme.radius.xl};
    background: ${HERO_BASE};
  }
`;

// 탐색 바. 브라우저의 range 입력을 그대로 써서 키보드와 보조 기술로도 조작할 수 있다.
const Seek = styled.input`
  --progress: 100%;
  display: block;
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      #3b82f6 var(--progress),
      rgba(255, 255, 255, 0.28) var(--progress)
    );
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      #3b82f6 var(--progress),
      rgba(255, 255, 255, 0.28) var(--progress)
    );
  }

  &::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border: none;
    border-radius: 50%;
    background: #ffffff;
    appearance: none;
    -webkit-appearance: none;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: -12px;

  /* 폭이 360px 안팎인 폰에서도 모든 조작 버튼이 한 줄에 들어가게 간격을 줄인다. */
  @media (max-width: 400px) {
    gap: 0;
  }
`;

const IconButton = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  /* 꺼진 토글(자막)은 흐리게 보여 준다. */
  &[aria-pressed='false'] {
    opacity: 0.5;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  /* 선으로 된 아이콘은 채우지 않는다. */
  svg[data-outline] {
    width: 20px;
    height: 20px;
    fill: none;
  }
`;

const Timecode = styled.span`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  /* 좁은 화면에서는 조작 버튼이 모두 들어가도록 시간 표시를 뺀다. 위치는 탐색 바로 알 수 있다. */
  @media (max-width: 480px) {
    display: none;
  }
`;

const Spacer = styled.span`
  flex: 1;
`;

const Select = styled.select`
  flex-shrink: 0;
  height: 44px;
  padding: 0 8px;

  @media (max-width: 400px) {
    padding: 0 2px;
  }

  /* 아주 좁은 화면에서는 재생 속도 선택을 숨겨 화질 선택과 통계 버튼이 잘리지 않게 한다. */
  @media (max-width: 345px) {
    &[data-optional] {
      display: none;
    }
  }

  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  /* 펼친 목록은 브라우저가 그린다. 어두운 패널 색을 따라가 글자가 안 보이는 일을 막는다. */
  option {
    background: #ffffff;
    color: #191f28;
  }
`;
