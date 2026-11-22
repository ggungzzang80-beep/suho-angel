/**
 * 등급 보정표 생성기 · 분포 검증기 (개발용)
 * ------------------------------------------------------------------
 * 관계 점수(mix)의 표본 분포를 재고, 13단계 등급이 의도한 비율로
 * 나뉘도록 'mix → 점수' 보정표를 뽑습니다. 결과 표를
 * `src/lib/relations.ts`의 CALIBRATION에 그대로 옮겨 적습니다.
 *
 * v5(2026-11-18)부터는 성별 조합 궁합 모드가 생겨 표본을 네 갈래로 나눠 잽니다.
 *   · 중립(v4 공통)   — 성별이 비어 있는 쌍
 *   · 남녀 궁합       — 나 여성 × 상대 남성
 *   · 동성 우정 궁합  — 여여 1,500쌍 + 남남 1,500쌍
 * 각 표본에서 13단계 점유율이 목표(2.6~11.5%)에서 크게 쏠리지 않는지 확인합니다.
 * 쏠리면 `MODE_TUNING`(모드별 하우스·그룹 배율)을 조정하고 다시 돌립니다.
 * 보정표(CALIBRATION)는 중립 표본에서 뽑습니다 — 모드가 달라도 같은 표를 쓰기 때문에
 * 세 표본의 분포가 서로 비슷하게 유지되는 것이 핵심입니다.
 *
 * 실행:
 *   npm run calibrate
 * (내부적으로 npx esbuild … → node scripts/.calibrate.mjs)
 */
import { computeChart } from '../src/lib/astro';
import type { BirthInput } from '../src/lib/astro';
import {
  COMPAT_MODES,
  FIVE_GROUPS,
  GROUP_BASELINE_BY_MODE,
  HOUSE_OVERLAY,
  MODE_RMS,
  MODE_TUNING,
  OVERLAY_BASELINE_BY_MODE,
  relationOf,
  scoreOfMix,
  TIERS,
} from '../src/lib/relations';
import type { CompatMode, Gender, GroupId } from '../src/lib/relations';
import { CITIES, DEFAULT_CITY } from '../src/lib/cities';

/* ------------------------------ 표본 ------------------------------ */

type Spec = [string, string, string, string]; // 이름, yyyymmdd, hhmm|unknown, 도시

const ME: Spec = ['나', '19921215', '0930', '서울'];

/** 손으로 고른 기준 표본 10명 — 지도에 실제로 올릴 법한 사람들 */
const REFERENCE: Spec[] = [
  ['지우', '19940722', '1420', '서울'],
  ['현우', '19870203', 'unknown', '부산'],
  ['수민', '19901109', '0745', '인천'],
  ['예린', '19950530', '2240', '대구'],
  ['도현', '19830618', '0610', '광주'],
  ['하늘', '20000114', '1830', '서울'],
  ['민서', '19780927', '1115', '대전'],
  ['준호', '19961205', '2350', '수원'],
  ['가연', '19920308', '1525', '서울'],
  ['태윤', '19891121', '0850', '부산'],
];

function chartOf(spec: Spec) {
  const [, date, time, cityName] = spec;
  const city = CITIES.find((c) => c.name === cityName) ?? DEFAULT_CITY;
  const input: BirthInput = {
    nickname: spec[0],
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(4, 6)),
    day: Number(date.slice(6, 8)),
    timeKnown: time !== 'unknown',
    hour: time === 'unknown' ? 12 : Number(time.slice(0, 2)),
    minute: time === 'unknown' ? 0 : Number(time.slice(2, 4)),
    city,
  };
  return computeChart(input);
}

const me = chartOf(ME);

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeRandom(seed: number) {
  const rand = lcg(seed);
  return (): Spec => {
    const year = 1955 + Math.floor(rand() * 50);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const timeKnown = rand() > 0.35;
    const hour = Math.floor(rand() * 24);
    const minute = Math.floor(rand() * 60);
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    return [
      'x',
      `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`,
      timeKnown ? `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}` : 'unknown',
      city.name,
    ];
  };
}

