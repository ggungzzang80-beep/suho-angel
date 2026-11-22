import { useMemo } from 'react';
import type { Guardian } from '../lib/guardians';
import { josaOf } from '../lib/korean';
import type { Relation } from '../lib/relations';
import { GuardianAvatar, TierBadge } from './ui';

export function Room2027({
  meName,
  myKeyword,
  relations,
  onShare,
}: {
  meName: string;
  myKeyword: string;
  relations: Relation[];
  onShare: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, { line: string; names: string[] }>();
    const add = (keyword: string, line: string, name: string) => {
      const cur = map.get(keyword) ?? { line, names: [] };
      cur.names.push(name);
      map.set(keyword, cur);
    };
    add(myKeyword, '', meName);
    relations.forEach((r) => add(r.keyword2027, r.line2027, r.name));
    return [...map.entries()].sort((a, b) => b[1].names.length - a[1].names.length);
  }, [relations, meName, myKeyword]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-cream-200 px-5 py-4">
        <p className="eyebrow">2027</p>
        <h3 className="mt-1.5 font-display text-[19px]">{meName}의 방 · 2027년</h3>
        <p className="mt-1 text-[13.5px] text-ink-500">같은 한 해를 보내는 사람끼리 모았습니다. 각자의 목성·토성 자리에서 나온 키워드입니다.</p>
      </div>
      <ul className="divide-y divide-cream-200">
        {groups.map(([keyword, group]) => (
          <li key={keyword} className="px-5 py-3">
            <p className="text-[14px] font-medium text-ink-800">{keyword}</p>
            <p className="mt-0.5 text-[13px] text-ink-500">{group.names.join(' · ')}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-cream-200 px-5 py-3.5">
        <button onClick={onShare} className="btn-ghost w-full !py-2.5 !text-[14px]">
          단톡방에 우리 방 2027년 보내기
        </button>
      </div>
    </div>
  );
}

export function RankingList({
  relations,
  onSelect,
  onRemove,
}: {
  relations: Relation[];
  onSelect: (r: Relation) => void;
  onRemove: (r: Relation) => void;
}) {
  const ranked = [...relations].sort((a, b) => b.score - a.score);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-cream-200 px-5 py-3.5">
        <p className="text-[14px] font-medium text-ink-800">사람 {ranked.length}명 · 가까운 순</p>
        <p className="text-[12.5px] text-ink-400">점수를 누르면 상세</p>
      </div>

      {!ranked.length && (
        <p className="px-5 py-10 text-center text-[13.5px] leading-[1.8] text-ink-500">
          아직 사람이 없습니다.
          <br />
          친구·연인·가족의 생일을 넣으면 이 목록에 차례로 쌓입니다.
        </p>
      )}

      <ul className="divide-y divide-cream-200">
        {ranked.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`num w-6 shrink-0 text-center text-[13.5px] ${i < 3 ? 'font-semibold text-gold-600' : 'text-ink-400'}`}>
              {i + 1}
            </span>
            <button onClick={() => onSelect(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <GuardianAvatar guardian={r.guardian} size={38} ring={r.tier.color} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[14.5px] font-medium text-ink-900">{r.name}</span>
                  <span className="shrink-0 text-[12px] text-ink-400">
                    {r.signGlyph} {r.signName}
                  </span>
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <TierBadge tier={r.tier} size="sm" />
                  <span className="text-[12px] text-ink-500">
                    {r.top ? `${r.top.aName} ${r.top.type} ${r.top.bName}` : r.tier.meaning}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ink-400">2027 · {r.keyword2027}</span>
              </span>
              <span className="num shrink-0 text-[14.5px] font-medium text-ink-800">{r.score}</span>
            </button>
            <button
              onClick={() => onRemove(r)}
              className="shrink-0 text-[12px] text-ink-300 hover:text-blush-500"
              aria-label={`${r.name} 지우기`}
            >
              지우기
            </button>
          </li>
        ))}
      </ul>

      {ranked.length > 0 && ranked[0] && (
        <div className="border-t border-cream-200 bg-cream-50 px-5 py-3">
          <p className="text-[12.5px] leading-[1.7] text-ink-500">
            맨 위 <span className="font-medium text-ink-800">{ranked[0].name}</span>
            {josaOf(ranked[0].name, '은는')} {ranked[0].tier.name} —{' '}
            {ranked[0].tier.does}
          </p>
        </div>
      )}
    </div>
  );
}

