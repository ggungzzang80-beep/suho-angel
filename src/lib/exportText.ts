/**
 * 데이터 내보내기 (exportText.ts)
 * ------------------------------------------------------------------
 * Astro-Seek 의 'Birth chart → AI/ChatGPT data export' 화면이 내보내는 세 묶음
 * (Planet positions / House positions / Planet aspects)을 같은 형식으로 만듭니다.
 * 리포트를 AI에 붙여 넣거나, 다른 사람과 데이터를 주고받을 때 씁니다.
 */
import type { Chart, ChartPoint } from './astro';

const EN_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const EN_POINTS: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  asc: 'ASC',
  mc: 'MC',
  fortune: 'Fortune',
  lilith: 'Lilith',
  vertex: 'Vertex',
};

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export function positionText(p: ChartPoint): string {
  const deg = `${p.degree}°${String(p.minute).padStart(2, '0')}'`;
  const retro = p.retrograde ? ', Retrograde' : '';
  return `${EN_POINTS[p.key]} in ${EN_SIGNS[p.signIndex]} ${deg}${retro}, in ${ordinal(p.house)} House`;
}

export function planetPositions(chart: Chart): string[] {
  return chart.planets.map(positionText);
}

export function housePositions(chart: Chart): string[] {
  return chart.houses.map((h) => `${ordinal(h.index)} House in ${EN_SIGNS[h.signIndex]} 0°00'`);
}

export function aspectLines(chart: Chart): string[] {
  const map: Record<string, string> = { 합: 'Conjunction', 육분: 'Sextile', 사분: 'Square', 삼분: 'Trine', 대립: 'Opposition' };
  return chart.aspects.map(
    (a) =>
      `${EN_POINTS[a.a]} ${map[a.type]} ${EN_POINTS[a.b]} (Orb: ${a.orb.toFixed(2)}°, ${
        a.applying ? 'Applying' : 'Separating'
      })`,
  );
}

export function exportDataText(chart: Chart): string {
  const lines = [
    `# ${chart.nickname || '나'} · ${chart.dateText} ${chart.timeText} · ${chart.city.name}`,
    '(Western astrology · Whole Sign houses)',
    '',
    'Planet positions:',
    ...planetPositions(chart),
    '',
    'House positions:',
    ...housePositions(chart),
    '',
    'Planet aspects:',
    ...aspectLines(chart),
  ];
  return lines.join('\n');
}
