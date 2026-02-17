---
title: 'HLS(HTTP Live Streaming) Deep Dive (feat. Codec & Shaka Player)'
date: '2026-01-26'
description: 'HLS 프로토콜의 표준 명세부터 m3u8 구조 분석, H.264 vs HEVC 코덱 전략, 그리고 Shaka Player가 이를 파싱하는 내부 로직까지 상세하게 파헤쳐 봅니다.'
category: 'Media'
---

영상 스트리밍 서비스(OTT)를 개발하다 보면 "영상이 안 나와요"라는 이슈를 밥 먹듯이 마주하게 됩니다. 이때 단순히 "네트워크 문제네요"라고 퉁치고 넘어갈 수도 있지만, 근본적인 원인을 파악하려면 **프로토콜(Protocol)**의 명세와 **플레이어(Player)**의 동작 원리를 꿰뚫고 있어야 합니다.

이 글에서는 현재 영상 스트리밍 업계의 사실상 표준(De facto standard)인 **HLS(HTTP Live Streaming)** 프로토콜을 아주 깊게 파고들어 보려 합니다. 단순히 개념을 훑는 수준을 넘어, RFC 표준 문서 레벨의 구조 분석과 Shaka Player의 소스 코드를 통해 실제 구현체가 이를 어떻게 처리하는지 살펴보겠습니다.

## 1. HLS Architecture: 거대한 영상을 쪼개는 기술

HLS의 핵심 철학은 **"HTTP를 통해 작은 파일들을 연속으로 다운로드한다"**는 것입니다. 이는 기존의 RTSP 같은 전용 스트리밍 프로토콜과 달리, 일반적인 웹 서버와 CDN(Content Delivery Network)을 그대로 사용할 수 있다는 강력한 장점을 가집니다.

### 전체적인 구조 (Hierarchical Structure)

HLS는 계층적인 구조를 가집니다. 아래 다이어그램을 보면 하나의 `Master Playlist`가 여러 화질의 `Media Playlist`를 가리키고, 각 `Media Playlist`는 수천 개의 작은 `Segment` 파일들을 가리키는 것을 볼 수 있습니다.

![HLS Structure](./hls_structure_diagram_1769433661578.png)

1.  **Master Playlist (Multivariant Playlist)**: 스트리밍의 진입점입니다. 영상이 제공하는 다양한 버전(화질, 언어, 코덱 등)에 대한 목록을 담고 있습니다.
2.  **Media Playlist**: 특정 버전(예: 720p 화질)의 실제 영상 파일(`.ts`) 목록을 순서대로 나열합니다.
3.  **Media Segments (`.ts` or `.m4s`)**: 실제 오디오/비디오 데이터가 담긴 2~10초 분량의 바이너리 파일입니다.

<br/>

## 2. Master Playlist Deep Dive: ABR의 시작점

플레이어(Client)가 영상 재생을 요청할 때 가장 먼저 다운로드하는 파일입니다. 여기서 **ABR(Adaptive Bitrate Streaming)**의 마법이 시작됩니다.

```text
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-STREAM-INF:BANDWIDTH=800000,AVERAGE-BANDWIDTH=600000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2",FRAME-RATE=29.970
360p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,AVERAGE-BANDWIDTH=1100000,RESOLUTION=854x480,CODECS="avc1.4d401f,mp4a.40.2",FRAME-RATE=29.970
480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,AVERAGE-BANDWIDTH=2200000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2",FRAME-RATE=29.970
720p/playlist.m3u8
```

### 주요 태그 분석

- **`#EXT-X-STREAM-INF`**: "이 아래에 있는 URL은 또 다른 플레이리스트야"라고 알려주는 태그입니다.
- **`BANDWIDTH` vs `AVERAGE-BANDWIDTH`**:
  - `BANDWIDTH`: 이 스트림에서 발생할 수 있는 **최대 비트레이트**입니다. 플레이어는 안전하게 버퍼링 없이 재생하려면 내 네트워크 속도가 이 값보다 커야 한다고 판단합니다.
  - `AVERAGE-BANDWIDTH`: 전체 영상의 **평균 비트레이트**입니다. 데이터 소모량을 예측할 때 쓰입니다.
