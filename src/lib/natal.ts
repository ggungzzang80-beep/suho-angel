/**
 * 네이탈 인사이트 (natal.ts)
 * ------------------------------------------------------------------
 * 계산된 천궁도(chart)를 사람이 읽는 문장으로 바꿉니다.
 * - 세 축: 태양(중심) · 달(감정) · 어센던트(첫인상)
 * - 원소 균형
 * - 10년 변곡점: 매년 목성·토성이 내 하우스(Whole Sign) 어디를 지나는지로 계산
 * - 직업적 재능: MC 자리·10하우스·MC 지배성·화성·토성
 * - 금전 흐름: 2·8·11하우스와 목성의 이동
 * - 월별 흐름: 해가 지나는 하우스 + 그 달의 목성·화성 각
 * 모든 수치는 실제 행성 위치 계산값(astro.ts)에서 나옵니다. 문장만 사람의 말로 옮깁니다.
 */

import type { Chart, ChartPoint } from './astro';
import { signIndexOfLongitude, transitingDates, TODAY } from './astro';
import { HOUSE_META, HOUSE_MONTH_THEME, PLANET_META, SIGNS } from './signs';

export type InsightCard = {
  id: string;
  kicker: string;
  title: string;
  free: boolean;
  paragraphs: string[];
  rows?: Array<{ label: string; value: string; note?: string }>;
};

export type YearNode = {
  year: number;
  age: number;
  jupiterHouse: number;
  saturnHouse: number;
  title: string;
  line: string;
  /** 변곡점 강조 */
  pivot: boolean;
  pivotReason?: string;
};

export type MonthNode = {
  key: string;
  label: string;
  house: number;
  theme: string;
  score: number;
  note: string;
};

export type Insights = {
  headline: string;
  oneLine: string;
  identity: Array<{ label: string; sign: string; glyph: string; line: string }>;
  balance: Array<{ element: string; count: number; percent: number }>;
  modalityLine: string;
  cards: InsightCard[];
  years: YearNode[];
  months: MonthNode[];
  career: { title: string; lines: string[]; keys: string[] };
  money: { score: number; line: string; curve: Array<{ year: number; value: number }> };
  houseOf2027: { keyword: string; line: string; jupiterHouse: number; saturnHouse: number };
};

/* ------------------------- 하우스별 트랜짓 문장 ------------------------- */

const JUPITER_LINE: Record<number, { title: string; line: string }> = {
  1: { title: '내가 앞에 서는 해', line: '먼저 손 든 사람이 가져가는 한 해입니다. 몸과 표정을 먼저 챙기면 그만큼 따라옵니다.' },
  2: { title: '내 몫이 늘어나는 해', line: '버는 길이 하나 더 열립니다. 새 수입은 크게 벌이기보다 작게 여러 번 들어오는 쪽입니다.' },
  3: { title: '말이 통하는 사람이 늘어나는 해', line: '짧은 만남과 연락이 일을 만듭니다. 글·말로 남긴 것이 오래 남는 해입니다.' },
  4: { title: '집이 중심이 되는 해', line: '집·가족 쪽에서 결정할 일이 생깁니다. 안쪽을 정리하면 바깥 일이 저절로 풀립니다.' },
  5: { title: '하고 싶은 걸 해보는 해', line: '취미가 부업이 되거나, 좋아하는 사람과의 관계가 한 칸 앞으로 갑니다.' },
  6: { title: '루틴이 몸을 바꾸는 해', line: '매일 하는 작은 일이 결과를 만듭니다. 일하는 방식만 바꿔도 성과가 달라집니다.' },
  7: { title: '짝이 정해지는 해', line: '계약·동업·연애처럼 둘이 맞추는 일이 구체화됩니다. 상대의 속도를 존중하는 쪽이 오래 갑니다.' },
  8: { title: '섞여서 커지는 해', line: '남의 돈·자원과 엮여 판이 커집니다. 조건을 문서로 남기면 좋습니다.' },
  9: { title: '멀리 나가야 답이 보이는 해', line: '배움·이동·새 판에서 기회가 옵니다. 지금 자리에서만 계산하면 답이 안 보입니다.' },
  10: { title: '이름이 알려지는 해', line: '직업과 평판에 볕이 듭니다. 하던 일을 세상에 내놓기에 가장 좋은 때입니다.' },
  11: { title: '사람이 데려오는 기회', line: '모임과 소개가 실제 돈과 기회로 이어집니다. 오래 연락 안 한 사람에게서 소식이 옵니다.' },
  12: { title: '비우는 만큼 채워지는 해', line: '겉으로 드러나는 성과보다 안쪽을 정리하는 해입니다. 쉬는 시간이 곧 실력이 됩니다.' },
};

