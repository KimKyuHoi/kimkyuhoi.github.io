---
title: '한국인들을 위한 낙관적인 업데이트 적용기'
date: '2026-09-20'
description: 'useOptimistic과 startTransition으로 낙관적인 업데이트 처리하기'
tags: ['React', 'useOptimistic', 'Optimistic UI', 'TanStack Query', 'Frontend']
category: '개발'
featured: true
---

요즘 스토어 개편 작업을 맡아 개발하고 있는데요! 상품 카드의 찜 기능을 만들다 보니 하트를 누르고 한참 뒤에야 채워지는 게 매번 거슬렸습니다. 제가 사용자라면 서버 응답이 올 때까지 UI가 멈춰 있는 구조 자체가 꽤 불편하겠다 싶었습니다. 

그래서 해당 글에서는 React 19의 `useOptimistic`과 `startTransition`으로 찜 버튼을 누르는 즉시 반응하게 바꾸면서, 연타와 요청 취소, 실패했을 때의 롤백까지 어떻게 처리했는지 정리해 보려고 합니다.

## 시작점: 왜 답답했나

처음에는 단순하게 state 하나로 구현했습니다. 서버 응답이 와야 state가 바뀌는 구조라, 서버가 조금만 느려져도 찜 한 번 누를 때마다 그만큼 기다려야 했습니다. 찜했다가 바로 취소하고 싶을 수도 있는데, 서버 응답이 올 때까지 화면이 굳어 있는 건 분명 아쉬운 UX였습니다.

<img src="./blocking-timeline.gif" alt="찜 하트를 누르면 버튼이 잠기고, 응답이 온 뒤에야 하트가 채워진다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">서버 응답이 올 때까지 하트가 바뀌지 않는 차단형 찜 버튼</div>

## 그래서 사용자가 편하려면?

사용자가 답답함을 느끼지 않으려면 화면만큼은 서버 사정과 무관하게 즉각 반응해야 한다고 생각했습니다. 그렇게 기준을 잡고 나니 몇 가지 고민이 꼬리를 물었습니다.

1. 서버 응답과 상관없이 화면부터 바꾸려면 낙관적 UI를 어떻게 적용해야 할까?
2. 버튼을 연타했을 때 날아가는 서버 요청들은 어떻게 제어해야 할까?
3. 이전 요청이 아직 처리 중인데 다시 누르면 어떻게 될까?
4. 낙관적으로 먼저 바꿔 뒀는데 서버 요청이 실패하면 어떻게 되돌릴까?
5. 화면이 서버보다 앞서가는 상황에서 엇갈린 요청들을 어떻게 동기화할까?

고민을 하나씩 풀어보니 결국 두 가지가 필요했습니다. 서버가 확인해 준 값과 화면에 보여줄 임시 값을 분리해서 들고 있어야 하고, 비동기 요청의 시작과 끝을 감지할 수 있어야 했습니다. 자연스럽게 React 19의 `useOptimistic`과 `startTransition`이 떠올랐습니다.

## 그냥 useState로 하면 안 될까?

`useOptimistic`을 꺼내기 전에 이런 의문이 들 수 있습니다. 낙관적 UI라고 해 봐야 화면 먼저 바꾸고 실패하면 되돌리면 그만인데, 굳이 새 훅을 써야 할까? 저도 처음엔 `useState`로 이렇게 짰습니다.

```tsx
const [shown, setShown] = useState(false);

const toggle = () => {
  const next = !shown;
  setShown(next); // 화면 먼저 반영

  server
    .set(next)
    .then(() => setShown(next)) // 성공하면 확정
    .catch(() => setShown(!next)); // 실패하면 반대로 되돌리기
};
```

한 번만 클릭할 때는 잘 동작합니다. 문제는 사용자가 버튼을 연타할 때 발생합니다.

### 응답이 화면을 덮어쓴다

찜을 누르고 곧바로 해제를 누르면 `POST`와 `DELETE` 요청이 연달아 날아갑니다. 사용자의 마지막 의도는 해제이므로 하트는 비어 있어야 합니다. 하지만 각 요청에 묶인 `.then` 핸들러는 네트워크 응답이 도착하는 순서대로 화면 상태를 덮어씁니다.

