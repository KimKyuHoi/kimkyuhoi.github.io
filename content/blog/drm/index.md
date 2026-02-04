---
title: 'Netflix 화면을 캡처하면 왜 검은 화면이 나올까?'
date: '2026-01-09'
description: '스트리밍 서비스에서 화면 녹화가 안 되는 이유, DRM과 EME/CDM의 동작 원리를 알아봅니다.'
tags: ['DRM', 'EME', 'CDM', 'Widevine', 'FairPlay']
category: '개발'
---

## Netflix 화면을 캡처해본 적 있으신가요?

스트리밍 서비스에서 마음에 드는 장면을 캡처하려고 스크린샷을 찍으면, 이상하게 **검은 화면**만 나옵니다.

<img src="./when_drm.png" alt="DRM 보호 콘텐츠 예시" style="width: 100%; display: block; margin: 0 auto;">
<div class="caption">DRM이 적용된 콘텐츠를 캡처하면 이렇게 검은 화면만 보입니다</div>

처음엔 "버그인가?" 싶었는데, 알고 보니 의도된 동작이었어요. 바로 **DRM(Digital Rights Management)** 때문입니다.

이 글에서는 DRM이 뭔지, 왜 필요한지, 그리고 브라우저에서 어떻게 동작하는지 알아보려고 해요.

## DRM이 뭔가요?

DRM이란 Digital Rights Management의 약자로, 디지털 콘텐츠의 무단 복제와 불법 배포를 방지하기 위한 기술적 보호 조치입니다.

쉽게 말하면 디지털 콘텐츠의 **자물쇠**라고 할 수 있어요. 영화나 드라마 같은 콘텐츠를 만드는 데는 어마어마한 돈이 들어가잖아요. 누군가 이걸 복사해서 무료로 뿌리면 콘텐츠 제작자들은 수익을 얻을 수 없고, 결국 좋은 콘텐츠가 만들어지지 않게 됩니다.

그래서 콘텐츠를 **암호화**하고, 정당하게 돈을 낸 사람만 **복호화해서 볼 수 있게** 만든 거예요.

## 왜 화면 캡처가 안 될까요?

여기서 궁금한 점이 생기죠. "영상은 잘 보이는데, 왜 캡처만 안 되는 거야?"

비밀은 **어디서 복호화하느냐**에 있어요.

DRM은 복호화된 영상 데이터가 **일반 소프트웨어에 절대 노출되지 않도록** 설계되어 있어요. 복호화와 렌더링이 하드웨어 레벨에서 일어나기 때문에, 화면 캡처 프로그램이 접근할 수 있는 메모리에는 원본 영상이 없습니다.

```text
[일반 영상 재생]
영상 데이터 → 메모리 → 화면 렌더링
                ↑
          캡처 프로그램이 여기서 가져감

[DRM 영상 재생]
암호화된 데이터 → CDM(하드웨어) → 직접 화면으로
                        ↑
              캡처 프로그램이 접근 불가!
```

그래서 캡처를 시도하면 검은 화면만 나오는 거예요.

## 주요 DRM 시스템 3가지

현재 웹에서 사용되는 DRM 시스템은 크게 세 가지예요.

### 1. Widevine (Google)

가장 널리 쓰이는 DRM이에요. Chrome, Firefox, Android, 스마트 TV 등에서 사용됩니다.

Widevine의 핵심은 **보안 레벨(L1, L2, L3)** 총 3개의 레벨로 구성되어 있어요. 기기의 하드웨어 보안 수준에 따라 시청 가능한 화질이 달라져요!

#### TEE(Trusted Execution Environment)란?

보안 레벨을 이해하려면 먼저 TEE를 알아야 해요.

TEE는 프로세서 내부의 **격리된 보안 영역**입니다. 일반 운영체제와 완전히 분리된 공간에서 코드가 실행되기 때문에:

- 해커가 OS를 장악해도 TEE 내부 데이터에 접근할 수 없어요
- 하드웨어 고유의 암호화 키가 칩에 내장되어 있어 변조가 거의 불가능해요
- 복호화된 영상이 메모리에 노출되지 않아 캡처가 불가능해요