const SATURN_LINE: Record<number, string> = {
  1: '혼자 서는 법을 배웁니다. 남에게 기대던 자리를 내가 메우게 됩니다.',
  2: '돈의 기준을 다시 세웁니다. 씀씀이를 점검하지 않으면 새는 곳이 드러납니다.',
  3: '말을 아껴야 합니다. 가까운 사람과의 약속을 가볍게 잡으면 신뢰가 상합니다.',
  4: '집안의 일을 정면으로 봅니다. 미뤄 둔 가족 문제가 정리됩니다.',
  5: '즐기던 것을 책임으로 바꾸는 시기입니다. 좋아하는 일에 규칙을 붙여야 오래갑니다.',
  6: '몸과 일의 균형을 강제로 맞춥니다. 무리한 일정은 몸이 먼저 멈춥니다.',
  7: '관계의 무게를 확인합니다. 함께 갈 사람과 정리할 사람이 갈립니다.',
  8: '묶여 있던 것을 정리합니다. 빚·계약·공유한 자원을 정돈할 때입니다.',
  9: '믿던 것을 다시 증명해야 합니다. 배움에 시간을 쓰면 다음 10년이 달라집니다.',
  10: '책임이 직함으로 옵니다. 맡은 일이 무거워지는 대신 자리가 단단해집니다.',
  11: '사람을 골라내는 시기입니다. 넓히기보다 남길 사람을 정합니다.',
  12: '쉬지 않으면 몸이 먼저 멈춥니다. 혼자 있는 시간을 일정에 넣어 두세요.',
};

/* ---------------------------- 유틸 ---------------------------- */

const transitHouse = (lon: number, ascSignIndex: number) =>
  ((signIndexOfLongitude(lon) - ascSignIndex + 12) % 12) + 1;

const midYear = (year: number) => transitingDates(year, 6, 15);

function aspectToNatal(transit: number, natal: number): { type: string; tone: 'flow' | 'tense' } | null {
  const diff = Math.abs((((transit - natal) % 360) + 540) % 360 - 180);
  const table: Array<[number, string, 'flow' | 'tense']> = [
    [0, '합', 'flow'],
    [60, '육분', 'flow'],
    [90, '사분', 'tense'],
    [120, '삼분', 'flow'],
    [180, '대립', 'tense'],
  ];
  for (const [angle, type, tone] of table) {
    if (Math.abs(diff - angle) <= 6) return { type, tone };
  }
  return null;
}

const elementCount = (chart: Chart, element: string) =>
  chart.elements.find((e) => e.element === element)?.count ?? 0;

const rulerOfSign = (signIndex: number) => SIGNS[signIndex].ruler;

const PLANET_BY_KOREAN: Record<string, string> = {
  태양: 'sun',
  달: 'moon',
  수성: 'mercury',
  금성: 'venus',
  화성: 'mars',
  목성: 'jupiter',
  토성: 'saturn',
  천왕성: 'uranus',
  해왕성: 'neptune',
  명왕성: 'pluto',
};

/* ---------------------------- 빌드 ---------------------------- */