만약 `POST` 응답이 늦게 도착하면, 이미 지나간 찜 클릭의 `setShown(true)`가 실행되면서 비워졌던 하트가 다시 채워졌다가, 뒤이어 `DELETE`가 도착해서야 비워집니다. 사용자 눈에는 하트가 제멋대로 깜빡거리는 버그로 보이게 됩니다.

| 시간   | 일어난 일   | 처리              | 화면                               |
| ------ | ----------- | ----------------- | ---------------------------------- |
| 0ms    | 찜 클릭     | `POST` 전송       | 하트 채움                          |
| 100ms  | 해제 클릭   | `DELETE` 전송     | 하트 비움 (요청 2개가 동시에 진행) |
| 1200ms | POST 응답   | `setShown(true)`  | 하트가 다시 채워짐                 |
| 1300ms | DELETE 응답 | `setShown(false)` | 다시 비워짐                        |

### 두 요청이 모두 실패한다면?

같은 상황에서 두 요청이 모두 실패했다고 가정해 보겠습니다. 각 요청은 클릭 직전의 값으로 상태를 되돌리려 합니다. 찜 요청은 `false`로, 해제 요청은 `true`로 되돌립니다. 찜 요청이 실패했을 때는 화면이 이미 비어 있어 변화가 없지만, 마지막 해제 요청마저 실패하면 롤백 로직이 돌면서 하트가 채워진 채로 끝납니다. 서버에는 아무것도 반영되지 않았는데 화면에는 찜이 된 채로 남는 상태 불일치가 생깁니다.

| 시간   | 일어난 일   | 처리              | 화면                     |
| ------ | ----------- | ----------------- | ------------------------ |
| 0ms    | 찜 클릭     | `POST` 전송       | 하트 채움                |
| 100ms  | 해제 클릭   | `DELETE` 전송     | 하트 비움                |
| 1200ms | POST 실패   | `setShown(false)` | 이미 비어 있어 변화 없음 |
| 1300ms | DELETE 실패 | `setShown(true)`  | 하트가 채워진 채로 끝남  |

직전 값이라고 믿었던 기준값조차 실은 서버가 확인해 준 진짜 값이 아니었던 셈입니다. 이 문제를 제대로 풀려면 서버가 보장한 기준값을 따로 관리하고, 진행 중인 요청의 수를 추적하다가, 모든 요청이 끝났을 때 기준값으로 수렴시켜야 합니다. 
이 귀찮은 일을 대신 처리해 주는 도구가 바로 `useOptimistic`과 `startTransition`입니다.

## useOptimistic이란?

`useOptimistic`은 비동기 작업이 대기 중인 동안 화면에 다른 상태를 보여 줄 수 있게 해 주는 Hook입니다. 사용법은 간단합니다.

```tsx
const [value, setValue] = useState(false); // 기준 상태: 서버가 확인해 준 값
const [shown, show] = useOptimistic(value); // 낙관적 상태: 화면에 보여 줄 값
```

`value`는 서버가 성공했다고 응답했을 때만 바꾸는 기준값이고, `shown`은 실제로 화면에 그리는 값입니다. 서버 요청은 우리 코드가 보내고, `useState`는 그 결과를 담아 두기만 합니다.

대기 중인 낙관적 업데이트가 없으면 `shown`은 `value`와 같습니다. 찜 버튼을 눌러 `show(true)`를 호출하면 낙관적 업데이트가 하나 쌓이고, `value`는 `false` 그대로인 채 `shown`만 먼저 `true`가 됩니다. 기준값 위에 낙관적 업데이트를 잠깐 덧씌워 놓는 셈입니다.

찜 버튼을 한 번 눌렀을 때 두 상태는 아래처럼 움직입니다.

| 시점        | 일어난 일              | `shown` | `value` |
| ----------- | ---------------------- | ------- | ------- |
| 클릭        | `show(true)`           | true    | false   |
| 응답 대기   | 서버 응답 기다림       | true    | false   |
| 응답 성공   | `setValue(true)`       | true    | true    |
| Action 완료 | 낙관적 업데이트 되돌림 | true    | true    |

여기서 `shown`이 다시 `value`를 따라가는 시점이 중요합니다. 응답이 성공해 `setValue(true)`를 호출하면 `value`는 바로 `true`가 되지만, 화면에 보이는 `shown`은 낙관적 업데이트가 덮고 있어서 계속 `true`입니다. 낙관적 업데이트는 Action이 완료될 때 되돌려지는데, 그때는 이미 `value`가 `true`라 `shown`도 그대로 `true`입니다. 그래서 값이 확정되는 순간에도 하트가 깜빡이지 않습니다.

