---
title: '한국인들을 위한 낙관적인 업데이트 적용기'
date: '2026-09-20'
description: 'useOptimic과 startTransition으로 낙관적인 업데이트 처리하기'
tags: ['React', 'useOptimistic', 'Optimistic UI', 'TanStack Query', 'Frontend']
category: '개발'
featured: true
---

요즘 스토어 개편 작업을 맡아 개발하고 있는데요! 그런데 상품 카드의 찜 하트를 누를 때마다 뭔가 답답했습니다. 누르면 버튼이 회색으로 잠기고, 한참 뒤에야 하트가 채워집니다. 못 기다릴 정도는 아닙니다. 하지만 참을성 없는 한국인으로서, 그리고 제가 사용자라고 생각한다면 서버 응답을 기다릴때까지 UI가 기다린다는 구조 자체가 정말 불편하게 느껴졌습니다.

## 시작점: 왜 답답했나

처음에는 정말 단순하게 state를 활용한 코드를 짰었습니다. 그러다보니 응답을 기다려야 state가 반영이 되었습니다. 여기서 문제점은 서버 지연 속도가 느리게 된다면 사용자는 찜을 위해 여러번 기다려야하는것입니다. 그렇게 되면 사용자 입장에서는 찜을 했다가 취소할수도있는데 서버를 위해 기다려야된다는 불편한 점을 느낄수도 있겠다는 생각을 했습니다.

<img src="./blocking-timeline.gif" alt="찜 하트를 누르면 버튼이 잠기고, 응답이 온 뒤에야 하트가 채워진다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">서버 응답이 올 때까지 하트가 바뀌지 않는 차단형 찜 버튼</div>

## 그래서 사용자가 편하려면?

그래서 저는 찜을 불편함 없이 쓰려면 사용자는 서버 사정을 몰라야 한다고 정의하기로 했습니다. 눌렀으면 눌린 것이고, 그 뒤처리는 코드가 알아서 해야 한다고 생각합니다. 그렇게 정하고 나니 고민이 줄줄이 따라왔습니다.

1. 서버 응답과 관계없이 화면부터 바꾸려면 — 낙관적 UI를 어떻게 적용할 것인가
2. 그러면 연타했을 때 서버 요청은 어떻게 관리할 것인가
3. 요청이 아직 진행 중인데 사용자가 다시 누르면 어떻게 할 것인가
4. 낙관적으로 바꿔놨는데 서버가 실패하면 어떻게 되돌릴 것인가
5. 만약 낙관적 UI로 상태가 서버보다 앞서가게 될텐데 어긋난 요청을 어떻게 관리할 것인가?
6. 요청을 미뤄두고 사용자가 페이지를 떠나면 그 찜은 어디로 가는가

화면부터 바꾸면 되겠다 싶었는데, 그러면 연타할 때 요청이 클릭 수만큼 나가지 않을까? 그래서 마지막 클릭만 보내면, 이미 출발한 요청은 어떻게 하지? 그걸 취소하면, 실패했을 때는 대체 어느 값으로 되돌려야 하지? 그 사이에 화면은 서버보다 앞서가 있을 텐데, 늦게 온 응답이 화면을 덮어쓰면? 게다가 요청을 미뤄 둔 사이에 사용자가 페이지를 떠나 버리면?

이 상황들을 순서대로 따라가 보니 결국 서버에서 나오는 응답 값과 지금 화면에 보여 줄 값을 따로 들고 있어야 하고, 요청이 진행 중인 구간이 언제 시작해서 언제 끝나는지 알아야 했습니다. 그 지점에서 떠오른 부분이 `useOptimistic`과 `startTransition`이었습니다.

## 그냥 useState로 하면 안 될까?

`useOptimistic`을 적용해보기 전에 의문점이 하나 들수도 있습니다. 낙관적 UI라고 해 봐야 화면 먼저 바꾸고, 실패하면 되돌리면되는데 `useState` 쓰면 되지 않을까? 실제로 가장 먼저 떠올리기 쉬운 코드는 이렇습니다.

