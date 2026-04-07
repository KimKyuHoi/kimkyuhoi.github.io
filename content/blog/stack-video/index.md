---
title: 'StackedAlphaVideo를 실제로 쓰다가 터진 것들'
date: '2026-04-02'
description: '이론상 완벽해 보였던 StackedAlphaVideo를 핑크퐁닷컴에 실제로 붙이면서 마주친 것들. WebGL OOM, 프레임 섞임, AV1 폴백 버그, Amazon Fire OS까지.'
tags: ['WebGL', 'Canvas2D', 'AV1', 'H.265', 'Video', 'React']
category: '개발'
featured: true
---

[이전 글](/blog/alpha-channel-with-codecs/)에서 저는 Stacked Alpha Video 방식이 기술적으로 더 낫다는 걸 알면서도, 당시 일정 문제로 VP9 + HEVC 조합을 선택했다고 썼습니다.

그리고 얼마 후, 드디어 제가 직접 그 Stacked Alpha Video를 구현해야 하는 상황이 왔습니다.

핑크퐁닷컴 캐릭터 탭에 캐릭터들이 캐러셀로 등장하는 섹션인데, 각 캐릭터가 투명 배경 영상으로 살아 움직이는 형태였습니다. 이전 글에서 잠깐 언급했던 `stacked-alpha-video` 패키지를 직접 붙이는 게 아니라, 우리 서비스에 맞게 React 컴포넌트로 직접 구현하는 작업이었습니다.

결론부터 말하면, 생각보다 훨씬 많은 게 터졌습니다.

---

## StackedAlphaVideo가 뭔지 잠깐만

이전 글에서도 다뤘지만 간단히 짚고 넘어가면, Stacked Alpha Video는 영상을 두 배 높이로 만들어서 **위쪽 절반은 컬러**, **아래쪽 절반은 알파 마스크(흑백)**로 구성하는 방식입니다. 브라우저가 Alpha Channel을 네이티브로 처리하는 게 아니라, WebGL fragment shader로 두 영역을 합성해서 투명도를 직접 만들어냅니다.

```
┌──────────────────┐
│   컬러 (RGB)      │  ← 위쪽 절반
├──────────────────┤
│   알파 마스크     │  ← 아래쪽 절반 (R채널 = alpha 값)
└──────────────────┘
```

AV1 코덱으로 인코딩하면 VP9 + HEVC 두 벌보다 용량도 훨씬 작고, 구형 기기 폴백용 H.265 하나만 따로 두면 됩니다.

이론상으로는 완벽한 방식이었는데, 막상 캐러셀 안에서 여러 플레이어가 동시에 돌아가는 상황이 되니까 예상치 못한 문제들이 연달아 터졌습니다.

---

## 첫 번째 문제: 캐러셀을 7~8번 넘기면 탭이 죽는다

처음에 각 캐러셀 카드마다 독립적인 `StackedAlphaVideoPlayer`를 만들고, 카드가 바뀔 때마다 이전 플레이어를 `dispose()`하고 새 플레이어를 생성하는 구조로 짰습니다.

```
카드 전환 시:
1. 이전 카드 → player.dispose() → WebGL 컨텍스트 파괴
2. 새 카드 → 새 WebGL 컨텍스트 생성 + 셰이더 컴파일
```

그런데 캐러셀을 7~8번 넘기면 태블릿/모바일에서 탭이 크래시(OOM)되고, 데스크톱에서는 심한 스터터링이 발생했습니다. Sentry에는 `"Shader compilation failed"` 경고가 쌓이기 시작했고요.

### 원인: 셰이더 캐시 고갈

WebGL 컨텍스트를 `WEBGL_lose_context`로 파괴해도, GPU 드라이버 레벨의 셰이더 캐시는 즉시 해제되지 않습니다. 생성→컴파일→파괴를 반복할수록 캐시가 누적되고, 결국 고갈됩니다.

```
[1회] create GL → compile shaders → destroy GL (캐시 잔류)
[2회] create GL → compile shaders → destroy GL (캐시 누적)
...
[7회] create GL → compile shaders → ❌ 셰이더 캐시 고갈
      → "Shader compilation failed"
      → Canvas2D 폴백 발생
```