요청이 실패하면 `setValue`를 호출하지 않으니 `value`는 계속 `false`로 남아 있습니다. Action이 완료되어 낙관적 업데이트가 되돌려지면 `shown`도 `false`가 되고, 하트는 원래대로 돌아갑니다. 성공이든 실패든 React는 낙관적 업데이트를 되돌리고 기준 상태를 보여 줄 뿐이라, 롤백 코드를 따로 쓸 필요가 없게 됩니다.

React가 낙관적 업데이트를 되돌리는 기준은 `show()`를 호출한 Action이 끝나는 시점입니다. 그래서 `show()`는 반드시 Action 안에서 불러야 합니다. 밖에서 부르면 언제 되돌릴지 기준이 없으니 경고가 뜨고 낙관적 상태가 바로 사라집니다.

## startTransition이란?

그렇다면 Action은 어떻게 만들까요? 가장 기본적인 방법이 `startTransition`입니다.

`startTransition`은 넘긴 함수가 실행되는 동안 일어난 상태 업데이트를 우선순위가 낮은 업데이트, 즉 Transition으로 처리합니다. React 19부터는 여기에 `async` 함수도 넘길 수 있게 되었고, 이렇게 `startTransition`에 넘기는 함수를 Action이라고 부릅니다.

```tsx
startTransition(async () => {
  show(true); // Action 안에서 호출
  await server.set(true);
}); // 이 함수가 끝나면 Action 완료
```

앞에서 말한 낙관적 업데이트가 되돌려지는 시점이 바로 이 함수가 끝나는 때입니다.

`startTransition`만으로는 Action이 진행 중인지 알 수 없습니다. 진행 여부가 필요하다면 `useTransition`을 쓰면 됩니다. `useTransition`이 돌려주는 `startTransition`은 위와 똑같이 동작하고, 여기에 Action이 대기 중인지를 알려 주는 `isPending`이 함께 따라옵니다.

## 써 보면서 생긴 의문들

사용법 자체는 간단하지만, 실제로 구현해 보면서 몇 가지 의문이 들었습니다.

- 코드 어디에도 롤백 로직이 없는데 실패 시 어떻게 원래대로 돌아갈까?
- 연타해서 Action이 겹쳐도 왜 화면이 깜빡이지 않을까?
- 요청이 진행 중일 때 다시 누르면 이전 요청은 어떻게 처리해야 할까?

공식 문서 설명만으로는 완전히 와닿지 않아 직접 테스트해 볼 수 있는 [Optimistic UI Lab](/playground/optimistic-ui/)을 만들고, 서버 지연과 실패 확률을 조절하며 직접 확인해 보았습니다.

### React는 어떻게 상태를 되돌릴까?

Lab에서 실패 모드를 켜고 찜 버튼을 눌러 보면, 하트가 즉시 채워졌다가 서버 응답 실패 후 자연스럽게 원래대로 돌아옵니다. 코드에는 롤백하는 로직이 단 한 줄도 없는데 말이죠.

<img src="./optimistic-fail.gif" alt="서버 실패 모드에서 찜을 누르면 하트가 먼저 채워졌다가 응답 실패 후 원래대로 돌아온다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">롤백 코드 없이 실패하면 하트가 원래대로 돌아온다</div>

대체 React 내부에서 무슨 일이 일어나는지 궁금해 `react-dom` 코드를 직접 뜯어보았습니다.

`show()`를 호출하면 내부적으로 `dispatchOptimisticSetState`가 실행되며 업데이트 객체를 만들어 큐에 쌓습니다. 이를 일반 `setState`(`dispatchSetStateInternal`)가 만드는 업데이트 객체와 나란히 비교해 보면 흥미로운 차이가 보입니다.

