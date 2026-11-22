/**
 * 랜딩 문구 다듬기 확인용 캡처
 * ------------------------------------------------------------------
 * 모바일(390×844)에서 랜딩 첫 화면과 '계산 방식' 섹션을 찍습니다.
 * 실행: PATH=/workspace/.tools/node/bin:$PATH PLAYWRIGHT_BROWSERS_PATH=/workspace/.scratch/pw/browsers \
 *       LD_LIBRARY_PATH=/workspace/.tools/libs node e2e/landing-preview.mjs
 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4183/';
const EXE = '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await page.screenshot({ path: '/workspace/downloads/suho_angel_landing_polished.png' });
await page.screenshot({ path: '/workspace/downloads/suho_angel_landing_polished_full.png', fullPage: true });

const how = page.locator('#how');
await how.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await how.screenshot({ path: '/workspace/downloads/suho_angel_landing_how_mobile.png' });

const tiers = page.locator('#tiers');
await tiers.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await tiers.screenshot({ path: '/workspace/downloads/suho_angel_landing_tiers_mobile.png' });

console.log('saved: downloads/suho_angel_landing_polished.png, _full.png, _how_mobile.png, _tiers_mobile.png');
await browser.close();