그리고 Canvas2D 폴백에서 OOM이 터집니다. Canvas2D로 Stacked Alpha 합성을 하려면 `getImageData()`로 프레임 단위 픽셀 복사를 해야 하는데, 이게 60fps rAF에서 매 프레임 돌아가면 메모리가 폭증합니다.

### 해결: 공유 Offscreen WebGL 싱글톤

WebGL 컨텍스트를 **앱 생애주기 동안 딱 하나만** 만들고, 절대 파괴하지 않는 구조로 바꿨습니다.

```
┌─────────────────────────────────┐
│  Shared Offscreen Canvas (숨김)  │
│  └─ WebGL Context (싱글톤)       │ ← 셰이더 컴파일 1회만
│     └─ drawVideoFrame(video)     │
└────────────────┬────────────────┘
                 │ ctx.drawImage() 복사
    ┌────────────┼────────────────┐
    ▼            ▼                ▼
[Player A]   [Player B]      [Player C]
visible       visible          visible
canvas(2d)   canvas(2d)       canvas(2d)
```

숨겨진 offscreen canvas 하나에서 WebGL로 합성을 한 뒤, 각 플레이어의 visible canvas에 `drawImage()`로 복사하는 방식입니다.

WebGL 컨텍스트를 한 번만 만들기 때문에 셰이더 캐시 누적이 없고, 브라우저의 WebGL 컨텍스트 수 제한(~16개)도 걱정할 필요가 없습니다. 그리고 visible canvas는 항상 2d context만 쓰기 때문에 canvas tainted state 문제도 피할 수 있습니다.

---

## 두 번째 문제: 화면에 엉뚱한 캐릭터 프레임이 보인다

싱글톤으로 바꾸고 나니 OOM은 해결됐는데, 이번엔 저사양 iOS 기기(iOS 16, 18)에서 **다른 캐릭터의 프레임이 섞여서 보이는** 현상이 발생했습니다. 핑크퐁 자리에 아기상어가 잠깐 보이는 식이었습니다.

### 원인: GPU 비동기 처리

iOS 18 Safari에는 regression이 하나 있었는데, `drawImage(webglCanvas)`가 GPU Process에서 비동기 처리되어 다른 플레이어가 offscreen canvas에 렌더링하는 시점과 겹쳐버리는 문제였습니다. 공유 canvas를 여러 플레이어가 동시에 쓰다 보니 프레임이 섞인 거였습니다.

### 해결: 활성 슬라이드 1개만 렌더링 + GPU 동기화 강제

먼저 구조를 단순하게 바꿨습니다. 중앙에 보이는 슬라이드 1개만 비디오를 렌더링하고, 나머지는 poster 이미지를 보여주도록 했습니다.

```typescript
// 이전: 중앙 + 양옆 3개 동시 렌더링
isVideoActive = isHighlighted || isNearby

// 이후: 중앙 1개만
isVideoActive = isHighlighted
```

그리고 GPU 동기화를 강제하기 위해 `gl.finish()` 대신 `readPixels()`를 사용했습니다. `gl.finish()`는 명령을 GPU에 제출하는 것만 보장하지만, `readPixels()`는 GPU 파이프라인이 실제로 완료될 때까지 CPU를 블로킹합니다.

```typescript
// gl.finish() → GPU 제출만 보장
// readPixels() → GPU 파이프라인 완전 완료 보장
gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
```

---

## 세 번째 문제: 슬라이드 전환할 때 따닥거린다

카드를 넘기면 순간적으로 이전 캐릭터의 마지막 프레임이 남아있다가 새 캐릭터로 바뀌는 느낌이 났습니다. 그리고 새 비디오가 준비되기 전까지 빈 canvas가 잠깐 노출되는 문제도 있었습니다.

### 해결: onFirstFrame 콜백

`active=true`가 되는 순간 poster를 보여주고, 실제 첫 프레임이 canvas에 렌더링 완료된 시점을 감지해서 poster를 숨기는 방식으로 바꿨습니다.

```
1. active=true → hasFirstFrame=false → poster 보임
2. 비디오 로딩 중... poster 계속 보임
3. 첫 프레임 렌더링 성공 → onFirstFrame() → hasFirstFrame=true
4. poster 숨김, 비디오 표시 (끊김 없음)
```