<img src="./widevine-levels.png" alt="Widevine Security Levels" style="width: 100%; max-width: 400px; display: block; margin: 24px auto;">
<div class="caption">출처: <a href="https://doverunner.com/kr/blogs/how-google-widevine-drm-prevents-hd-and-ultra-hd-video-leakage/">Doverunner - Widevine DRM</a></div>

#### 보안 레벨 비교

|  레벨  |   복호화    |  영상 처리  | 지원 화질  |     대표 기기      |
| :----: | :---------: | :---------: | :--------: | :----------------: |
| **L1** | TEE 내부 ✅ | TEE 내부 ✅ |  4K / HDR  | 스마트폰, 스마트TV |
| **L2** | TEE 내부 ✅ |  TEE 외부   | HD (1080p) |   일부 셋톱박스    |
| **L3** |  TEE 외부   |  TEE 외부   |   SD~HD    |    PC 브라우저     |

---

#### 재미로 보는 넷플릭스 브라우저 지원 차이

실제로 Netflix에서도 브라우저별로 지원하는 최대 해상도가 다릅니다:

<img src="./netflix-windows.png" alt="Netflix Windows 브라우저별 해상도" style="width: 100%; display: block; margin: 0 auto;">
<img src="./netflix-mac.png" alt="Netflix Mac 브라우저별 해상도" style="width: 100%; display: block; margin: 0 auto;">
<div class="caption">출처: <a href="https://help.netflix.com/ko/node/30081">Netflix 고객센터 - 넷플릭스 지원 브라우저 및 시스템 요구 사항</a></div>

> 💡 그래서 같은 Netflix인데 **Chrome에서는 1080p**가 최대이고, **Safari(Mac)나 Edge(Windows)에서는 4K**가 가능해요. 사용하는 DRM 시스템의 보안 레벨이 다르기 때문이죠!

### 2. FairPlay (Apple)

Apple 생태계 전용이에요. Safari, iOS, macOS, Apple TV에서 사용됩니다.

### 3. PlayReady (Microsoft)

Microsoft 생태계에서 사용해요. Edge, Windows, Xbox에서 지원됩니다.

### 브라우저별 지원 현황

| 브라우저 | Widevine | FairPlay | PlayReady |
| :------- | :------: | :------: | :-------: |
| Chrome   |    O     |    -     |     -     |
| Firefox  |    O     |    -     |     -     |
| Safari   |    -     |    O     |     -     |
| Edge     |    O     |    -     |     O     |

그래서 스트리밍 서비스들은 보통 **Widevine + FairPlay**를 함께 지원해요. 이래야 대부분의 브라우저를 커버할 수 있거든요.

## 브라우저는 DRM을 어떻게 처리할까?

여기서부터 조금 기술적인 이야기인데요, 브라우저에서 DRM 영상을 재생하는 구조를 알아볼게요.

### EME: 브라우저와 DRM을 연결하는 다리

**EME(Encrypted Media Extensions)** 는 W3C에서 표준화한 웹 API예요. 브라우저에서 DRM 영상을 재생할 수 있게 해주는 인터페이스입니다.

쉽게 말해서, JavaScript가 "나 이 DRM 영상 틀고 싶어"라고 하면 EME가 브라우저 내부의 DRM 모듈과 대화를 중계해주는 역할을 해요.

### CDM: 실제로 복호화하는 녀석

**CDM(Content Decryption Module)** 은 실제로 암호화된 영상을 복호화하는 모듈이에요. 브라우저에 내장되어 있거나, 운영체제에 포함되어 있습니다.

Chrome에는 Widevine CDM이, Safari에는 FairPlay CDM이 내장되어 있어요.

### 전체 구조를 그림으로 보면

<img src="./eme-architecture.png" alt="EME 아키텍처" style="width: 100%; display: block; margin: 0 auto;">
<div class="caption">출처: <a href="https://w3c.github.io/encrypted-media/">W3C Encrypted Media Extensions Specification</a></div>

