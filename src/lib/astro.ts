/**
 * 출생 천궁도 계산 엔진 (astro.ts) — 서양 점성술 · Whole Sign
 * ------------------------------------------------------------------
 * 1) 태양·달: Meeus 저정밀 급수
 * 2) 수성~명왕성: JPL 근사 궤도요소(1800–2050) → 지심 황경
 * 3) 어센던트·MC: 지방 항성시 + 황도경사 공식 (도시의 위·경도 반영)
 * 4) 하우스: 어센던트 자리부터 한 자리 = 한 하우스 (Whole Sign)
 * 5) 각: 합·육분·사분·삼분·대립 + 오브 + 접근/이탈(applying/separating)
 *
 * 참고: Astro-Seek 의 'Birth chart → AI/ChatGPT data export' 가 내보내는
 *       Planet positions / House positions / Planet aspects 세 묶음을 그대로
 *       화면에서 재현할 수 있도록, 모든 점의 자리·도수·하우스·역행과
 *       각의 오브·적용 상태를 데이터로 남깁니다.
 */

import { PLANET_META, PLANET_ORDER, SIGNS } from './signs';
import type { Element, Modality, PlanetKey, PointKey } from './signs';
import type { City } from './cities';

const D2R = Math.PI / 180;
export const norm360 = (d: number) => ((d % 360) + 360) % 360;

/* ------------------------------ 입력 ------------------------------ */

export type BirthInput = {
  nickname?: string;
  year: number;
  month: number;
  day: number;
  timeKnown: boolean;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  city: City;
};

/* ------------------------------ 결과 ------------------------------ */

export type ChartPoint = {
  key: PointKey;
  name: string;
  glyph: string;
  longitude: number;
  signIndex: number;
  signName: string;
  signGlyph: string;
  degree: number;
  minute: number;
  /** 소수 도수 (예: 10.42°) */
  degreeExact: number;
  house: number;
  retrograde: boolean;
  /** 하루 이동량(도). 각의 접근/이탈 판정에 씁니다. */
  speed: number;
};

export type House = {
  index: number;
  signIndex: number;
  signName: string;
  /** Whole Sign 이므로 하우스 시작 = 그 자리의 0° */
  cuspDegree: number;
  points: string[];
};

export type AspectType = '합' | '육분' | '사분' | '삼분' | '대립';

export type ChartAspect = {
  a: PointKey;
  b: PointKey;
  aName: string;
  bName: string;
  type: AspectType;
  angle: number;
  orb: number;
  maxOrb: number;
  applying: boolean;
  tone: 'flow' | 'tense';
};

export type Chart = {
  nickname: string;
  year: number;
  month: number;
  day: number;
  dateText: string;
  timeText: string;
  timeKnown: boolean;
  /** 시간 모름의 다른 이름 — 시너스트리 보정이 이 값을 읽습니다. */
  unknownTime: boolean;
  city: City;
  /** UTC 오프셋(시간) */
  tz: number;
  points: ChartPoint[];
  planets: ChartPoint[];
  houses: House[];
  aspects: ChartAspect[];
  sun: ChartPoint;
  moon: ChartPoint;
  rising: ChartPoint;
  midheaven: ChartPoint;
  elements: Array<{ element: Element; count: number }>;
  modalities: Array<{ modality: Modality; count: number }>;
  dominantElement: Element;
  dominantModality: Modality;
  indices: { love: number; money: number; work: number };
  seed: number;
};

/* --------------------------- 천문 계산 --------------------------- */

function julianDay(year: number, month: number, day: number, hourUT: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + hourUT / 24
  );
}

const centuries = (jd: number) => (jd - 2451545.0) / 36525;

function sunLongitude(jd: number): number {
  const t = centuries(jd);
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * D2R) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m * D2R) +
    0.000289 * Math.sin(3 * m * D2R);
  const omega = 125.04 - 1934.136 * t;
  return norm360(l0 + c - 0.00569 - 0.00478 * Math.sin(omega * D2R));
}

