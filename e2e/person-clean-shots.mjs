/**
 * 인물 상세 시트 정리 후 캡처 (모바일 390×844)
 * ------------------------------------------------------------------
 * - downloads/suho_angel_person_clean_top.png    : 시트 상단(헤더·요약·세 축·다섯 결 시작)
 * - downloads/suho_angel_person_clean_bottom.png : 시트 하단(그룹 카드·구체적 배치·가장 강한 흐름)
 * 콘솔 에러 0건을 함께 확인합니다.
 *
 * 실행: PLAYWRIGHT_BROWSERS_PATH=... node e2e/person-clean-shots.mjs  (npm run preview 서버가 떠 있어야 함)
 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4183/';
const OUT = '/workspace/downloads';
const EXE = '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';
const errors = [];

async function fillIntake(page, { name, date, time, city, gender }) {
  if (name) await page.locator('#intake-name').fill(name);
  if (gender) await page.locator(`[data-testid="gender-${gender}"]`).click();
  await page.locator('#intake-date').fill(date);
  if (time) await page.locator('#intake-time').fill(time);
  await page.locator('#intake-city').fill(city);
  const option = page.locator('li button', { hasText: city }).first();
  await option.waitFor({ state: 'visible', timeout: 4000 });
  await option.click();
}

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
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await fillIntake(page, { name: '서윤', date: '19921215', time: '0930', city: '서울', gender: 'female' });
await page.getByRole('button', { name: '내 지도 열기' }).click();
await page.waitForTimeout(1000);

/* 참고 캡처와 같은 사람(지우 · 시간 있음)으로 상세를 엽니다 */
await page.getByRole('button', { name: '사람 추가', exact: true }).click();
await page.waitForTimeout(300);
await fillIntake(page, { name: '지우', date: '19940722', time: '1420', city: '서울', gender: 'female' });
await page.getByRole('button', { name: '지도에 추가' }).click();
await page.waitForTimeout(900);

await page.getByRole('button', { name: '지우 자세히 보기' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
await page.getByRole('button', { name: '지우 자세히 보기' }).first().click({ timeout: 8000 });
/* 토스트("지도에 올랐습니다")가 사라질 때까지 기다립니다 */
await page.waitForTimeout(3000);

const scroller = page.locator('[role="dialog"] > div').first();
await scroller.evaluate((el) => {
  el.scrollTop = 0;
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/suho_angel_person_clean_top.png`, fullPage: false });

/* 하단 — 구체적 배치(행성 → 하우스) 줄부터 가장 강한 흐름·조심할 자리까지 */
const hits = page.locator('[data-testid="house-groups"] > div').last();
await hits.evaluate((el) => {
  const box = el.closest('[role="dialog"] > div');
  const offset = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
  box.scrollTop = box.scrollTop + offset - 150;
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/suho_angel_person_clean_bottom.png`, fullPage: false });

const lead = await page.locator('[data-testid="house-groups"] p').first().innerText();
const mode = await page.locator('[data-testid="house-groups"]').getAttribute('data-compat-mode');
console.log('요약 문장:', lead);
console.log('모드:', mode);
console.log('콘솔 에러:', errors.length ? errors.join(' | ') : '0건');

await browser.close();
process.exit(errors.length ? 1 : 0);
