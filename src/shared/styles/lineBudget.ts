import { css } from '@emotion/react';

/*
 * 카드에서 제목과 설명이 정해진 높이를 나눠 쓰게 하는 스타일.
 * 글의 길이와 상관없이 카드 높이가 같도록 둘이 쓰는 자리의 높이를 줄 수로 정해 둔다.
 * 제목이 필요한 만큼 먼저 쓰고, 설명이 남은 줄을 쓴다. 남은 줄 수는 useExcerptFit이 재서 --excerpt-lines에 적는다.
 */

type TextSizes = {
  title: number;
  titleLine: number;
  excerpt: number;
  excerptLine: number;
  gap: number;
};

/**
 * 글자 규격(px)을 자리에 적는다. 제목 크기를 1em으로 두고 나머지를 그 비율로 바꿔 적어,
 * 글자만 키워 보는 사용자에게도 정해 둔 높이가 함께 커진다.
 */
export const budgetType = ({ title, titleLine, excerpt, excerptLine, gap }: TextSizes) => `
  --title-leading: ${titleLine / title};
  --excerpt-size: ${excerpt / title}em;
  --excerpt-leading: ${excerptLine / excerpt};
  --text-gap: ${gap}px;
  font-size: ${title}px;
`;

/**
 * 줄 수를 정한다. 제목은 최대 titleMax줄까지 쓰고, 제목이 그만큼 길 때 설명에 남는 줄 수가 excerptMin이다.
 * 제목이 한 줄 짧아질 때마다 설명이 한 줄쯤 더 쓴다.
 */
export const budgetLines = (titleMax: number, excerptMin: number) => `
  --title-max: ${titleMax};
  --excerpt-min: ${excerptMin};
  --excerpt-default: ${excerptMin + 1};
`;

/** 제목과 설명을 감싸는 자리. budgetType과 budgetLines를 함께 적어야 높이가 정해진다. */
export const budgetBlock = css`
  display: flex;
  flex-direction: column;
  gap: var(--text-gap);
  height: calc(
    var(--title-max) * var(--title-leading) * 1em + var(--text-gap) + var(--excerpt-min) *
      var(--excerpt-leading) * var(--excerpt-size)
  );

  /* 남은 자리를 넘는 설명 줄은 줄 경계에서 잘린다. 세로로만 자르고, 가로로는 글자가 잘리지 않게 둔다. */
  overflow: hidden;
  overflow: visible clip;
`;

export const budgetTitle = css`
  flex: none;
  margin: 0;
  font-size: 1em;
  line-height: var(--title-leading);
  display: -webkit-box;
  -webkit-line-clamp: var(--title-max);
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 스크립트가 줄 수를 재기 전에는, 가장 흔한 경우(제목이 최대보다 한 줄 짧을 때)의 줄 수로 보여 준다. */
export const budgetExcerpt = css`
  flex: none;
  margin: 0;
  font-size: var(--excerpt-size);
  line-height: var(--excerpt-leading);
  display: -webkit-box;
  -webkit-line-clamp: var(--excerpt-lines, var(--excerpt-default));
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