```js
// node_modules/react-dom/cjs/react-dom-client.development.js

// 1. 일반 setState → dispatchSetStateInternal
var update = {
  lane: lane,                          // 이벤트나 Transition에 따라 정해진 우선순위
  revertLane: 0,                       // 0 = 되돌리지 않음. 한 번 적용되면 계속 남는다
  gesture: null,
  action: action,
  hasEagerState: !1,
  eagerState: null,
  next: null,
};

// 2. useOptimistic의 show() → dispatchOptimisticSetState
action = {                             // (실제 코드에선 매개변수 action 변수를 재할당)
  lane: 2,                             // SyncLane(2). 언제나 최우선 순위로 즉시 렌더링
  revertLane: requestTransitionLane(), // 현재 Action의 우선순위. 이 렌더링이 오면 버려진다
  gesture: null,                       // 제스처 Transition용 실험 기능
  action: action,                      // show()에 넘긴 값
  hasEagerState: !1,
  eagerState: null,
  next: null,                          // 업데이트 큐에서 다음 업데이트를 가리킴
};
```

나머지 필드는 같고 `lane`과 `revertLane`만 다릅니다. 일반 `setState`는 `revertLane`이 `0`이라 한 번 적용된 업데이트가 그대로 남습니다. 반면 낙관적 업데이트는 `lane`이 `2`여서 화면에 즉시 보이고, `revertLane`에 Action의 Transition 우선순위가 기록되어 있어 해당 Action이 끝나면 버려집니다.

실제로 업데이트를 버리는 로직은 같은 파일의 `updateReducerImpl` 함수에 있습니다.

```js
// node_modules/react-dom/cjs/react-dom-client.development.js
// updateReducerImpl (react-dom 19.3.0, 일부 생략)
var revertLane = update.revertLane;

if (0 === revertLane) {
  // 일반 setState 업데이트: 되돌릴 일이 없으니 그대로 적용
} else if ((renderLanes & revertLane) === revertLane) {
  // 낙관적 업데이트 + 지금이 revertLane을 렌더링하는 중(= Action이 끝남)
  update = update.next; // 이 업데이트는 계산에서 빼고
  continue; // 다음 업데이트로 넘어간다
} else {
  // 낙관적 업데이트 + Action이 아직 진행 중
  // 다음 렌더링에서도 계속 적용되도록 큐에 복사본을 남겨 두고
  newBaseQueueLast = newBaseQueueLast.next = { lane: 0, revertLane, action: update.action /* ... */ };
  // Action이 끝나면 revertLane으로 다시 렌더링하도록 예약해 둔다
  currentlyRenderingFiber.lanes |= revertLane;
}

// 건너뛰지 않은 업데이트만 실제 값 계산에 반영된다
pendingQueue = reducer(pendingQueue, update.action);
```

업데이트 큐를 순회하며 낙관적 업데이트를 두 가지 경우로 나누어 처리합니다. 

Action이 진행 중일 때는 낙관적 값을 화면에 적용하면서 다음 렌더링을 위해 큐에 복사본을 남겨 둡니다. 덕분에 그사이에 다른 이유로 리렌더링이 일어나도 `shown`은 낙관적 값을 유지합니다. 그러다 Action이 완료되어 `revertLane` 차례가 오면, React는 이 낙관적 업데이트를 계산에서 아예 건너뛰어 버립니다.

결국 React는 요청이 성공했는지 실패했는지 전혀 모릅니다.
Action이 끝나면 그저 임시로 덧씌워 뒀던 낙관적 업데이트를 큐에서 걷어내고, 남아 있는 기준 상태(`value`)로 다시 계산할 뿐입니다. 요청이 성공해서 `setValue(true)`를 호출했다면 `value`가 `true`로 바뀌어 있어 하트가 그대로 유지되고, 실패해서 호출하지 않았다면 `value`가 여전히 `false`로 남아 있어 원래대로 돌아간 것처럼 보였던 것입니다.

### 연타하면 왜 깜빡이지 않을까?

서버 지연을 늘리고 찜을 누른 뒤 곧바로 해제를 눌러 보면 차이가 확실히 드러납니다. `useState`로 만든 버전은 응답이 도착할 때마다 하트가 다시 채워졌다 비워지지만, `useOptimistic` 버전은 마지막으로 누른 상태 그대로 유지됩니다.

<img src="./optimistic-rapid.gif" alt="찜과 해제를 빠르게 누르면 useState 버전은 응답마다 하트가 깜빡이고 useOptimistic 버전은 마지막 상태를 유지한다" loading="lazy" style="width: 640px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">왼쪽 useState 버전은 응답이 올 때마다 깜빡이고, 오른쪽 useOptimistic 버전은 마지막으로 누른 상태를 유지한다</div>

