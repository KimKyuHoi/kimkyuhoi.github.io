import React, { useState } from 'react';

/**
 * 제목을 단어 단위로 잘라 아래에서 밀어 올린다.
 * 서버에서 span으로 나눠 렌더링하고 CSS 애니메이션만 쓰기 때문에,
 * JS가 로드되기 전 첫 페인트부터 재생되고 하이드레이션 때 깜빡이지 않는다 (style.css의 .rt-word).
 */
const RevealText: React.FC<{ text: string }> = ({ text }) => {
  // 페이지 전환(pageTransition.ts) 중에 나타난 제목은 전환 효과가 이미 등장을 담당하므로 정지 상태로 둔다.
  const [still] = useState(
    () =>
      typeof document !== 'undefined' && document.documentElement.dataset.pageTransition === 'on'
  );

  return (
    <>
      {text.split(' ').map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span className={still ? 'rt-word rt-still' : 'rt-word'}>
            <span style={{ '--i': index } as React.CSSProperties}>{word}</span>
          </span>{' '}
        </React.Fragment>
      ))}
    </>
  );
};

export default RevealText;