```tsx
const [shown, setShown] = useState(false);

const toggle = () => {
  const next = !shown;
  setShown(next); // 화면 먼저

  server
    .set(next)
    .then(() => setShown(next)) // 성공하면 확정
    .catch(() => setShown(!next)); // 실패하면 반대로 되돌리기
};
```

한 번만 누르게 되면 동작은 합니다. 하지만 그렇게 되면 아래처럼 몇가지 문제점이 생깁니다.

### 응답이 화면을 덮어쓰임

찜을 누르고 곧바로 해제를 누르면 `POST`와 `DELETE` 요청이 동시에 떠 있게 되고, 화면의 하트는 마지막 클릭대로 비어 있어야합니다. 문제는 각 요청에 묶인 `.then`이 응답이 도착하는 순서대로 화면을 덮어쓴다는 점입니다.

`POST` 응답이 먼저 오면, 이미 지나간 찜 클릭의 `setShown(true)`가 하트를 다시 채웠다가 `DELETE` 응답이 와서야 비웁니다. 사용자 눈에는 하트가 혼자 깜빡이게 됩니다.

| 시간   | 일어난 일   | 처리              | 화면                               |
| ------ | ----------- | ----------------- | ---------------------------------- |
| 0ms    | 찜 클릭     | `POST` 전송       | 하트 채움                          |
| 100ms  | 해제 클릭   | `DELETE` 전송     | 하트 비움 (요청 2개가 동시에 진행) |
| 1200ms | POST 응답   | `setShown(true)`  | 하트가 다시 채워짐                 |
| 1300ms | DELETE 응답 | `setShown(false)` | 다시 비워짐                        |

### 두 요청이 실패한다면?

같은 상황에서 두 요청이 모두 실패했다고 해 볼게요. 각 요청은 자기 클릭 직전 값으로 되돌립니다. 찜 요청은 `setShown(!true)` = `false`, 해제 요청은 `setShown(!false)` = `true`입니다. 찜 요청이 롤백될 때는 하트가 이미 비어 있어 아무 변화가 없고, 마지막에 해제 요청이 롤백되면서 하트를 채운 채로 끝납니다. 서버에는 아무것도 반영되지 않았는데 화면에는 하트가 채워진 채로 남게됩니다.

| 시간   | 일어난 일   | 처리              | 화면                     |
| ------ | ----------- | ----------------- | ------------------------ |
| 0ms    | 찜 클릭     | `POST` 전송       | 하트 채움                |
| 100ms  | 해제 클릭   | `DELETE` 전송     | 하트 비움                |
| 1200ms | POST 실패   | `setShown(false)` | 이미 비어 있어 변화 없음 |
| 1300ms | DELETE 실패 | `setShown(true)`  | 하트가 채워진 채로 끝남  |

결국 문제는 직전 값이라고 생각한 것도 서버가 확인해 준 값이 아니라는 점입니다. 제대로 하려면 서버가 확인해 준 값을 따로 저장해 두고, 아직 안 끝난 요청이 몇 개인지 세다가, 전부 끝나면 그 값으로 화면을 맞춰야 합니다. 그렇다고 서버 응답에 맞춰서만 state를 바꾸면, 처음의 차단형 버튼처럼 응답이 올 때까지 화면이 멈춰 있는 구간이 다시 생깁니다. 이 두 가지 불편함을 대신 해결해 주는 게 `useOptimistic`과 `startTransition`입니다.

## useOptimistic이란?

`useOptimistic`은 비동기 작업이 대기 중인 동안 화면에 다른 상태를 보여 줄 수 있게 해 주는 Hook입니다. 사용법은 간단합니다.

```tsx
const [value, setValue] = useState(false); // 기준 상태: 서버가 확인해 준 값
const [shown, show] = useOptimistic(value); // 낙관적 상태: 화면에 보여 줄 값
```

여기서 두 상태의 역할이 다릅니다. `value`는 기준 state로, 서버가 성공했다고 응답했을 때만 바꾸는 실제 값입니다. `shown`은 낙관적 state로, 화면에 렌더링하는 값입니다. 서버 요청은 우리 코드가 보내고, `useState`는 그 결과를 담아 두기만 합니다.