진행 중인 Action이 있을 때 새로 시작한 Action은 같은 묶음으로 엮이고, 낙관적 업데이트는 묶인 Action이 모두 끝날 때까지 큐에 남아 있습니다. 그래서 중간에 `value`가 바뀌어도 화면에는 마지막으로 누른 값이 계속 보입니다.

| 시점           | 일어난 일         | 결과                                                         |
| -------------- | ----------------- | ------------------------------------------------------------ |
| 찜 클릭        | `show(true)`      | `shown`: true, Action 1개 진행 중                            |
| 해제 클릭      | `show(false)`     | `shown`: false, 같은 묶음으로 엮여 Action 2개 진행 중        |
| 찜 응답 성공   | `setValue(true)`  | 해제 클릭의 낙관적 업데이트가 남아 있어 `shown`은 계속 false |
| 해제 응답 성공 | `setValue(false)` | 모든 Action 완료, `value`·`shown` 모두 false                 |

찜 요청이 먼저 성공해 `setValue(true)`를 호출해도, 해제 클릭의 낙관적 업데이트가 남아 있으니 하트는 비어 있는 그대로입니다. 해제 요청까지 끝나 낙관적 업데이트가 모두 빠질 때는 이미 `value`가 `false`라 화면도 그대로입니다. 먼저 보낸 요청만 실패하는 경우도 마찬가지로, 나중 요청이 끝날 때까지 롤백이 일어나지 않아 하트가 중간에 비었다 채워지는 일이 없습니다.

### 요청이 진행 중일 때 다시 누르면?

화면 표현은 깔끔해졌지만, 네트워크 요청 처리는 또 다른 문제였습니다. 찜을 눌러 `POST`가 서버로 날아가는 도중에 해제를 누르면 어떻게 될까요? 서버로 이미 떠난 POST는 끝까지 실행되고, 뒤늦게 돌아온 응답이 `setValue(true)`를 호출해 버립니다. 사용자는 마지막에 해제하려고 눌렀는데, 이전 요청의 응답이 기준 상태를 엉뚱하게 되돌려 놓는 셈입니다.

이를 해결하기 위해 다시 누르면 이전 클릭의 요청을 `AbortController`로 취소하게 했습니다. `abort()`를 부르면 해당 `signal`을 넘겨받은 `fetch`나 대기 작업이 취소되는 브라우저 API입니다. 스토어에서는 클릭마다 컨트롤러를 하나씩 만들고, 새 클릭이 들어오면 이전 컨트롤러를 `abort()` 합니다. 

이와 함께 불필요한 요청을 줄이고자 400ms `debounce`도 두었는데, 사용자가 다시 누른 시점이 debounce 진행 중이냐 끝난 후냐에 따라 각각 다르게 처리해야 했습니다.

```tsx
// 새로 누르면 이전 클릭의 요청(또는 대기)을 취소한다
prev?.controller.abort();

// 이전 요청이 이미 출발했다면 서버에 반영됐는지 알 수 없다
const unsure = prev && !prev.settled && (prev.sent || prev.unsure);

// debounce가 끝난 뒤, 서버 상태를 확실히 알고 그 값으로 돌아왔다면 요청하지 않는다
if (!unsure && next === valueRef.current) return;
```
**1) debounce(400ms)가 끝나기 전에 다시 누른 경우**

<img src="./abort-debounce.gif" alt="debounce 중에 찜과 해제를 누르면 요청이 하나도 나가지 않는다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">요청을 보내기 전에 찜을 해제하면 아무 요청도 나가지 않는다</div>

찜을 누르고 400ms가 채 지나기 전에 해제를 누르면, 대기 중이던 찜 타이머가 취소되면서 `POST`는 아예 출발조차 하지 않습니다. 해제 클릭 역시 서버의 원래 상태(찜 안 됨)와 사용자의 최종 의도가 같으니 요청을 보낼 필요가 없습니다. 결국 네트워크 요청은 0번으로 끝납니다.

**2) debounce가 끝나 POST가 이미 출발한 뒤에 다시 누른 경우**

<img src="./abort-inflight.gif" alt="POST가 나간 뒤 해제를 누르면 POST를 취소하고 DELETE를 보내 서버를 맞춘다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">이미 나간 POST는 취소해도 서버에서 처리되므로, DELETE를 보내 서버를 맞춘다</div>

