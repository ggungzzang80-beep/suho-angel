/**
 * 로컬 E2E 검증 (Playwright)
 * ------------------------------------------------------------------
 * 대상: http://127.0.0.1:4183/  (npm run preview)
 * 흐름: 30초 입력 → 차트 결과 → 사람 2명 추가 → 관계 지도 등급 표시 → 인물 상세
 *       → 잠금 해제(미리보기 결제) → 정책 모달 → 콘솔 에러 0건
 * 캡처: downloads/suho_angel_home_mobile.png, downloads/suho_angel_map_mobile.png
 *
 * 실행: PLAYWRIGHT_BROWSERS_PATH=/workspace/.scratch/pw/browsers node e2e/run.mjs
 */
import { chromium } from '/workspace/.scratch/pw/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4183/';
const OUT = '/workspace/downloads';
const SHOT_DIR = '/workspace/projects/suho-angel/e2e/out';
const EXE = process.env.E2E_CHROME ?? '/workspace/.scratch/pw/browsers/chromium-1148/chrome-linux/chrome';
const errors = [];
const failed = [];
let pass = 0;
let fail = 0;

const check = (name, condition, extra = '') => {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name} ${extra}`);
  }
};

const ctxOptionsOf = (mode) => {
  const mobile = mode === 'mobile';
  return {
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'ko-KR',
  };
};

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

/* 인물 상세 시트의 모드 분기·하우스 지수 — 화면에 그리지 않고 data 속성으로만 실어 둡니다 */
const modeOf = (page) => page.locator('[data-testid="house-groups"]').getAttribute('data-compat-mode');
const houseScoreOf = async (page) =>
  Number(await page.locator('[data-testid="house-groups"]').getAttribute('data-house-score'));

async function safeClick(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const page = locator.page();
  await page.waitForTimeout(400);
  /* scrollIntoView가 안 먹는 자리(SVG 노드 등)가 있어 Playwright의 스크롤·가림 검사를 먼저 씁니다 */
  try {
    await locator.click({ timeout: 5000 });
  } catch {
    const box = await locator.boundingBox();
    if (!box) throw new Error('element has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.waitForTimeout(300);
}

async function run(mode) {
  const mobile = mode === 'mobile';
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const ctxOptions = ctxOptionsOf(mode);
  const ctx = await browser.newContext(ctxOptions);
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${mode}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${mode}] PAGEERROR ${e.message}`));
  page.on('requestfailed', (r) => failed.push(`[${mode}] ${r.url()} · ${r.failure()?.errorText ?? ''} · at ${page.url()}`));

  console.log(`\n=== ${mode} (${mobile ? '390×844' : '1280×900'}) ===`);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  check('랜딩 타이틀', (await page.title()).includes('나의 수호천사'));
  check('30초 입력 폼 노출', await page.locator('#intake-date').isVisible());
  check('수호 고양이 12종 노출', (await page.locator('img[alt*="수호 고양이"]').count()) >= 12);
  check(
    '등급 13단계 노출',
    (await page.getByText('소울메이트').count()) > 0 &&
      (await page.getByText('짝꿍').count()) > 0 &&
      (await page.getByText('절친').count()) > 0 &&
      (await page.getByText('찐친').count()) > 0 &&
      (await page.getByText('프레너미').count()) > 0 &&
      (await page.getByText('선한 사마리아인').count()) > 0 &&
      (await page.getByText('라이벌').count()) > 0,
  );
  check('등급 구간 표기', (await page.getByText('94~99').count()) > 0 && (await page.getByText('38 이하').count()) > 0);
  check('2궤도 명칭 조력자', (await page.getByText('조력자').count()) > 0);
  check('계산 방식에 은인·후원자 그룹명', (await page.getByText(/은인·후원자/).count()) > 0);
  check('옛 표기(페러너미) 없음', (await page.getByText('페러너미').count()) === 0);
  check('프레너미 풀이 문구', (await page.getByText(/Frenemy \(프레너미\): Friend\(친구\)와 Enemy\(적\)의 합성/).count()) > 0);

  /* v5 성별 토글 — 여성/남성 2버튼, 다시 누르면 미선택으로 돌아감 */
  check(
    '성별 토글 노출',
    (await page.locator('[data-testid="gender-female"]').isVisible()) &&
      (await page.locator('[data-testid="gender-male"]').isVisible()),
  );
  check(
    '성별 첫 상태 미선택',
    (await page.locator('[data-testid="gender-female"]').getAttribute('aria-pressed')) === 'false' &&
      (await page.locator('[data-testid="gender-male"]').getAttribute('aria-pressed')) === 'false',
  );
  await page.locator('[data-testid="gender-female"]').click();
  check('성별 선택 표시', (await page.locator('[data-testid="gender-female"]').getAttribute('aria-pressed')) === 'true');
  check('성별 안내 문구', (await page.getByText(/남녀 궁합 \/ 동성 우정 궁합 가중치/).count()) > 0);
  await page.locator('[data-testid="gender-female"]').click();
  check(
    '성별 선택 해제',
    (await page.locator('[data-testid="gender-female"]').getAttribute('aria-pressed')) === 'false',
  );
  await page.locator('[data-testid="gender-female"]').click();

  if (mobile) {
    await page.screenshot({ path: `${OUT}/suho_angel_home_mobile.png`, fullPage: false });
  }

  /* 입력 */
  await fillIntake(page, { name: '서윤', date: '19921215', time: '0930', city: '서울' });
  await page.getByRole('button', { name: '내 지도 열기' }).click();
  await page.waitForTimeout(900);

  check('결과 화면 진입', await page.locator('[data-testid="result-root"]').isVisible());
  const headline = await page.locator('text=태양').first().innerText().catch(() => '');
  check('세 축 헤드라인', headline.includes('태양'), headline);
  check('천궁도 SVG', (await page.locator('svg[aria-label*="출생 천궁도"]').count()) > 0);
  check('무료 인사이트 2개 열림', (await page.getByText('내 별자리 세 축').count()) > 0);
  check('잠금 안내 노출', (await page.getByText('심층 리포트에서 열기').count()) > 0);

  /* 사람 추가 1 */
  await page.getByRole('button', { name: '사람 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await fillIntake(page, { name: '지우', date: '19940722', time: '1420', city: '서울', gender: 'female' });
  await page.getByRole('button', { name: '지도에 추가' }).click();
  await page.waitForTimeout(800);
  check('지도에 지우 등장', (await page.getByRole('button', { name: '지우 자세히 보기' }).count()) > 0);

  /* 사람 추가 2 (시간 모름) */
  await page.getByRole('button', { name: '사람 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: '시간 모름' }).click();
  await fillIntake(page, { name: '현우', date: '19870203', city: '부산', gender: 'male' });
  await page.getByRole('button', { name: '지도에 추가' }).click();
  await page.waitForTimeout(800);
  check('지도에 현우 등장', (await page.getByRole('button', { name: '현우 자세히 보기' }).count()) > 0);

  /* 사람 추가 3 (가족 · 성별 미입력 → 공통 가중치 폴백) */
  await page.getByRole('button', { name: '사람 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await fillIntake(page, { name: '수민', date: '19901109', time: '0745', city: '인천' });
  await page.getByRole('button', { name: '지도에 추가' }).click();
  await page.waitForTimeout(800);
  check('지도에 수민 등장', (await page.getByRole('button', { name: '수민 자세히 보기' }).count()) > 0);

  /* 등급 배지 · 13단계 범례 */
  const mapText = await page.locator('#map').innerText();
  const shortNames = ['소울메이트', '수호천사', '짝꿍', '은인', '찐친', '조력자', '절친', '기사', '사마리아인', '경쟁자', '호적수', '프레너미', '라이벌'];
  const missing = shortNames.filter((n) => !mapText.includes(n));
  check('지도 범례 13단계 전체', missing.length === 0, `빠짐: ${missing.join(',')}`);
  check('지도 프레너미 풀이', mapText.includes('Friend(친구)와 Enemy(적)의 합성'));

  const rows = page.locator('#room ul').last().locator('li');
  const rowCount = await rows.count();
  check('랭킹 3명', rowCount === 3, String(rowCount));
  const tierPattern = /(소울메이트|나의 수호천사|짝꿍|은인|찐친|조력자|절친|기사|선한 사마리아인|선의의 경쟁자|호적수|프레너미|라이벌)/;
  let withTier = 0;
  for (let i = 0; i < rowCount; i += 1) {
    if (tierPattern.test(await rows.nth(i).innerText())) withTier += 1;
  }
  check('랭킹 전원 등급 표시', withTier === rowCount, `${withTier}/${rowCount}`);

  /* 지도 캡처 (모바일) — 토스트가 사라진 뒤 */
  await page.waitForTimeout(2600);
  if (mobile) {
    await page.locator('#map').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/suho_angel_map_mobile.png`, fullPage: false });
  }

  /* 인물 상세 */
  await safeClick(page.getByRole('button', { name: '지우 자세히 보기' }).first());
  await page.waitForTimeout(500);
  check('인물 상세 열림', (await page.getByText('감정의 온도').first().isVisible()));
  check('교차 각 표시', (await page.getByText(/교차 각 \d+개/).first().isVisible()));
  check('13단계 중 위치 표시', (await page.getByText(/13단계 중 \d+단계/).first().isVisible()));
  check('하우스 오버레이 블록', (await page.locator('[data-testid="house-groups"]').count()) > 0);
  /* 2026-11-18 박아름 님 피드백 — 계산 표시는 화면에서 걷어냈습니다(계산은 그대로) */
  check('계산 머리글 숨김(하우스 오버레이)', (await page.getByText(/하우스 오버레이/).count()) === 0);
  check('계산 머리글 숨김(12하우스 5그룹)', (await page.getByText(/12하우스 5그룹/).count()) === 0);
  const groupNames = [
    '소울메이트 & 운명적 인연',
    '은인 & 후원자',
    '절친 & 베스트 프렌드',
    '나를 지키는 기사 & 헌신',
    '라이벌 & 경쟁자',
  ];
  let groupFound = 0;
  for (const name of groupNames) {
    if ((await page.getByText(name, { exact: true }).count()) > 0) groupFound += 1;
  }
  check('다섯 그룹 해설 전부 노출', groupFound === groupNames.length, `${groupFound}/${groupNames.length}`);
  check('그룹 하우스 번호 숨김', (await page.getByText('4·7·8·12하우스').count()) === 0);
  check('그룹 우측 소수점 수치 숨김', (await page.getByText(/^\s*[+-]\d\.\d{2}\s*$/).count()) === 0);
  check('하우스 지수 숨김', (await page.getByText(/하우스 지수/).count()) === 0);
  check('보조 하우스 계산 메모 숨김', (await page.getByText(/1하우스\(나·첫인상\)/).count()) === 0);
  check('친구 친화도 지수 숨김', (await page.getByText(/친구 친화도/).count()) === 0);
  const groupLead = await page.locator('[data-testid="house-groups"] p').first().innerText();
  check('그룹 요약 한 문장 유지', /사이예요|사이입니다/.test(groupLead), groupLead.slice(0, 60));
  check('하우스 오버레이 방향 표기', (await page.getByText(/→ (내|상대) \d+하우스/).count()) > 0);
  check('등급 산정 하단 계산 줄 숨김', (await page.getByText(/자리까지 올라왔습니다|자리로 내려왔습니다|자리에 머물렀습니다|자리에 섰습니다/).count()) === 0);
  check('가장 강한 흐름 카드 유지', (await page.getByText('가장 강한 흐름').count()) > 0);

  /* v5 성별 조합 — 나(여성) × 지우(여성) → 여여 우정 궁합 기준 (계산은 화면에 쓰지 않고 데이터 속성으로만 확인) */
  const sameModeBadge = await modeOf(page);
  check('성별 모드 분기 · 여여', sameModeBadge === 'sameFemale', sameModeBadge);
  check('모드 배지 화면 숨김', (await page.getByText(/남녀 궁합 기준|여여 우정 궁합 기준|남남 우정 궁합 기준|공통 기준/).count()) === 0);
  check('가중치 설명 문구 숨김', (await page.getByText(/하우스에 무게/).count()) === 0);
  check('역할 지표 상자 숨김', (await page.locator('[data-testid="role-signals"]').count()) === 0);
  const sameHouse = await houseScoreOf(page);
  check('동성 하우스 지수 계산됨', Number.isFinite(sameHouse), String(sameHouse));

  if (mobile) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/suho_angel_person_mobile.png`, fullPage: false });
    await page.locator('[data-testid="house-groups"]').evaluate((el) => {
      const scroller = el.closest('[role="dialog"] > div');
      if (!scroller) return;
      const offset = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTop = scroller.scrollTop + offset - 12;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/suho_angel_person_groups_mobile.png`, fullPage: false });
    /* 그룹 카드 아래 해설(구체적 배치)까지 한 화면에 */
    await page.locator('[data-testid="house-groups"]').evaluate((el) => el.scrollIntoView({ block: 'end' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/suho_angel_person_hits_mobile.png`, fullPage: false });
    await page.locator('[role="dialog"] > div').first().evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(300);
  }

  /* 잠금 해제(프로토타입 결제) */
  await page.getByRole('button', { name: /관계 심층 리포트 · 3,900원/ }).click({ timeout: 8000 });
  await page.waitForTimeout(400);
  check('결제 모달 열림', (await page.getByText('결제 금액').count()) > 0);
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole('button', { name: '미리보기로 열어보기' }).click();
  await page.waitForTimeout(600);
  check('잠금 해제 반영', (await page.getByText(/관계 심층 리포트가 열렸습니다/).count()) > 0);

  /* 닫기 */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  /* 시간 모름 인물(남성) — 하우스 오버레이 단방향 보정 + 남녀 궁합 모드 */
  await safeClick(page.getByRole('button', { name: '현우 자세히 보기' }).first());
  await page.waitForTimeout(500);
  check('시간 모름 보정 문장', (await page.getByText(/시간을 아는 쪽/).count()) > 0);
  const heteroBadge = await modeOf(page);
  check('성별 모드 분기 · 남녀', heteroBadge === 'hetero', heteroBadge);
  check('시간 모름 배지 숨김', (await page.getByText('한쪽 시간 모름').count()) === 0);
  check('남녀 역할 지표 안내 숨김', (await page.getByText(/하우스는 총점을 올리는 대신/).count()) === 0);
  if (mobile) {
    await page.locator('[data-testid="house-groups"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/suho_angel_person_hetero_mobile.png`, fullPage: false });
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  /* 성별 미입력 인물 → 공통(v4) 가중치 폴백 */
  await safeClick(page.getByRole('button', { name: '수민 자세히 보기' }).first());
  await page.waitForTimeout(500);
  const neutralBadge = await modeOf(page);
  check('성별 미입력 → 공통 기준', neutralBadge === 'neutral', neutralBadge);
  check('공통 기준 안내 문구 숨김', (await page.getByText(/v4 공통 가중치/).count()) === 0);
  check('공통 기준은 역할 지표 없음', (await page.locator('[data-testid="role-signals"]').count()) === 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  /* 같은 차트 쌍(지우)에서 성별만 바꿔 모드·가중치가 달라지는지 */
  await page.evaluate(() => {
    const raw = localStorage.getItem('suho-angel.v1');
    if (!raw) return;
    const saved = JSON.parse(raw);
    const target = saved.people.find((p) => p.name === '지우');
    if (target) target.input.gender = 'male';
    localStorage.setItem('suho-angel.v1', JSON.stringify(saved));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await safeClick(page.getByRole('button', { name: '지우 자세히 보기' }).first());
  await page.waitForTimeout(500);
  const flippedBadge = await modeOf(page);
  check('같은 차트 · 성별만 바꾸면 남녀 모드', flippedBadge === 'hetero', flippedBadge);
  const flippedHouse = await houseScoreOf(page);
  check('같은 차트 · 모드에 따라 하우스 지수가 달라짐', flippedHouse !== sameHouse, `${sameHouse} → ${flippedHouse}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  /* 원래(여여)로 되돌리고 다시 읽기 */
  await page.evaluate(() => {
    const raw = localStorage.getItem('suho-angel.v1');
    if (!raw) return;
    const saved = JSON.parse(raw);
    const target = saved.people.find((p) => p.name === '지우');
    if (target) target.input.gender = 'female';
    localStorage.setItem('suho-angel.v1', JSON.stringify(saved));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await safeClick(page.getByRole('button', { name: '지우 자세히 보기' }).first());
  await page.waitForTimeout(400);
  check('성별 되돌리면 여여 모드 복귀', (await modeOf(page)) === 'sameFemale');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  /* 정책 모달 */
  await page.locator('footer').getByRole('button', { name: '개인정보처리방침' }).click();
  await page.waitForTimeout(400);
  check('개인정보처리방침 모달', (await page.getByText('개인정보 보호책임자').count()) > 0);
  await page.getByRole('dialog').getByRole('button', { name: '환불 정책' }).click();
  await page.waitForTimeout(300);
  check('환불 정책 탭', (await page.getByText('청약철회 가능 기간').count()) > 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  /* 사업자 푸터 */
  const footer = await page.locator('footer').first().innerText();
  check('사업자 푸터', footer.includes('409-37-46363') && footer.includes('모브릭'), footer.slice(0, 80));

  /* 지도 퍼시스턴스 */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  check('새로고침 후 유지', (await page.locator('[data-testid="result-root"]').count()) > 0 && (await page.getByRole('button', { name: '지우 자세히 보기' }).count()) > 0);

  /* 초대 링크 뷰 */
  const invite = await page.evaluate(() => {
    const raw = localStorage.getItem('suho-angel.v1');
    return raw ? JSON.parse(raw) : null;
  });
  check('로컬 저장 확인', Boolean(invite?.me?.city?.name), JSON.stringify(invite?.me?.city?.name ?? null));

  await browser.close();
}

/**
 * 초대 링크로 처음 들어온 사람의 흐름 — 새 브라우저에서 따로 확인합니다.
 * (오래 쓴 탭은 렌더러 자원이 쌓여 새 방문자와 조건이 달라집니다.)
 * ① 성별이 담긴 초대 링크 → 남녀 궁합 모드
 * ② 성별이 없는 구버전 초대 링크 → 공통 기준 폴백
 * ③ 성별 필드가 없는 구버전 저장 데이터 → 공통 기준 폴백, 오류 없음
 */
async function runGuest(mode) {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const ctx = await browser.newContext(ctxOptionsOf(mode));
  const guest = await ctx.newPage();
  guest.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${mode}:guest] ${m.text()}`);
  });
  guest.on('pageerror', (e) => errors.push(`[${mode}:guest] PAGEERROR ${e.message}`));
  guest.on('requestfailed', (r) => failed.push(`[${mode}:guest] ${r.url()} · ${r.failure()?.errorText ?? ''}`));

  console.log(`\n=== ${mode} · 초대 링크 ===`);

  /* v2 초대 카드 — 이름과 별자리 자리만 담습니다(생년월일·시각·도시 없음) */
  const inviteLink = async (card) =>
    guest.evaluate((inv) => {
      const bytes = new TextEncoder().encode(JSON.stringify(inv));
      let bin = '';
      bytes.forEach((b) => {
        bin += String.fromCharCode(b);
      });
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }, card);

  const cardOf = (gender) => ({
    v: 2,
    n: '나래',
    p: [11, 4, 0, 11, 10, 5, 10, 9, 9, 7],
    a: 3,
    ...(gender ? { g: gender } : {}),
  });

  const linkWithGender = await inviteLink(cardOf('m'));
  check(
    '초대 링크에 생년월일·시각·도시가 없음',
    !/\d{8}|\d{4}-|"d"|"t"|"c"/.test(
      decodeURIComponent(
        Buffer.from(linkWithGender.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
      ),
    ),
  );
  await guest.goto(`${BASE}?invite=${linkWithGender}`, { waitUntil: 'networkidle' });
  await guest.waitForTimeout(700);
  check('초대 링크 참여 화면', (await guest.getByText(/나래님의 지도에/).count()) > 0);
  check(
    '참여 폼에도 성별 선택 버튼',
    (await guest.locator('[data-testid="gender-female"]').isVisible()) &&
      (await guest.locator('[data-testid="gender-male"]').isVisible()),
  );
  await fillIntake(guest, { name: '해나', date: '19910812', time: '1130', city: '서울', gender: 'female' });
  await guest.locator('input[type="checkbox"]').last().check();
  await guest.getByRole('button', { name: '지도에 이름 올리기' }).click();
  await guest.waitForTimeout(900);
  check('초대 참여 후 결과 화면', (await guest.locator('[data-testid="result-root"]').count()) > 0);
  await safeClick(guest.getByRole('button', { name: '나래 자세히 보기' }).first());
  await guest.waitForTimeout(500);
  const inviteBadge = await guest.locator('[data-testid="house-groups"]').getAttribute('data-compat-mode');
  check('초대 링크의 성별이 상대에 적용됨(남녀)', inviteBadge === 'hetero', inviteBadge);
  await guest.keyboard.press('Escape');
  await guest.waitForTimeout(300);

  /* 성별을 넣지 않은 초대 카드 → 공통 가중치로 폴백 */
  const legacyLink = await inviteLink(cardOf());
  await guest.evaluate(() => localStorage.clear());
  await guest.goto(`${BASE}?invite=${legacyLink}`, { waitUntil: 'networkidle' });
  await guest.waitForTimeout(700);
  check('성별 없는 초대 카드도 참여 화면', (await guest.getByText(/나래님의 지도에/).count()) > 0);
  await fillIntake(guest, { name: '보라', date: '19890423', time: '0815', city: '대전' });
  await guest.locator('input[type="checkbox"]').last().check();
  await guest.getByRole('button', { name: '지도에 이름 올리기' }).click();
  await guest.waitForTimeout(900);
  await safeClick(guest.getByRole('button', { name: '나래 자세히 보기' }).first());
  await guest.waitForTimeout(500);
  const legacyBadge = await guest.locator('[data-testid="house-groups"]').getAttribute('data-compat-mode');
  check('성별 없는 초대 카드 폴백(공통)', legacyBadge === 'neutral', legacyBadge);
  await guest.keyboard.press('Escape');
  await guest.waitForTimeout(300);

  /* 구버전 저장 데이터(성별 필드 없음) */
  await guest.evaluate(() => {
    const raw = localStorage.getItem('suho-angel.v1');
    if (!raw) return;
    const saved = JSON.parse(raw);
    delete saved.me.gender;
    saved.people.forEach((p) => {
      if (p.input) delete p.input.gender;
    });
    localStorage.setItem('suho-angel.v1', JSON.stringify(saved));
  });
  await guest.reload({ waitUntil: 'networkidle' });
  await guest.waitForTimeout(800);
  check('구버전 저장 데이터도 정상 로드', (await guest.locator('[data-testid="result-root"]').count()) > 0);
  await safeClick(guest.getByRole('button', { name: '나래 자세히 보기' }).first());
  await guest.waitForTimeout(500);
  const legacyStoreBadge = await guest.locator('[data-testid="house-groups"]').getAttribute('data-compat-mode');
  check('구버전 저장 데이터 폴백(공통)', legacyStoreBadge === 'neutral', legacyStoreBadge);
  await guest.keyboard.press('Escape');
  await guest.waitForTimeout(300);

  await browser.close();
}

mkdirSync(SHOT_DIR, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const mode of ['mobile', 'desktop']) {
  await run(mode);
  await runGuest(mode);
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
if (errors.length) {
  console.log('콘솔 에러:');
  errors.forEach((e) => console.log('  ' + e));
} else {
  console.log('콘솔 에러: 0건');
}
if (failed.length) {
  console.log('요청 실패:');
  failed.forEach((f) => console.log('  ' + f));
}
process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