function moonLongitude(jd: number): number {
  const t = centuries(jd);
  const lp =
    218.3164477 +
    481267.88123421 * t -
    0.0015786 * t * t +
    (t * t * t) / 538841 -
    (t * t * t * t) / 65194000;
  const d = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + (t * t * t) / 545868;
  const m = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t;
  const mp = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + (t * t * t) / 69699;
  const f = 93.272095 + 483202.0175233 * t - 0.0036539 * t * t;
  return norm360(
    lp +
      6.289 * Math.sin(mp * D2R) +
      1.274 * Math.sin((2 * d - mp) * D2R) +
      0.658 * Math.sin(2 * d * D2R) +
      0.214 * Math.sin(2 * mp * D2R) -
      0.186 * Math.sin(m * D2R) -
      0.114 * Math.sin(2 * f * D2R) +
      0.059 * Math.sin((2 * d - 2 * mp) * D2R) +
      0.057 * Math.sin((2 * d - m - mp) * D2R) +
      0.053 * Math.sin((2 * d + mp) * D2R) +
      0.046 * Math.sin((2 * d - m) * D2R) -
      0.041 * Math.sin((m - mp) * D2R) -
      0.035 * Math.sin(d * D2R) -
      0.031 * Math.sin((m + mp) * D2R),
  );
}

type Orbit = {
  a: number;
  e: number;
  i: number;
  l: number;
  peri: number;
  node: number;
  da: number;
  de: number;
  di: number;
  dl: number;
  dperi: number;
  dnode: number;
};

/** JPL 근사 궤도요소 (1800–2050, 100년당 변화율) */
const ORBITS: Record<'earth' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto', Orbit> = {
  earth: { a: 1.00000261, e: 0.01671123, i: -0.00001531, l: 100.46457166, peri: 102.93768193, node: 0, da: 0.00000562, de: -0.00004392, di: -0.01294668, dl: 35999.37244981, dperi: 0.32327364, dnode: 0 },
  mercury: { a: 0.38709927, e: 0.20563593, i: 7.00497902, l: 252.2503235, peri: 77.45779628, node: 48.33076593, da: 0.00000037, de: 0.00001906, di: -0.00594749, dl: 149472.67411175, dperi: 0.16047689, dnode: -0.12534081 },
  venus: { a: 0.72333566, e: 0.00677672, i: 3.39467605, l: 181.9790995, peri: 131.60246718, node: 76.67984255, da: 0.0000039, de: -0.00004107, di: -0.0007889, dl: 58517.81538729, dperi: 0.00268329, dnode: -0.27769418 },
  mars: { a: 1.52371034, e: 0.0933941, i: 1.84969142, l: -4.55343205, peri: -23.94362959, node: 49.55953891, da: 0.00001847, de: 0.00007882, di: -0.00813131, dl: 19140.30268499, dperi: 0.44441088, dnode: -0.29257343 },
  jupiter: { a: 5.202887, e: 0.04838624, i: 1.30439695, l: 34.39644051, peri: 14.72847983, node: 100.47390909, da: -0.00011607, de: -0.00013253, di: -0.00183714, dl: 3034.74612775, dperi: 0.21252668, dnode: 0.20469106 },
  saturn: { a: 9.53667594, e: 0.05386179, i: 2.48599187, l: 49.95424423, peri: 92.59887831, node: 113.66242448, da: -0.0012506, de: -0.00050991, di: 0.00193609, dl: 1222.49362201, dperi: -0.41897216, dnode: -0.28867794 },
  uranus: { a: 19.18916464, e: 0.04725744, i: 0.77263783, l: 313.23810451, peri: 170.9542763, node: 74.01692503, da: -0.00196176, de: -0.00004397, di: -0.00242939, dl: 428.48202785, dperi: 0.40805281, dnode: 0.04240589 },
  neptune: { a: 30.06992276, e: 0.00859048, i: 1.77004347, l: -55.12002969, peri: 44.96476227, node: 131.78422574, da: 0.00026291, de: 0.00005105, di: 0.00035372, dl: 218.45945325, dperi: -0.32241464, dnode: -0.00508664 },
  pluto: { a: 39.48211675, e: 0.2488273, i: 17.14001206, l: 238.92903833, peri: 224.06891629, node: 110.30393684, da: -0.00031596, de: 0.0000517, di: 0.00004818, dl: 145.20780515, dperi: -0.04062942, dnode: -0.01183482 },
};

type Vec3 = { x: number; y: number; z: number };

