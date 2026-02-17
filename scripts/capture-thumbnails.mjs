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

// playground.tsx에서 link 필드를 파싱하여 프로젝트 목록 추출
const playgroundSrc = readFileSync(resolve(ROOT, 'src/pages/playground.tsx'), 'utf-8');

const linkRegex = /link:\s*['"]([^'"]+)['"]/g;
const links = [];
let match;
while ((match = linkRegex.exec(playgroundSrc)) !== null) {
  links.push(match[1]);
}

if (links.length === 0) {
  console.log('No project links found in playground.tsx');
  process.exit(0);
}

console.log(`Found ${links.length} project(s):`);
links.forEach((l) => console.log(`  - ${l}`));

const outDir = outDirArg ? resolve(ROOT, outDirArg) : resolve(ROOT, 'static/playground');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
});

for (const link of links) {
  // 내부 경로인 경우 baseUrl과 결합, 외부 URL은 그대로 사용
  const url = link.startsWith('http') ? link : `${baseUrl}${pathPrefix}${link}`;
  const slug = link.replace(/^\/playground\//, '').replace(/\//g, '-');
  const outPath = resolve(outDir, `${slug}-thumb.png`);

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
