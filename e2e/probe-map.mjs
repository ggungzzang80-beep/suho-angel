/** 관계 지도 노드 라벨이 범례/지도 밖으로 넘치는지 확인 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';
const browser = await chromium.launch({
  executablePath: '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4183/', { waitUntil: 'networkidle' });
await page.locator('#intake-date').fill('19920315');
await page.locator('#intake-time').fill('0930');
await page.locator('#intake-city').fill('서울');
const o = page.locator('li button', { hasText: '서울' }).first();
await o.waitFor({ state: 'visible' });
await o.click();
await page.getByRole('button', { name: /내 지도 열기/ }).click();
await page.waitForTimeout(700);
const demo = page.getByRole('button', { name: /예시 친구 3명/ });
if (await demo.count()) {
  await demo.first().click();
  await page.waitForTimeout(800);
}
const info = await page.evaluate(() => {
  const sq = document.querySelector('#map .aspect-square');
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom), Math.round(b.left), Math.round(b.right)]; };
  const nodes = [...document.querySelectorAll('#map .aspect-square button')].map((b) => [b.getAttribute('aria-label'), r(b)]);
  const legend = [...document.querySelectorAll('#map .space-y-1\\.5 > div')].map((d) => [d.textContent.trim().slice(0, 10), r(d)]);
  return { square: r(sq), nodes, legend };
});
console.log(JSON.stringify(info));
await browser.close();