- **`CODECS`**: 디코딩 가능 여부를 판단하는 핵심 잣대입니다.

### 실무 Tip: Codec String의 중요성

`CODECS="avc1.4d401f"` 같은 문자열은 단순한 텍스트가 아닙니다.

- `avc1`: H.264 코덱.
- `4d`: Main Profile.
- `40`: Level 4.0.

만약 플레이어가 구형 스마트 TV라서 "H.264 High Profile"을 지원하지 않는데, `CODECS` 값 정보 없이 무탁대고 고화질 스트림을 선택했다면? **영상은 검은 화면만 나오고 소리만 나오는 대참사**가 발생합니다. 그래서 Master Playlist를 생성할 때 정확한 코덱 정보를 명시해 주는 것이 매우 중요합니다.

<br/>

## 3. Media Playlist Deep Dive: 시간과의 싸움

플레이어가 자신의 네트워크 환경에 맞는 화질(예: 720p)을 선택했다면, 이제 구체적인 배달 목록인 Media Playlist를 봅니다.

```text
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:10.000,
segment0.ts
#EXTINF:10.000,
segment1.ts
#EXTINF:9.500,
segment2.ts
#EXT-X-ENDLIST
```

- **`#EXT-X-TARGETDURATION`**: 모든 세그먼트 중 가장 긴 녀석의 시간입니다. 플레이어는 이 값을 보고 "아, 내가 최소한 10초 치 버퍼는 확보해야겠구나"라고 판단하기도 합니다.
- **`#EXTINF`**: 각 세그먼트의 정확한 실수(float) 단위 재생 시간입니다. 이것들을 모두 더하면 전체 영상의 길이가 됩니다.
- **`#EXT-X-ENDLIST`**: VOD(다시보기) 영상이라는 뜻입니다. 이 태그가 없으면 플레이어는 "아직 방송 중이구나(Live)"라고 판단하고 주기적으로 m3u8 파일을 다시 요청(Polling)하여 새로 추가된 세그먼트가 있는지 확인합니다.

<br/>

## 4. Codec 전쟁: H.264(AVG) vs H.265(HEVC)

HLS 자체는 '배달 상자(Container)'와 '운송장(Manifest)'일 뿐이며, 실제 그 안에 담긴 내용물은 **코덱(Codec)**에 의해 압축됩니다.

### H.264 (Default Standard)

- **장점**: 전 세계 거의 모든 기기(Android, iOS, Web, Smart TV)에서 하드웨어 가속을 지원합니다. 호환성 100점.
- **단점**: 이제는 낡은 기술입니다. 4K 이상의 초고화질 영상을 전송하기엔 용량이 너무 큽니다.
- **HLS 표기**: `CODECS="avc1...."`

### H.265 / HEVC (High Efficiency Video Coding)

- **장점**: H.264 대비 약 **50% 더 높은 압축 효율**을 자랑합니다. 즉, 같은 화질 영상을 절반의 데이터로 전송할 수 있습니다. (망 사용료 절감의 구세주)
- **단점**: **브라우저 호환성이 최악입니다.** Chrome이나 Firefox에서는 하드웨어 디코딩 지원 여부에 따라 재생이 안 될 수 있습니다. (Safari는 Apple 꺼라 잘 됩니다.)
- **HLS 표기**: `CODECS="hvc1..."` 또는 `hev1...`

### 실무에서의 전략: Hybrid Encoding

그래서 최신 스트리밍 서비스들은 꼼수를 씁니다. **Master Playlist 안에 두 가지를 다 넣어두는 것**입니다.

1.  저사양/호환성용 H.264 스트림 (360p ~ 1080p)
2.  고화질/고효율용 HEVC 스트림 (1080p ~ 4K)

그리고 플레이어가 `CODECS` 태그를 보고 자신의 브라우저가 `hvc1`을 지원하면 HEVC 스트림을 선택하고, 지원하지 않으면 H.264 스트림을 선택하도록 유도하는 방식을 주로 사용합니다.