단순하지만 꽤 효과적이었습니다. `active=true`가 됐다고 바로 poster를 숨기면 canvas가 비어있는 순간이 노출되는데, 실제 첫 프레임 렌더링 시점을 기준으로 하면 그 타이밍 문제가 깔끔하게 해결됩니다.

---

## 네 번째 문제: DrawResult가 false뿐이라 Canvas2D 전환이 불필요하게 발생한다

기존 `drawVideoFrameToCanvas()`는 렌더링 결과를 `boolean`으로 반환했습니다. 비디오가 아직 준비 중일 때(`readyState < 2`)도 `false`를 반환하다 보니, 플레이어가 이를 "WebGL 실패"로 판단하고 Canvas2D 모드로 불필요하게 전환하는 케이스가 생겼습니다.

### 해결: DrawResult 타입 세분화

```typescript
export type DrawResult = "ok" | "skip" | "fail";
// readyState < 2 → "skip" (재시도, 모드 전환 없음)
// sharedGLFailCount >= 3 → "fail" (Canvas2D 전환)
// 정상 렌더링 → "ok"
```

`"skip"`과 `"fail"`을 구분해서, 비디오가 준비 중인 동안은 그냥 다음 프레임을 기다리도록 했습니다.

---

## 다섯 번째 문제: AV1 → H.265 폴백이 안 된다

`<source>` 태그를 AV1 → H.265 순서로 두면 브라우저가 알아서 폴백해줄 거라고 생각했는데, 실제로는 그렇지 않았습니다.

### 브라우저 에러 코드와 폴백 동작

브라우저의 `<source>` 자동 폴백은 에러 코드에 따라 동작이 다릅니다.

- **`MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4)**: 포맷/코덱 자체 미지원 → **자동 폴백 O**
- **`MEDIA_ERR_DECODE` (code 3)**: 포맷은 지원하지만 디코딩 실패 → **자동 폴백 X**

문제는 Android Chrome에서 구형 기기나 특정 환경에서 AV1을 디코딩할 때 code 4가 아닌 **code 3**이 발생한다는 점이었습니다. Chrome 146 이후 Android에서 소프트웨어 AV1 디코딩이 제거되면서, 하드웨어 디코더가 없는 기기에서는 `canPlayType()` 이 `"probably"`를 반환하더라도 실제 재생 시 code 3으로 실패합니다. 브라우저는 code 3을 "지원은 되는데 다른 문제"로 판단해서 다음 `<source>`로 넘어가지 않습니다.

그래서 오류 핸들러에서 직접 폴백 처리를 해야 했습니다.

```typescript
// 기존 코드: currentSrc 체크
if (code === 3 && this.video.currentSrc.includes("av1")) {
  // 에러 발생 시점에 currentSrc가 비어있는 경우가 있어서 미충족
}

// 수정: source 태그 직접 확인
if (code === 3) {
  const av1Source = this.video.querySelector("source[type*='av01']");
  if (av1Source) {
    av1Source.remove();
    this.video.load(); // H.265 소스로 재시도
    return;
  }
  // AV1 소스도 없음 = H.265도 실패 → poster로 전환
  this.onRenderingFailed?.();
}
```

`currentSrc`를 체크하던 기존 코드에는 함정이 있었는데, 에러가 발생하는 시점에 `currentSrc`가 비어있는 경우가 있어서 조건이 충족되지 않는 케이스가 있었습니다. `source[type*='av01']` DOM으로 직접 확인하면 이 문제가 없습니다.

---

## 여섯 번째 문제: Amazon Fire HD 10에서 AV1도 H.265도 안 된다

AV1 폴백 처리를 해놨더니, 이번엔 Amazon Fire HD 10(KFTUWI, 2023, MT8186)에서 AV1도 H.265도 모두 code 3으로 실패하는 기기 리포트가 올라왔습니다.

### 원인: Fire OS의 브라우저 MediaCodec 차단

이 기기는 MT8186 칩을 써서 AV1, H.265 하드웨어 디코더가 내장되어 있고, `canPlayType()`도 `"probably"`를 반환합니다. 그런데 실제 재생을 시도하면 `PIPELINE_ERROR_DECODE`가 발생합니다.

```
MT8186 하드웨어 H.265/AV1 디코더 ✅
         ↓