export function ShareSection({ onShare, onNewMap }: { onShare: () => void; onNewMap: () => void }) {
  return (
    <div className="rounded-[22px] border border-gold-300/60 bg-gold-100/50 p-5">
      <p className="font-display text-[18px]">친구에게 지도를 건네보세요</p>
      <p className="mt-1.5 max-w-[520px] text-[13.5px] leading-[1.75] text-ink-600">
        친구가 생일만 넣으면 나와 어떤 인연인지, 그 친구의 2027년 한 줄까지 지도에 함께 뜹니다. 사람이 늘수록 관계의
        균형이 더 정확해집니다.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={onShare} className="btn-primary flex-1 !py-2.5 !text-[14.5px]">
          이 지도 공유하기
        </button>
        <button onClick={onNewMap} className="btn-ghost flex-1 !py-2.5 !text-[14.5px]">
          내 지도 새로 만들기
        </button>
      </div>
      <p className="mt-2.5 text-[12px] leading-[1.6] text-ink-500">
        프로토타입 단계에서는 초대 링크를 열어도 서버에 저장되지 않고, 이 브라우저 안에서만 관계가 계산됩니다.
      </p>
    </div>
  );
}

export function MyCard({
  meName,
  headline,
  oneLine,
  guardian,
  keyword,
  balanceLabel,
  balanceLine,
  counts,
  onCta,
  onDetail,
}: {
  meName: string;
  headline: string;
  oneLine: string;
  guardian: Guardian;
  keyword: string;
  balanceLabel: string;
  balanceLine: string;
  counts: Array<{ label: string; value: number; color: string }>;
  onCta: () => void;
  onDetail: () => void;
}) {
  return (
    <div className="starry relative overflow-hidden rounded-[24px] p-5 text-cream-100">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
      <div className="relative flex items-start gap-4">
        <GuardianAvatar guardian={guardian} size={76} ring="#DBBD86" />
        <div className="min-w-0">
          <p className="text-[12px] uppercase tracking-[0.16em] text-gold-300">나의 수호천사</p>
          <h2 className="mt-1 font-display text-[24px] leading-tight">{meName}</h2>
          <p className="mt-1 text-[13.5px] text-cream-200/80">{headline}</p>
        </div>
      </div>

      <p className="relative mt-3 text-[14px] leading-[1.75] text-cream-200/90">{oneLine}</p>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/8 px-3 py-2.5">
          <p className="text-[12px] text-cream-300/70">2027 키워드</p>
          <p className="mt-0.5 text-[13.5px] font-medium text-gold-300">{keyword}</p>
        </div>
        <div className="rounded-xl bg-white/8 px-3 py-2.5">
          <p className="text-[12px] text-cream-300/70">관계 균형</p>
          <p className="mt-0.5 text-[13.5px] font-medium text-cream-50">{balanceLabel}</p>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {counts.filter((c) => c.value > 0).length === 0 && (
          <span className="rounded-full bg-white/6 px-2.5 py-1 text-[12px] text-cream-300/70">사람을 넣으면 등급이 표시됩니다</span>
        )}
        {counts.filter((c) => c.value > 0).map((c) => (
          <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-1 text-[12px] text-cream-200/85">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label} <span className="num font-medium text-cream-50">{c.value}</span>
          </span>
        ))}
      </div>

      <p className="relative mt-3 text-[13px] leading-[1.7] text-cream-300/80">{balanceLine}</p>

      <div className="relative mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={onCta} className="btn-gold flex-1 !py-2.5 !text-[14px]">
          나는 이 사람들에게 어떤 사람일까?
        </button>
        <button onClick={onDetail} className="btn !bg-white/10 !py-2.5 !text-[14px] text-cream-100 hover:!bg-white/15">
          내 차트 자세히
        </button>
      </div>
    </div>
  );
}