function heliocentric(body: keyof typeof ORBITS, t: number): Vec3 {
  const o = ORBITS[body];
  const a = o.a + o.da * t;
  const e = o.e + o.de * t;
  const inc = (o.i + o.di * t) * D2R;
  const l = o.l + o.dl * t;
  const peri = o.peri + o.dperi * t;
  const node = (o.node + o.dnode * t) * D2R;
  const m = norm360(l - peri) * D2R;
  const omega = (peri - o.node - o.dnode * t) * D2R;

  let ecc = m;
  for (let k = 0; k < 8; k += 1) {
    ecc -= (ecc - e * Math.sin(ecc) - m) / (1 - e * Math.cos(ecc));
  }
  const xv = a * (Math.cos(ecc) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(ecc);

  const cw = Math.cos(omega);
  const sw = Math.sin(omega);
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  const ci = Math.cos(inc);
  const si = Math.sin(inc);

  return {
    x: (cw * cn - sw * sn * ci) * xv + (-sw * cn - cw * sn * ci) * yv,
    y: (cw * sn + sw * cn * ci) * xv + (-sw * sn + cw * cn * ci) * yv,
    z: sw * si * xv + cw * si * yv,
  };
}

function geocentricLongitude(body: Exclude<keyof typeof ORBITS, 'earth'>, jd: number): number {
  const t = centuries(jd);
  const earth = heliocentric('earth', t);
  const planet = heliocentric(body, t);
  return norm360(Math.atan2(planet.y - earth.y, planet.x - earth.x) / D2R);
}

function gmstDegrees(jd: number): number {
  const t = centuries(jd);
  return norm360(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000,
  );
}

const obliquity = (jd: number) => 23.439291 - 0.0130042 * centuries(jd);

/** 어센던트 황경 — ramc: 지방 항성시(도) */
function ascendantLongitude(ramc: number, lat: number, eps: number): number {
  const r = ramc * D2R;
  const e = eps * D2R;
  const phi = Math.max(-66, Math.min(66, lat)) * D2R;
  return norm360(
    Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) / D2R,
  );
}

function mcLongitude(ramc: number, eps: number): number {
  const r = ramc * D2R;
  const e = eps * D2R;
  return norm360(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) / D2R);
}

/** 평균 흑월(릴리트) — 달 원지점 평균 황경 */
function meanLilith(jd: number): number {
  const t = centuries(jd);
  const perigee =
    83.3532465 + 4069.0137287 * t - 0.01032 * t * t - (t * t * t) / 80053 + (t * t * t * t) / 18999000;
  return norm360(perigee + 180);
}

function longitudeOf(key: PlanetKey, jd: number): number {
  switch (key) {
    case 'sun':
      return sunLongitude(jd);
    case 'moon':
      return moonLongitude(jd);
    default:
      return geocentricLongitude(key, jd);
  }
}

function speedOf(key: PlanetKey, jd: number): number {
  const prev = longitudeOf(key, jd - 0.5);
  const next = longitudeOf(key, jd + 0.5);
  return Number(((((next - prev + 540) % 360) - 180) / 1).toFixed(4));
}

/* ------------------------------ 각 ------------------------------ */

const ASPECT_TABLE: Array<{ angle: number; type: AspectType; orb: number; tone: 'flow' | 'tense' }> = [
  { angle: 0, type: '합', orb: 8, tone: 'flow' },
  { angle: 60, type: '육분', orb: 4, tone: 'flow' },
  { angle: 90, type: '사분', orb: 6, tone: 'tense' },
  { angle: 120, type: '삼분', orb: 6, tone: 'flow' },
  { angle: 180, type: '대립', orb: 8, tone: 'tense' },
];

export type RawAspect = {
  type: AspectType;
  angle: number;
  orb: number;
  maxOrb: number;
  tone: 'flow' | 'tense';
  /** 목표 각에서 남은 차이의 부호 있는 값 */
  delta: number;
};

export function findAspect(lonA: number, lonB: number): RawAspect | null {
  const diff = Math.abs((((lonA - lonB) % 360) + 540) % 360 - 180);
  const signed = ((lonA - lonB + 540) % 360) - 180;
  for (const t of ASPECT_TABLE) {
    let delta = signed - t.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) <= t.orb) {
      return {
        type: t.type,
        angle: t.angle,
        orb: Number(Math.abs(delta).toFixed(2)),
        maxOrb: t.orb,
        tone: t.tone,
        delta,
      };
    }
  }
  return null;
}

