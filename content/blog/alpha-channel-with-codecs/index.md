---
title: '문제의 원인을 Safari에서 찾으면 대부분 맞다? (feat. Alpha
  Channel)'
date: '2026-02-17'
description: 'GIF의 용량을 줄이기 위해 Alpha Channel을 지원하는 영상 코덱을 찾다가,
  Safari의 문제를 발견하게 된 이야기. 코덱별 Alpha Channel 지원 현황과 브라우저
  호환성을 정리합니다.'
tags: ['Safari', 'Alpha Channel', 'AV1', 'H.265', 'Video Codec']
category: 'Media'
featured: true
---

여러분은 아래의 영상을 보시면 어떻게 보이나요?

<video autoplay loop muted playsinline style="max-width: 480px; width: 100%; display: block; margin: 0 auto;">
  <source src="./alpha-demo.webm" type="video/webm" />
</video>
<div class="caption">Alpha Channel이 적용된 WebM 영상</div>

만약에 제 글을 읽게 되신다면 분명 Safari에서 보시는 분들도 계실 거고 Chrome에서 보실 분도 계실 겁니다.

<img src="./safari-webm.png" alt="Safari WebM Alpha Channel" style="width: 100%; display: block; margin: 0 auto; border-radius: 0;">
분명 Safari에서 보시게 되면 위의 사진처럼 보이게 될 것이구요,

Chrome에서 보시게 되면 아래의 사진처럼 보이게 될 겁니다.

<img src="./chrome-webm.png" alt="Chrome WebM Alpha Channel" style="width: 100%; display: block; margin: 0 auto; border-radius: 0;">

분명 같은 영상을 재생했는데, 배경이 투명하게 나오는 부분과 검은색으로 나오는 부분으로 나뉘게 됩니다. 왜 그럴까요?

## 사건의 발단

최근 회사에서 웹사이트 리뉴얼 작업을 진행하면서, 팀원분께서 페이지에 GIF 영상을 넣게 되었습니다. 그런데 GIF는 용량이 워낙 크다 보니 대안을 찾고 계셨고, 평소 영상 쪽에 관심이 많았던 저도 함께 고민하게 되었습니다.

### 대체 영상을 찾기 위한 조건

여러 가지를 찾다 보니까 애니메이션이 들어간 이미지를 대체하기 위해서는 여러 조건들이 필요했습니다.

1. 파일 용량이 `5MB`를 넘기지 말 것
2. 배경이 투명한 `Alpha` 채널을 지원할 것
3. Safari, Chrome 호환성 내에 문제가 없을 것

## 첫 번째 대안

팀원분께서 처음으로 제안하신 건 `APNG`였습니다. 저는 `APNG`에 대해 들어본 적이 없어 찾아봤는데, 애니메이션과 Alpha Channel을 모두 지원하는 포맷이었습니다.

<img src="./img.gif" alt="APNG가 적용된 토스인증서 페이지" loading="lazy" style="width: 100%; display: block; margin: 0 auto; border-radius: 0;">
<div class="caption">APNG가 적용된 토스인증서 페이지</div>

APNG는 GIF와 비슷한 방식으로 애니메이션을 구현하면서도 기존 PNG와의 하위 호환성을 유지하기 때문에, GIF보다 더 높은 품질을 보여줍니다. 24비트 컬러를 유지하면서 Alpha Channel까지 지원하므로 퀄리티 있는 이미지를 보여주기에는 안성맞춤입니다.

그러나 가장 큰 문제는 용량이었습니다. 저희 페이지에서 캐릭터를 리뉴얼하려면 고퀄리티 이미지가 필요한데, APNG는 용량이 생각보다 컸습니다. 로딩 경험 또한 좋지 않았습니다.

> **Baseline JPEG** - 이미지를 위에서 아래로 한 줄씩 순차적으로 디코딩합니다. 네트워크가 느리면 이미지가 위에서부터 끊기듯 한 줄씩 그려집니다.
>
> **Progressive JPEG** - 처음에 전체 이미지를 흐릿하게 보여준 뒤, 점차 선명해지는 방식입니다. 용량이 다 받아지지 않아도 전체 윤곽을 먼저 확인할 수 있습니다.

Baseline 방식에서는 이미지가 위에서부터 한 줄씩 끊기듯 로드되고, Progressive 방식이라 해도 용량 자체가 크다 보니 흐릿한 상태에서 선명해지기까지 시간이 오래 걸렸습니다. 어느 쪽이든 로딩 경험이 썩 좋지 않았습니다.

## 두 번째 대안

그래서 제가 `AVIF` 포맷을 제안했습니다. 용량도 APNG보다 훨씬 작고, 로딩 경험도 훨씬 좋았습니다. `AVIF`는 AV1 코덱 기반이라 Safari에서도 문제없을 거라고 생각했었구요.

