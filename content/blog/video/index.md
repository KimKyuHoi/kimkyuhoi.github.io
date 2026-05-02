---
title: '우리는 왜 스트리밍 플레이어를 사용할까?'
date: '2026-04-28'
description: 'Streaming 플레이어를 쓰는 이유에 대해서 알아보고 MSE까지의 흐름을 따라가봅니다.'
tags: ['video', 'HLS', 'DASH', 'MSE', 'DRM', 'Media']
category: 'Media'
featured: true
---

> **🙋 누구를 위한 글인가요?**
>
> 이런 분들에게 도움이 될 것 같습니다.
>
> - HTML `<video>` 태그를 한두 번 써봤지만, 그 뒤에서 일어나는 일은 잘 모르는 분
> - 영상을 띄워봤더니 **왜 자꾸 끊기지, 화질은 어떻게 자동으로 바뀌는 거지** 같은 의문이 생겼던 분
> - 회사에서 갑자기 웹 플레이어를 맡게 된 프론트엔드 개발자
> - shaka-player, hls.js, video.js 같은 이름은 들어봤는데 **이게 정확히 뭘 해주는지** 헷갈리는 분
> - OTT/유튜브가 끊김 없이 영상을 보여주는 원리가 평소에 궁금했던 분

우리는 퇴근이나 공부를 하고, 저녁에 오게 되면 늘 유튜브나 OTT플랫폼 서비스를 켭니다. 아 물론 교육 플랫폼을 통해 강의를 듣기도 합니다.
그만큼 저희 일상에서는 미디어가 일상화가 되어있습니다.
개발자인 저희는 그런 미디어를 구현하기 위해서 HTML파일 내부에서는 video 태그를 사용하여 비디오를 구현하고 있습니다. 근데 과연 비디오 태그만 있으면 우리가 원하는 스트리밍 서비스를 구현할 수 있을까요? 결론부터 말하면 아닙니다. 왜 그럴까요?
만약 충분하다면 왜 그 video 태그 하나 때문에 넷플릭스나 티빙 등 수많은 개발자들이 그 video 태그 하나에 매달리게 되는 걸까요?

이번 글에서는 단순한 `<video>` 태그가 왜 충분하지 않은지, 그리고 우리가 흔히 쓰는 스트리밍 플레이어가 도대체 뒤에서 무엇을 해주고 있는지를 차근차근 따라가보려고 합니다.

## `<video src="movie.mp4">`의 한계

### `<video>` 태그와 Progressive download

기본적으로 `<video>` 태그는 progressive download라는 방식으로 영상을 받아 재생합니다.

> **Progressive download란?**
>
> HTTP로 파일을 받는 동시에 재생을 시작하는 방식입니다. 전체 파일이 도착할 때까지 기다리지 않고, 앞부분(헤더 + 초반 미디어 데이터)이 도착하는 순간 바로 재생이 시작됩니다. 핵심은 [HTTP Range 요청](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) — 파일을 통째로 받는 게 아니라 앞에서 N바이트만 부분적으로 요청하는 메커니즘입니다.

`<video src="movie.mp4">` 한 줄로 영상이 척척 재생되는 것도 사실 이 progressive download 덕분입니다. mp4 파일 끝까지 받지 않아도, 앞쪽 메타데이터(`moov` atom — 어디에 어떤 프레임이 있는지를 적어둔 목차)와 초반 데이터만 도착하면 브라우저는 곧바로 화면에 영상을 띄워줍니다.

#### 그럼 다운로드 끝날 때까지 브라우저 탭이 계속 로딩 중이겠네?

직관적으론 그럴 것 같지만, 실제로는 그렇지 않습니다. `<video>`의 미디어 다운로드는 페이지의 `load` 이벤트와 분리되어 있고, `preload` 속성 기본값(`metadata`) 덕분에 페이지 로드 시점엔 헤더 정도만 받고 끝납니다. 본격적인 다운로드는 사용자가 재생 버튼을 누른 다음 백그라운드로 일어납니다.

#### 그럼 `<video>` 태그로 충분할까요?

여기까지만 보면 그냥 mp4 잘 만들어서 올리면 끝 아닌가 싶지만, 실제 서비스에선 progressive download만으로는 한계가 명확합니다.

