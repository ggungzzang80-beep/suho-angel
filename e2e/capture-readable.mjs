/**
 * 나의 수호천사 — 가독성 개선 후 모바일(390×844) 캡처·검수
 * 실행: node e2e/capture-readable.mjs
 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4183/';
const EXE = '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';
const OUT = '/workspace/downloads';

const errors = [];
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
});
const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const metrics = async (label) => {
  const m = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const els = [...document.querySelectorAll('body *')];
    const small = [...document.querySelectorAll('p, span, li, button, label, h1, h2, h3')]
      .map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.size > 0 && x.size < 12)
      .map((x) => `${x.size}px ${x.el.tagName} "${(x.el.textContent || '').trim().slice(0, 18)}"`);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: cw,
      scrollHeight: document.documentElement.scrollHeight,
      overflow: els
        .filter((el) => el.getBoundingClientRect().right > cw + 1)
        .slice(0, 6)
        .map((el) => `${el.tagName}.${(el.className || '').toString().slice(0, 50)}`),
      small: [...new Set(small)].slice(0, 12),
      smallCount: small.length,
    };
  });
  console.log(
    `[${label}] scrollWidth ${m.scrollWidth} / clientWidth ${m.clientWidth} · overflow ${
      m.scrollWidth <= m.clientWidth ? 'none' : 'YES'
    } · scrollHeight ${m.scrollHeight} · <12px ${m.smallCount}`,
  );
  if (m.small.length) console.log('   small:', m.small.join(' | '));
  if (m.overflow.length) console.log('   overflow:', m.overflow.join(' | '));
  return m;
};

/* 1) 랜딩 */
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await metrics('landing');
await page.screenshot({ path: `${OUT}/suho_angel_landing_readable.png` });

/* 2) 입력 → 결과 */
await page.locator('#intake-date').fill('19920315');
await page.locator('#intake-time').fill('0930');
await page.locator('#intake-city').fill('서울');
const opt = page.locator('li button', { hasText: '서울' }).first();
await opt.waitFor({ state: 'visible', timeout: 5000 });
await opt.click();
await page.getByRole('button', { name: /내 지도 열기/ }).click();
await page.waitForTimeout(900);
await metrics('result');
await page.screenshot({ path: `${OUT}/suho_angel_result_readable.png` });

console.log('console errors:', errors.length, errors.slice(0, 5));

/* 3) 검토용 전체 페이지(확대 없이 dpr1) */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ko-KR' });
const p2 = await ctx2.newPage();
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.waitForTimeout(400);
await p2.screenshot({ path: '/workspace/projects/suho-angel/e2e/out/landing_full.png', fullPage: true });
await p2.locator('#intake-date').fill('19920315');
await p2.locator('#intake-time').fill('0930');
await p2.locator('#intake-city').fill('서울');
const opt2 = p2.locator('li button', { hasText: '서울' }).first();
await opt2.waitFor({ state: 'visible', timeout: 5000 });
await opt2.click();
await p2.getByRole('button', { name: /내 지도 열기/ }).click();
await p2.waitForTimeout(900);
await p2.screenshot({ path: '/workspace/projects/suho-angel/e2e/out/result_full.png', fullPage: true });
console.log('review shots saved');

await browser.close();
