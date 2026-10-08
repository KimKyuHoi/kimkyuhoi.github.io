#!/usr/bin/env node
// Optimistic UI Lab 카드를 녹화해 content/blog/optimistic-ui/ 에 GIF로 저장한다.
// 사용법: node scripts/capture-optimistic-lab.mjs [baseUrl]   (기본 http://localhost:8001)
// 필요: dev 서버 실행 중, ffmpeg 설치

import puppeteer from 'puppeteer';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'content/blog/optimistic-ui');
const TMP = resolve(ROOT, '.cache/optimistic-lab-capture');
const BASE = process.argv[2] ?? 'http://localhost:8001';
const URL = `${BASE}/playground/optimistic-ui/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(TMP, { recursive: true });

const browser = await puppeteer.launch({ headless: true });

// 카드 제목으로 찾는다 (카드 순서가 바뀌어도 동작하도록)
const indexOf = (page, title) =>
  page.evaluate(
    (title) =>
      [...document.querySelectorAll('[data-lab-heart]')].findIndex((h) =>
        h.parentElement.innerText.includes(title)
      ),
    title
  );
const click = (page, i) =>
  page.evaluate((i) => document.querySelectorAll('[data-lab-heart]')[i].click(), i);

async function scene(name, titles, run, total) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(URL, { waitUntil: 'load' }); // dev 서버는 HMR 때문에 networkidle 이 오지 않는다
  await page.waitForSelector('[data-lab-heart]');
  await sleep(500);

  const keep = [];
  for (const t of titles) keep.push(await indexOf(page, t));
  if (keep.includes(-1)) throw new Error(`카드를 찾지 못함: ${titles.join(', ')}`);

  // 필요한 카드만 남기고 그 영역만 녹화
  const rect = await page.evaluate((keep) => {
    const cards = [...document.querySelectorAll('[data-lab-heart]')].map((h) => h.parentElement);
    cards.forEach((c, i) => {
      if (!keep.includes(i)) c.style.display = 'none';
    });
    cards[0].parentElement.style.gridTemplateColumns = `repeat(${keep.length}, 300px)`;
    cards[keep[0]].scrollIntoView({ block: 'center' });
    const rs = keep.map((i) => cards[i].getBoundingClientRect());
    const l = Math.min(...rs.map((r) => r.left));
    const t = Math.min(...rs.map((r) => r.top));
    const r = Math.max(...rs.map((r) => r.right));
    const b = Math.max(...rs.map((r) => r.bottom));
    return { x: Math.floor(l) - 8, y: Math.floor(t) - 8, width: Math.ceil(r - l) + 16, height: Math.ceil(b - t) + 16 };
  }, keep);
  // screencast 는 화면이 바뀔 때만 프레임을 보내서, 마지막 변화가 GIF 에 담기지 않는다.
  // 눈에 띄지 않는 요소를 계속 움직여 녹화 내내 프레임이 나오게 한다.
  await page.evaluate(() => {
    const tick = document.createElement('div');
    tick.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
    document.body.appendChild(tick);
    let on = false;
    setInterval(() => {
      on = !on;
      tick.style.background = on ? '#fff' : '#fefefe';
    }, 50);
  });
  await sleep(300);

  const webm = resolve(TMP, `${name}.webm`);
  const rec = await page.screencast({ path: webm, crop: rect, scale: 2 });
  await sleep(500);
  await run(page, keep);
  await sleep(total);
  await rec.stop();
  await page.close();

  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', webm,
    '-vf', 'fps=15,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5',
    resolve(OUT, `${name}.gif`),
  ]);
  console.log(`✓ ${name}.gif`);
}

// 실패 모드에서 롤백
await scene('optimistic-fail', ['useOptimistic만'], async (p, [i]) => {
  await p.evaluate(() => document.querySelector('input[type=checkbox]').click());
  await sleep(300);
  await click(p, i);
}, 2200);

// useState vs useOptimistic: 찜 → 해제 연타
await scene('optimistic-rapid', ['즉시 반영', 'useOptimistic만'], async (p, [a, b]) => {
  await click(p, a); await click(p, b);
  await sleep(150);
  await click(p, a); await click(p, b);
}, 2400);

// 400ms 안에 찜 → 해제: 요청이 하나도 나가지 않는다
await scene('abort-debounce', ['useOptimistic + abort'], async (p, [i]) => {
  await click(p, i); await sleep(150); await click(p, i);
}, 2000);

// POST가 나간 뒤 반대 클릭: 이전 요청만 취소하고 DELETE는 보내지 않는다
await scene('abort-inflight', ['useOptimistic + abort'], async (p, [i]) => {
  await click(p, i); await sleep(1000); await click(p, i);
}, 3000);

await browser.close();
rmSync(TMP, { recursive: true, force: true });
