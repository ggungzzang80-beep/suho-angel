/** 인물 상세 시트의 실제 문구를 글로 떠서 확인합니다(캡처와 별개 증빙). */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:4183/';
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

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, locale: 'ko-KR' })).newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await fillIntake(page, { name: '서윤', date: '19921215', time: '0930', city: '서울', gender: 'female' });
await page.getByRole('button', { name: '내 지도 열기' }).click();
await page.waitForTimeout(900);

const add = async (who) => {
  await page.getByRole('button', { name: '사람 추가', exact: true }).click();
  await page.waitForTimeout(300);
  if (!who.time) await page.getByRole('button', { name: '시간 모름' }).click();
  await fillIntake(page, who);
  await page.getByRole('button', { name: '지도에 추가' }).click();
  await page.waitForTimeout(800);
};

await add({ name: '지우', date: '19940722', time: '1420', city: '서울', gender: 'female' });
await add({ name: '현우', date: '19870203', city: '부산', gender: 'male' });

for (const who of ['지우', '현우']) {
  await page.getByRole('button', { name: `${who} 자세히 보기` }).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: `${who} 자세히 보기` }).first().click({ timeout: 8000 });
  await page.waitForTimeout(700);
  const block = page.locator('[data-testid="house-groups"]');
  const text = await block.innerText();
  const header = await page.locator('[role="dialog"] h3').first().innerText();
  console.log(`\n===== ${who} (시트 제목: ${header}) mode=${await block.getAttribute('data-compat-mode')} =====`);
  console.log(text);
  console.log('--- 채택 문구 포함:', text.includes('마음이 열려 있어 인연의 끈이 닿아 있는 편이에요'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
console.log('\n콘솔 에러:', errors.length ? errors.join(' | ') : '0건');
await browser.close();