대기 중인 낙관적 업데이트가 없으면 `shown`은 `value`와 같습니다. 찜 버튼을 눌러 `show(true)`를 호출하면 낙관적 업데이트가 하나 쌓이고, `value`는 `false` 그대로인 채 `shown`만 먼저 `true`가 됩니다. 기준 상태 위에 낙관적 업데이트를 잠깐 덧씌운다고 생각하면 쉽습니다.

찜 버튼을 한 번 눌렀을 때 두 상태는 이렇게 움직입니다.

| 시점        | 일어난 일              | `shown` | `value` | 비고         |
| ----------- | ---------------------- | ------- | ------- | ------------ |
| 클릭        | `show(true)`           | true    | false   |              |
| 응답 대기   | 서버 응답 기다림       | true    | false   |              |
| 응답 성공   | `setValue(true)`       | true    | true    | 아직 커밋 전 |
| Action 완료 | 낙관적 업데이트 되돌림 | true    | true    | 한 번에 커밋 |

여기서 `shown`이 다시 `value`를 따라가는 시점이 중요합니다. 응답이 성공해 `setValue(true)`를 호출해도 그 업데이트는 바로 커밋되지 않고, Action이 완료될 때까지 기다립니다. 그리고 Action이 완료되면 낙관적 업데이트를 되돌리는 일과 `value`의 변경을 같은 렌더에서 계산해 한 번에 커밋합니다. 만약 낙관적 업데이트가 먼저 되돌려졌다면 그 순간 `value`는 아직 `false`라서 하트가 잠깐 비었다가 다시 채워졌을 겁니다. 한 번에 커밋되기 때문에 이런 깜빡임이 생기지 않습니다.

요청이 실패하면 `setValue`를 호출하지 않으니 `value`는 계속 `false`로 남아 있습니다. Action이 완료되어 낙관적 업데이트가 되돌려지면 `shown`도 `false`가 되고, 하트는 원래대로 돌아갑니다. 성공이든 실패든 React는 낙관적 업데이트를 되돌리고 기준 상태를 보여 줄 뿐이라, 롤백 코드를 따로 작성할 필요가 없습니다.

이렇게 React가 낙관적 업데이트를 되돌리는 기준은 `show()`를 호출한 Action이 완료되는 시점입니다. 그래서 `show()`는 반드시 Action 안에서 호출해야 합니다. Action 밖에서 호출하면 언제 되돌릴지 기준이 없어서, 경고가 뜨고 낙관적 상태가 바로 사라집니다.

## startTransition이란?

그렇다면 Action은 어떻게 만들까요? 가장 기본적인 방법이 `startTransition`입니다.

`startTransition`은 넘긴 함수가 실행되는 동안 일어난 상태 업데이트를 우선순위가 낮은 업데이트, 즉 Transition으로 처리합니다. React 19부터는 여기에 `async` 함수도 넘길 수 있게 되었고, 이렇게 `startTransition`에 넘기는 함수를 Action이라고 부릅니다.

```tsx
startTransition(async () => {
  show(true); // Action 안에서 호출
  await server.set(true);
}); // 이 함수가 끝나면 Action 완료
```

앞에서 `useOptimistic`이 낙관적 업데이트를 되돌린다고 했던 때가 바로 이 함수가 끝나는 시점입니다.

`startTransition`만으로는 Action이 진행 중인지 알 수 없습니다. 진행 여부가 필요하다면 `useTransition`을 쓰면 됩니다. `useTransition`이 돌려주는 `startTransition`은 위와 똑같이 동작하고, 여기에 Action이 대기 중인지를 알려 주는 `isPending`이 함께 따라옵니다.

### 함께 사용하기

두 Hook을 함께 사용한 실제 찜 버튼 코드를 간단히 옮기면 다음과 같습니다.

```tsx
const [shown, show] = useOptimistic(value);
const [isPending, startTransition] = useTransition();

const toggle = () => {
  const next = !shown;
  startTransition(async () => {
    show(next); // 화면 먼저
    try {
      await applyWish(productId, next); // 찜이면 POST, 해제면 DELETE
      setValue(next); // 성공했을 때만 확정
    } catch (error) {
      showToast({ message: '찜 처리에 실패했어요. 잠시 후 다시 시도해주세요.', tone: 'fail' });
    }
  });
};
```