이때는 일단 이전 컨트롤러를 `abort()` 해서 지나간 `POST` 응답이 뒤늦게 `value`를 덮어쓰지 못하도록 끊어 둡니다. 나중에 응답이 와도 `signal.aborted`로 무시하면 되니까요.

하지만 진짜 문제는 서버에 있었습니다. `abort()`는 브라우저가 응답을 안 받겠다는 뜻이지, 이미 서버에 도착한 요청 자체를 취소해 주지는 못합니다. 실제로 로그를 확인해 보니 클라이언트에서 `abort`를 날려도 서버는 이미 들어온 `POST`를 그대로 처리해 버렸습니다.

그래서 이전 요청이 이미 출발했다면 서버 상태를 알 수 없다고 보고, 사용자의 마지막 의도인 `DELETE`를 확실하게 날려 서버 상태를 맞춰 주어야 했습니다.


| 시점          | 일어난 일                  | 결과                                |
| ------------- | -------------------------- | ----------------------------------- |
| 찜 클릭       | debounce 후 `POST` 전송    | 하트 채움                           |
| 해제 클릭     | 이전 컨트롤러 `abort()`    | `POST` 응답은 더 이상 기다리지 않음 |
| debounce 후   | `DELETE` 전송              | 하트는 계속 비어 있음               |
| `POST` 처리   | 서버는 이미 받은 요청 처리 | 클라이언트는 결과를 무시            |
| `DELETE` 응답 | `setValue(false)`          | 서버도 찜 안 함, 화면과 서버가 일치 |

## 실패했을 때 사용자에게는?

요청이 실패하면 하트가 이전 상태로 자연스럽게 롤백되는데, 이때 사용자 입장에서는 눌렀던 하트가 아무런 안내 없이 다시 비워지니, 잘못 누른 줄 알고 혼동이 올 수 있겠다고 판단했습니다. 그래서 실패 시 토스트로 상황을 알려 주기로 했습니다.

그런데 토스트를 붙이자마자 하트를 빠르게 연타하기만 해도 실패 토스트가 떴습니다. 연타할 때마다 이전 요청을 `abort()`로 취소하는데, `abort`된 요청 역시 에러로 간주되어 `catch` 블록으로 들어가기 때문입니다. 새 클릭에 의해 의도적으로 취소된 요청은 실패가 아니므로, `catch`에서 `signal.aborted`를 먼저 확인해 최종적으로 걸러 냈습니다.

```tsx
try {
  await applyWish(productId, next, signal);
  setValue(next);
} catch (error) {
  if (signal.aborted) return; // 사용자의 새 클릭으로 취소된 요청은 실패가 아님
  if (isAuthError(error)) return promptLogin(); // 로그인 만료 등은 별도 처리
  showToast('찜하지 못했어요. 잠시 후 다시 시도해 주세요.');
}
```

이렇게 해서 연타와 네트워크 취소, 롤백과 에러 토스트까지 안전하게 처리되는 찜 버튼 구현을 마쳤습니다.

## TanStack Query랑은 뭐가 다를까? 언제 쓰면 안 될까?

구현을 마치고 낙관적 업데이트에 대해 자료를 더 찾아보며 공부하다 보니, 실무에서 가장 흔히 쓰이는 TanStack Query방식도 눈에 띄었습니다. 공식 문서의 예시를 보면 대략 아래와 같습니다.

```tsx
useMutation({
  mutationFn: updateTodo,
  // mutate가 호출되면
  onMutate: async (newTodo, context) => {
    // 진행 중인 refetch 취소 (낙관적 업데이트를 덮어쓰지 않도록)
    await context.client.cancelQueries({ queryKey: ['todos', newTodo.id] });

    // 이전 값을 스냅샷으로 백업
    const previousTodo = context.client.getQueryData(['todos', newTodo.id]);

    // 캐시에 낙관적 값 직접 쓰기
    context.client.setQueryData(['todos', newTodo.id], newTodo);

    // 롤백용 스냅샷 반환
    return { previousTodo, newTodo };
  },
  // mutation 실패 시 스냅샷으로 롤백
  onError: (err, newTodo, onMutateResult, context) => {
    context.client.setQueryData(['todos', onMutateResult.newTodo.id], onMutateResult.previousTodo);
  },
  // 성공이든 실패든 완료되면 서버 데이터와 동기화
  onSettled: (newTodo, error, variables, onMutateResult, context) =>
    context.client.invalidateQueries({ queryKey: ['todos', newTodo.id] }),
});
```

