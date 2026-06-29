#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// gatsby-config.js에서 pathPrefix 읽기
let pathPrefix = '';
try {
  const configSrc = readFileSync(resolve(ROOT, 'gatsby-config.js'), 'utf-8');
  const prefixMatch = configSrc.match(/pathPrefix:\s*['"]([^'"]+)['"]/);
  if (prefixMatch) pathPrefix = prefixMatch[1];
} catch {}

// CLI args 파싱: [baseUrl] [--out-dir <dir>]
const args = process.argv.slice(2);
let baseUrl = 'http://localhost:8000';
let outDirArg = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out-dir' && args[i + 1]) {
    outDirArg = args[++i];
  } else if (!args[i].startsWith('--')) {
    baseUrl = args[i];
  }
}

// playground.tsx에서 link / thumbnail 필드를 파싱하여 프로젝트 목록 추출
const playgroundSrc = readFileSync(resolve(ROOT, 'src/pages/playground.tsx'), 'utf-8');

// link와 thumbnail은 각 프로젝트 객체에서 link가 먼저, thumbnail이 나중에 등장한다.
// 각 link 뒤에 가장 먼저 나오는 thumbnail을 짝지어 출력 파일명으로 사용한다.
const collect = (regex) => {
  const out = [];
  let m;
  while ((m = regex.exec(playgroundSrc)) !== null) {
    out.push({ value: m[1], index: m.index });
  }
  return out;
};

const linkMatches = collect(/link:\s*['"]([^'"]+)['"]/g);
const thumbMatches = collect(/thumbnail:\s*['"]([^'"]+)['"]/g);

const projects = linkMatches.map(({ value: link, index }) => {
  const thumb = thumbMatches.find((t) => t.index > index);
  return { link, thumbnail: thumb ? thumb.value : null };
});

if (projects.length === 0) {
  console.log('No project links found in playground.tsx');
  process.exit(0);
}

console.log(`Found ${projects.length} project(s):`);
projects.forEach((p) => console.log(`  - ${p.link}`));

const outDir = outDirArg ? resolve(ROOT, outDirArg) : resolve(ROOT, 'static/playground');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  // CI에서 설치 스텝이 알려준 실행 파일 경로를 직접 사용 (캐시 경로 불일치 방지)
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
});

for (const { link, thumbnail } of projects) {
  // 외부 링크는 CI에서 자동 캡처하지 않고, 직접 커밋한 정적 썸네일을 사용한다.
  if (link.startsWith('http')) {
    console.log(`\nSkipping external link (uses committed thumbnail): ${link}`);
    continue;
  }

  const url = `${baseUrl}${pathPrefix}${link}`;
  // 출력 파일명은 카드의 thumbnail 경로를 우선 사용하고, 없으면 link에서 유추한다.
  const fileName = thumbnail
    ? thumbnail.split('/').pop()
    : `${link.replace(/^\/playground\//, '').replace(/\//g, '-')}-thumb.png`;
  const outPath = resolve(outDir, fileName);

  console.log(`\nCapturing: ${url}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 동적 콘텐츠(커스텀 엘리먼트, 비디오 등)가 렌더링될 때까지 대기
    await page
      .waitForFunction(
        () => {
          const videos = document.querySelectorAll('video');
          if (videos.length === 0) return true;
          return [...videos].every((v) => v.readyState >= 2);
        },
        { timeout: 15000 }
      )
      .catch(() => {});

    // 렌더 안정화를 위한 추가 대기
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`  -> Saved: ${outPath}`);
  } catch (err) {
    console.error(`  -> Failed: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('\nDone!');