버튼을 한 번 눌렀을 때 세 값이 어떻게 바뀌는지 정리해 보겠습니다. 요청이 성공하면 이렇게 움직입니다.

| 시점        | 일어난 일              | `shown` | `value` | `isPending` | 비고         |
| ----------- | ---------------------- | ------- | ------- | ----------- | ------------ |
| 클릭        | `show(true)`           | true    | false   | true        |              |
| 응답 대기   | 서버 응답 기다림       | true    | false   | true        |              |
| 응답 성공   | `setValue(true)`       | true    | true    | true        | 아직 커밋 전 |
| Action 완료 | 낙관적 업데이트 되돌림 | true    | true    | false       | 한 번에 커밋 |

요청이 실패하면 `setValue`를 호출하지 않습니다.

| 시점        | 일어난 일              | `shown` | `value` | `isPending` |
| ----------- | ---------------------- | ------- | ------- | ----------- |
| 클릭        | `show(true)`           | true    | false   | true        |
| 응답 대기   | 서버 응답 기다림       | true    | false   | true        |
| 응답 실패   | `setValue` 호출 안 함  | true    | false   | true        |
| Action 완료 | 낙관적 업데이트 되돌림 | false   | false   | false       |

실패한 경우에도 롤백 코드 없이 `shown`이 `false`로 돌아오는 것을 확인할 수 있습니다.

## 파고들기: 문서만으로는 안 풀리던 질문들

그러면 이때까지 `useOptimistic`, `startTransition`에 대해 알아봤는데요. 그러면 저렇게만 알면 충분한걸까요? 해당 부분을 공부를 하다보니 아래처럼 고민이 생기게 되었습니다.

- 실패하면 누가 값을 되돌리는 걸까?
- 연타해서 Action이 겹치면 왜 깜빡이지 않을까?
- 요청이 진행 중일 때 다시 누르면, 이전 요청은 어떻게 될까?

문서만으로는 잘 와닿지 않아서, [Optimistic UI Lab](/playground/optimistic-ui/)에서 서버 지연과 실패를 조절해 가며 직접 눌러 보고 확인했습니다.

### 실패하면 누가 되돌릴까?

Lab에서 실패 모드를 켜고 찜을 눌러 보면, 하트가 먼저 채워졌다가 서버 응답이 실패한 뒤 원래대로 돌아옵니다. 코드에는 롤백하는 줄이 한 줄도 없는데 말이죠.

<img src="./optimistic-fail.gif" alt="서버 실패 모드에서 찜을 누르면 하트가 먼저 채워졌다가 응답 실패 후 원래대로 돌아온다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">롤백 코드 없이 실패하면 하트가 원래대로 돌아온다</div>

이유는 React 내부 코드에서 찾을 수 있었습니다. 프로젝트에 설치된 `react-dom`의 개발용 빌드 파일을 열어 보면, `show()`를 호출했을 때 실행되는 `dispatchOptimisticSetState` 함수가 있습니다.

```js
// node_modules/react-dom/cjs/react-dom-client.development.js
// dispatchOptimisticSetState (react-dom 19.3.0)
action = {
  lane: 2, // 가장 높은 우선순위로 바로 렌더링
  revertLane: requestTransitionLane(), // 이 Action이 끝나는 렌더링에서 버려짐
  gesture: null, // 제스처 Transition용 실험 기능, 정식 버전에서는 항상 null
  action: action, // show()에 넘긴 값
  hasEagerState: !1, // 미리 계산한 결과가 있는지 (낙관적 업데이트는 항상 false)
  eagerState: null, // 미리 계산한 결과
  next: null // 업데이트 큐에서 다음 업데이트를 가리킴
};
```

`show()`를 호출하면 이 객체가 하나 만들어져 업데이트 큐에 쌓입니다.

여기서 눈여겨볼 값은 `lane`과 `revertLane`입니다. 같은 파일에서 일반 `setState`가 만드는 업데이트 객체와 나란히 놓고 보면 차이가 잘 보입니다.

