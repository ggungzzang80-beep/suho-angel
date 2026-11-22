import { norm360, type Chart } from '../lib/astro';
import { PLANET_META, SIGNS, type PointKey } from '../lib/signs';

const SIZE = 360;
const C = SIZE / 2;

const RAD = {
  outer: 164,
  zodiacInner: 132,
  planet: 104,
  line: 84,
  inner: 60,
};

function pos(longitude: number, ascLon: number, radius: number) {
  const theta = (180 + (longitude - ascLon)) * (Math.PI / 180);
  return { x: C + Math.cos(theta) * radius, y: C - Math.sin(theta) * radius };
}

export default function NatalWheel({ chart }: { chart: Chart }) {
  const ascLon = chart.rising.longitude;
  const drawPoints = chart.planets;
  const aspectKeys: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  /* 겹치는 행성을 살짝 밀어 표시 */
  const placed: Array<{ key: PointKey; lon: number; label: string; retro: boolean; offset: number }> = [];
  const sorted = [...drawPoints].sort((a, b) => a.longitude - b.longitude);
  sorted.forEach((p) => {
    let offset = 0;
    while (placed.some((q) => Math.abs(norm360(q.lon + q.offset * 0.6 - (p.longitude + offset * 0.6))) < 5)) {
      offset += 3;
    }
    placed.push({ key: p.key, lon: p.longitude, label: PLANET_META[p.key].glyph, retro: p.retrograde, offset });
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-[340px]" role="img" aria-label={`${chart.nickname}의 출생 천궁도`}>
      <defs>
        <radialGradient id="wheelBg" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#1E2749" />
          <stop offset="70%" stopColor="#141A36" />
          <stop offset="100%" stopColor="#0E1330" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={RAD.outer} fill="url(#wheelBg)" />
      <circle cx={C} cy={C} r={RAD.outer} fill="none" stroke="rgba(219,189,134,0.35)" strokeWidth="0.8" />
      <circle cx={C} cy={C} r={RAD.zodiacInner} fill="none" stroke="rgba(250,247,242,0.16)" strokeWidth="0.7" />
      <circle cx={C} cy={C} r={RAD.line} fill="none" stroke="rgba(250,247,242,0.1)" strokeWidth="0.6" />
      <circle cx={C} cy={C} r={RAD.inner} fill="none" stroke="rgba(250,247,242,0.08)" strokeWidth="0.6" />

      {/* 12자리 칸 */}
      {SIGNS.map((sign) => {
        const start = sign.index * 30;
        const a = pos(start, ascLon, RAD.zodiacInner);
        const b = pos(start, ascLon, RAD.outer);
        const g = pos(start + 15, ascLon, (RAD.zodiacInner + RAD.outer) / 2);
        const mid = pos(start + 15, ascLon, RAD.line);
        const isRising = sign.index === chart.rising.signIndex;
        return (
          <g key={sign.index}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(250,247,242,0.14)" strokeWidth="0.6" />
            <text
              x={g.x}
              y={g.y + 4.5}
              textAnchor="middle"
              fontSize="13"
              fill={isRising ? '#DBBD86' : 'rgba(250,247,242,0.62)'}
            >
              {sign.glyph}
            </text>
            <text x={mid.x} y={mid.y + 3} textAnchor="middle" fontSize="7.5" fill="rgba(250,247,242,0.34)">
              {((sign.index - chart.rising.signIndex + 12) % 12) + 1}
            </text>
          </g>
        );
      })}

      {/* 각 선 */}
      {chart.aspects
        .filter(
          (a) =>
            aspectKeys.includes(a.a) &&
            aspectKeys.includes(a.b) &&
            (a.type === '삼분' || a.type === '사분' || a.type === '대립' || a.type === '육분') &&
            a.orb <= 4,
        )
        .map((a, i) => {
          const pa = chart.points.find((p) => p.key === a.a);
          const pb = chart.points.find((p) => p.key === a.b);
          if (!pa || !pb) return null;
          const p1 = pos(pa.longitude, ascLon, RAD.line);
          const p2 = pos(pb.longitude, ascLon, RAD.line);
          const color = a.tone === 'flow' ? 'rgba(219,189,134,0.5)' : 'rgba(217,143,134,0.5)';
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth="0.8" />;
        })}

      {/* 행성 */}
      {placed.map((p) => {
        const { x, y } = pos(p.lon + p.offset, ascLon, RAD.planet);
        return (
          <g key={p.key}>
            <text x={x} y={y + 4} textAnchor="middle" fontSize="12.5" fill="#F7EFDD">
              {p.label}
            </text>
            {p.retro && (
              <text x={x + 8} y={y + 8} textAnchor="middle" fontSize="6.5" fill="rgba(217,143,134,0.9)">
                R
              </text>
            )}
          </g>
        );
      })}

      {/* ASC · MC 축과 라벨 */}
      {(() => {
        const mc = pos(chart.midheaven.longitude, ascLon, RAD.inner);
        return (
          <>
            <line x1={C - RAD.outer + 4} y1={C} x2={C + 4} y2={C} stroke="rgba(219,189,134,0.45)" strokeWidth="0.6" />
            <line x1={C} y1={C} x2={mc.x} y2={mc.y} stroke="rgba(219,189,134,0.3)" strokeWidth="0.6" />
            <text x={C - RAD.outer - 3} y={C + 3} textAnchor="end" fontSize="8" fill="#DBBD86">
              ASC
            </text>
            <text x={mc.x} y={mc.y - 5} textAnchor="middle" fontSize="8" fill="rgba(219,189,134,0.8)">
              MC
            </text>
          </>
        );
      })()}

      {/* 중심 */}
      <text x={C} y={C - 2} textAnchor="middle" fontSize="16" fill="#DBBD86">
        {SIGNS[chart.sun.signIndex].glyph}
      </text>
      <text x={C} y={C + 14} textAnchor="middle" fontSize="7.5" fill="rgba(250,247,242,0.55)">
        {chart.sun.signName}
      </text>
    </svg>
  );
}
