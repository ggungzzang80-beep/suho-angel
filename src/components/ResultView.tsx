import type { Chart } from '../lib/astro';
import type { Guardian } from '../lib/guardians';
import type { Insights } from '../lib/natal';
import { PRODUCTS, PRODUCT_ORDER, type ProductId } from '../lib/products';
import type { MapBalance, Relation } from '../lib/relations';
import { TIERS } from '../lib/relations';
import NatalPanel, { InsightCards } from './NatalPanel';
import RelationMap from './RelationMap';
import { MyCard, RankingList, Room2027, ShareSection } from './Relations';
import { SectionHead, Star } from './ui';

export default function ResultView(props: {
  meLabel: string;
  chart: Chart;
  insights: Insights;
  guardian: Guardian;
  relations: Relation[];
  balance: MapBalance;
  unlocked: Set<string>;
  onAddPerson: () => void;
  onSelectPerson: (r: Relation) => void;
  onRemovePerson: (r: Relation) => void;
  onShare: () => void;
  onUnlockInsight: (id: string) => void;
  onOpenProduct: (id: ProductId) => void;
  onReset: () => void;
  onCopyRoom: () => void;
}) {
  const {
    meLabel,
    chart,
    insights,
    guardian,
    relations,
    balance,
    unlocked,
    onAddPerson,
    onSelectPerson,
    onRemovePerson,
    onShare,
    onUnlockInsight,
    onOpenProduct,
    onReset,
    onCopyRoom,
  } = props;

  return (
    <div className="pb-4" data-testid="result-root">
      <header className="sticky top-0 z-30 border-b border-cream-200/70 bg-cream-50/90 backdrop-blur">
        <div className="wrap flex h-14 items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night-800 text-gold-300">
              <Star className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[16.5px]">나의 수호천사</span>
          </a>
          <div className="flex items-center gap-2">
            <button onClick={onAddPerson} className="btn-ghost !px-3.5 !py-1.5 !text-[13.5px]">
              사람 추가
            </button>
            <button onClick={onShare} className="btn-primary !px-3.5 !py-1.5 !text-[13.5px]">
              공유
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="wrap pt-5">
        <MyCard
          meName={meLabel}
          headline={insights.headline}
          oneLine={insights.oneLine}
          guardian={guardian}
          keyword={insights.houseOf2027.keyword}
          balanceLabel={balance.label}
          balanceLine={balance.line}
          counts={TIERS.map((t) => ({ label: t.short, value: balance.counts[t.id], color: t.color }))}
          onCta={onAddPerson}
          onDetail={() => {
            const el = document.getElementById('chart');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />

        <section id="chart" className="mt-12 scroll-mt-20">
          <SectionHead
            eyebrow="Natal"
            title="내 수호 차트"
            lead="태양·달·어센던트를 축으로, 하우스는 어센던트 자리부터 한 자리씩 놓는 Whole Sign 방식으로 읽었습니다."
          />
          <NatalPanel chart={chart} insights={insights} onToast={() => {}} />
        </section>

        <section id="insight" className="mt-12 scroll-mt-20">
          <SectionHead
            eyebrow="Insight"
            title="내 별자리 사용설명서"
            lead="무료로 두 개를 열어 두었습니다. 잠긴 다섯 개는 10년·직업·금전·월별·사람에 대한 심층 해석입니다."
          />
          <InsightCards
            insights={insights}
            unlocked={unlocked}
            onUnlock={onUnlockInsight}
            onOpenAll={() => onOpenProduct('self-deep')}
          />
        </section>

        <section id="map" className="mt-12 scroll-mt-20">
          <SectionHead
            eyebrow="Guardian map"
            title="나의 수호천사 관계 지도"
            lead="사람마다 두 천궁도의 교차 각을 계산해 등급을 붙였습니다. 이름을 누르면 그 사람과의 흐름이 열립니다."
          />
          <RelationMap
            me={chart}
            relations={relations}
            balance={balance}
            onSelect={onSelectPerson}
            onAdd={onAddPerson}
            onShare={onShare}
          />
        </section>

        <section id="room" className="mt-12 grid scroll-mt-20 gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Room2027 meName={meLabel} myKeyword={insights.houseOf2027.keyword} relations={relations} onShare={onCopyRoom} />
          <RankingList relations={relations} onSelect={onSelectPerson} onRemove={onRemovePerson} />
        </section>

        <section className="mt-12">
          <ShareSection onShare={onShare} onNewMap={onReset} />
        </section>

        <section id="products" className="mt-12 scroll-mt-20">
          <SectionHead
            eyebrow="Report"
            title="더 깊이 보고 싶다면"
            lead="지도는 무료입니다. 깊은 해석만 한 편씩 열 수 있게 했습니다. 결제 전에 무엇이 열리는지 먼저 확인하세요."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {PRODUCT_ORDER.filter((id) => id !== 'map-all').map((id) => {
              const p = PRODUCTS[id];
              return (
                <div key={id} className="card flex flex-col p-4">
                  <p className="text-[14px] font-medium text-ink-900">{p.name}</p>
                  <p className="mt-1 text-[13px] leading-[1.6] text-ink-500">{p.tagline}</p>
                  <p className="num mt-3 font-display text-[20px] text-ink-900">{p.priceText}</p>
                  <button onClick={() => onOpenProduct(id)} className="btn-ghost mt-3 w-full !py-2 !text-[13.5px]">
                    자세히 보기
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col items-start justify-between gap-3 rounded-2xl bg-night-800 px-5 py-4 text-cream-100 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-[17.5px]">{PRODUCTS['map-all'].name}</p>
              <p className="mt-0.5 text-[13px] text-cream-300/80">{PRODUCTS['map-all'].tagline}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="num text-[16.5px] text-gold-300">{PRODUCTS['map-all'].priceText}</span>
              <button onClick={() => onOpenProduct('map-all')} className="btn-gold !px-4 !py-2 !text-[13.5px]">
                열기
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
