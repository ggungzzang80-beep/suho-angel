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
    const H = 8; // 라벨 상자 높이(%)
    const AV = 11; // 아바타 상자 크기(%)
    const centerBox = { x: 50, y: 50, w: 22, h: 22 };
    const placed: Array<{ x: number; y: number; w: number; h: number }> = [centerBox];
    const hits = (x: number, y: number) =>
      placed.some((b) => Math.abs(b.x - x) < (b.w + W) / 2 && Math.abs(b.y - y) < (b.h + H) / 2);

    return [...relations]
      .sort((a, b) => b.score - a.score)
      .map((r) => {
        /* 아바타 자리는 먼저 차지해 둡니다 */
        placed.push({ x: r.x, y: r.y, w: AV, h: AV });
        return r;
      })
      .map((r) => {
        const candidates = [6.6, -6.6, 13.2, -13.2, 19.8, -19.8].map((d) => r.y + (r.y > 50 ? -d : d));
        const fallback = r.y > 50 ? r.y - 22 : r.y + 22;
        const y = candidates.find((c) => c > 3 && c < 97 && !hits(r.x, c)) ?? Math.max(3, Math.min(97, fallback));
        placed.push({ x: r.x, y, w: W, h: H });
        return { r, x: r.x, y };
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