```js
// node_modules/react-dom/cjs/react-dom-client.development.js

// 일반 setState → dispatchSetStateInternal
var update = {
  lane: lane, // 이벤트나 Transition에 따라 정해진 우선순위
  revertLane: 0, // 0 = 되돌리지 않음. 한 번 적용되면 계속 남는다
  gesture: null,
  action: action,
  hasEagerState: !1,
  eagerState: null,
  next: null
};

// useOptimistic의 show() → dispatchOptimisticSetState
action = {
  lane: 2, // 항상 가장 높은 우선순위로 바로 렌더링
  revertLane: requestTransitionLane(), // 현재 Action의 우선순위. 이 렌더링이 오면 버려진다
  gesture: null,
  action: action,
  hasEagerState: !1,
  eagerState: null,
  next: null
};
```

나머지 값은 같고 `lane`과 `revertLane`만 다릅니다. 일반 `setState`는 `revertLane`이 `0`이라 한 번 적용된 업데이트가 그대로 남습니다. 반면 낙관적 업데이트는 `lane`이 `2`라서 바로 화면에 보이고, `revertLane`에 Action의 Transition 우선순위가 들어가 있어서 그 Action이 끝나면 사라집니다.

실제로 업데이트를 버리는 부분은 같은 파일의 `updateReducerImpl` 함수에 있습니다.

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

업데이트 큐를 하나씩 꺼내면서, 낙관적 업데이트는 두 가지 경우로 나뉩니다. Action이 아직 진행 중이면 값을 적용하고 큐에 복사본을 남겨 두기 때문에, 그사이 다른 이유로 다시 렌더링되더라도 `shown`은 계속 낙관적 값을 유지합니다. 그리고 Action이 끝나 `revertLane`으로 렌더링할 때가 오면 이 업데이트를 건너뜁니다. 낙관적 업데이트가 빠진 채로 다시 계산되니 `shown`은 `value`와 같아집니다.

즉 React는 요청이 실패했는지 알지 못합니다. 성공이든 실패든 Action이 끝나면 낙관적 업데이트를 빼고 다시 계산할 뿐입니다. 성공해서 `setValue(true)`를 호출했다면 `value`가 `true`라 하트가 그대로 남고, 실패해서 호출하지 않았다면 `value`가 `false`라 되돌아간 것처럼 보이는 것입니다.

### 연타하면 왜 깜빡이지 않을까?

서버 지연을 늘리고 찜을 누른 뒤 곧바로 해제를 눌러 보면 차이가 확실히 보입니다. `useState`로 만든 버전은 응답이 도착할 때마다 하트가 다시 채워졌다 비워지지만, `useOptimistic` 버전은 마지막으로 누른 상태 그대로 유지됩니다.

<img src="./optimistic-rapid.gif" alt="찜과 해제를 빠르게 누르면 useState 버전은 응답마다 하트가 깜빡이고 useOptimistic 버전은 마지막 상태를 유지한다" loading="lazy" style="width: 640px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">왼쪽 useState 버전은 응답이 올 때마다 깜빡이고, 오른쪽 useOptimistic 버전은 마지막으로 누른 상태를 유지한다</div>

진행 중인 Action이 있을 때 새로 시작한 Action은 같은 묶음으로 엮입니다. React는 묶인 Action이 모두 끝날 때까지 그 안의 상태 업데이트를 커밋하지 않습니다.

| 시점           | 일어난 일         | 결과                                                        |
| -------------- | ----------------- | ----------------------------------------------------------- |
| 찜 클릭        | `show(true)`      | `shown`: true, Action 1개 진행 중                           |
| 해제 클릭      | `show(false)`     | `shown`: false, 같은 묶음으로 엮여 Action 2개 진행 중       |
| 찜 응답 성공   | `setValue(true)`  | 해제 Action이 남아 있어 커밋되지 않음                       |
| 해제 응답 성공 | `setValue(false)` | 모든 Action 완료, `value`·`shown` 모두 false로 한 번에 커밋 |

찜 요청이 먼저 성공해 `setValue(true)`를 호출해도, 해제 요청이 끝나기 전까지는 화면에 반영되지 않습니다. 마지막에 `setValue(true)`와 `setValue(false)`가 순서대로 처리된 최종 값만 한 번에 커밋됩니다. 먼저 보낸 요청만 실패하는 경우도 마찬가지로, 나중 요청이 끝날 때까지 롤백이 일어나지 않아 하트가 중간에 비었다 채워지는 일이 없습니다.

