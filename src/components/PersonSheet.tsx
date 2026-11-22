import type { Relation } from '../lib/relations';
import { TIERS, tierRank } from '../lib/relations';
import { GuardianAvatar, LockIcon, ScoreBar, TierBadge } from './ui';

/**
 * 인물 상세 시트 — 결과와 해설만 보여 줍니다.
 *
 * 계산(v5: 하우스 오버레이 5그룹·성별 조합 가중치·시간 모름 보정)은 `lib/relations.ts`가 그대로 하고,
 * 이 화면에서는 하우스 번호·하우스 지수·가중치·소수점 수치 같은 계산 표시를 꺼내지 않습니다.
 * (2026-11-18 박아름 님 피드백: 기술적 표시를 걷어내고 결과·해설 중심으로)
 * 테스트가 모드 분기를 확인할 수 있도록 블록에 `data-compat-mode`·`data-house-score`만 남깁니다(화면에 그리지 않음).
 */
export default function PersonSheet({
  relation,
  unlocked,
  onUnlock,
  onRemove,
  onClose,
}: {
  relation: Relation;
  unlocked: boolean;
  onUnlock: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const r = relation;
  const previewAspects = r.aspects.slice(0, unlocked ? 8 : 2);
  /* 같은 행성·같은 하우스가 두 그룹에 걸칠 수 있어(7=배우자·라이벌) 가장 센 설명 한 줄만 남깁니다 */
  const leadHits = r.overlay.hits
    .filter(
      (h, i, all) =>
        all.findIndex((x) => x.direction === h.direction && x.house === h.house && x.pointKey === h.pointKey) === i,
    )
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-start gap-3">
        <GuardianAvatar guardian={r.guardian} size={54} ring={r.tier.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[19px]">{r.name}</h3>
            <span className="num rounded-full bg-cream-100 px-2 py-0.5 text-[12.5px] text-ink-600">{r.score}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-500">
            {r.signGlyph} {r.signName} · 수호 고양이 {r.guardian.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <TierBadge tier={r.tier} size="sm" />
            <span className="text-[12px] text-ink-400">
              13단계 중 {tierRank(r.tier)}단계 · {r.tier.band}점 구간
            </span>
          </div>
          {/* 열세 단계 가운데 어디인지 — 점 자체는 고정이므로 '오르는' 표시는 두지 않습니다 */}
          <div className="mt-2 flex gap-[3px]" aria-hidden="true">
            {TIERS.map((t) => (
              <span
                key={t.id}
                className="h-[3px] flex-1 rounded-full"
                style={{ backgroundColor: t.id === r.tier.id ? t.color : '#EAE3D7' }}
              />
            ))}
          </div>
        </div>
        <button onClick={onClose} aria-label="닫기" className="text-[13px] text-ink-400 hover:text-ink-700">
          닫기
        </button>
      </div>

      <p className="mt-3 rounded-xl px-3.5 py-3 text-[13.5px] leading-[1.8] text-ink-700" style={{ backgroundColor: r.tier.soft }}>
        {r.tier.meaning}. {r.summary}
      </p>

      <div className="mt-4 space-y-2.5">
        <ScoreBar label="감정의 온도" value={r.axes.warmth} color="#D98F86" />
        <ScoreBar label="끌림의 세기" value={r.axes.pull} color="#C8A15E" />
        <ScoreBar label="오래 가는 힘" value={r.axes.lasting} color="#5FA491" />
      </div>

      {/* 다섯 갈래 결 — 요약 한 문장 · 그룹별 해설 · 구체적 배치만 남깁니다 */}
      <div
        className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-3.5"
        data-testid="house-groups"
        data-compat-mode={r.compatMode}
        data-house-score={r.houseScore.toFixed(3)}
      >
        <p className="text-[13px] leading-[1.7] text-ink-700">{r.overlay.line}</p>

        <div className="mt-2.5 space-y-1.5">
          {r.groups.map((g) => (
            <div key={g.id} className="rounded-lg bg-white/75 px-2.5 py-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-[12.5px] text-ink-800">{g.name}</span>
                <span
                  className="rounded-full px-1.5 py-[1px] text-[12px]"
                  style={
                    g.level === 'active' || g.level === 'warm'
                      ? { backgroundColor: '#E4F3ED', color: '#3F7F6B' }
                      : g.level === 'tense' || g.level === 'watch'
                        ? { backgroundColor: '#F7E8E1', color: '#A9635A' }
                        : g.level === 'dim' || g.level === 'strained'
                          ? { backgroundColor: '#F1EBE4', color: '#8A7A6B' }
                          : { backgroundColor: '#EFEDF3', color: '#6E6A80' }
                  }
                >
                  {g.levelLabel}
                </span>
              </div>
              {g.line && <p className="mt-1 pl-3 text-[12px] leading-[1.6] text-ink-600">{g.line}</p>}
            </div>
          ))}
        </div>

        {leadHits.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-cream-200 pt-2.5">
            {leadHits.map((h, i) => (
              <div key={`${h.direction}-${h.house}-${h.group}-${h.pointKey}-${i}`} className="flex items-start gap-2">
                <span
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: h.tone === 'help' ? '#5FA491' : '#D98F86' }}
                />
                <p className="text-[12.5px] leading-[1.6] text-ink-600">
                  <span className="text-ink-800">
                    {h.direction === 'mine' ? '상대' : '내'} {h.pointName} → {h.direction === 'mine' ? '내' : '상대'} {h.house}
                    하우스({h.houseShort}) · {h.roleLabel}
                  </span>
                  <span className="block">{h.line}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {r.top && (
          <div className="rounded-xl border border-mint-300/60 bg-mint-100/60 p-3">
            <p className="text-[12px] uppercase tracking-[0.12em] text-mint-500">가장 강한 흐름</p>
            <p className="mt-1 text-[13.5px] font-medium text-ink-800">
              {r.top.aName} · {r.top.bName} {r.top.type}
            </p>
            <p className="mt-1 text-[13px] leading-[1.7] text-ink-600">{r.top.body}</p>
          </div>
        )}
        {r.tension && (
          <div className="rounded-xl border border-blush-300/60 bg-blush-100/60 p-3">
            <p className="text-[12px] uppercase tracking-[0.12em] text-blush-500">조심할 자리</p>
            <p className="mt-1 text-[13.5px] font-medium text-ink-800">
              {r.tension.aName} · {r.tension.bName} {r.tension.type}
            </p>
            <p className="mt-1 text-[13px] leading-[1.7] text-ink-600">{r.tension.body}</p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-cream-100 p-3.5">
        <p className="text-[12.5px] text-ink-500">2027년 이 사람의 한 줄</p>
        <p className="mt-1 text-[13.5px] font-medium text-ink-800">{r.keyword2027}</p>
        <p className="mt-1 text-[13px] leading-[1.7] text-ink-600">{r.line2027}</p>
      </div>

      <p className="mt-3 text-[13px] leading-[1.8] text-ink-600">{r.mirrored}</p>

      <div className="mt-4">
        <p className="mb-2 text-[13px] font-medium text-ink-800">교차 각 {r.aspects.length}개</p>
        <div className="space-y-1.5">
          {previewAspects.map((a, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-cream-50 px-2.5 py-1.5">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: a.tone === 'flow' ? '#5FA491' : '#D98F86' }}
              />
              <p className="flex-1 text-[13px] leading-[1.6] text-ink-700">
                {a.aName} {a.type} {a.bName}
                <span className="num ml-1 text-ink-400">오브 {a.orb.toFixed(1)}°</span>
              </p>
            </div>
          ))}
          {!unlocked && r.aspects.length > previewAspects.length && (
            <div className="relative overflow-hidden rounded-lg border border-cream-200 px-2.5 py-2">
              <div className="lock-blur space-y-1 text-[13px] text-ink-500">
                <p>달 삼분 금성 · 오브 1.2°</p>
                <p>태양 육분 목성 · 오브 2.4°</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[12px] text-gold-600">
                  <LockIcon className="h-3 w-3" /> 나머지 {r.aspects.length - previewAspects.length}개
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!unlocked ? (
        <button onClick={onUnlock} className="btn-gold mt-4 w-full !py-3 !text-[14.5px]">
          관계 심층 리포트 · 3,900원
        </button>
      ) : (
        <p className="mt-4 rounded-xl bg-mint-100 px-3 py-2.5 text-center text-[13px] text-mint-500">
          관계 심층 리포트가 열렸습니다. 전체 각과 조언을 볼 수 있어요.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[12px] leading-[1.5] text-ink-400">
          생년월일시 원본은 지도에 표시되지 않습니다.
        </p>
        <button onClick={onRemove} className="text-[12px] text-ink-400 underline-offset-2 hover:text-blush-500 hover:underline">
          지도에서 지우기
        </button>
      </div>
    </div>
  );
}
