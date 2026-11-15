/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 글별 공유 이미지(OG 이미지, 1200×630)를 만든다. gatsby-node.js의 onPostBuild에서 쓴다.
 * satori로 레이아웃을 SVG로 그리고 resvg로 PNG로 바꾼다. 브라우저를 띄우지 않아 빌드가 빠르다.
 */
const fs = require(`fs`);
const path = require(`path`);
const { Resvg } = require(`@resvg/resvg-js`);
const satoriModule = require(`satori`);

const satori = satoriModule.default || satoriModule;

const WIDTH = 1200;
const HEIGHT = 630;
const BASE = `#0b1020`;

// 홈 화면 히어로와 같은 로고. src/images/logo.svg와 같은 좌표다.
const LOGO_STROKES = [
  { d: `M-80 130 L0 -110`, width: 75, color: `#2563eb` },
  { d: `M0 -110 L80 130`, width: 75, color: `#3b82f6` },
  { d: `M-45 40 L45 40`, width: 60, color: `#60a5fa` },
];

// 사이트 서체인 Pretendard의 한글은 Noto Sans KR(본고딕)에서 나왔다. satori가 읽을 수 있는 woff가
// 이미 의존성(@fontsource/noto-sans-kr)에 들어 있어 이것을 쓴다. korean 서브셋 파일 하나에 한글과
// 영문·숫자가 모두 들어 있다. (같은 이름으로 여러 파일을 넘기면 satori는 첫 파일만 써서 한글이 깨진다.)
const fontDir = path.join(
  path.dirname(require.resolve(`@fontsource/noto-sans-kr/package.json`)),
  `files`
);
const loadFont = (weight) => ({
  name: `Noto Sans KR`,
  data: fs.readFileSync(path.join(fontDir, `noto-sans-kr-korean-${weight}-normal.woff`)),
  weight,
  style: `normal`,
});

const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

// 제목이 길수록 글자를 줄여, 로고를 가리지 않는 폭 안에서 다섯 줄을 넘지 않게 한다.
const titleSize = (title) => {
  if (title.length <= 14) return 72;
  if (title.length <= 26) return 60;
  if (title.length <= 42) return 50;
  return 44;
};

const card = ({ title, category, siteTitle, author }) =>
  h(
    `div`,
    {
      style: {
        position: `relative`,
        display: `flex`,
        width: WIDTH,
        height: HEIGHT,
        background: BASE,
        fontFamily: `Noto Sans KR`,
        color: `#ffffff`,
      },
    },
    h(
      `svg`,
      {
        width: 500,
        height: 670,
        viewBox: `-117.5 -147.5 235 315`,
        style: { position: `absolute`, left: 760, top: -20 },
      },
      ...LOGO_STROKES.map(({ d, width, color }) =>
        h(`path`, { d, stroke: color, strokeWidth: width, strokeLinecap: `round`, fill: `none` })
      )
    ),
    h(
      `div`,
      {
        style: {
          position: `absolute`,
          left: 72,
          top: 64,
          display: `flex`,
          flexDirection: `column`,
          width: 660,
        },
      },
      h(
        `div`,
        { style: { fontSize: 30, fontWeight: 700, color: `#60a5fa`, marginBottom: 24 } },
        category
      ),
      h(
        `div`,
        {
          style: {
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.28,
            letterSpacing: `-0.02em`,
            wordBreak: `keep-all`,
          },
        },
        title
      )
    ),
    h(
      `div`,
      { style: { position: `absolute`, left: 72, bottom: 60, display: `flex`, fontSize: 28 } },
      h(`div`, { style: { fontWeight: 700 } }, siteTitle),
      h(`div`, { style: { marginLeft: 20, color: `#aab4c3` } }, author)
    )
  );

/** 폰트는 한 번만 읽고, 글마다 호출할 렌더 함수를 돌려준다. */
const createOgImageRenderer = () => {
  const fonts = [loadFont(700), loadFont(400)];

  return async (content) => {
    const svg = await satori(card(content), { width: WIDTH, height: HEIGHT, fonts });
    return new Resvg(svg).render().asPng();
  };
};

module.exports = { createOgImageRenderer };