/* ------------------------------ 표본 집계 ------------------------------ */

type SampleStats = {
  label: string;
  mode: CompatMode;
  n: number;
  mix: number[];
  friend: number[];
  house: number[];
  group: Record<GroupId, number[]>;
  groupActive: Record<GroupId, number>;
  friendActive: number;
  singleDir: number;
  noDir: number;
  deltaSum: number;
  deltaMax: number;
  deltaUp: number;
  deltaDown: number;
};

function emptyStats(label: string, mode: CompatMode, n: number): SampleStats {
  return {
    label,
    mode,
    n,
    mix: [],
    friend: [],
    house: [],
    group: { soulmate: [], benefactor: [], bestfriend: [], knight: [], rival: [], self: [], romance: [] },
    groupActive: { soulmate: 0, benefactor: 0, bestfriend: 0, knight: 0, rival: 0, self: 0, romance: 0 },
    friendActive: 0,
    singleDir: 0,
    noDir: 0,
    deltaSum: 0,
    deltaMax: 0,
    deltaUp: 0,
    deltaDown: 0,
  };
}

/** 한 성별 조합 표본을 잽니다. 차트 목록은 세 모드가 같이 씁니다(같은 사람들로 모드만 바꿔 비교). */
function sampleMode(label: string, mode: CompatMode, specs: Spec[], meGender: Gender | undefined, otherGender: Gender | undefined): SampleStats {
  const stats = emptyStats(label, mode, specs.length);
  specs.forEach((spec, i) => {
    const rel = relationOf(me, chartOf(spec), `p${i}`, { me: meGender, other: otherGender });
    stats.mix.push(rel.mix);
    stats.friend.push(rel.friendHouseScore);
    stats.house.push(rel.houseScore);
    rel.groups.forEach((g) => {
      stats.group[g.id].push(g.score);
      if (g.level === 'active' || g.level === 'tense') stats.groupActive[g.id] += 1;
    });
    if (rel.overlay.friendHousesActive) stats.friendActive += 1;
    if (rel.overlay.directions === 1) stats.singleDir += 1;
    if (rel.overlay.directions === 0) stats.noDir += 1;
    const noBonus = scoreOfMix(rel.mix - rel.overlay.bonus);
    const d = rel.score - noBonus;
    stats.deltaSum += Math.abs(d);
    stats.deltaMax = Math.max(stats.deltaMax, Math.abs(d));
    if (d > 0) stats.deltaUp += 1;
    if (d < 0) stats.deltaDown += 1;
  });
  stats.mix.sort((a, b) => a - b);
  stats.friend.sort((a, b) => a - b);
  stats.house.sort((a, b) => a - b);
  Object.values(stats.group).forEach((list) => list.sort((a, b) => a - b));
  return stats;
}

const quantOf = (list: number[], p: number) =>
  list[Math.min(list.length - 1, Math.max(0, Math.round((p / 100) * (list.length - 1))))];

/* --------------------- 목표 점유율 (위에서 아래로) --------------------- */
/** 13단계가 모두 살아 있고, 가운데가 두껍고 양 끝이 얇은 모양 */
const TARGET: Record<string, number> = {
  soulmate: 3,
  angel: 6,
  buddy: 9,
  benefactor: 10,
  truefriend: 11,
  patron: 12,
  bestie: 11,
  knight: 10,
  samaritan: 9,
  competitor: 7,
  nemesis: 5,
  frenemy: 4,
  rival: 3,
};
console.log('TARGET 합계', Object.values(TARGET).reduce((a, b) => a + b, 0));

const N = 3000;
const HALF = 1500;

/* 세 모드가 **같은 차트 3,000쌍**을 봅니다. 성별만 바꿔 비교해야 분포 차이가
   가중치 때문인지 표본 때문인지 구분됩니다. */
const rand = makeRandom(20261118);
const CHARTS: Spec[] = Array.from({ length: N }, () => rand());

