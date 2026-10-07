# 낙관적 업데이트 글 작업 진행 상황

마지막 작업일: 2026-10-07

글: `content/blog/optimistic-ui/index.md` ("한국인들을 위한 낙관적인 업데이트 적용기")
Lab: `src/features/optimistic-lab/`, 페이지 `src/pages/playground/optimistic-ui.tsx`

## 다른 데스크톱에서 이어서 하기

```bash
git pull
npm install            # React 19.3.0, gatsby 5.16 으로 올라가 있음
npx gatsby develop -p 8001
```

- 8000 포트는 Docker가 쓰고 있을 수 있어서 8001 포트로 띄워 작업했다.
- 글: http://localhost:8001/optimistic-ui/
- Lab: http://localhost:8001/playground/optimistic-ui/

## 지금 글 구성

1. 도입, 시작점: 왜 답답했나 (`blocking-timeline.gif`)
2. 그래서 사용자가 편하려면? (고민 6가지)
3. 그냥 useState로 하면 안 될까? (응답이 화면을 덮어씀 / 두 요청이 실패하면)
4. useOptimistic이란? (기준 상태, 낙관적 상태, 낙관적 업데이트, 타임라인 표)
5. startTransition이란? (`startTransition` vs `useTransition`, 함께 사용하기)
6. 파고들기
   - 실패하면 누가 되돌릴까? (`optimistic-fail.gif`, `dispatchOptimisticSetState` vs `dispatchSetStateInternal` 비교, `updateReducerImpl` 분기)
   - 연타하면 왜 깜빡이지 않을까? (`optimistic-rapid.gif`)
   - 요청이 진행 중일 때 다시 누르면? (`abort-debounce.gif`, `abort-inflight.gif`, 목표 상태 전송)
7. 실패했을 때 사용자에게는? (토스트, 로그인 안내, abort된 요청은 실패로 치지 않기)
8. TanStack Query랑은 뭐가 다를까? 언제 쓰면 안 될까?
9. 마치며, 참고

뺀 것: React 소스 딥다이브(lane 엮기, isPending 내부 구현 등), jsdom 실험 로그, "await 뒤 setValue 다시 감싸기" 섹션, 정리 표, 최종 적용(훅 전체 코드, ①~⑥), Action 밖에서 `show()` 호출 섹션.

## 남은 일

- [ ] frontmatter `description` 오타: `useOptimic` → `useOptimistic`
- [ ] 글 안의 불일치 정리: "함께 사용하기" 코드는 실제 스토어처럼 `setValue`를 `startTransition`으로 감싸지 않는데, "useOptimistic이란?" 본문과 타임라인 표 두 곳에는 "`setValue(true)` → 아직 커밋 전"이라고 되어 있다. 감싸지 않으면 `value`는 바로 커밋되고, 화면은 `shown`을 보니 하트만 그대로다. 실제 스토어는 `value`가 TanStack Query 캐시라 감싸도 Transition이 되지 않는다. 글을 실제 코드 기준으로 맞출지 결정 필요
- [ ] "응답이 화면을 덮어쓰임" 아래 표 등 넓은 표는 모바일에서 가로 스크롤된다. 필요하면 열을 줄이기
- [ ] 전체 문체 한 번 더 점검 (아래 문체 원칙)
- [ ] 발행 전 `date` 확인 (현재 2026-09-20)

## 문체 원칙 (작업하면서 정한 것)

- 토스, 우아한형제들 같은 기업 기술블로그 톤: 습니다체, 문제 → 원인 → 해결
- "1번 클릭", "A. 성공", "①" 같은 번호 라벨 쓰지 않기
- 용어에 굵은 글씨나 "기준 상태(base state)" 같은 영어 병기 붙이지 않기
- "이게 바로 ~입니다" 같은 요약형 마무리, 불릿 남발 피하기
- 직접 하지 않은 경험을 지어내지 않기 (예: 처음부터 useOptimistic을 쓰려고 했다)

## 참고한 코드와 문서

- 실제 스토어 코드: `~/pinkfong/store/web/src/shared/lib/optimistic/use-optimistic-toggle.ts`, `features/wishlist-edit/lib/use-wish-toggle.ts`
  - 디바운스 400ms + 클릭마다 AbortController, 실패 시 토스트, 로그인 에러면 로그인 안내, `pending`은 `aria-busy`에만 사용
  - `value`는 TanStack Query 캐시(`useWishlistedIds`), 확정은 `setQueryData`(`setWishlisted`)
  - 페이지 이탈(`pagehide`/`keepalive`) 처리는 없음
- React 소스: `node_modules/react-dom/cjs/react-dom-client.development.js`
  - `dispatchSetStateInternal` 9516줄, `dispatchOptimisticSetState` 9563줄, `updateReducerImpl` 8352줄 (react-dom 19.3.0 기준)
- 공식 문서: https://ko.react.dev/reference/react/useOptimistic , https://ko.react.dev/reference/react/startTransition

## Lab과 GIF

Lab 카드: 차단형 / 즉시 반영(useState) / useOptimistic만 / + debounce 400ms / useOptimistic + abort

GIF 다시 만들기 (dev 서버 실행 중, ffmpeg 필요):

```bash
node scripts/capture-optimistic-lab.mjs http://localhost:8001
```

`optimistic-fail`, `optimistic-rapid`, `abort-debounce`, `abort-inflight` 네 개를 `content/blog/optimistic-ui/`에 덮어쓴다. 카드는 제목으로 찾으므로 Lab 카드 제목을 바꾸면 스크립트도 같이 고쳐야 한다.

## 이번 작업에서 같이 바뀐 공통 코드

- `package.json`: React 18 → 19.3.0, gatsby 5.14 → 5.16 (`useOptimistic` 때문)
- `src/style.css`: 모바일에서 표 안의 인라인 코드가 글자 단위로 끊기던 문제 수정, 표 셀 여백 축소
- `src/features/blog/templates/BlogPost.tsx`: 표 본문 셀이 한 줄로 늘어지지 않고 단어 단위로 줄바꿈되게 변경
- 위 두 개는 다른 글의 표에도 적용된다
