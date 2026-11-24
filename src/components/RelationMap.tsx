import { useMemo } from 'react';
import type { Chart } from '../lib/astro';
import { guardianOfSign } from '../lib/guardians';
import { TIERS, type MapBalance, type Relation } from '../lib/relations';
import { GuardianAvatar, TierBadge } from './ui';

const RADII = [22, 29, 35, 40, 44];

/** 고정 배치 별 — 난수 없이 항상 같은 자리에 놓습니다. */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = (i * 137.508) % 360;
  const r = 6 + ((i * 53) % 86);
  const rad = (a * Math.PI) / 180;
  return {
    x: +(50 + Math.cos(rad) * r * 0.62).toFixed(2),
    y: +(50 + Math.sin(rad) * r * 0.62).toFixed(2),
    r: +(0.14 + ((i * 7) % 5) * 0.05).toFixed(3),
    o: +(0.22 + ((i * 11) % 6) * 0.07).toFixed(2),
  };
});

export default function RelationMap({
  me,
  relations,
  balance,
  onSelect,
  onAdd,
  onShare,
}: {
  me: Chart;
  relations: Relation[];
  balance: MapBalance;
  onSelect: (r: Relation) => void;
  onAdd: () => void;
  onShare: () => void;
}) {
  const myGuardian = guardianOfSign(me.sun.signIndex);

  /**
   * 지도 노드 라벨 배치.
   * 아바타 아래에 이름을 붙이면 안쪽 궤도 노드끼리, 또 아래쪽 범례와 겹쳤습니다.
   * 그래서 라벨을 아바타와 분리해 두 줄(이름·점수)짜리 상자로 놓고,
   * 가까운 상자와 부딪히면 위/아래 후보 자리를 차례로 시도합니다.
   */
  const labels = useMemo(() => {
    const W = 19; // 라벨 상자 폭(%) — w-[84px] / 지도 폭 430px
    const H = 9; // 라벨 상자 높이(%)
    const AV = 12; // 아바타 상자 크기(%)
    type Box = { x: number; y: number; w: number; h: number };
    const placed: Box[] = [
      { x: 50, y: 50, w: 22, h: 22 }, // 가운데 '나' 아바타
      { x: 50, y: 60, w: 26, h: 11 }, // 가운데 '나' 이름·별자리
    ];
    relations.forEach((r) => placed.push({ x: r.x, y: r.y, w: AV, h: AV }));

    const overlapOf = (x: number, y: number) =>
      placed.reduce((sum, b) => {
        const ox = Math.min(x + W / 2, b.x + b.w / 2) - Math.max(x - W / 2, b.x - b.w / 2);
        const oy = Math.min(y + H / 2, b.y + b.h / 2) - Math.max(y - H / 2, b.y - b.h / 2);
        return sum + Math.max(0, ox) * Math.max(0, oy);
      }, 0);

    /* 아바타 바로 위/아래부터 시작해 조금씩 밀어 보고, 겹침이 가장 적은 자리를 씁니다 */
    const rings = [6.8, 13.6, 20.4, 27.2, 34];
    const sides = [1, -1];
    const shifts = [0, -11, 11, -20, 20];

    return [...relations]
      .sort((a, b) => b.score - a.score)
      .map((r) => {
        const near = r.y > 50 ? -1 : 1; // 아래쪽 노드는 위로, 위쪽 노드는 아래로
        const candidates: Array<{ x: number; y: number }> = [];
        for (const d of rings) {
          for (const side of sides) {
            for (const dx of shifts) {
              const y = r.y + d * side * (side === near ? 1 : 0.85);
              const x = Math.max(13, Math.min(87, r.x + dx));
              if (y > 4 && y < 96) candidates.push({ x, y });
            }
          }
        }
        let best = candidates[0];
        let bestScore = Number.POSITIVE_INFINITY;
        for (const c of candidates) {
          const score = overlapOf(c.x, c.y) + Math.abs(c.x - r.x) * 0.01 + Math.abs(c.y - r.y) * 0.004;
          if (score < bestScore) {
            bestScore = score;
            best = c;
          }
          if (overlapOf(c.x, c.y) === 0) {
            best = c;
            bestScore = 0;
            break;
          }
        }
        placed.push({ x: best.x, y: best.y, w: W, h: H });
        return { r, x: best.x, y: best.y };
      });
  }, [relations]);

  const legend = (side: 'protect' | 'tension') => {
    const list = TIERS.filter((t) => t.side === side);
    const total = list.reduce((s, t) => s + balance.counts[t.id], 0);
    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="mr-0.5 text-[12.5px] uppercase tracking-[0.14em] text-cream-300/50">
          {side === 'protect' ? '수호' : '긴장'}
          <span className="num ml-1 text-cream-200/75">{total}</span>
        </span>
        {list.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full bg-white/6 px-1.5 py-[2px] text-[12.5px] text-cream-200/80"
            style={{ boxShadow: `inset 0 0 0 1px ${t.color}33` }}
          >
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: t.color }} />
            {t.short}
            <span className={`num ${balance.counts[t.id] ? 'font-medium text-cream-50' : 'text-cream-300/40'}`}>
              {balance.counts[t.id]}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const buttons = (
    <>
      <button onClick={onAdd} className="btn-primary w-full !py-3 !text-[15px]">
        생일 넣고 사람 추가
      </button>
      <button onClick={onShare} className="btn-ghost w-full !py-3 !text-[15px]">
        이 지도 공유하기
      </button>
    </>
  );

  const balanceCard = (
    <div className="rounded-2xl border border-cream-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <TierBadge tier={TIERS[1]} size="sm" />
        <p className="text-[13.5px] font-medium text-ink-800">{balance.label}</p>
      </div>
      <p className="mt-2 text-[13.5px] leading-[1.75] text-ink-600">{balance.line}</p>
      {balance.strongest && (
        <p className="mt-2 text-[13px] leading-[1.7] text-ink-500">
          이 지도에서 가장 가까운 사람은 <span className="font-medium text-ink-800">{balance.strongest.name}</span> —{' '}
          {balance.strongest.tier.meaning}.
        </p>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,500px)_300px] lg:justify-center">
      <div>
        <div className="starry relative overflow-hidden rounded-[24px] px-3 pb-4 pt-4">
          <div className="flex items-start justify-between px-2">
            <div>
              <p className="text-[12px] uppercase tracking-[0.16em] text-gold-300">수호천사 지도</p>
              <p className="mt-1 text-[13.5px] text-cream-200/80">
                {relations.length ? `${relations.length}명 · 중심에 가까울수록 나를 살리는 사람` : '아직 아무도 없는 지도'}
              </p>
            </div>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[12px] text-cream-200/70">
              {balance.average ? `평균 ${balance.average}` : '대기 중'}
            </span>
          </div>

          <div className="relative mx-auto mt-3 aspect-square w-full max-w-[430px] lg:max-w-[452px]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {RADII.map((r) => (
                <circle
                  key={r}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke="rgba(250,247,242,0.12)"
                  strokeWidth="0.22"
                  strokeDasharray="0.8 1.6"
                />
              ))}
              {STARS.map((st, i) => (
                <circle key={`st-${i}`} cx={st.x} cy={st.y} r={st.r} fill="#FAF7F2" opacity={st.o} />
              ))}
              {/* 라벨이 아바타에서 떨어져 놓인 경우, 어느 아바타의 이름인지 잇는 점선 */}
              {labels
                .filter((l) => Math.abs(l.x - l.r.x) > 4 || Math.abs(l.y - l.r.y) > 9)
                .map((l) => {
                  const endX = Math.max(l.x - 9.5, Math.min(l.x + 9.5, l.r.x));
                  const endY = Math.max(l.y - 4.5, Math.min(l.y + 4.5, l.r.y));
                  return (
                    <line
                      key={`ll-${l.r.id}`}
                      x1={l.r.x}
                      y1={l.r.y}
                      x2={endX}
                      y2={endY}
                      stroke="rgba(219,189,134,0.42)"
                      strokeWidth="0.26"
                      strokeDasharray="0.9 1.2"
                    />
                  );
                })}

              {relations.map((r) => (
                <line
                  key={`l-${r.id}`}
                  x1="50"
                  y1="50"
                  x2={r.x}
                  y2={r.y}
                  stroke={r.tier.color}
                  strokeOpacity="0.28"
                  strokeWidth="0.22"
                />
              ))}
              <circle cx="50" cy="50" r="11" fill="rgba(219,189,134,0.06)" />
            </svg>

            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
              <GuardianAvatar guardian={myGuardian} size={56} ring="#DBBD86" className="mx-auto" />
              <p className="mt-1.5 max-w-[88px] truncate text-[13px] font-medium text-cream-50">{me.nickname || '나'}</p>
              <p className="text-[12.5px] text-gold-300">{me.sun.signName}</p>
            </div>

            {/* 이름·점수 라벨 — 아바타와 따로 놓아 서로 겹치지 않게 자리를 찾습니다 */}
            {labels.map(({ r, x, y }) => (
              <div
                key={`label-${r.id}`}
                className="pointer-events-none absolute z-10 w-[84px] text-center"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <p className="truncate text-[12px] leading-tight text-cream-100">{r.name}</p>
                <p className="num text-[12px] leading-tight text-cream-300/60">
                  {r.approx ? `≈${r.score}` : r.score}
                </p>
              </div>
            ))}

            {relations.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="group absolute z-10 text-center focus:outline-none"
                style={{ left: `${r.x}%`, top: `${r.y}%`, transform: 'translate(-50%, -50%)' }}
                aria-label={`${r.name} 자세히 보기`}
              >
                <span className="block transition group-hover:-translate-y-0.5 group-active:scale-95">
                  <GuardianAvatar guardian={r.guardian} size={r.ring === 0 ? 46 : 38} ring={r.tier.color} />
                </span>
              </button>
            ))}

            {!relations.length && (
              <div className="absolute inset-x-6 bottom-6 text-center">
                <p className="rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-[13px] leading-[1.6] text-cream-200/80">
                  친구의 생일을 넣으면
                  <br />
                  이 자리에 별이 하나 생깁니다
                </p>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1.5 px-2">
            {legend('protect')}
            {legend('tension')}
            <p className="pt-1 text-[12.5px] leading-[1.6] text-cream-300/50">
              * Frenemy (프레너미): Friend(친구)와 Enemy(적)의 합성
            </p>
            {relations.some((r) => r.approx) && (
              <p className="text-[12.5px] leading-[1.6] text-cream-300/50">
                * ≈ 표시는 초대 카드로 들어온 사람 — 생년월일시 없이 별자리 자리만으로 계산한 간이 값입니다.
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 lg:hidden">{buttons}</div>
      </div>

      <div className="hidden flex-col gap-3 lg:flex">
        {balanceCard}
        <div className="flex flex-col gap-2">{buttons}</div>
        <div className="rounded-2xl bg-cream-100 p-3.5 text-[12.5px] leading-[1.7] text-ink-500">
          지도는 사람이 늘수록 촘촘해집니다. 친구가 자기 생일을 넣으면 그 사람의 지도에도 내가 함께 뜹니다.
        </div>
      </div>

      <div className="lg:hidden">{balanceCard}</div>
    </div>
  );
}