복잡해 보이지만, 각 구성요소의 역할을 이해하면 어렵지 않아요.

위 다이어그램의 흐름을 단계별로 살펴볼게요:

1. **CDN → Browser**: 암호화된 영상 스트림 수신
2. **Browser → App**: 암호화 감지, 웹 앱에 이벤트 전달
3. **App → CDM**: DRM 세션 생성
4. **CDM → App**: 라이선스 요청 데이터 생성
5. **App → License Server**: 라이선스 요청
6. **License Server → App**: 인증 확인 후 라이선스 발급
7. **App → CDM**: 라이선스 전달
8. **CDM → 화면**: 복호화 후 GPU로 직접 렌더링

> 💡 **핵심 포인트**: 복호화된 영상은 CDM에서 GPU로 직접 전달돼요. 일반 메모리를 거치지 않기 때문에 캡처 프로그램이 접근할 수 없어요!

## 라이선스 서버, 아무나 만들 수 있을까?

여기서 한 가지 의문이 생길 수 있어요. "그럼 라이선스 서버는 내가 만들면 되는 거 아냐?"

**아니요, 그렇게 간단하지 않아요.** 😅

Widevine 라이선스 서버를 구축하려면 [Google의 공식 Widevine 교육](https://www.widevine.com/training)을 이수하고 인증을 받아야 해요. Google이 승인한 파트너만 라이선스 서버를 구축하고 운영할 수 있습니다.

### 왜 이렇게 까다로울까?

DRM의 핵심은 **복호화 키가 유출되지 않는 것**이에요. 만약 아무나 라이선스 서버를 만들 수 있다면, 보안 허점이 생길 수 있겠죠?

그래서 Google은 Certified Widevine Implementation Partner 프로그램을 운영해요. 인증받은 업체들만 Widevine 솔루션을 구축하고 배포할 수 있습니다.

### DRM 솔루션 제공 업체들

실제로 대부분의 OTT 서비스들은 직접 라이선스 서버를 구축하기보다, 이런 인증된 업체들의 솔루션을 사용해요.

<img src="./cwip-integrators.png" alt="CWIP Integrators List" style="width: 100%; display: block; margin: 0 auto;">
<div class="caption">Google에서 인증한 Widevine 솔루션 제공 업체들 (CWIP Integrators)</div>

Accenture, Alticast, Altimedia 등 다양한 글로벌 업체들이 DRM 솔루션을 제공하고 있어요. 국내에서도 Alticast 같은 업체들이 DRM 솔루션을 제공하고 있습니다.

> 💡 작은 스타트업이 처음부터 DRM을 직접 구현하기보다, 이런 솔루션을 활용하는 게 현실적인 선택이에요.

## 마무리

DRM을 공부하고 오픈소스에 기여하다 보니, 평소 궁금했던 것들이 하나씩 해소되어서 재미있었어요.

- Netflix 화면을 캡처하면 **검은 화면**이 나오는 이유
- MacBook에서 DisplayLink 듀얼 모니터를 쓰면 **OTT가 안 보이는** 이유
- 같은 영상인데 브라우저마다 **화질이 다른** 이유

결국 모두 DRM이 **복호화된 영상을 보호된 경로로만 출력**하기 때문이었어요.

예전엔 "왜 안 되지?" 하고 답답하기만 했는데, 원리를 알고 나니 오히려 "이 정도로 보호하는구나" 싶어서 신기하더라고요. �

> 🔗 **다음 글**: DRM 세션이 예기치 않게 닫히는 상황을 어떻게 처리할까요? [Shaka Player에 PR을 보낸 경험](/shaka-player/)에서 이어집니다!

---

## 관련 링크

- [W3C Encrypted Media Extensions Specification](https://w3c.github.io/encrypted-media/)
- [Google Widevine](https://www.widevine.com/)
- [Apple FairPlay Streaming](https://developer.apple.com/streaming/fps/)
- [MDN: Encrypted Media Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API)
