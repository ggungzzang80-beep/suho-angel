/** 섹션별 검토용 캡처 (수호천사) */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:4183/';
const EXE = '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';
const OUT = '/workspace/projects/suho-angel/e2e/out';

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// 랜딩 하단 섹션(등급·계산 방식)
for (const id of ['tiers', 'how']) {
  const el = page.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await el.screenshot({ path: `${OUT}/landing_${id}.png` });
}

await page.locator('#intake-date').fill('19920315');
await page.locator('#intake-time').fill('0930');
await page.locator('#intake-city').fill('서울');
const opt = page.locator('li button', { hasText: '서울' }).first();
await opt.waitFor({ state: 'visible', timeout: 5000 });
await opt.click();
await page.getByRole('button', { name: /내 지도 열기/ }).click();
await page.waitForTimeout(800);

// 예시 친구 3명 넣기
const demo = page.getByRole('button', { name: /예시 친구 3명/ });
if (await demo.count()) {
  await demo.first().click();
  await page.waitForTimeout(900);
}

for (const [name, sel] of [
  ['chart', '#chart'],
  ['insight', '#insight'],
  ['map', '#map'],
  ['products', '#products'],
]) {
  const el = page.locator(sel);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await el.screenshot({ path: `${OUT}/result_${name}.png` });
}
console.log('ok');
await browser.close();