### 요청이 진행 중일 때 다시 누르면?

화면은 깜빡이지 않게 됐지만, 요청은 여전히 클릭한 횟수만큼 나갑니다. 찜을 눌렀다가 바로 해제하면 `POST`와 `DELETE`가 모두 서버로 갑니다. 사용자가 원한 건 결국 "찜 안 함" 하나인데 말이죠.

그래서 스토어에서는 클릭마다 `AbortController`를 하나씩 만들고, 요청을 보내기 전에 400ms를 기다리게 했습니다.

```tsx
const toggle = () => {
  const next = !shown;
  lastRef.current?.abort(); // 새로 누르면 이전 클릭은 취소
  const controller = new AbortController();
  lastRef.current = controller;

  startTransition(async () => {
    show(next);
    await sleep(400, controller.signal); // 400ms 기다리되, 취소되면 바로 끝남
    if (controller.signal.aborted) return; // 그사이 다시 눌렸다면 요청을 보내지 않음

    try {
      await applyWish(productId, next, controller.signal); // 요청에도 같은 signal 전달
      if (controller.signal.aborted) return; // 응답이 왔어도 이미 취소된 클릭이면 무시
      setValue(next);
    } catch (error) {
      if (!controller.signal.aborted) onError(error);
    }
  });
};
```

다시 누른 시점에 따라 두 가지로 나뉩니다.

먼저 요청이 나가기 전, 400ms 안에 다시 누른 경우입니다. 이전 클릭의 `sleep`이 취소로 바로 끝나고 `return` 하기 때문에 요청은 아예 나가지 않습니다. 화면은 낙관적 업데이트로 바뀌어 있지만, 서버에는 마지막 클릭 하나만 전달됩니다.

<img src="./abort-debounce.gif" alt="400ms 안에 찜, 해제, 찜을 빠르게 누르면 요청은 마지막 POST 하나만 나간다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">400ms 안에 세 번 눌렀지만 요청은 POST 하나만 나간다</div>

다음은 이미 `POST`가 나간 뒤에 다시 누른 경우입니다. 이때는 이전 클릭의 컨트롤러를 `abort()` 해서 진행 중인 `POST`를 취소하고, 새 클릭의 `DELETE`를 보냅니다.

<img src="./abort-inflight.gif" alt="POST가 나간 뒤 다시 누르면 POST를 취소하고 DELETE를 보낸다" loading="lazy" style="width: 320px; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;" />
<div class="caption">진행 중인 POST를 취소하고 DELETE를 보낸다. 서버는 이미 받은 POST도 처리한다</div>

| 시점        | 일어난 일                | 결과                                       |
| ----------- | ------------------------ | ------------------------------------------ |
| 찜 클릭     | 400ms 뒤 `POST` 전송     | 하트 채움                                  |
| 해제 클릭   | 이전 컨트롤러 `abort()`  | `POST` 응답은 더 이상 기다리지 않음        |
| 400ms 뒤    | `DELETE` 전송            | 하트는 계속 비어 있음                      |
| `POST` 처리 | 서버는 이미 받은 요청 처리 | 클라이언트는 결과를 무시                   |
| `DELETE` 응답 | `setValue(false)`      | 서버도 찜 안 함, 화면과 서버가 일치         |

여기서 주의할 점이 있습니다. `abort()`는 클라이언트가 응답을 기다리지 않겠다는 뜻일 뿐, 서버에 이미 도착한 요청까지 되돌리지는 않습니다. 위 로그에서도 `POST`는 클라이언트에서 취소됐지만 서버는 그대로 처리했습니다. 그래서 요청에는 "뒤집어라"가 아니라 "이 상태로 만들어라"를 담았습니다. 찜이면 `POST`, 해제면 `DELETE`처럼 목표 상태를 보내면, 이전 요청이 서버에 반영됐더라도 마지막 요청이 최종 상태를 맞춰 줍니다.

## 실패했을 때 사용자에게는?

자동 롤백은 편하지만, 사용자 입장에서는 **하트가 말없이 비워지는** 것입니다. 왜 비워졌는지 모르면 "내가 잘못 눌렀나?" 하고 다시 누르게 됩니다.

