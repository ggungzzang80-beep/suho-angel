/**
 * 검토용 캡처 (개발용) — 13단계 등급 UI 확인
 * 실행: LD_LIBRARY_PATH=/workspace/.tools/libs node scripts/review.mjs
 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4183/';
const OUT = '/workspace/browser/review13';
const EXE = '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });

async function shot(page, name, selector) {
  if (selector) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: `${OUT}/${name}.png` });
  } else {
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
}

async function run(mode) {
  const mobile = mode === 'm';
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await shot(page, `${mode}-tiers`, '#tiers');

  await page.locator('#intake-date').fill('19921215');
  await page.locator('#intake-time').fill('0930');
  await page.locator('#intake-city').fill('서울');
  await page.locator('li button', { hasText: '서울' }).first().click();
  await page.getByRole('button', { name: '내 지도 열기' }).click();
  await page.waitForTimeout(900);

  await page.getByRole('button', { name: '사람 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('#intake-name').fill('지우');
  await page.locator('#intake-date').fill('19940722');
  await page.locator('#intake-time').fill('1420');
  await page.locator('#intake-city').fill('서울');
  await page.locator('li button', { hasText: '서울' }).first().click();
  await page.getByRole('button', { name: '지도에 추가' }).click();
  await page.waitForTimeout(1200);

  await shot(page, `${mode}-map`, '#map');
  await page.getByRole('button', { name: '지우 자세히 보기' }).first().click({ force: true });
  await page.waitForTimeout(600);
  await shot(page, `${mode}-sheet`, '[role="dialog"]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await shot(page, `${mode}-room`, '#room');
  await ctx.close();
}

await run('m');
await run('d');
await browser.close();
console.log('done');