const neutral = sampleMode('중립(v4 공통)', 'neutral', CHARTS, undefined, undefined);
const hetero = sampleMode('남녀 궁합(나 여 × 상대 남)', 'hetero', CHARTS, 'female', 'male');
const sameFemale = sampleMode('여여 우정 궁합', 'sameFemale', CHARTS.slice(0, HALF), 'female', 'female');
const sameMale = sampleMode('남남 우정 궁합', 'sameMale', CHARTS.slice(HALF), 'male', 'male');
const sameAll = emptyStats('동성 우정 궁합(여여+남남)', 'sameFemale', N);
[ sameFemale, sameMale ].forEach((s) => {
  sameAll.mix.push(...s.mix);
  sameAll.friend.push(...s.friend);
  sameAll.house.push(...s.house);
  Object.keys(s.group).forEach((k) => sameAll.group[k as GroupId].push(...s.group[k as GroupId]));
  Object.keys(s.groupActive).forEach((k) => (sameAll.groupActive[k as GroupId] += s.groupActive[k as GroupId]));
  sameAll.friendActive += s.friendActive;
  sameAll.singleDir += s.singleDir;
  sameAll.noDir += s.noDir;
  sameAll.deltaSum += s.deltaSum;
  sameAll.deltaMax = Math.max(sameAll.deltaMax, s.deltaMax);
  sameAll.deltaUp += s.deltaUp;
  sameAll.deltaDown += s.deltaDown;
});
[sameAll.mix, sameAll.friend, sameAll.house].forEach((l) => l.sort((a, b) => a - b));
Object.values(sameAll.group).forEach((l) => l.sort((a, b) => a - b));

/* ------------------------------ 1. 모드 상수 ------------------------------ */

console.log('\n=== v5 성별 조합 궁합 모드 상수 ===');
(Object.keys(COMPAT_MODES) as CompatMode[]).forEach((mode) => {
  const meta = COMPAT_MODES[mode];
  console.log(
    `  ${meta.label.padEnd(14)} 강조 ${meta.emphasis.join('·') || '—'}  지표 ${meta.indicators.join('·') || '—'}  RMS ${MODE_RMS[mode]}  기대값 ${OVERLAY_BASELINE_BY_MODE[mode]}`,
  );
});
(Object.keys(MODE_TUNING) as CompatMode[]).forEach((mode) => {
  const tuning = MODE_TUNING[mode];
  const houses = Object.entries(tuning.houses)
    .map(([h, v]) => `${h}:${v}`)
    .join(' ');
  const groups = Object.entries(tuning.groups)
    .map(([g, v]) => `${g}:${v}`)
    .join(' ');
  console.log(`  ${mode.padEnd(11)} 하우스 ${houses || '—'}  그룹 ${groups || '—'}`);
});
(Object.keys(GROUP_BASELINE_BY_MODE.neutral) as GroupId[]).forEach(() => {});
console.log(
  '\n그룹 기대값(중립 / 남녀 / 여여 / 남남):',
);
FIVE_GROUPS.forEach((g) => {
  console.log(
    `  ${g.name.padEnd(22)} ${GROUP_BASELINE_BY_MODE.neutral[g.id].toFixed(4)} / ${GROUP_BASELINE_BY_MODE.hetero[g.id].toFixed(4)} / ${GROUP_BASELINE_BY_MODE.sameFemale[g.id].toFixed(4)} / ${GROUP_BASELINE_BY_MODE.sameMale[g.id].toFixed(4)}`,
  );
});

/* ------------------------------ 2. 표본별 분포 ------------------------------ */

function shareOf(stats: SampleStats): Record<string, number> {
  const hist = new Map<string, number>();
  stats.mix.forEach((mix) => {
    const score = scoreOfMix(mix);
    const t = TIERS.find((x) => score >= x.min) ?? TIERS[TIERS.length - 1];
    hist.set(t.name, (hist.get(t.name) ?? 0) + 1);
  });
  return Object.fromEntries(TIERS.map((t) => [t.id, ((hist.get(t.name) ?? 0) / stats.n) * 100]));
}