선택지는 크게 세 가지입니다.

- **조용히 롤백**: 찜처럼 가볍고, 하트가 비워진 것 자체가 피드백이 되는 경우.
- **토스트 + 재시도**: "찜하지 못했어요. 다시 시도해 주세요." 사용자가 실패를 확실히 알아야 하는 경우.
- **스크린 리더 안내**: 하트 모양만 바뀌면 화면을 보지 않는 사용자는 롤백을 알 수 없습니다. 버튼의 `aria-pressed`를 `shown`에 연결하고, 실패 메시지는 `aria-live` 영역으로 알려 줍니다.

스토어에서는 토스트를 택했습니다. 앞에서 말한 것처럼 하트가 말없이 비워지면 사용자는 다시 누를 뿐이고, 왜 안 됐는지는 끝까지 알 수 없기 때문입니다. 하트 버튼의 `aria-pressed`도 `shown`에 연결해 두었기 때문에, 화면을 보지 않는 사용자에게도 롤백된 상태가 그대로 전달됩니다.

그런데 토스트를 붙이자 문제가 하나 생겼습니다. `abort()`로 취소한 요청도 `catch`로 들어온다는 점입니다. 연타할 때마다 이전 요청이 취소되니, 그대로 두면 사용자가 하트를 빠르게 누르기만 해도 실패 토스트가 쌓이게 됩니다. 새 클릭이 이전 요청을 취소한 것은 실패가 아니므로 `signal.aborted`로 걸러 줘야 합니다.

```tsx
} catch (error) {
  if (!controller.signal.aborted) onError(error); // 새 클릭이 취소한 요청은 실패가 아니다
}
```

실패 중에서도 로그인이 풀린 경우는 따로 다뤘습니다. 이때는 다시 시도해도 똑같이 실패하니, 토스트 대신 로그인 안내 시트를 띄웁니다.

```tsx
onError: (error) => {
  if (error instanceof WishlistAuthError) return promptLogin();
  showToast({ message: '찜 처리에 실패했어요. 잠시 후 다시 시도해주세요.', tone: 'fail' });
},
```

## TanStack Query랑은 뭐가 다를까? 언제 쓰면 안 될까?

낙관적 업데이트를 찾아보면 TanStack Query의 `onMutate` 방식이 가장 많이 나옵니다. 둘 다 써 볼 만한데, **낙관적 값을 어디에 두느냐**가 다릅니다.

```tsx
// TanStack Query: 쿼리 캐시를 직접 고친다
useMutation({
  mutationFn: (next: boolean) => api.setWish(productId, next),
  onMutate: async (next) => {
    await queryClient.cancelQueries({ queryKey: ['wish', productId] }); // 진행 중 refetch 취소
    const prev = queryClient.getQueryData(['wish', productId]); // 스냅샷
    queryClient.setQueryData(['wish', productId], next); // 캐시를 낙관적으로 수정
    return { prev };
  },
  onError: (_e, _next, ctx) => queryClient.setQueryData(['wish', productId], ctx?.prev), // 직접 롤백
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['wish', productId] }),
});
```

|                  | `useState` 직접         | `useOptimistic`               | TanStack Query `onMutate`             |
| ---------------- | ----------------------- | ----------------------------- | ------------------------------------- |
| 낙관적 값의 위치 | 컴포넌트 state          | 컴포넌트 렌더 결과 (덧씌우기) | 쿼리 캐시                             |
| 롤백             | 직접 (기준값 관리 필요) | 자동 (빼고 다시 계산)         | `onError`에서 스냅샷으로 직접         |
| 여러 화면 동기화 | 어려움                  | 그 컴포넌트에서만 보임        | 같은 쿼리를 쓰는 모든 화면            |
| 겹친 요청        | 직접 처리               | Action 엮임 + abort           | `cancelQueries` + `invalidateQueries` |