가장 큰 차이는 낙관적인 값을 어디에 보관하느냐입니다. 

TanStack Query는 서버 데이터를 관리하는 캐시 자체를 직접 수정합니다. 해당 캐시를 구독하는 모든 컴포넌트가 동시에 바뀐다는 장점이 있지만, 그 대가로 진행 중인 쿼리 취소, 스냅샷 저장, 에러 시 롤백, 종료 후 invalidate까지 개발자가 직접 챙겨야 합니다. 

반면 `useOptimistic`은 전역 캐시를 건드리지 않고, 클릭이 발생한 컴포넌트의 화면 위에 값을 임시로 덧씌웁니다. Action이 끝나면 덧씌운 값이 자연스럽게 사라지기 때문에 복잡한 롤백 코드를 작성할 필요가 없습니다.

| 비교           | TanStack Query             | useOptimistic             |
| -------------- | -------------------------- | ------------------------- |
| 낙관적인 값    | 쿼리 캐시에 직접 씀        | 누른 화면에만 덧씌움      |
| 함께 바뀌는 곳 | 같은 쿼리를 쓰는 화면 전체 | 누른 컴포넌트만           |
| 진행 중인 조회 | 직접 취소해야 함           | 덮어쓸 걱정 없음          |
| 실패했을 때    | 스냅샷으로 직접 되돌림     | Action이 끝나면 사라짐    |
| 끝난 뒤        | 다시 받아와 서버와 맞춤    | 성공했을 때만 기준값 변경 |

결제나 주문처럼 한 번 잘못 처리되면 치명적인 기능이라면 전역 캐시와 함께 엄격하게 다뤄야겠지만, 찜 기능은 실패 확률이 낮고 설령 되돌려지더라도 사용자에게 가는 피해가 적다고 생각했습니다. 굳이 화면에 잠깐 띄워둘 값 때문에 전역 캐시 롤백 로직까지 짤 필요는 없다고 판단해, 찜 기능에는 가볍고 선언적인 useOptimistic을 선택했습니다.

## 마치며

처음에는 찜 버튼 하나 답답한 걸 고쳐 보자고 가볍게 시작했는데, 덕분에 useOptimistic과 startTransition을 제대로 공부해 볼 수 있었습니다. 문서만 읽을 때는 잘 와닿지 않던 부분도, React 코드를 직접 열어 보고 Lab에서 하나씩 눌러 보면서 이해할 수 있었습니다.

TanStack Query와 `useOptimistic` 중 무엇으로 풀지 고민한 과정도 재밌었습니다. 늘 쓰던 라이브러리였는데, 서버에서 받아 온 값을 담는 캐시와 화면에 잠깐 보여 줄 값을 각각 어디에 두어야 하는지는 이번에 처음 제대로 고민해 봤습니다.

돌아보면 이 공부는 모두 사용자를 이 바쁘디 바쁜 현대사회에서 기다리지 않고 사용하게 하고 싶다는 고민에서 시작됐었는데, 덕분에 꽤 많은 걸 배울 수 있었던 작업이었습니다.                              

## 참고

- [useOptimistic – React](https://react.dev/reference/react/useOptimistic)
- [useTransition – React](https://react.dev/reference/react/useTransition)
- [React v19 – Actions](https://react.dev/blog/2024/12/05/react-19)
- [Optimistic Updates – TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Concurrent Optimistic Updates in React Query – TkDodo](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [Mastering Mutations in React Query – TkDodo](https://tkdodo.eu/blog/mastering-mutations-in-react-query)
- [Handling API request race conditions in React – Sébastien Lorber](https://sebastienlorber.com/handling-api-request-race-conditions-in-react) — stale response 문제의 고전적 정리
- [The Optimistic UI Race Condition That Only Showed Up on the Fifth Click – DEV](https://dev.to/shubhradev/the-optimistic-ui-race-condition-that-only-showed-up-on-the-fifth-click-5a55)
- [JavaScript Async Race Conditions: Fix Stale UI – FrontendAtlas](https://frontendatlas.com/javascript/trivia/js-async-race-conditions) — AbortController · request-id · takeLatest 세 가지 처방 비교
