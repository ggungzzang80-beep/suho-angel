/**
 * 초대 링크 (invite.ts)
 * ------------------------------------------------------------------
 * 초대 링크에는 생년월일·출생 시각·출생 도시를 담지 않습니다.
 * (예전에는 JSON 을 base64 로 감쌌지만, 디코딩하면 생년월일시 원본이 그대로 보였습니다.)
 *
 * 지금 담는 것은 '지도에 이미 보이는 정보'뿐입니다.
 *   - 지도에 표시되는 이름(닉네임)
 *   - 열 개 행성과 어센던트가 놓인 '자리'(별자리 번호 0~11) — 도수·시각·도시 없음
 *   - 성별(선택) — 궁합 가중치에만 쓰고 지도에는 표시하지 않음
 *
 * 서버가 없는 정적 앱이라, 초대받은 사람의 브라우저에서 상대를 다시 계산하려면
 * 상대의 '자리'가 필요합니다. 자리만으로는 생년월일시를 되돌릴 수 없고,
 * 관계는 자리 단위의 간이 계산이 됩니다(정확한 계산은 상대가 내 지도를 열 때).
 */

import { findAspect, norm360, pointFrom, type Chart, type ChartPoint } from './astro';
import type { City } from './cities';
import { PLANET_ORDER, SIGNS, type Element, type Modality, type PointKey } from './signs';
import type { Gender } from './relations';

/** 초대 카드에 담기는 내용 — 생년월일·시각·도시 없음 */
export type InviteCard = {
  /** 형식 버전 */
  v: 2;
  /** 지도에 보이는 이름 */
  n: string;
  /** 행성 10개의 자리 (0=양자리 … 11=물고기자리), PLANET_ORDER 순서 */
  p: number[];
  /** 어센던트 자리 — 출생 시각을 모르면 null */
  a: number | null;
  /** 성별(선택) — 궁합 가중치에만 씀 */
  g?: 'f' | 'm';
};

const CITY_PLACEHOLDER: City = {
  id: 'invite-card',
  name: '초대 카드',
  en: 'Invite card',
  region: '',
  lat: 0,
  lon: 0,
  tz: 0,
};

const signOf = (n: unknown): number | null =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 12 ? n : null;

/* ------------------------------ 인코딩 ------------------------------ */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeInviteCard(card: InviteCard): string {
  return toBase64Url(JSON.stringify(card));
}

/**
 * 초대 링크를 읽습니다.
 * v2 카드가 아니면 null — 생년월일시를 담던 예전 형식(d·t·c)은 받지 않습니다.
 */
export function decodeInviteCard(value: string): InviteCard | null {
  try {
    const raw = JSON.parse(fromBase64Url(value)) as Record<string, unknown>;
    if (!raw || raw.v !== 2) return null;
    /* 예전 형식(생년월일 8자리·시각·도시)이 섞여 있으면 거절합니다 */
    if ('d' in raw || 't' in raw || 'c' in raw || 'k' in raw) return null;
    if (!Array.isArray(raw.p) || raw.p.length !== PLANET_ORDER.length) return null;
    const planets = raw.p.map(signOf);
    if (planets.some((s) => s === null)) return null;
    const asc = raw.a === null ? null : signOf(raw.a);
    if (raw.a !== null && asc === null) return null;
    const name = typeof raw.n === 'string' ? raw.n.slice(0, 14) : '';
    const g = raw.g === 'f' || raw.g === 'm' ? raw.g : undefined;
    return { v: 2, n: name, p: planets as number[], a: asc, g };
  } catch {
    return null;
  }
}

/* ------------------------------ 카드 만들기 ------------------------------ */

export function cardFromChart(chart: Chart, gender?: Gender): InviteCard {
  return {
    v: 2,
    n: (chart.nickname || '').slice(0, 14),
    p: PLANET_ORDER.map((key) => chart.points.find((p) => p.key === key)!.signIndex),
    a: chart.timeKnown ? chart.rising.signIndex : null,
    g: gender === 'female' ? 'f' : gender === 'male' ? 'm' : undefined,
  };
}

export function genderOfCard(card: InviteCard): Gender | undefined {
  return card.g === 'f' ? 'female' : card.g === 'm' ? 'male' : undefined;
}

/* ------------------------------ 카드 → 차트 ------------------------------ */