function reportSample(stats: SampleStats) {
  const mix = stats.mix;
  console.log(`\n=== ${stats.label} · 표본 ${stats.n}쌍 ===`);
  console.log(
    [1, 5, 25, 50, 75, 95, 99].map((p) => `P${p}=${quantOf(mix, p).toFixed(2)}`).join('  ') +
      `  최소 ${mix[0].toFixed(2)} 최대 ${mix[mix.length - 1].toFixed(2)}`,
  );
  const mean = mix.reduce((s, n) => s + n, 0) / mix.length;
  const sd = Math.sqrt(mix.reduce((s, n) => s + (n - mean) ** 2, 0) / mix.length);
  console.log(`  평균 ${mean.toFixed(2)} · 표준편차 ${sd.toFixed(2)}`);
  console.log(
    `  하우스 지수 P5=${quantOf(stats.house, 5).toFixed(2)} P50=${quantOf(stats.house, 50).toFixed(2)} P95=${quantOf(stats.house, 95).toFixed(2)}  최소 ${stats.house[0].toFixed(2)} 최대 ${stats.house[stats.house.length - 1].toFixed(2)}`,
  );
  console.log(
    `  보너스 영향 |Δ| 평균 ${(stats.deltaSum / stats.n).toFixed(2)}점 · 최대 ${stats.deltaMax}점 · 상승 ${((stats.deltaUp / stats.n) * 100).toFixed(1)}% / 하락 ${((stats.deltaDown / stats.n) * 100).toFixed(1)}%`,
  );
  console.log(
    `  단방향(한쪽 시간 모름) ${((stats.singleDir / stats.n) * 100).toFixed(1)}% · 오버레이 없음 ${((stats.noDir / stats.n) * 100).toFixed(1)}% · 3·11 활성 ${((stats.friendActive / stats.n) * 100).toFixed(1)}%`,
  );
  console.log('  그룹별 P5 / P50 / P95 · 활성 비율');
  FIVE_GROUPS.forEach((g) => {
    const list = stats.group[g.id];
    console.log(
      `    ${g.name.padEnd(22)} ${quantOf(list, 5).toFixed(2)} / ${quantOf(list, 50).toFixed(2)} / ${quantOf(list, 95).toFixed(2)}   활성 ${((stats.groupActive[g.id] / stats.n) * 100).toFixed(1)}%`,
    );
  });

  const share = shareOf(stats);
  let maxDev = 0;
  let over = 0;
  let minShare = 100;
  let maxShare = 0;
  console.log('  등급 점유율 (목표 / 실측 / 차이)');
  TIERS.forEach((t) => {
    const target = TARGET[t.id] ?? 0;
    const actual = share[t.id];
    /* 화면·문서에 적는 값은 소수 첫째 자리까지라, 판정도 그 값으로 합니다 */
    const rounded = Number(actual.toFixed(1));
    const dev = rounded - target;
    maxDev = Math.max(maxDev, Math.abs(dev));
    minShare = Math.min(minShare, rounded);
    maxShare = Math.max(maxShare, rounded);
    if (Math.abs(dev) > 2) over += 1;
    const flag = Math.abs(dev) > 2 ? ' ←' : '';
    console.log(`    ${t.name.padEnd(8)} ${String(target).padStart(2)}% / ${rounded.toFixed(1)}% / ${dev >= 0 ? '+' : ''}${dev.toFixed(1)}${flag}`);
  });
  console.log(
    `  → 목표 대비 최대 편차 ${maxDev.toFixed(1)}%p · 13단계 실측 범위 ${minShare.toFixed(1)}~${maxShare.toFixed(1)}% · 목표에서 2%p 넘게 벗어난 단계 ${over}개 · 점수 범위 ${Math.min(...stats.mix.map(scoreOfMix))}~${Math.max(...stats.mix.map(scoreOfMix))}`,
  );
  return { share, maxDev, over, minShare, maxShare };
}

const neutralReport = reportSample(neutral);
const heteroReport = reportSample(hetero);
const sameReport = reportSample(sameAll);