근데 AVIF도 문제가 있었습니다. 직접 ffmpeg으로 애니메이션 AVIF를 만들어서 테스트해봤더니, Alpha Channel을 넣는 순간 브라우저별로 심각한 이슈가 터졌습니다.

- **Safari** - 애니메이션 AVIF의 투명도가 제대로 렌더링되지 않습니다. ([WebKit Bug #275906](https://bugs.webkit.org/show_bug.cgi?id=275906))
- **Chrome** - 애니메이션 + 투명 AVIF에서 성능 이슈가 발생합니다. ([Chromium Issue #349566435](https://issues.chromium.org/issues/349566435))

웃긴 건 Chrome에서는 데스크톱 기준으로 성능 이슈가 크게 체감되진 않았는데, Safari에서는 Alpha Channel 렌더링도 안 되고 성능도 버벅거리면서 문제가 계속 터졌다는 점입니다. 좀 더 찾아보니까:

- AVIF 자체는 지원하지만, 애니메이션 AVIF의 투명도는 제대로 렌더링되지 않습니다.
- 고사양 기기에서도 60fps를 달성하기 어렵고, Android에서는 몇 fps 수준까지 떨어집니다.
- `<img>` 태그로 동작하기 때문에 `<video>` 태그처럼 Progressive Download가 되지 않고, 느린 네트워크에서는 프레임이 뚝뚝 끊깁니다.

<img src="./avif-support.png" alt="Can I Use - AVIF 브라우저 지원 현황" loading="lazy" style="width: 100%; display: block; margin: 0 auto; border-radius: 0;">
<div class="caption">AVIF 브라우저 지원 현황 (출처: Can I Use)</div>

결국 애니메이션 AVIF도 답이 아니었습니다.

## 세 번째 대안

그래서 결국 `<video>` 태그를 쓰자는 얘기가 나왔습니다.

`<video>` 태그는 [Progressive Download](https://en.wikipedia.org/wiki/Progressive_download) 방식으로 동작합니다. 브라우저가 영상 파일을 한 번에 전부 받지 않고 chunk 단위로 나눠 요청하기 때문에, 전체 파일이 다 받아지지 않아도 바로 재생을 시작할 수 있습니다. APNG처럼 이미지가 전부 로드될 때까지 기다릴 필요가 없죠. Alpha Channel을 지원하는 코덱도 다양해서, 투명 배경 영상을 구현하기에 훨씬 적합했습니다.

다만 모든 브라우저가 같은 코덱을 지원하지 않아서, Chrome용과 Safari용 영상을 각각 준비해서 `<source>` 태그로 분기하는 방식을 택했습니다.

- **Chrome/Firefox** - WebM 컨테이너 + VP9 코덱
- **Safari** - MOV 컨테이너 + HEVC(H.265) 코덱

```html
<video autoplay loop muted playsinline>
  <source src="sample.mov" type="video/quicktime" />
  <source src="sample.webm" type="video/webm" />
</video>
```

<video autoplay loop muted playsinline preload="none" style="max-width: 480px; width: 100%; display: block; margin: 0 auto;">
  <source src="./alpha-demo.mov" type="video/quicktime" />
  <source src="./alpha-demo.webm" type="video/webm" />
</video>
<div class="caption">Safari는 MOV(HEVC), Chrome/Firefox는 WebM(VP9)으로 재생됩니다</div>

브라우저는 `<source>` 태그를 위에서부터 순서대로 확인하며, 자신이 재생할 수 있는 첫 번째 포맷을 선택합니다. Safari는 `.mov`(HEVC)를 재생하고, Chrome/Firefox는 `.mov`를 지원하지 않으므로 `.webm`(VP9)으로 fallback됩니다.

## 더 좋은 대안이 없을까?

VP9 + HEVC 조합으로 문제를 해결하긴 했지만, 솔직히 찝찝한 부분이 남아 있었습니다. Chrome용 WebM과 Safari용 MOV, 같은 영상을 두 벌이나 준비해야 하고, 용량도 가볍다고 하기엔 애매했습니다.

그러던 중 [Jake Archibald의 글](https://jakearchibald.com/2024/video-with-transparency/)을 발견했는데, 이 분도 저와 똑같은 고민을 하고 있었습니다. 그리고 꽤 기발한 해결책을 제시하고 있었습니다.

### 영상을 세로로 쌓기

핵심 아이디어는 영상을 두 배 높이로 만들어서, **윗쪽 절반은 원본 컬러**, **아랫쪽 절반은 Alpha Channel을 밝기로 표현한 흑백 영상**으로 구성하는 것입니다. 그리고 WebGL fragment shader로 아랫쪽 절반을 윗쪽에 마스크로 씌우면 투명도가 적용됩니다.

<img src="./video-solution.png" alt="Stacked Alpha Video 방식으로 투명 영상을 적용한 예시" loading="lazy" style="width: 100%; display: block; margin: 0 auto; border-radius: 0;">
<div class="caption">Stacked Alpha Video 방식으로 투명 영상을 적용한 예시 (출처: Jake Archibald)</div>

이 방식의 장점이 꽤 놀라웠는데요.

- AV1 자체는 Alpha Channel을 지원하지 않지만, alpha를 별도 영역으로 분리했기 때문에 그냥 일반 영상으로 인코딩할 수 있습니다.
- VP9 + HEVC 조합이 1.1MB + 3.4MB였던 것에 비해, AV1 stacked 방식은 **460KB** 하나로 해결됩니다.
- AV1을 지원하지 않는 구형 Apple 기기에는 HEVC fallback(1.14MB)을 제공하면 되는데, 이것도 기존 3.4MB보다 훨씬 작습니다. 저희는 애초에 구형 브라우저를 신경 쓸 필요가 없었기 때문에 꽤 이상적이었습니다.

다만 이 방식은 WebGL을 사용하기 때문에 **JavaScript가 필수**라는 단점이 있습니다. Jake Archibald는 이를 [`<stacked-alpha-video>`](https://www.npmjs.com/package/stacked-alpha-video)라는 Web Component로 만들어 NPM에 공개해두었습니다.

```html
<stacked-alpha-video>
  <video autoplay crossorigin muted playsinline loop>
    <source src="av1.mp4" type="video/mp4; codecs=av01.0.08M.08.0.110.01.01.01.1" />
    <source src="hevc.mp4" type="video/mp4; codecs=hvc1.1.6.H120.b0" />
  </video>
</stacked-alpha-video>
```

## 더 좋은 건 알겠는데 그럼에도 결국에는 세 번째 대안을 선택하게 된 이유

Stacked Alpha Video가 기술적으로 더 낫다는 건 확실했지만, 결국 저희 팀은 VP9 + HEVC 조합을 그대로 가져갔습니다.

일단 **리뉴얼 일정이 빠듯했습니다.** WebGL 기반의 새로운 방식을 도입하고 검증할 시간적 여유가 없었어요. 거기다 이 영상 작업은 **제가 직접 맡은 영역이 아니었습니다.** 팀원분이 담당하고 계셨고, 저는 옆에서 같이 고민하는 입장이었기 때문에 제가 주도적으로 새로운 기술을 밀어붙이기엔 좀 그랬습니다. 저도 **맡은 다른 기능 구현이 밀려 있는 상태**였구요.

그리고 사실 **VP9 + HEVC만으로도 GIF 대비 5MB 이상 줄일 수 있었습니다.** 처음에 목표했던 "5MB 이하"를 이미 만족하고 있었고, 로딩 경험도 GIF나 APNG 때와는 비교가 안 될 정도로 나아진 상태였거든요.

영상을 두 벌로 관리해야 한다는 게 개인적으로 아쉽긴 했지만, 이것저것 따져보니까 **지금 상황에서는 오버엔지니어링**이라는 결론이었습니다. 이미 충분히 목표를 달성하고 있는데 굳이 복잡도를 높일 이유가 없었습니다.

> **직접 체험해보기** — 글로만 보면 감이 잘 안 올 수 있습니다. 아쉬운 김에 직접 만들어봤는데, AV1 하나로 460KB짜리 투명 영상이 어떻게 재생되는지 [Playground](/playground/stacked-alpha-video/)에서 직접 확인해보세요.

## 정리하며

이번에 작업하면서 다시 한 번 느꼈는데, Safari는 진짜 프론트엔드 개발자한테 너무한 브라우저인 것 같습니다. 다른 브라우저에서 멀쩡하게 돌아가는 게 Safari에서만 안 되는 경우가 한두 번이 아니었거든요. 애니메이션 AVIF의 Alpha Channel이 안 되는 것도, WebM을 아예 지원 안 하는 것도 전부 Safari였습니다.

그리고 APNG부터 AVIF, Video 태그, Stacked Alpha Video까지 하나씩 검토해보면서 느낀 건, 결국 기술적으로 가장 좋은 게 항상 정답은 아니라는 점이었습니다. 일정, 담당 범위, 팀 상황 같은 현실적인 요소들까지 다 고려해야 하고, 그 안에서 균형점을 찾는 게 실무에서의 기술 선택이라는 걸 다시금 느꼈습니다.

## Reference

- [Alpha transparency in Chrome video](https://developer.chrome.com/blog/alpha-transparency-in-chrome-video?hl=ko)
- [Video with transparency - Jake Archibald](https://jakearchibald.com/2024/video-with-transparency/)
- [stacked-alpha-video - NPM](https://www.npmjs.com/package/stacked-alpha-video)
- [WebKit Bug #275906 - Animated AVIF Alpha Channel](https://bugs.webkit.org/show_bug.cgi?id=275906)
- [Chromium Issue #349566435 - Animated AVIF Performance](https://issues.chromium.org/issues/349566435)
- [Progressive Download - Wikipedia](https://en.wikipedia.org/wiki/Progressive_download)