- **화질이 하나로 고정됩니다**: 5G 환경의 사용자도, 지하철에서 LTE가 약해진 사용자도 같은 파일을 받아야 합니다.
- **시킹이 비효율적입니다**: 30분짜리 영상을 5분만 보다가 끝으로 점프하면, 그동안 미리 받아둔 데이터는 통째로 버려집니다.
- **라이브 방송에 적합하지 않습니다**: 끝이 정해진 단일 파일 구조라 실시간 송출에는 부적합합니다.
- **DRM 적용이 까다롭습니다**: 단일 mp4 파일에 라이선스 절차나 청크 단위 암호화를 끼워 넣기 어렵습니다.

### `<video>`만으로 스트리밍 플레이어를 만든다면?

한번 예시로 순수 `<video>` 태그의 문제점을 짚어보겠습니다. 1280×720 해상도, 24비트 컬러, 30fps의 1초짜리 원본 영상을 가정해보겠습니다.

```text
1280 × 720 × 3 bytes × 30 frames = 82,944,000 bytes ≈ 약 83 MB / 초 ≈ 약 664 Mbps
```

위 계산을 그대로 하면 무압축 원본 영상의 **비트레이트는 약 664Mbps**에 달하고, 이걸 2시간짜리 영화로 환산하면 약 597GB가 됩니다. 순수 2시간짜리 영상을 원본 무압축으로 video 태그를 통해 본다면 무제한 요금제를 쓰지 않는 이상 휴대폰 데이터는 바닥납니다. 이걸 그대로 보낼 수는 없으니 H.264, H.265, AV1 같은 코덱으로 압축해서 내려보냅니다.

> 비트레이트는 1초 동안의 영상에 얼마만큼의 데이터가 담기는지를 나타내는 값으로, 보통 `bps(bits per second)` 단위로 표기합니다. 예를 들어 4Mbps라면 1초에 약 4메가비트, 즉 0.5MB 정도의 데이터를 쓴다는 의미입니다. 비트레이트가 높을수록 같은 해상도라도 더 많은 디테일을 담을 수 있어 화질이 좋아지지만, 그만큼 파일 크기와 네트워크 대역폭도 함께 커집니다. 영상 압축에서 화질 ↔ 용량의 균형을 결정하는 가장 핵심적인 지표가 바로 비트레이트라는 뜻입니다.

업계에서 권장하는 720p 비트레이트는 출처에 따라 조금씩 다른데, 대체로 2~6Mbps 범위에서 정해집니다.