/* ------------------------------ 3. 모드 비교 ------------------------------ */

console.log('\n=== 표본별 비교 요약 (13단계 점유율이 얼마나 비슷한가) ===');
console.log(`  ${'모드'.padEnd(18)} ${'mix 표준편차'.padEnd(12)} ${'최대 편차'.padEnd(10)} 13단계 실측 범위`);
[
  ['중립(v4 공통)', neutral, neutralReport],
  ['남녀 궁합', hetero, heteroReport],
  ['동성 우정 궁합', sameAll, sameReport],
].forEach(([label, stats, rep]: any) => {
  const m = stats.mix.reduce((s: number, n: number) => s + n, 0) / stats.mix.length;
  const sd = Math.sqrt(stats.mix.reduce((s: number, n: number) => s + (n - m) ** 2, 0) / stats.mix.length);
  console.log(
    `  ${label.padEnd(18)} ${sd.toFixed(2).padEnd(12)} ${(rep.maxDev.toFixed(1) + '%p').padEnd(10)} ${rep.minShare.toFixed(1)}~${rep.maxShare.toFixed(1)}%`,
  );
});

const skewOk = neutralReport.over === 0 && heteroReport.over === 0 && sameReport.over === 0;
console.log(
  skewOk
    ? '\n✅ 세 표본 모두 13단계 점유율이 목표에서 2%p 안쪽입니다 — 모드가 달라도 같은 보정표로 쓸 수 있습니다.'
    : '\n⚠️ 목표에서 2%p 넘게 벗어난 단계가 있습니다. MODE_TUNING을 조정한 뒤 다시 돌려 주세요.',
);
console.log(
  '  · 참고: 조력자 목표 점유율은 12%로, v4 실측 상한(11.5%)보다 높습니다. 그래서 판정은 ‘2.6~11.5%’가 아니라 목표 대비 편차로 합니다.',
);

/* ------------------------------ 4. 기준 표본 10명 ------------------------------ */

console.log('\n=== 기준 표본 10명 · 성별 조합별 비교 (같은 차트, 다른 모드) ===');
console.log(`  ${'이름'.padEnd(5)} ${'중립'.padEnd(22)} ${'남녀 궁합'.padEnd(22)} 동성 우정 궁합`);
REFERENCE.forEach((spec) => {
  const chart = chartOf(spec);
  const n = relationOf(me, chart, spec[0], {});
  const h = relationOf(me, chart, spec[0], { me: 'female', other: 'male' });
  const s = relationOf(me, chart, spec[0], { me: 'female', other: 'female' });
  const cell = (r: typeof n) => `${String(r.score).padStart(2)}점 ${r.tier.name.padEnd(8)} 하우스 ${r.houseScore >= 0 ? '+' : ''}${r.houseScore.toFixed(2)}`;
  console.log(`  ${spec[0].padEnd(5)} ${cell(n).padEnd(22)} ${cell(h).padEnd(22)} ${cell(s)}`);
});

console.log('\n=== relations.ts에 넣을 표 (중립 표본에서) ===');
console.log('export const CALIBRATION: Array<[number, number]> = [');
console.log(`  [${neutral.mix[0].toFixed(2)}, 24],`);
{
  let cum = 0;
  const anchors: Array<{ id: string; score: number; mix: number }> = [];
  TIERS.forEach((t) => {
    cum += TARGET[t.id] ?? 0;
    anchors.push({ id: t.id, score: t.min, mix: quantOf(neutral.mix, 100 - cum) });
  });
  for (let i = anchors.length - 1; i >= 0; i -= 1) {
    const a = anchors[i];
    if (a.id === 'rival') continue;
    console.log(`  [${a.mix.toFixed(2)}, ${a.score}],`);
  }
  console.log(`  [${neutral.mix[neutral.mix.length - 1].toFixed(2)}, 99],`);
}
console.log('];');
console.log('  · 중립 표본은 v4와 같은 가중치라 위 표는 현행 CALIBRATION과 같아야 합니다.');
