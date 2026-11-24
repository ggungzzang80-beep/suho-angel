import type { Chart } from '../lib/astro';
import type { Insights } from '../lib/natal';
import { HOUSE_META } from '../lib/signs';
import NatalWheel from './NatalWheel';
import { SignGlyph } from './Glyphs';
import { Arrow, Disclosure, GuardianAvatar } from './ui';
import { guardianOfSign } from '../lib/guardians';

const ELEMENT_COLOR: Record<string, string> = {
  불: '#D98F86',
  흙: '#C2A277',
  공기: '#A6C0E4',
  물: '#8E9FD1',
};

export default function NatalPanel({ chart, insights }: { chart: Chart; insights: Insights; onToast?: (m: string) => void }) {
  const guardian = guardianOfSign(chart.sun.signIndex);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:gap-6">
      <div className="card starry h-fit self-start overflow-hidden p-4">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[12.5px] uppercase tracking-[0.16em] text-gold-300">Whole Sign · Natal</span>
          <span className="text-[12px] text-cream-300/70">
            {chart.city.name} {chart.timeKnown ? chart.timeText.replace(` (${chart.city.name} 현지)`, '') : '정오 기준'}
          </span>
        </div>
        <div className="flex justify-center">
          <NatalWheel chart={chart} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 px-1 text-center">
          {[
            ['태양', chart.sun],
            ['달', chart.moon],
            ['어센던트', chart.rising],
          ].map(([label, p]) => {
            const point = p as typeof chart.sun;
            return (
              <div key={label as string} className="rounded-xl bg-white/5 px-2 py-2">
                <p className="text-[12px] text-cream-300/60">{label as string}</p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-[13px] text-cream-100">
                  <SignGlyph signIndex={point.signIndex} className="text-[13px]" />
                  {point.signName}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">내 수호 차트</p>
              <h3 className="mt-1.5 font-display text-[20px] leading-snug">{insights.headline}</h3>
            </div>
            <div className="text-right">
              <GuardianAvatar guardian={guardian} size={44} ring="#DBBD86" />
              <p className="mt-1 text-[12px] text-ink-500">{guardian.name}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {insights.identity.map((row) => (
              <div key={row.label} className="flex gap-3">
                <span className="mt-[2px] w-[74px] shrink-0 text-[12.5px] text-ink-400">{row.label}</span>
                <div>
                  <p className="flex items-center gap-1.5 text-[14px] font-medium text-ink-800">
                    <SignGlyph signIndex={row.signIndex} className="text-[14px]" />
                    {row.sign}
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-[1.7] text-ink-600">{row.line}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-[14px] font-medium text-ink-800">원소의 균형</p>
            <div className="mt-3 space-y-2.5">
              {insights.balance.map((b) => (
                <div key={b.element}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-600">{b.element}</span>
                    <span className="num text-ink-500">{b.count} · {b.percent}%</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(4, b.percent)}%`, backgroundColor: ELEMENT_COLOR[b.element] }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-[1.65] text-ink-500">{insights.modalityLine}</p>
          </div>

          <div className="card p-5">
            <p className="text-[14px] font-medium text-ink-800">세 가지 지수</p>
            <div className="mt-3 space-y-3">
              {[
                ['연애의 온도', chart.indices.love],
                ['금전의 결', chart.indices.money],
                ['일의 추진력', chart.indices.work],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span className="w-[70px] shrink-0 text-[13px] text-ink-600">{label as string}</span>
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${value as number}%` }} />
                  </div>
                  <span className="num w-7 text-right text-[13.5px] font-medium text-ink-800">{value as number}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-[1.65] text-ink-500">
              금성·달·목성·화성·토성이 놓인 자리와 각으로 계산합니다. 절대 점수가 아니라 서로 비교하기 위한 값입니다.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-[14px] font-medium text-ink-800">어센던트부터 한 자리씩 놓인 하우스</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-ink-500">
            하우스는 삶의 영역입니다. 내 어센던트 자리에서 시작해 한 자리가 한 하우스가 됩니다.
          </p>
          <div className="mt-3">
            <Disclosure summary="열두 하우스 자리 한눈에 보기">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
                {chart.houses.map((h) => (
                  <div key={h.index} className="flex justify-between gap-2">
                    <span className="text-ink-500">
                      {h.index}. {HOUSE_META[h.index - 1].short}
                    </span>
                    <span className="text-ink-800">{h.signName}</span>
                  </div>
                ))}
              </div>
            </Disclosure>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InsightCards({
  insights,
  unlocked,
  onUnlock,
  onOpenAll,
}: {
  insights: Insights;
  unlocked: Set<string>;
  onUnlock: (id: string) => void;
  onOpenAll: () => void;
}) {
  const freeCount = insights.cards.filter((c) => c.free).length;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-[5px] w-24 overflow-hidden rounded-full bg-cream-200">
          <div className="h-full rounded-full bg-gold-500" style={{ width: `${(freeCount / insights.cards.length) * 100}%` }} />
        </div>
        <p className="text-[12.5px] text-ink-500">
          무료 공개 {freeCount}/{insights.cards.length} · 나머지는 심층 리포트
        </p>
      </div>

      <div className="space-y-3">
        {insights.cards.map((card) => {
          const open = card.free || unlocked.has(card.id);
          return (
            <div key={card.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-4">
                <div className="flex items-center gap-2">
                  <span className={`chip ${open ? '!border-gold-300 !bg-gold-100 !text-gold-600' : ''}`}>{open ? card.kicker : '잠김'}</span>
                  <h3 className="font-display text-[17px]">{card.title}</h3>
                </div>
              </div>

              <div className={`px-5 pb-4 pt-2 ${open ? '' : 'relative'}`}>
                <div className={open ? '' : 'lock-blur'}>
                  {card.paragraphs.slice(0, open ? card.paragraphs.length : 2).map((p, i) => (
                    <p key={i} className="mt-1.5 text-[14px] leading-[1.8] text-ink-700">
                      {p}
                    </p>
                  ))}
                  {open && card.rows && (
                    <div className="mt-3 divide-y divide-cream-200 rounded-xl border border-cream-200">
                      {card.rows.map((row, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2">
                          <span className="w-[54px] shrink-0 text-[12.5px] text-ink-400">{row.label}</span>
                          <span className="flex-1 text-[13px] leading-[1.6] text-ink-800">{row.value}</span>
                          {row.note && <span className="hidden text-[12px] text-ink-400 sm:block">{row.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!open && (
                  <div className="absolute inset-0 flex min-h-[86px] items-center justify-center">
                    <button onClick={() => onUnlock(card.id)} className="btn-gold !px-4 !py-2 !text-[13.5px]">
                      {card.id === 'decade' || card.id === 'career' || card.id === 'money' || card.id === 'monthly' || card.id === 'people'
                        ? '개인 심층 리포트에서 열기'
                        : '잠금 해제'}
                      <Arrow className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-gold-300/60 bg-gold-100/60 px-4 py-4 text-center">
        <p className="text-[14px] text-ink-700">잠긴 다섯 개를 한 번에 여는 개인 심층 리포트</p>
        <button onClick={onOpenAll} className="btn-primary !py-2.5 !text-[14.5px]">
          심층 리포트 보기 · 6,900원
        </button>
        <p className="text-[12px] text-ink-500">결제 즉시 열람 · 열람 후 청약철회 제한 안내에 동의하게 됩니다</p>
      </div>
    </div>
  );
}