Fire OS MediaCodec 브라우저 노출 ❌
         ↓
canPlayType() → "probably" (거짓말)
         ↓
실제 재생 시도 → PIPELINE_ERROR_DECODE
```

Fire OS는 Google 인증을 받지 않은 독자적인 Android fork입니다. 삼성, LG 같은 일반 Android는 Google 인증 과정에서 표준 MediaCodec 구현을 보장하지만, Amazon은 Prime Video 등 자체 앱에만 디코더를 열어두고 **브라우저 컨텍스트(`<video>` 태그)에는 제한**을 걸어뒀습니다. `canPlayType()`은 하드웨어 디코더 존재 여부만 체크하고 OS 레벨 노출 여부는 확인하지 않기 때문에 `"probably"`를 반환하는 겁니다.

근본적인 해결은 VP9 소스를 추가하는 건데(Silk 브라우저는 VP9 소프트웨어 디코딩 가능), 백엔드 작업이 필요해서 당장은 **비디오 렌더링이 완전히 실패한 경우 poster 이미지를 보여주는** 방식으로 대응했습니다.

```tsx
// 모든 렌더링 실패 시 정적 이미지로 fallback
const showPoster = poster && (!active || hasRenderingFailed);
```

---

## 일곱 번째 문제: Canvas2D와 WebGL의 색상이 달라 보인다

WebGL이 미지원인 환경에서는 Canvas2D로 Stacked Alpha 합성을 하는 폴백 경로가 있었는데, 이 경로에서 색상이 약간 다르게 보인다는 얘기가 나왔습니다.

Canvas2D 렌더링 코드에 문제가 있나 싶어서 꽤 파봤습니다. `premultipliedAlpha`, `drawingBufferColorSpace: "srgb"`, `unpackColorSpace: "srgb"`, `colorSpace: "srgb"` 같은 옵션들을 이것저것 바꿔봤는데 아무런 효과가 없었습니다.

### 진짜 원인: 코드가 아니라 브라우저 비디오 디코딩 파이프라인

결론적으로, 같은 프레임에서 WebGL과 Canvas2D의 색상 출력은 동일합니다. 색상 차이는 Canvas2D 코드 때문이 아니었습니다.

진짜 원인은 **하드웨어 가속 ON/OFF에 따른 비디오 디코딩 파이프라인의 차이**였습니다.

- **하드웨어 가속 ON**: GPU를 통해 비디오 디코딩 (VideoToolbox, VAAPI 등)
- **하드웨어 가속 OFF**: FFmpeg 기반 CPU 소프트웨어 디코딩

그리고 WebGL이 미지원인 환경은 대부분 하드웨어 가속도 OFF인 환경입니다. 두 경로에서 YUV → RGB 변환 매트릭스나 정밀도가 미세하게 다를 수 있어서, "같은 비디오인데 색이 다르게" 보이는 겁니다. 이건 JavaScript 레벨에서는 아무것도 할 수 없는 영역이었습니다.

---

## 마무리

나중에 다시 생각해보면 각각은 그렇게 어렵지 않은 문제들인데, 캐러셀이라는 컨텍스트에서 여러 플레이어가 공유 자원을 쓰다 보니 예상치 못한 조합으로 터졌습니다.

작업하면서 가장 인상적이었던 건 두 가지였습니다.

하나는 **`canPlayType()`을 믿으면 안 된다**는 거. 하드웨어 디코더가 있다고 OS가 브라우저에 그걸 열어준다는 보장이 없습니다. Amazon Fire OS가 그 사례를 직접 보여줬습니다.

다른 하나는 **WebGL 컨텍스트가 생각보다 훨씬 비싸다**는 거. 생성/파괴를 반복하면 GPU 드라이버 레벨에서 리소스가 조용히 누적되고, 결국 터지는 시점이 옵니다. "컨텍스트를 파괴하면 정리되겠지"라는 가정이 틀렸습니다.

그리고 색상 차이 문제처럼 **코드로 제어할 수 없는 영역이 있다는 걸 빨리 파악하는 것**도 중요했습니다. 원인을 명확히 파악하지 못한 채로 계속 시도했다면 꽤 많은 시간을 낭비했을 겁니다.