function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * 자리만 아는 사람의 차트를 복원합니다.
 *
 * 자리 안에서의 도수는 알 수 없으므로, 초대 카드마다 고정되는 값으로 자리 안에 흩어 놓습니다.
 * (같은 링크는 언제 열어도 같은 결과가 나오고, 각의 오브가 한쪽으로 몰리지 않습니다.)
 * 하우스는 어센던트 자리부터 한 자리씩 놓는 Whole Sign 그대로입니다.
 */
export function chartFromCard(card: InviteCard): Chart {
  const ascSign = card.a ?? card.p[0];
  const seedBase = card.n + card.p.join('-') + String(card.a);
  const lonOf = (key: PointKey, signIndex: number, salt: string) =>
    norm360(signIndex * 30 + 0.4 + hash01(`${seedBase}:${salt}`) * 29.2);

  const planets: ChartPoint[] = PLANET_ORDER.map((key, i) => {
    const signIndex = card.p[i];
    return pointFrom(key, lonOf(key, signIndex, key), 0, ascSign);
  });

  const ascLon = lonOf('asc', ascSign, 'asc');
  const mcSign = (ascSign + 9) % 12;
  const extra: ChartPoint[] = [
    pointFrom('asc', ascLon, 0, ascSign),
    pointFrom('mc', lonOf('mc', mcSign, 'mc'), 0, ascSign),
    pointFrom('fortune', lonOf('fortune', (ascSign + 5) % 12, 'fortune'), 0, ascSign),
    pointFrom('lilith', lonOf('lilith', (ascSign + 8) % 12, 'lilith'), 0, ascSign),
    pointFrom('vertex', lonOf('vertex', (ascSign + 2) % 12, 'vertex'), 0, ascSign),
  ];

  const points = [...planets, ...extra];
  const byKey = Object.fromEntries(points.map((p) => [p.key, p])) as Record<PointKey, ChartPoint>;

  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (ascSign + i) % 12;
    return {
      index: i + 1,
      signIndex,
      signName: SIGNS[signIndex].name,
      cuspDegree: 0,
      points: planets.filter((p) => p.house === i + 1).map((p) => p.name),
    };
  });

  const aspects = [] as Chart['aspects'];
  const aspectPoints = [...planets, byKey.asc, byKey.mc];
  for (let i = 0; i < aspectPoints.length; i += 1) {
    for (let j = i + 1; j < aspectPoints.length; j += 1) {
      const a = aspectPoints[i];
      const b = aspectPoints[j];
      const found = findAspect(a.longitude, b.longitude);
      if (!found) continue;
      aspects.push({
        a: a.key,
        b: b.key,
        aName: a.name,
        bName: b.name,
        type: found.type,
        angle: found.angle,
        orb: found.orb,
        maxOrb: found.maxOrb,
        applying: false,
        tone: found.tone,
      });
    }
  }

  const elementCount: Record<Element, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  const modalityCount: Record<Modality, number> = { 활동: 0, 고정: 0, 변통: 0 };
  planets.forEach((p) => {
    elementCount[SIGNS[p.signIndex].element] += 1;
    modalityCount[SIGNS[p.signIndex].modality] += 1;
  });
  elementCount[SIGNS[ascSign].element] += 2;
  modalityCount[SIGNS[ascSign].modality] += 2;
  const elements = (Object.keys(elementCount) as Element[]).map((element) => ({ element, count: elementCount[element] }));
  const modalities = (Object.keys(modalityCount) as Modality[]).map((modality) => ({ modality, count: modalityCount[modality] }));

  return {
    nickname: card.n,
    year: 0,
    month: 0,
    day: 0,
    dateText: '',
    timeText: card.a === null ? '시간 모름' : '',
    timeKnown: card.a !== null,
    unknownTime: card.a === null,
    city: CITY_PLACEHOLDER,
    tz: 0,
    points,
    planets,
    houses,
    aspects,
    sun: byKey.sun,
    moon: byKey.moon,
    rising: byKey.asc,
    midheaven: byKey.mc,
    elements,
    modalities,
    dominantElement: elements.reduce((a, b) => (b.count > a.count ? b : a)).element,
    dominantModality: modalities.reduce((a, b) => (b.count > a.count ? b : a)).modality,
    indices: { love: 60, money: 60, work: 60 },
    seed: Math.floor(hash01(seedBase) * 100000),
  };
}

/* ------------------------------ 안내 문구 ------------------------------ */

export const INVITE_NOTE =
  '초대 카드에는 생년월일시와 태어난 도시가 담기지 않습니다. 별자리 자리만으로 계산한 간이 인연이라, 상대가 내 지도를 열면 더 정확한 값으로 다시 계산됩니다.';