<br/>

## 5. Shaka Player Internals: 코드를 까보자

Google의 **Shaka Player**는 웹 기반 플레이어 중 가장 강력하고 유연한 구조를 가지고 있습니다. Shaka가 HLS를 어떻게 다루는지 실제 소스 코드(`lib/hls/hls_parser.js`)의 흐름을 통해 살펴보겠습니다.

### 1) Presentation Timeline 동기화 (`syncStreamsWithProgramDateTime_`)

HLS에서는 영상(Video)과 소리(Audio)가 별도의 m3u8 파일로 쪼개져 있는 경우가 많습니다. 이때 두 트랙의 싱크가 안 맞으면 입모양과 소리가 따로 놀게 됩니다.

Shaka Player는 `syncStreamsWithProgramDateTime_` 메서드를 통해 이를 보정합니다.

```javascript
// (개념적인 간소화 코드)
syncStreamsWithProgramDateTime_(streamInfos) {
  let lowestSyncTime = Infinity;

  // 1. 모든 스트림을 순회하며 가장 빠른 시작 시간(Earliest Sync Time)을 찾습니다.
  for (const info of streamInfos) {
    const segment0 = info.segmentIndex.earliestReference();
    if (segment0 && segment0.syncTime) {
      lowestSyncTime = Math.min(lowestSyncTime, segment0.syncTime);
    }
  }

  // 2. 가장 빠른 시간을 '0초'로 기준 잡고(Normalization), 나머지 스트림들의 시간을 오프셋만큼 밉니다.
  for (const info of streamInfos) {
     const segment0 = info.segmentIndex.earliestReference();
     const offset = segment0.syncTime - lowestSyncTime;

     // 이 offset만큼 전체 세그먼트들의 start_time, end_time을 조절합니다.
     info.segmentIndex.offset(offset * -1);
  }
}
```

이 로직 덕분에 각기 다른 시간에 인코딩된 오디오/비디오 트랙이라도, `#EXT-X-PROGRAM-DATE-TIME` 태그를 기준으로 정확하게 0초 시점을 맞춰서 재생할 수 있게 됩니다.

### 2) VOD와 Live의 구분

Shaka는 m3u8에 `#EXT-X-ENDLIST` 태그가 있냐 없냐를 보고 `PresentationType`을 결정합니다.

- **VOD**: `ENDLIST`가 있음. 전체 길이를 알 수 있으므로 Seek Bar(재생 바)를 끝까지 그릴 수 있습니다.
- **LIVE**: `ENDLIST`가 없음. 무한히 지속되는 스트림으로 간주하고, 주기적으로 `updatePlaylist_()`를 호출하여 최신 세그먼트를 갱신합니다.

### 3) Codec Support Check

`parseMasterPlaylist_` 단계에서 Shaka는 브라우저 내장 API인 `MediaCapabilities`나 `MediaSource.isTypeSupported`를 호출합니다.

```javascript
if (!MediaSource.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"')) {
  // 이 브라우저는 HEVC 못 틈!
  // HEVC Variant는 로드 목록에서 제외 (drop)
}
```

이 과정이 있기에 우리는 안심하고 Master Playlist에 온갖 고화질 코덱을 때려 넣어도, 사용자 환경에서는 "재생 가능한 최선의 화질"이 자동으로 나오게 되는 것입니다.

<br/>

## 정리하며

HLS는 단순한 텍스트 파일 몇 개로 이루어진 프로토콜 같지만, 그 안에는 네트워크 가변성에 대응하기 위한 **ABR**, 영상 압축 효율을 위한 **Codec Negotiation**, 그리고 이를 오치 없이 재생하기 위한 **Time Synchronization** 등 엄청난 엔지니어링 정수가 담겨 있습니다.

프론트엔드 개발자로서 "영상이 그냥 나온다"를 넘어, "어떤 프로토콜로, 어떤 코덱으로, 어떻게 파싱되어 나오는지"를 이해한다면, 재생 오류나 성능 이슈를 마주했을 때 훨씬 더 깊이 있는 해결책을 제시할 수 있을 것입니다.