/* ------------------------------ 빌드 ------------------------------ */

function pointFrom(key: PointKey, longitude: number, speed: number, ascSignIndex: number): ChartPoint {
  const lon = norm360(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const sign = SIGNS[signIndex];
  const meta = PLANET_META[key];
  const degreeExact = Number((lon - signIndex * 30).toFixed(2));
  const degree = Math.floor(degreeExact);
  const minute = Math.round((degreeExact - degree) * 60);
  const isPlanet = (PLANET_ORDER as string[]).includes(key);
  return {
    key,
    name: meta.name,
    glyph: meta.glyph,
    longitude: lon,
    signIndex,
    signName: sign.name,
    signGlyph: sign.glyph,
    degree,
    minute: minute === 60 ? 59 : minute,
    degreeExact,
    house: ((signIndex - ascSignIndex + 12) % 12) + 1,
    retrograde: isPlanet ? speed < 0 : false,
    speed: Number(speed.toFixed(4)),
  };
}

export function computeChart(input: BirthInput): Chart {
  const { year, month, day, timeKnown, city } = input;
  const tz = city.tz;
  const hour = timeKnown ? input.hour : 12;
  const minute = timeKnown ? input.minute : 0;
  const localHour = hour + minute / 60;

  const jd = julianDay(year, month, day, localHour - tz);
  const eps = obliquity(jd);
  const ramc = norm360(gmstDegrees(jd) + city.lon);

  const ascLon = ascendantLongitude(ramc, city.lat, eps);
  const mcLon = mcLongitude(ramc, eps);
  const ascSignIndex = Math.floor(ascLon / 30) % 12;

  const planets: ChartPoint[] = PLANET_ORDER.map((key) =>
    pointFrom(key, longitudeOf(key, jd), speedOf(key, jd), ascSignIndex),
  );

  const sun = planets[0];
  const moon = planets[1];

  /* 포춘: 낮 차트(태양이 7~12하우스)면 ASC+달-태양, 밤이면 ASC+태양-달 */
  const dayChart = sun.house >= 7;
  const fortuneLon = dayChart
    ? ascLon + moon.longitude - sun.longitude
    : ascLon + sun.longitude - moon.longitude;

  const vertexLon = ascendantLongitude(ramc + 180, 90 - city.lat, eps);

  const extra: ChartPoint[] = [
    pointFrom('asc', ascLon, 0, ascSignIndex),
    pointFrom('mc', mcLon, 0, ascSignIndex),
    pointFrom('fortune', fortuneLon, 0, ascSignIndex),
    pointFrom('lilith', meanLilith(jd), 0.111, ascSignIndex),
    pointFrom('vertex', vertexLon, 0, ascSignIndex),
  ];

  const points = [...planets, ...extra];
  const byKey = Object.fromEntries(points.map((p) => [p.key, p])) as Record<PointKey, ChartPoint>;

  const houses: House[] = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (ascSignIndex + i) % 12;
    return {
      index: i + 1,
      signIndex,
      signName: SIGNS[signIndex].name,
      cuspDegree: 0,
      points: planets.filter((p) => p.house === i + 1).map((p) => p.name),
    };
  });

  /* 각 — 행성 10개 + 어센던트 + MC (포춘·릴리트·버텍스는 별도 표기) */
  const aspectPoints: ChartPoint[] = [...planets, byKey.asc, byKey.mc];
  const aspects: ChartAspect[] = [];
  for (let i = 0; i < aspectPoints.length; i += 1) {
    for (let j = i + 1; j < aspectPoints.length; j += 1) {
      const a = aspectPoints[i];
      const b = aspectPoints[j];
      const found = findAspect(a.longitude, b.longitude);
      if (!found) continue;
      /* 접근/이탈 — 0.1일 뒤 목표 각에 더 가까워지면 applying */
      const a2 = a.longitude + a.speed * 0.1;
      const b2 = b.longitude + b.speed * 0.1;
      const after = findAspect(a2, b2);
      const applying = after ? Math.abs(after.delta) < Math.abs(found.delta) : false;
      aspects.push({
        a: a.key,
        b: b.key,
        aName: a.name,
        bName: b.name,
        type: found.type,
        angle: found.angle,
        orb: found.orb,
        maxOrb: found.maxOrb,
        applying,
        tone: found.tone,
      });
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  const elementCount: Record<Element, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  const modalityCount: Record<Modality, number> = { 활동: 0, 고정: 0, 변통: 0 };
  planets.forEach((p) => {
    elementCount[SIGNS[p.signIndex].element] += 1;
    modalityCount[SIGNS[p.signIndex].modality] += 1;
  });
  elementCount[SIGNS[ascSignIndex].element] += 2;
  modalityCount[SIGNS[ascSignIndex].modality] += 2;

  const elements = (Object.keys(elementCount) as Element[]).map((element) => ({
    element,
    count: elementCount[element],
  }));
  const modalities = (Object.keys(modalityCount) as Modality[]).map((modality) => ({
    modality,
    count: modalityCount[modality],
  }));
  const dominantElement = elements.reduce((a, b) => (b.count > a.count ? b : a)).element;
  const dominantModality = modalities.reduce((a, b) => (b.count > a.count ? b : a)).modality;

  const venus = byKey.venus;
  const jupiter = byKey.jupiter;
  const mars = byKey.mars;
  const saturn = byKey.saturn;

  const clampIndex = (n: number) => Math.max(42, Math.min(96, Math.round(n)));
  const love =
    50 +
    ([5, 7].includes(venus.house) ? 18 : [2, 8, 11].includes(venus.house) ? 10 : 0) +
    (SIGNS[venus.signIndex].element === SIGNS[ascSignIndex].element ? 7 : 0) +
    ([4, 7, 12].includes(moon.house) ? 5 : 0) +
    (aspects.some((a) => (a.aName === '금성' || a.bName === '금성') && a.type === '삼분') ? 6 : 0);
  const money =
    52 +
    ([2, 8, 11].includes(jupiter.house) ? 16 : [10, 5].includes(jupiter.house) ? 9 : 0) +
    ([2, 8].includes(venus.house) ? 8 : 0) +
    (saturn.house === 2 ? -6 : 0) +
    (aspects.some((a) => (a.aName === '목성' || a.bName === '목성') && a.type === '사분') ? -4 : 4);
  const work =
    52 +
    ([10, 6].includes(mars.house) ? 14 : [1, 3].includes(mars.house) ? 8 : 0) +
    ([10, 6].includes(saturn.house) ? 11 : 0) +
    ([10, 6].includes(sun.house) ? 8 : 0) +
    (aspects.some((a) => (a.aName === '화성' && a.bName === '토성') || (a.bName === '화성' && a.aName === '토성')) ? -5 : 0);

  const seed = hashSeed(`${year}-${month}-${day}-${hour}-${minute}-${city.id}-${input.timeKnown}`);

  return {
    nickname: (input.nickname ?? '').trim(),
    year,
    month,
    day,
    dateText: `${year}. ${month}. ${day}.`,
    timeText: timeKnown
      ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} (${city.name} 현지)`
      : '시간 모름 · 정오 기준',
    timeKnown,
    unknownTime: !timeKnown,
    city,
    tz,
    points,
    planets,
    houses,
    aspects,
    sun,
    moon,
    rising: byKey.asc,
    midheaven: byKey.mc,
    elements,
    modalities,
    dominantElement,
    dominantModality,
    indices: { love: clampIndex(love), money: clampIndex(money), work: clampIndex(work) },
    seed,
  };
}

/* --------------------------- 유틸 --------------------------- */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100000;
}

/** 2026-11-18 기준 오늘 */
export const TODAY = { year: 2026, month: 11, day: 18 };

/** 특정 날짜(정오 UT) 행성 황경 — 관계 지도·연도 흐름의 트랜짓 계산에 씁니다. */
export function transitingDates(year: number, month: number, day: number): Record<PlanetKey, number> {
  const jd = julianDay(year, month, day, 12);
  return Object.fromEntries(PLANET_ORDER.map((k) => [k, longitudeOf(k, jd)])) as Record<PlanetKey, number>;
}

export function signIndexOfLongitude(lon: number): number {
  return Math.floor(norm360(lon) / 30) % 12;
}

export function formatDegree(p: ChartPoint): string {
  return `${p.degree}° ${String(p.minute).padStart(2, '0')}'`;
}
