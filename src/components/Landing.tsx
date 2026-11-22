import { GUARDIANS } from '../lib/guardians';
import { TIERS } from '../lib/relations';
import IntakeForm, { type IntakeSubmit } from './IntakeForm';
import { GuardianAvatar, Star, TierBadge } from './ui';

export default function Landing({
  onSubmit,
  onOpenLegal,
}: {
  onSubmit: (v: IntakeSubmit) => void;
  onOpenLegal: () => void;
}) {
  return (
    <div className="pb-16">
      <header className="sticky top-0 z-30 border-b border-cream-200/70 bg-cream-50/85 backdrop-blur">
        <div className="wrap flex h-14 items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night-800 text-gold-300">
              <Star className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[16.5px] tracking-tight">나의 수호천사</span>
          </a>
          <div className="flex items-center gap-4 text-[14px] text-ink-600">
            <a href="#tiers" className="hidden hover:text-ink-900 sm:inline">
              관계 등급
            </a>
            <a href="#how" className="hidden hover:text-ink-900 sm:inline">
              계산 방식
            </a>
            <button onClick={onOpenLegal} className="text-ink-500 hover:text-ink-900">
              정책
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="wrap grid gap-8 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="animate-rise">
            <p className="eyebrow">서양 점성술 · 태어난 순간의 별자리</p>
            <h1 className="mt-3 font-display text-[32px] leading-[1.28] tracking-[-0.02em] sm:text-[44px]">
              내 곁에 누가 빛을 주는지,
              <br />
              나는 누구의 빛인지
            </h1>
            <p className="mt-4 max-w-[440px] text-[16px] leading-[1.8] text-ink-600">
              생일과 태어난 시간, 태어난 도시만 넣으면 30초. 내 별자리와 수호 고양이를 찾아 주고, 곁의 사람들과 어떤
              사이인지 한 장의 지도로 그려 드려요.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
              <span className="chip">로그인 없이</span>
              <span className="chip">입력 30초</span>
              <span className="chip">친구를 더할수록 정확해짐</span>
            </p>

            <div className="mt-7 hidden lg:block">
              <TierList />
            </div>
          </div>

          <div className="animate-rise lg:pt-2" style={{ animationDelay: '80ms' }}>
            <IntakeForm mode="me" submitLabel="내 지도 열기" onSubmit={onSubmit} />
          </div>
        </section>

        <section className="wrap mt-12">
          <div className="rounded-[22px] border border-cream-200 bg-white/60 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[14px] font-medium text-ink-700">수호 고양이 14종</p>
              <p className="text-[12.5px] text-ink-400">태양 별자리마다 한 마리씩</p>
            </div>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
              {GUARDIANS.map((g) => (
                <div key={g.id} className="w-[78px] shrink-0 text-center">
                  <GuardianAvatar guardian={g} size={62} className="mx-auto" />
                  <p className="mt-1.5 text-[12.5px] font-medium text-ink-800">{g.name}</p>
                  <p className="text-[12px] text-ink-400">{g.trait}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tiers" className="wrap mt-14 scroll-mt-20">
          <p className="eyebrow">관계 등급</p>
          <h2 className="section-title mt-2">열세 단계로 나눈, 내 곁의 사람들</h2>
          <p className="section-lead max-w-[560px]">
            두 사람의 별자리가 서로 어떻게 놓여 있는지를 마음의 온도, 끌림, 오래 가는 힘 세 가지로 나눠 봐요. 서로에게
            좋은 자리로 들어오는지도 함께 보고요. 수호 쪽 아홉 단계와 긴장 쪽 네 단계 — 소울메이트부터 라이벌까지,
            점수가 높을수록 지도 가운데 가까이 놓여요.
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-ink-400">
            * Frenemy (프레너미): Friend(친구)와 Enemy(적)의 합성
          </p>

          {/* 좁은 화면: 한 줄씩 보는 등급표 */}
          <div className="mt-5 sm:hidden">
            <TierList />
          </div>

          {/* 넓은 화면: 카드 */}
          <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5">
            {TIERS.map((t) => (
              <div key={t.id} className="card flex flex-col gap-2 p-4" style={{ borderTopColor: t.color, borderTopWidth: 3 }}>
                <TierBadge tier={t} size="sm" />
                <p className="text-[13.5px] leading-[1.6] text-ink-700">{t.meaning}</p>
                <p className="mt-auto text-[12.5px] text-ink-400">
                  {t.band}점 · {t.side === 'protect' ? '수호' : '긴장'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="wrap mt-14 scroll-mt-20">
          <div className="card overflow-hidden">
            <div className="grid gap-0 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  title: '30초 입력',
                  body: '이름은 안 써도 괜찮아요. 생년월일 여덟 자리, 태어난 시간 네 자리(모르면 ‘모름’에 체크), 태어난 도시. 이 네 칸이면 충분해요.',
                },
                {
                  step: '02',
                  title: '내 별자리와 수호 고양이',
                  body: '태양과 달, 그리고 태어난 시간에 따라 달라지는 ‘나를 보여 주는 자리’를 찾아요. 그 자리에 어울리는 수호 고양이를 붙여 드려요.',
                },
                {
                  step: '03',
                  title: '사람을 더하면 지도가 돼요',
                  body: '친구, 연인, 가족, 동료의 생일을 넣을수록 지도가 촘촘해져요. 사람마다 관계 등급과 수호 고양이가 함께 붙어요.',
                },
              ].map((s, i) => (
                <div key={s.step} className={`p-5 ${i > 0 ? 'border-t border-cream-200 sm:border-l sm:border-t-0' : ''}`}>
                  <p className="num text-[12.5px] tracking-[0.16em] text-gold-600">{s.step}</p>
                  <p className="mt-2 font-display text-[17.5px]">{s.title}</p>
                  <p className="mt-1.5 text-[13.5px] leading-[1.75] text-ink-600">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-cream-200 bg-cream-50 px-5 py-3.5 text-[12.5px] leading-[1.7] text-ink-500">
              별자리는 그날 하늘에 별이 실제로 놓인 자리로 계산해요. 두 사람의 별자리를 겹쳐 놓고, 서로에게 어떤 자리로
              들어오는지를 다섯 갈래 결(소울메이트·운명적 인연 / 은인·후원자 / 절친·베스트 프렌드 / 기사·헌신 / 라이벌·경쟁자)로
              나눠 봐요. 같은 자리라도 좋은 별이 오는지에 따라 다르게 읽고요. 태어난 시간과 도시에 따라 달라지는 부분이
              있어서 도시는 꼭 넣어 주세요.
            </div>
          </div>
        </section>

        <section className="wrap mt-12">
          <div className="starry relative overflow-hidden rounded-[22px] p-6 text-cream-100 sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full border border-white/10" />
            <p className="text-[12.5px] uppercase tracking-[0.18em] text-gold-300">오늘의 별</p>
            <p className="mt-2 max-w-[520px] font-display text-[22px] leading-[1.5] sm:text-[24px]">
              별은 사람을 정해 주지 않습니다.
              <br />
              다만 내가 어느 쪽으로 기울어 있는지는 알려 줍니다.
            </p>
            <p className="mt-3 max-w-[520px] text-[14px] leading-[1.8] text-cream-300">
              지도는 판결이 아니라 거울입니다. 도움을 받는 자리와 힘을 주는 자리를 나란히 놓고 보면, 다음 한 해에 어디에
              힘을 쓸지가 조금 선명해집니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function TierList() {
  return (
    <div className="grid gap-x-6 gap-y-2.5 rounded-2xl border border-cream-200 bg-white/60 p-4 sm:grid-cols-2 sm:border-0 sm:bg-transparent sm:p-0">
      {TIERS.map((t) => (
        <div key={t.id} className="flex items-start gap-3">
          <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-ink-800">
              {t.name}
              <span className="num ml-1.5 text-[12px] font-normal text-ink-400">{t.band}</span>
            </p>
            <p className="text-[13px] leading-[1.55] text-ink-500">{t.meaning}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