|                                                                       출처                                                                       |    720p 권장 비트레이트    |
| :----------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------: |
|                      [AWS Elemental MediaConvert](https://docs.aws.amazon.com/mediaconvert/latest/ug/qvbr-guidelines.html)                       | 2 Mbps / 4 Mbps (QVBR 7~8) |
| [Apple HLS Authoring Specification](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices) |    약 3 Mbps / 4.5 Mbps    |
|                         [YouTube Live Encoder Settings (720p, 60fps)](https://support.google.com/youtube/answer/2853702)                         |           6 Mbps           |

대략 중간값에 해당하는 약 4Mbps로 압축한다고 가정하면 2시간 영화는 약 3.6GB, 가장 낮은 2Mbps 기준이라도 2시간이면 약 1.8GB입니다. 압축 효율이 아무리 좋아져도, 단일 화질 파일 하나로 모든 사용자를 커버하는 건 불가능에 가깝습니다.

- 5G 환경의 사용자에겐 720p가 너무 낮을 수 있고
- 지하철에서 LTE가 약해진 사용자에겐 720p가 너무 무거울 수 있고
- 모바일 데이터를 아끼고 싶은 사용자에겐 360p로 충분합니다.

결국 화질을 하나로 고정한다는 건 누군가에겐 버퍼링을, 누군가에겐 데이터 낭비를 떠넘기게 됩니다.

## 그래서 어떤 구조가 필요했을까?

앞서 짚은 한계들을 풀려면 영상은 결국 여러 화질로 미리 인코딩되어야 하고, 짧은 단위로 잘려 있어야 하며, 각 청크는 암호화가 가능한 형태여야 합니다. 그리고 클라이언트에는 어떤 화질이 어디에 있는지를 적어둔 목록이 가장 먼저 도착해야 합니다.

이 요구사항들을 한 번에 표현하기 위해 등장한 것이 바로 manifest + segment 구조의 스트리밍 프로토콜인 HLS와 DASH입니다.

> 화질을 자동으로 어떻게 바꾸는지(ABR)는 [유튜브에서 자동 화질을 선택할 때 생각보다 복잡한 이유](/abr/) 글에서, 청크가 어떻게 암호화/복호화되는지(DRM)는 [Netflix 화면을 캡처하면 왜 검은 화면이 나올까?](/drm/) 글에서 찾아보실 수 있습니다 :)

## 스트리밍의 양대 산맥: HLS와 DASH

### HLS — 텍스트 플레이리스트를 여러 파일로 표현

HLS(HTTP Live Streaming)는 Apple이 만든 프로토콜로, manifest를 텍스트 플레이리스트(`.m3u8`)로 표현합니다. 그리고 이 플레이리스트를 계층 구조로 쪼개서 사용합니다.

![HLS 계층 구조](./hls.png 'master.m3u8 → 화질별 media playlist → 세그먼트로 이어지는 HLS의 계층 구조')

- **Master playlist**: 사용 가능한 화질 목록 (각 화질별 media playlist URL)
- **Media playlist**: 한 화질의 세그먼트 목록
- **Segment**: `.ts` 또는 `.m4s` 실제 미디어 파일

그래서 HLS는 Master playlist → Media playlist → Segment 순서로 차례차례 로드해서 화면에 보여주게 됩니다. 각 단계가 어떻게 생겼는지 한 번 까보겠습니다.

#### Master playlist — 화질 목록

클라이언트가 가장 먼저 받는 파일이 master playlist입니다. 사용 가능한 화질 변형(variant)들이 `#EXT-X-STREAM-INF` 태그로 나열되어 있습니다.

```text
#EXTM3U
#EXT-X-VERSION:6

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42e01e,mp4a.40.2"
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p.m3u8
```

각 변형에 붙는 핵심 속성은 다음과 같습니다.

- `BANDWIDTH`: 그 화질의 최대 비트레이트(bps). 플레이어가 ABR로 화질을 고를 때 가장 먼저 보는 값입니다.
- `RESOLUTION`: 가로 × 세로 픽셀
- `CODECS`: 어떤 비디오/오디오 코덱이 쓰였는지 (예: `avc1.4d401f` = H.264 Main 3.1, `mp4a.40.2` = AAC-LC)

#### Media playlist — 한 화질의 세그먼트 목록

플레이어가 이 화질로 보겠다고 결정하면, 해당 변형의 media playlist를 받아와서 실제 세그먼트를 순차적으로 다운로드합니다.

```text
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:6.0,
seg_001.ts
#EXTINF:6.0,
seg_002.ts
#EXTINF:6.0,
seg_003.ts
...
#EXT-X-ENDLIST
```

- `#EXT-X-TARGETDURATION`: 세그먼트 한 조각의 최대 길이(초)
- `#EXT-X-MEDIA-SEQUENCE`: 첫 세그먼트의 일련번호. 라이브에서 윈도우가 앞으로 밀릴 때 이 값이 증가합니다.
- `#EXT-X-PLAYLIST-TYPE`: `VOD`이면 끝이 정해진 영상, 라이브는 이 태그가 없거나 `EVENT`
- `#EXTINF`: 바로 아래에 적힌 세그먼트의 정확한 재생 시간(초)
- `#EXT-X-ENDLIST`: 더 이상 세그먼트가 없다는 표시. VOD에만 등장합니다.

라이브 방송이라면 `#EXT-X-ENDLIST`가 없고, 서버는 시간이 지날 때마다 새 세그먼트를 추가하면서 오래된 세그먼트를 윈도우에서 빼냅니다. 플레이어는 주기적으로(보통 `TARGETDURATION` 절반 주기) media playlist를 다시 받아 갱신된 목록을 따라갑니다.

#### Segment — `.ts`와 `.m4s` (CMAF)

실제 미디어 데이터를 담는 컨테이너는 두 가지가 있습니다.

- `.ts` (MPEG-2 Transport Stream): 전통적인 HLS 포맷. 호환성은 가장 넓지만 컨테이너 오버헤드가 큽니다.
- `.m4s` (fMP4 / CMAF): HLS와 DASH가 같은 세그먼트를 공유할 수 있도록 [ISO/IEC 23000-19](https://www.iso.org/standard/79106.html)로 표준화된 포맷입니다. CMAF의 주요 설계 목적 자체가 한 번 패키징된 미디어로 HLS·DASH를 모두 커버하는 것이고, [CTA(Consumer Technology Association)의 CMAF 페이지](https://www.cta.tech/cmaf/)에도 같은 방향이 명시되어 있습니다.

실제 HLS manifest는 그냥 텍스트라서 `curl` 한 줄로 까볼 수 있습니다. 참고로 아래 URL은 테스트용으로 공개해둔 샘플 스트림입니다.

```bash
curl https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
```

위에서 봤던 `#EXTM3U`, `#EXT-X-STREAM-INF` 태그가 그대로 등장합니다. Safari/iOS라면 같은 URL을 주소창에 붙여 넣어도 바로 재생되고, 다른 브라우저에서 재생하고 싶다면 [hls.js 데모](https://hlsjs.video-dev.org/demo/)나 [Shaka Player 데모](https://shaka-player-demo.appspot.com/)에 URL만 넣어주면 됩니다.

`.m4s`(fMP4)를 쓰는 HLS도 같은 방식으로 까볼 수 있습니다.

```bash
curl https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8
```

### DASH — XML 하나에 계층을 중첩해서 표현

DASH(Dynamic Adaptive Streaming over HTTP)는 표준화 단체에서 만든 오픈 프로토콜로, manifest를 **하나의 XML 파일(`.mpd`)** 에 모두 담습니다. HLS가 텍스트 플레이리스트를 여러 파일로 쪼개서 표현했다면, DASH는 같은 정보를 한 XML 트리에 중첩시켜 표현합니다.

![DASH 계층 구조](./dash.png 'MPD → Period → AdaptationSet → Representation → Segment로 이어지는 DASH의 XML 트리 구조')

- **MPD**: 전체 프레젠테이션
- **Period**: 시간 구간 (광고 삽입 등에 유용)
- **AdaptationSet**: 비디오/오디오/자막 그룹, 언어별 오디오 등
- **Representation**: 화질·비트레이트 변형
- **Segment**: `.m4s` 실제 미디어 파일

#### DASH는 어떻게 동작하나요?

이름 그대로 **H**TTP로 굴러간다는 게 핵심입니다. 별도의 미디어 서버(RTSP, RTMP 등) 없이, 일반 웹 서버나 CDN이면 어디서든 DASH 스트림을 호스팅할 수 있습니다. 즉 평소에 쓰는 HTTP 기반 인프라(방화벽, 프록시, CDN 캐시)를 그대로 활용할 수 있다는 뜻입니다.

전체 흐름을 단계로 나누면 다음과 같습니다.

1. **인코딩** — 원본 영상을 여러 비트레이트(360p / 720p / 1080p ...)로 트랜스코딩하고, 각각을 짧은 청크(`.m4s`)로 분할합니다.
2. **MPD 생성** — 어떤 화질이 어디에 있는지를 적은 XML manifest를 만들어 함께 배포합니다.
3. **클라이언트 시작** — 플레이어는 가장 먼저 `.mpd`를 받아서 파싱합니다.
4. **ABR 판단** — 현재 네트워크 / 버퍼 상태를 보고 가장 적당한 화질을 고릅니다.
5. **세그먼트 다운로드 + 재생** — 해당 화질의 세그먼트를 순차적으로 받아 `<video>`에 흘려 넣습니다. 이때 MSE를 사용합니다.
6. **상황 변화 시 갈아끼움** — 네트워크가 나빠지거나 좋아지면 다음 세그먼트부터 자연스럽게 다른 화질로 전환합니다.

#### 코덱 독립성 — DASH의 큰 강점

DASH의 또 하나 중요한 특징은 **표준 자체가 코덱을 가리지 않는다**는 점입니다. HLS와 비교하면 차이가 분명합니다.

| 프로토콜 | 주로 지원하는 코덱                                         |
| :------: | :--------------------------------------------------------- |
|   HLS    | H.264 / HEVC / AAC 위주 (Apple 호환성 제약이 큼)           |
|   DASH   | H.264, H.265(HEVC), VP9, AV1, AAC, Opus — 사실상 모두 가능 |

이게 왜 중요할까요? 새로 등장한 효율 좋은 코덱(AV1, VP9)은 같은 화질을 더 적은 비트레이트로 인코딩할 수 있어 CDN 비용이 줄어듭니다. DASH는 표준이 코덱을 가리지 않으니 새 코덱을 빠르게 도입할 수 있는 반면, HLS는 Apple 생태계 호환성에 묶이는 경우가 많습니다.

이제 각 계층이 실제로 어떻게 생겼는지 하나씩 까보겠습니다.

#### MPD — 전체 프레젠테이션

`<MPD>` 루트는 영상 하나의 전체 정의를 담는 컨테이너입니다. VOD인지 라이브인지(`type`), 총 재생 길이(`mediaPresentationDuration`), 최소 버퍼 크기(`minBufferTime`) 같은 메타데이터가 여기 붙습니다.

```xml
<MPD type="static"
     mediaPresentationDuration="PT2H10M"
     minBufferTime="PT4S"
     profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
  ...
</MPD>
```

- `type="static"`: VOD(정해진 길이의 영상)
- `type="dynamic"`: 라이브 방송
- `PT2H10M`: ISO 8601 duration 표기로 2시간 10분이라는 뜻입니다.
- `profiles`: 어떤 DASH 프로필을 따르는지. on-demand / live 등 몇 가지가 있습니다.

#### Period — 시간 구간

하나의 `<Period>`는 영상의 한 시간 구간입니다. 일반 영화는 보통 Period 하나만 있지만, 광고 삽입(ad-insertion)에서는 본편 → 광고 → 본편 식으로 Period를 여러 개 두는 게 핵심 활용 사례입니다. HLS에는 없는 DASH 고유의 강점이기도 합니다.

```xml
<Period start="PT0S"  duration="PT30M">     <!-- 본편 1부 -->
<Period start="PT30M" duration="PT2M">      <!-- 광고 -->
<Period start="PT32M" duration="PT60M">     <!-- 본편 2부 -->
```

플레이어는 Period가 바뀔 때마다 새로운 인코딩 정보(코덱, 해상도, DRM 키 등)를 다시 읽어들이기 때문에, 본편과 광고가 서로 다른 인코더로 만들어져 있어도 매끄럽게 이어붙일 수 있습니다.

#### AdaptationSet — 같은 종류 트랙의 그룹

`<AdaptationSet>`은 서로 대체 가능한 변형들을 한 그룹으로 묶습니다. 가장 흔한 분류는 비디오 / 오디오 / 자막인데, 같은 종류라도 언어별로 나눌 수 있습니다.

```xml
<AdaptationSet contentType="video" mimeType="video/mp4">
  <!-- 같은 영상의 여러 화질 -->
</AdaptationSet>
<AdaptationSet contentType="audio" lang="ko">
  <!-- 한국어 오디오 -->
</AdaptationSet>
<AdaptationSet contentType="audio" lang="en">
  <!-- 영어 더빙 -->
</AdaptationSet>
<AdaptationSet contentType="text" lang="ko">
  <!-- 한국어 자막 -->
</AdaptationSet>
```

플레이어는 사용자가 선택한 언어·화질에 따라 어떤 AdaptationSet을 활성화할지 정합니다. 넷플릭스에서 오디오 트랙·자막 트랙을 따로따로 고를 수 있는 이유가 여기에 있습니다. 각각이 별도의 AdaptationSet으로 독립되어 있기 때문입니다.

#### Representation — 화질·비트레이트 변형

`<Representation>`은 한 AdaptationSet 안에서 실제 인코딩된 변형 하나입니다. HLS master playlist의 variant와 정확히 같은 역할입니다.

```xml
<AdaptationSet contentType="video">
  <Representation id="360p"  bandwidth="500000"  width="640"  height="360"  codecs="avc1.42c01e" />
  <Representation id="720p"  bandwidth="2500000" width="1280" height="720"  codecs="avc1.4d401f" />
  <Representation id="1080p" bandwidth="5000000" width="1920" height="1080" codecs="avc1.640028" />
</AdaptationSet>
```

ABR로 화질을 선택할 때 플레이어가 가장 먼저 보는 게 `bandwidth`입니다. HLS의 `BANDWIDTH` 속성과 정확히 같은 의도입니다.

#### SegmentTemplate — 세그먼트 위치 표현

DASH에서 가장 헷갈리는 부분이 세그먼트 URL을 어떻게 표현하느냐입니다. 2시간짜리 영화를 6초 단위로 자르면 1200개가 넘는데, 이걸 일일이 나열하면 MPD가 수 메가바이트가 됩니다. 그래서 `<SegmentTemplate>`으로 패턴만 적어두는 방식이 자주 쓰입니다.

```xml
<Representation id="720p" bandwidth="2500000">
  <SegmentTemplate
    initialization="init-$RepresentationID$.m4s"
    media="seg-$RepresentationID$-$Number$.m4s"
    startNumber="1"
    duration="6"
    timescale="1"
  />
</Representation>
```

- `$RepresentationID$`, `$Number$`는 변수입니다. 위 예시는 `seg-720p-1.m4s`, `seg-720p-2.m4s`, ... 로 확장됩니다.
- `initialization`: 디코더 초기화에 필요한 fMP4 헤더 파일
- `duration` / `timescale`: 세그먼트 한 조각의 길이

DASH manifest도 그냥 XML이라 `curl`로 까볼 수 있습니다. Akamai가 공개한 Big Buck Bunny 테스트 스트림이 대표적입니다.

```bash
curl https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd
```

위에서 본 `<MPD>`, `<Period>`, `<AdaptationSet>`, `<Representation>`, `<SegmentTemplate>` 태그가 그대로 등장합니다.

> 유튜브를 켜고 개발자 도구 → Network 탭에서 `.mpd`나 `.m3u8`을 검색해보면 이 manifest 파일이 가장 먼저 다운로드되는 걸 직접 확인할 수 있습니다.

## 그런데 브라우저는 manifest를 못 읽는다

여기서 중요한 사실 하나. 일반 `<video>` 태그는 완성된 파일 포맷(`mp4`,`webm`)을 제외하고는 `.m3u8`도, `.mpd`도 직접 재생하지 못합니다.

예외가 있다면 Safari/iOS 정도입니다. 이쪽은 HLS를 네이티브로 지원해서 다음과 같이 써도 잘 동작합니다.

```html
<!-- Safari/iOS에서만 OK -->
<video src="https://example.com/master.m3u8"></video>
```

하지만 Chrome, Firefox, Edge, Opera, Samsung Internet 등에서는요? 누군가 중간에서 manifest를 해석하고, 청크를 직접 받아서, `<video>`에 적절한 형태로 넣어줘야 합니다. 그 누군가가 바로 JavaScript이고, JS에 영상 데이터를 받을 수 있는 통로를 열어주는 Web API가 MSE(Media Source Extensions)입니다.

## Media Source Extensions(MSE)

MSE([Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API))란 `<video>` 태그를 빈 통으로 만들고, JS가 fetch한 미디어 청크를 그 통에 직접 부어주는 Web API입니다. 기존 `<video src="movie.mp4">`는 브라우저가 src URL에서 알아서 파일을 받아와 재생하는 식이었습니다. MSE는 src 자리에 JS가 만든 가상 미디어 객체를 꽂아서, 어떤 데이터를 어떤 순서로 보낼지를 JS가 결정할 수 있게 해줍니다.

### 핵심 객체 두 가지

|      객체      | 역할                                                                      |
| :------------: | :------------------------------------------------------------------------ |
| `MediaSource`  | 미디어 데이터를 담을 빈 통. `<video>`의 `src`에 연결되는 가상 객체입니다. |
| `SourceBuffer` | 통 안에 만들어지는 실제 버퍼. 비디오·오디오 트랙별로 하나씩 만듭니다.     |

비디오와 오디오를 따로 받고 싶다면 `SourceBuffer`를 두 개 만들어 각각 다른 청크를 부어주면 됩니다.

### 동작 흐름

실제 HLS m3u8 URL이 들어왔을 때, MSE가 어떻게 그 데이터를 `<video>`까지 흘려보내는지 흐름을 따라가보겠습니다.

![MSE 동작 흐름](./MSE.png 'm3u8 파싱 → MediaSource 연결 → 코덱 체크 → SourceBuffer 생성 → 세그먼트 주입으로 이어지는 MSE 동작 흐름')

1. **manifest 파싱** — m3u8을 받아 화질·코덱 정보(예: `avc1.4d401f`, `mp4a.40.2`)를 추출합니다. 이 단계는 그냥 텍스트 파싱이라 MSE는 아직 등장하지 않습니다.
2. **MediaSource를 `<video>`에 연결** — `new MediaSource()`로 빈 통을 만들고, `URL.createObjectURL()`로 이 통을 가리키는 가상 URL을 만들어 `<video>.src`에 꽂습니다. 통이 준비되면 `MediaSource.readyState`가 `closed`에서 `open`으로 바뀌고 `sourceopen` 이벤트가 발사됩니다.
3. **코덱 지원 체크** — `MediaSource.isTypeSupported(mimeCodec)`로 브라우저가 해당 코덱을 디코딩할 수 있는지 먼저 확인합니다. `false`라면 다른 변형으로 폴백하거나 에러를 띄워야 하고, 이걸 빼먹으면 다음 단계에서 곧바로 예외가 납니다.
4. **SourceBuffer 생성** — `addSourceBuffer(mimeCodec)`로 통 안에 실제 버퍼를 만듭니다. 이 시점에 브라우저는 디코더를 미리 셋업해둡니다. 비디오와 오디오를 분리해서 다루고 싶다면 두 개를 만들면 됩니다.
5. **세그먼트 fetch → appendBuffer** — 세그먼트를 `arrayBuffer`로 받아 `sb.appendBuffer(buf)`로 통에 붓습니다. 그 순간부터 `<video>`가 디코딩·재생을 시작합니다. 단 `appendBuffer`는 비동기라 `sb.updating === false`가 될 때까지 다음 호출을 보류해야 합니다.
6. **화질 변경** — ABR로 다른 화질로 갈아탈 때 새 `<video>`나 새 `MediaSource`를 만들 필요는 없습니다. 같은 SourceBuffer에 다른 화질의 세그먼트를 이어 붙이면 됩니다(코덱이 같은 경우). 코덱이 바뀌면 `SourceBuffer.changeType()`을 따로 호출합니다.

### 직접 동작시켜 보기

지금까지 따라온 6단계 흐름을 React + 순수 MSE로 그대로 옮겨놓은 미니 플레이어입니다. 비디오가 재생되는 동안 각 단계가 로그 패널에 단계별로 찍힙니다.

<iframe
  src="/playground/mse-mini-player?embed=1&preset=shaka-bbb-hls"
  style="width:100%; height:620px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;"
  title="MSE 미니 플레이어"
  loading="lazy"
></iframe>

> 자세한 내용은 [Playground / MSE 미니 플레이어](/playground/mse-mini-player) 페이지에서 직접 확인해볼 수 있습니다.

### 그러면 직접 짜서 개발하죠?

위 흐름만 보면 fetch + appendBuffer 반복이라 단순해 보이지만, 막상 만들기 시작하면 다음과 같은 주제들이 줄줄이 따라옵니다.

> **트랜스먹싱(transmuxing)이란?** 미디어 데이터의 _내용_(코덱·프레임·샘플)은 그대로 두고, *컨테이너 포맷*만 다른 형태로 다시 포장하는 작업입니다. 예: `.ts`(MPEG-2 Transport Stream) → fMP4. 디코딩이나 재인코딩(transcoding)과는 달리 화질 손실이 없습니다. CPU 비용도 트랜스코딩보다 훨씬 낮아요 — 박스 구조만 다시 만들면 되니까요.

- **fragmented MP4 / init segment 처리** — 일반 MP4는 그대로 부을 수 없고, 첫 조각으로 init segment부터 따로 넣어줘야 한다는 사실
- **HLS `.ts` 트랜스먹싱** — `.ts` 세그먼트는 MSE가 직접 디코딩하지 못합니다. 패킷을 풀어서 H.264 NALU·AAC 프레임을 추출한 뒤 fMP4(`moov`/`moof`/`mdat` 박스)로 다시 포장해서 SourceBuffer에 부어넣어야 합니다. hls.js가 [mux.js](https://github.com/videojs/mux.js)라는 트랜스먹서를 내장하는 이유가 여기에 있습니다
- **DASH `SegmentTemplate` 변형들** — `$Number$`만 있는 단순 케이스 외에도 `$Time$` 기반 `<SegmentTimeline>`(가변 길이 세그먼트), `<SegmentBase>` + `indexRange`(byte-range 기반 sidx 파싱), `<SegmentList>`까지 — manifest 변형마다 segment URL을 만드는 방식이 달라서 모두 따로 구현해야 합니다
- **HLS byte-range** — `#EXT-X-BYTERANGE`로 단일 fMP4 파일에서 부분만 가져오는 케이스. fetch에 `Range` 헤더를 정확히 계산해서 붙여줘야 합니다
- **분리 트랙(video/audio 별도)** — fMP4 HLS·DASH는 보통 비디오와 오디오 트랙이 별도 SourceBuffer로 분리되어 있어서, 두 SourceBuffer를 동시에 관리하고 timestamp로 동기화시켜야 합니다
- **ABR** — 직전 segment 다운로드 throughput 측정 + 버퍼 길이 모니터링 → 다음에 어느 화질을 받을지 결정. throughput-based, buffer-based(BOLA), hybrid 등 알고리즘이 따로 연구되는 분야입니다. 코덱이 바뀌면 `SourceBuffer.changeType()`을 호출해야 하는 등 splice 타이밍 처리도 필요합니다
- **라이브 스트리밍** — manifest를 주기적으로 다시 받고, DVR 윈도우 밖으로 밀려난 구간을 따라가는 루프
- **에러 복구** — 네트워크 끊김, 디코딩 실패, 버퍼 stall, DRM 라이선스 만료 — 단계마다 회복 전략이 다 다름
- **자막·다국어 오디오** — WebVTT/IMSC 자막, 트랙 스위칭과 동기화
- **DRM(EME/CDM)** — 라이선스 협상, 키 회전, 플랫폼별 CDM(Widevine·PlayReady·FairPlay) 분기
- **CORS·인증·토큰** — 서명된 URL, 토큰 만료 시 재발급
- **저지연 라이브(LL-HLS, CMAF Low-Latency)** — partial segment, chunked transfer, 빠른 ABR 판단
- **그 외** — 백그라운드 탭 동작, 시킹(seek 시 buffer flush), 가비지 컬렉션(`SourceBuffer.remove`), 텔레메트리, 브라우저별 quirk…

## 스트리밍 플레이어 라이브러리가 대신 해주는 일

여기까지 와서 진짜로 직접 짜려면 사실상 하나의 팀이 풀타임으로 매달려야 합니다. 한 사람이 챙기기엔 표면적이 너무 넓고, 브라우저별 동작 차이도 끝이 없습니다. 그래서 실무에서는 이 모든 걸 검증된 라이브러리에 위임합니다.

그러한 대표적인 라이브러리는 다음과 같습니다.

- **[hls.js](https://github.com/video-dev/hls.js)** — HLS 전용. m3u8 한 개만 던져주면 위 1~4번을 알아서 처리합니다. 가벼워서 HLS만 필요하다면 가장 먼저 후보에 오릅니다.
- **[shaka-player](https://github.com/shaka-project/shaka-player)** — Google이 만든 라이브러리로 DASH와 HLS, 그리고 Widevine·PlayReady·FairPlay까지 DRM 통합이 가장 강력합니다. OTT급 서비스에서 많이 채택됩니다.
- **[video.js](https://github.com/videojs/video.js)** — 플레이어 UI + 플러그인 생태계 중심. 자막·광고(VAST/VPAID)·분석 같은 부가 기능을 붙이기 쉽고, 내부적으로 hls.js나 dash.js를 호출하는 형태로 동작합니다.

위에서 다룬 함정들은 사실상 라이브러리 메인테이너들이 매일 마주치는 이슈들이고, 우리는 그 결과물을 가져다 쓰는 입장입니다. 덕분에 우리가 직접 신경 쓸 영역은 훨씬 좁아집니다.

- 어떤 manifest를 물려줄지
- 버퍼링·ABR 정책을 어떻게 설정할지
- 자막(VTT)·오디오 트랙·DRM을 어떻게 노출할지

위 항목들 외에도 고려해야 할 부분들을 라이브러리가 메서드와 설정 객체로 잘 정리해두기 때문에, 우리는 거기에 맞춰 값을 채워 넣는 정도면 충분합니다. 무거운 일은 라이브러리가 하고, 우리는 정책과 자산만 결정하면 되는 구조입니다.

## 마치며

물론 예외도 있습니다. 넷플릭스·유튜브 같은 메이저 OTT는 자체 플레이어를 만들어 직접 운영합니다. 사용자 규모가 워낙 커서 1%의 버퍼링 개선도 비용과 매출에 곧장 꽂히고, ABR·DRM·CDN 같은 영역은 차라리 인하우스로 잡는 편이 빠릅니다. 넷플릭스가 [Open Connect](https://openconnect.netflix.com/)라는 자체 CDN까지 들고 있는 게 그 연장선입니다.

다만 거기까지는 정말 극소수의 이야기고, 우리가 짜는 대부분의 서비스에서는 검증된 라이브러리 위에 정책 몇 개만 얹어도 충분히 잘 굴러갑니다. 뼈대부터 다시 깎을 이유는 거의 없습니다.

오늘 저녁에도 어디선가 영상을 켜실 겁니다. 영화든, 유튜브든, OTT든, 강의 플랫폼이든. 그 매끄러운 재생 한 장면 뒤에는 본문에서 짚은 그 수많은 함정들을 누군가가 매 초마다 다듬고 있습니다.

다음번에 버퍼링이 한 번쯤 걸리더라도 너무 미워하지 마세요. 누군가는 그 1초를 줄이려고 지금도 풀타임으로 매달리고 있을 테니까요.