export function buildInsights(chart: Chart): Insights {
  const sunSign = SIGNS[chart.sun.signIndex];
  const moonSign = SIGNS[chart.moon.signIndex];
  const riseSign = SIGNS[chart.rising.signIndex];
  const ascSignIndex = chart.rising.signIndex;

  const headline = `태양 ${sunSign.name} · 달 ${moonSign.name} · 어센던트 ${riseSign.name}`;

  const oneLine = `${sunSign.keyword}. ${moonSign.name}의 달이 감정의 결을, ${riseSign.name}의 어센던트가 첫인상을 만듭니다.`;

  const identity = [
    {
      label: '중심 · 태양',
      sign: sunSign.name,
      glyph: sunSign.glyph,
      line: sunSign.identity,
    },
    {
      label: '감정 · 달',
      sign: moonSign.name,
      glyph: moonSign.glyph,
      line: `${moonSign.name}의 달 — ${moonSign.keyword}. ${moonSign.love}`,
    },
    {
      label: '첫인상 · 어센던트',
      sign: riseSign.name,
      glyph: riseSign.glyph,
      line: `처음 만나는 사람에게는 ${riseSign.keyword}으로 보입니다. ${riseSign.identity.split('.')[0]}.`,
    },
  ];

  const totalElements = chart.elements.reduce((s, e) => s + e.count, 0) || 1;
  const balance = chart.elements.map((e) => ({
    element: e.element,
    count: e.count,
    percent: Math.round((e.count / totalElements) * 100),
  }));
  const elementOrder = [...chart.elements].sort((a, b) => b.count - a.count);
  const strong = elementOrder[0];
  const weak = elementOrder[elementOrder.length - 1];
  const modalityLine = `${chart.dominantModality} 기운이 중심입니다. ${
    chart.dominantModality === '활동'
      ? '먼저 시작하는 쪽이라 결정이 빠르고, 대신 마무리를 옆 사람에게 맡기기 쉽습니다.'
      : chart.dominantModality === '고정'
        ? '한 번 잡으면 놓지 않는 쪽이라 오래 가지만, 바꿔야 할 때 늦게 움직입니다.'
        : '상황에 맞춰 모양을 바꾸는 쪽이라 유연하지만, 기준이 흐려지면 흔들립니다.'
  }`;

  /* ---------- 10년 변곡점 ---------- */
  const startYear = TODAY.year;
  const years: YearNode[] = [];
  for (let i = 0; i < 10; i += 1) {
    const year = startYear + i;
    const t = midYear(year);
    const jupHouse = transitHouse(t.jupiter, ascSignIndex);
    const satHouse = transitHouse(t.saturn, ascSignIndex);
    const age = year - chart.year;

    const isSaturnReturn = (age >= 28 && age <= 30) || (age >= 57 && age <= 59);
    const jupOnAsc = jupHouse === 1;
    const satOnMc = satHouse === 10;
    const pivot = isSaturnReturn || satOnMc || (jupOnAsc && i > 0);
    const reason = isSaturnReturn
      ? '토성 회귀 — 인생의 뼈대를 다시 세우는 해'
      : satOnMc
        ? '토성이 10하우스 — 책임이 직함으로 오는 해'
        : jupOnAsc
          ? '목성이 1하우스 — 새 판이 열리는 해'
          : undefined;

    years.push({
      year,
      age,
      jupiterHouse: jupHouse,
      saturnHouse: satHouse,
      title: JUPITER_LINE[jupHouse].title,
      line: `${JUPITER_LINE[jupHouse].line} ${SATURN_LINE[satHouse]}`,
      pivot,
      pivotReason: reason,
    });
  }

  /* ---------- 직업적 재능 ---------- */
  const mcSign = SIGNS[chart.midheaven.signIndex];
  const tenth = chart.houses[9];
  const tenthSign = SIGNS[tenth.signIndex];
  const mcRulerName = mcSign.ruler;
  const mcRulerKey = PLANET_BY_KOREAN[mcRulerName];
  const mcRuler = mcRulerKey ? chart.planets.find((p) => p.key === mcRulerKey) : undefined;
  const tenthPlanets = chart.houses[9].points;
  const careerLines = [
    `10하우스(커리어)는 ${tenthSign.name}입니다. ${tenthSign.work}`,
    mcRuler
      ? `MC의 지배성은 ${mcSign.ruler}이고, 그 ${mcSign.ruler}이 ${mcRuler.signName} ${mcRuler.house}하우스에 있습니다. ${PLANET_META[mcRuler.key].means}이(가) ${HOUSE_META[mcRuler.house - 1].short} 자리에서 쓰이는 일이 성과로 이어집니다.`
      : `MC의 지배성은 ${mcSign.ruler}입니다.`,
    tenthPlanets.length
      ? `10하우스에 ${tenthPlanets.join('·')}이(가) 앉아 있어, 이 영역이 삶에서 자주 다뤄집니다.`
      : '10하우스가 비어 있어 직업은 고정된 하나보다 그때그때 맡은 일로 채워집니다.',
    `화성 ${chart.planets[4].signName} ${chart.planets[4].house}하우스 · 토성 ${chart.planets[6].signName} ${chart.planets[6].house}하우스 — ${
      chart.planets[4].house === 10 || chart.planets[6].house === 10
        ? '일에서 직접 부딪히는 자리에 힘이 실립니다.'
        : '혼자 오래 파고드는 일에서 강합니다.'
    } ${SIGNS[chart.planets[5].signIndex].work}`,
  ];
  const careerKeys = [
    `${mcSign.name} MC`,
    `${tenthSign.name} 10H`,
    mcRuler ? `${mcRuler.name} ${mcRuler.house}H` : '',
  ].filter(Boolean);

  /* ---------- 금전 ---------- */
  const second = chart.houses[1];
  const eighth = chart.houses[7];
  const jupiter = chart.planets[5];
  const venus = chart.planets[3];
  const moneyCurve = years.map((y) => {
    const t = midYear(y.year);
    const jh = transitHouse(t.jupiter, ascSignIndex);
    const sh = transitHouse(t.saturn, ascSignIndex);
    const base = chart.indices.money;
    const bump = jh === 2 ? 12 : jh === 8 ? 8 : jh === 11 ? 9 : jh === 10 ? 5 : 0;
    const drag = sh === 2 ? -9 : sh === 8 ? -6 : 0;
    return { year: y.year, value: Math.max(40, Math.min(97, base + bump + drag)) };
  });
  const moneyLine = `${second.signName} 2하우스에 ${second.points.length ? second.points.join('·') : '행성 없이'} 자리가 잡혀 있습니다. ${
    SIGNS[second.signIndex].money
  } ${eighth.signName} 8하우스는 공동 자금·남의 돈을 보는 자리입니다. 목성이 ${jupiter.signName} ${jupiter.house}하우스, 금성이 ${venus.signName} ${venus.house}하우스에 있어 ${
    [2, 8, 11].includes(jupiter.house) ? '돈이 사람과 기회를 통해 들어오는 구조입니다.' : '돈은 큰 한 방보다 쌓이는 쪽으로 들어옵니다.'
  }`;

  /* ---------- 월별 흐름 (앞으로 12개월) ---------- */
  const months: MonthNode[] = [];
  let y = TODAY.year;
  let m = TODAY.month;
  for (let i = 0; i < 12; i += 1) {
    const t = transitingDates(y, m, 15);
    const sunHouse = transitHouse(t.sun, ascSignIndex);
    const jupAspect = aspectToNatal(t.jupiter, chart.sun.longitude);
    const marsAspect = aspectToNatal(t.mars, chart.moon.longitude);
    let score = 62 + (jupAspect?.tone === 'flow' ? 12 : jupAspect?.tone === 'tense' ? -6 : 0);
    score += marsAspect?.tone === 'tense' ? -7 : marsAspect?.tone === 'flow' ? 4 : 0;
    if (sunHouse === 10 || sunHouse === 11) score += 6;
    if (sunHouse === 12) score -= 4;
    months.push({
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: `${y}. ${m}.`,
      house: sunHouse,
      theme: HOUSE_MONTH_THEME[sunHouse - 1],
      score: Math.max(42, Math.min(96, score)),
      note:
        jupAspect?.tone === 'flow'
          ? '목성이 내 태양을 받쳐 주는 달 — 밀어붙인 일이 결실로 옵니다.'
          : marsAspect?.tone === 'tense'
            ? '화성이 감정을 건드리는 달 — 말이 빨라지니 한 박자 쉬어 가세요.'
            : '무리하지 않으면 흐름이 부드러운 달입니다.',
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  /* ---------- 2027 키워드 ---------- */
  const t2027 = transitingDates(2027, 6, 15);
  const jup2027 = transitHouse(t2027.jupiter, ascSignIndex);
  const sat2027 = transitHouse(t2027.saturn, ascSignIndex);

  const cards: InsightCard[] = [
    {
      id: 'axis',
      kicker: '무료',
      title: '내 별자리 세 축',
      free: true,
      paragraphs: [sunSign.identity, identity[1].line, identity[2].line],
      rows: [
        { label: '태양', value: `${sunSign.name} ${chart.sun.degree}° ${chart.sun.house}하우스` },
        { label: '달', value: `${moonSign.name} ${chart.moon.degree}° ${chart.moon.house}하우스` },
        { label: '어센던트', value: `${riseSign.name} ${chart.rising.degree}°` },
      ],
    },
    {
      id: 'balance',
      kicker: '무료',
      title: '타고난 기운의 균형',
      free: true,
      paragraphs: [
        `${strong.element} 기운이 ${strong.count}개로 가장 많고, ${weak.element} 기운이 ${weak.count}개로 가장 적습니다. ${modalityLine}`,
        `${strong.element === '물' ? '감정으로 먼저 판단하는 편이라, 결정을 미루는 대신 사람의 마음을 놓치지 않습니다.' : strong.element === '불' ? '열이 먼저 오르는 편이라 시작은 빠르지만, 식는 속도도 빠릅니다.' : strong.element === '흙' ? '현실 감각이 먼저 서는 편이라 안전하지만, 새로움에 몸이 늦게 반응합니다.' : '말과 정보가 먼저 도는 편이라 이해는 빠르지만, 감정은 뒤늦게 따라옵니다.'} ${weak.element} 기운을 가진 사람과 함께할 때 가장 편안해집니다.`,
      ],
      rows: chart.elements.map((e) => ({
        label: e.element,
        value: `${e.count}`,
        note: e.element === strong.element ? '가장 강함' : e.element === weak.element ? '가장 적음' : '',
      })),
    },
    {
      id: 'decade',
      kicker: '심층',
      title: '10년의 변곡점',
      free: false,
      paragraphs: [
        '태어난 자리에 목성과 토성이 언제 들어오는지로 10년의 마디를 잡았습니다. 목성은 기회가 열리는 자리, 토성은 책임이 오는 자리입니다.',
      ],
      rows: years.map((yr) => ({
        label: `${yr.year}`,
        value: yr.title,
        note: yr.pivot ? yr.pivotReason : `목성 ${yr.jupiterHouse}H · 토성 ${yr.saturnHouse}H`,
      })),
    },
    {
      id: 'career',
      kicker: '심층',
      title: '직업적 재능과 맞는 분야',
      free: false,
      paragraphs: careerLines,
      rows: careerKeys.map((k) => ({ label: k.split(' ')[1] ?? k, value: k })),
    },
    {
      id: 'money',
      kicker: '심층',
      title: '금전 흐름',
      free: false,
      paragraphs: [moneyLine],
      rows: moneyCurve.slice(0, 5).map((c) => ({ label: `${c.year}`, value: `${c.value}점` })),
    },
    {
      id: 'monthly',
      kicker: '심층',
      title: '앞으로 12개월의 월별 흐름',
      free: false,
      paragraphs: ['해가 내 하우스를 지나는 자리로 그 달의 주제를, 목성·화성의 각으로 그 달의 온도를 잡았습니다.'],
      rows: months.map((mo) => ({ label: mo.label, value: `${mo.theme} · ${mo.score}`, note: mo.note })),
    },
    {
      id: 'people',
      kicker: '심층',
      title: '사람에게서 오는 운',
      free: false,
      paragraphs: [
        `11하우스(사람)는 ${chart.houses[10].signName}, 7하우스(짝)는 ${chart.houses[6].signName}입니다. ${SIGNS[chart.houses[10].signIndex].presence}`,
        '아래 수호천사 지도에서 누가 내게 힘을 주는지, 내가 누구의 힘인지 함께 볼 수 있습니다. 지도에 사람을 더할수록 계산이 정확해집니다.',
      ],
    },
  ];

  return {
    headline,
    oneLine,
    identity,
    balance,
    modalityLine,
    cards,
    years,
    months,
    career: { title: JUPITER_LINE[jup2027].title, lines: careerLines, keys: careerKeys },
    money: { score: chart.indices.money, line: moneyLine, curve: moneyCurve },
    houseOf2027: {
      keyword: JUPITER_LINE[jup2027].title,
      line: `${JUPITER_LINE[jup2027].line} ${SATURN_LINE[sat2027]}`,
      jupiterHouse: jup2027,
      saturnHouse: sat2027,
    },
  };
}

/** 사람 한 명의 2027 한 줄 (관계 지도·우리 방 요약에 씁니다) */
export function yearKeyword2027(chart: Chart): { keyword: string; line: string } {
  const asc = chart.rising.signIndex;
  const t = transitingDates(2027, 6, 15);
  const jup = transitHouse(t.jupiter, asc);
  const sat = transitHouse(t.saturn, asc);
  return { keyword: JUPITER_LINE[jup].title, line: `${JUPITER_LINE[jup].line} ${SATURN_LINE[sat]}` };
}

/** 데이터 표(Planet positions)에 쓰는 짧은 표기 */
export function positionLabel(p: ChartPoint): string {
  return `${p.signName} ${p.degree}° ${String(p.minute).padStart(2, '0')}'`;
}