TanStack Query 문서도 같은 기준을 제시합니다. 낙관적 값을 **한 곳에서만** 보여 주면 UI 쪽에서 처리하고, **여러 곳**에서 같은 데이터를 보면 캐시를 고치라는 것입니다. 상품 카드의 하트처럼 그 자리에서만 바뀌면 되는 경우는 `useOptimistic`이 훨씬 가볍고, 상세 페이지·찜 목록·헤더 배지가 같은 찜 상태를 공유한다면 캐시 방식이 맞습니다. 둘을 섞어서 `useOptimistic`으로 즉시 반영하고, 성공 후 `invalidateQueries`로 다른 화면을 맞추는 방법도 있습니다.

스토어는 이 섞는 방식을 택했습니다. 다만 성공한 뒤에 `invalidateQueries`로 다시 받아오지 않고, 캐시를 직접 고쳤습니다.

스토어의 상품 목록에는 같은 상품이 여러 섹션에 겹쳐 나오는 경우가 많습니다. 한 카드에서 찜을 눌렀는데 아래쪽 같은 상품의 하트가 그대로라면 어색합니다. 그래서 로그인한 사용자가 찜한 상품 id 목록을 TanStack Query 캐시에 한 번 받아 두고, 모든 카드가 이 캐시를 `useOptimistic`의 기준값으로 씁니다.

```tsx
export function useWishToggle(productId: number) {
  const queryClient = useQueryClient();
  const { ids } = useWishlistedIds(); // 찜한 상품 id 목록 (쿼리 캐시)

  const { value: shown, toggle } = useOptimisticToggle({
    value: ids.has(productId),
    apply: (target, signal) => applyWish(productId, target, signal),
    write: (target) => setWishlisted(queryClient, productId, target), // 성공했을 때만 캐시 수정
    onError,
  });

  return { wished: shown, toggle };
}
```

낙관적 값은 누른 카드에만 `useOptimistic`으로 보여 주고, 캐시는 서버가 성공했다고 답한 뒤에만 `setQueryData`로 id 하나를 넣거나 뺍니다. 그러면 같은 상품을 보여 주는 다른 카드들도 그때 함께 바뀝니다. 캐시에는 확정된 값만 들어가기 때문에 `onMutate`의 스냅샷도, `onError`의 롤백도 필요 없었습니다. 목록 전체를 다시 받아오지 않으니 찜 한 번에 요청도 하나만 나갑니다.

이렇게 정리하고 나니 찜과 상관없는 부분만 남았습니다. 화면부터 바꾸고, 연타를 모으고, 이전 요청을 취소하고, 성공하면 기록하는 흐름은 결국 "켜고 끄는 버튼"이면 모두 같습니다. 그래서 이 흐름을 `useOptimisticToggle`이라는 공용 훅으로 빼 두었고, 지금은 재입고 알림 버튼도 같은 훅을 씁니다.

그리고 낙관적 UI가 항상 정답은 아닙니다. TkDodo도 낙관적 업데이트가 과하게 쓰이고 있다고 지적합니다. 이럴 때는 기다리게 하는 편이 낫습니다.

- **실패 비용이 큰 동작**: 결제, 주문, 삭제처럼 "됐다"고 보여 줬다가 되돌리면 사용자가 혼란스러운 경우.
- **결과를 서버가 만들어 주는 동작**: 쿠폰 적용 후 금액, 재고 차감 결과처럼 클라이언트가 결과를 미리 알 수 없는 경우.
- **실패가 자주 나는 동작**: 롤백이 잦으면 즉시 반응한다는 장점보다 화면이 뒤집히는 불쾌함이 더 커집니다.

찜은 실패가 드물고, 결과를 클라이언트가 정확히 알고, 되돌려도 피해가 작습니다. 낙관적 UI가 가장 잘 맞는 경우였습니다.

## 마치며

처음에는 "화면부터 바꾸면 되겠지"라고 가볍게 시작했는데, 상황을 하나씩 따라가다 보니 결국 **확정된 값과 보여 줄 값을 분리하는 것**이 핵심이었습니다. `useOptimistic`과 `startTransition`은 그 분리와 "진행 중" 구간을 React가 대신 관리해 주는 도구였고요. 이제 하트를 아무리 빠르게 눌러도 화면은 바로 반응하고, 서버에는 마지막 의도 하나만 갑니다. 참을성 없는 한국인으로서 꽤 만족스럽습니다.

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
