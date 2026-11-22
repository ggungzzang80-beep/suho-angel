/**
 * 관계 지도 엔진 (relations.ts)
 * ------------------------------------------------------------------
 * '나'의 천궁도와 사람들의 천궁도를 교차(시너스트리)해 한 장의 지도로 만듭니다.
 *
 * - 점: 태양·달·수성·금성·화성·목성·토성 + 어센던트 (8점 × 8점)
 * - 각: 합·육분·사분·삼분·대립 + 오브 → 흐름(flow)/마찰(tense)
 * - 하우스 오버레이(옵션 B → v4): 상대 점이 내 Whole Sign 하우스에, 내 점이 상대 하우스에
 *   들어오는지를 양방향으로 보고 **12하우스 전체**를 다섯 그룹(소울메이트·운명적 인연 /
 *   은인·후원자 / 절친·베스트 프렌드 / 기사·헌신 / 라이벌·경쟁자)으로 나눠 해설합니다.
 *   같은 하우스가 두 그룹에 속합니다(7=①⑤, 11=②③, 4=①④) — 7하우스의 길성은 배우자로,
 *   흉성은 공개된 적으로 읽힙니다. 친구 친화도(`friendHouseScore`)는 3·11하우스의 절친 그룹 지수입니다.
 * - 시간 모름 보정(옵션 A): 한쪽이라도 출생 시각을 모르면 어센던트 교차 각을 0.15로 낮추고,
 *   하우스 오버레이는 시간을 아는 쪽 방향만 씁니다(양쪽 다 모르면 오버레이를 비웁니다).
 * - 성별 조합(v5, 2026-11-18 박아름 님 측 최종 합의): 두 사람의 성별이 모두 있으면
 *   남녀 궁합은 1·4·5·7·8·11하우스에 무게를 싣고 2·3·6·9·10·12하우스는 역할·해설 지표로만 쓰고,
 *   동성(여여·남남) 우정 궁합은 11(짝꿍) > 7(찐친) > 3·5(절친) > 9(조력자) 순으로 싣고 8·12를 낮춥니다.
 *   성별이 하나라도 비어 있으면 v4 공통 가중치로 그대로 폴백합니다.
 * - 점수: 세 축(감정의 온도 · 끌림 · 오래 가는 힘)으로 나눈 mix + 친구 친화도 보너스를
 *   보정표로 24~99점에 옮김
 * - 등급: 점수 → 13단계 (소울메이트 … 라이벌 · 2026-11-18 박아름 님 측 확정으로 '찐친'과 '절친'의 자리를 맞바꿈)
 * - 지도: 등급이 높을수록 중심('나')에 가까운 궤도에 놓습니다
 *
 * 계산 기준과 보정표는 `SCORING_SPEC.md`, 보정표 재생성은 `scripts/calibrate.ts`.
 */

import type { Chart, ChartPoint } from './astro';
import { findAspect, norm360 } from './astro';
import { guardianOfSign } from './guardians';
import type { Guardian } from './guardians';
import { josaOf } from './korean';
import { HOUSE_META, SIGNS } from './signs';
import type { PointKey } from './signs';
import { yearKeyword2027 } from './natal';

/* ------------------------------ 등급 ------------------------------ */

export type TierId =
  | 'soulmate'
  | 'angel'
  | 'buddy'
  | 'benefactor'
  | 'bestie'
  | 'patron'
  | 'truefriend'
  | 'knight'
  | 'samaritan'
  | 'competitor'
  | 'nemesis'
  | 'frenemy'
  | 'rival';

export type Tier = {
  id: TierId;
  name: string;
  short: string;
  min: number;
  /** 화면에 쓰는 점수 구간 표기 */
  band: string;
  color: string;
  soft: string;
  /** 이 등급이 뜻하는 바 */
  meaning: string;
  /** 이 사람이 내게 하는 일 */
  does: string;
  /** 조심할 지점 */
  caution: string;
  ring: number;
  /** 수호 쪽(따뜻함)인지 긴장 쪽인지 */
  side: 'protect' | 'tension';
};

export const TIERS: Tier[] = [
  {
    id: 'soulmate',
    name: '소울메이트',
    short: '소울메이트',
    min: 94,
    band: '94~99',
    color: '#B98937',
    soft: '#F6EAD2',
    meaning: '말하지 않아도 같은 쪽을 보는 사람',
    does: '내가 오래 바라던 것을 이 사람과 이야기하면 갑자기 현실의 일정이 됩니다. 함께 있으면 원래의 나로 돌아갑니다.',
    caution: '너무 잘 맞아 이 사람의 속도에 내 인생을 맞추지 않도록 하세요.',
    ring: 0,
    side: 'protect',
  },
  {
    id: 'angel',
    name: '나의 수호천사',
    short: '수호천사',
    min: 89,
    band: '89~93',
    color: '#C8A15E',
    soft: '#F7EFDD',
    meaning: '내가 무너질 때 먼저 손을 내미는 사람',
    does: '내가 말하지 않아도 지금 어디쯤인지 알아채고, 결정적인 순간에 한 번 등을 밀어 줍니다.',
    caution: '이 사람의 기대에 맞추려다 내 속도를 잃지 않도록 하세요.',
    ring: 0,
    side: 'protect',
  },
  {
    id: 'buddy',
    name: '짝꿍',
    short: '짝꿍',
    min: 84,
    band: '84~88',
    color: '#C08A76',
    soft: '#F7E8E1',
    meaning: '손발이 맞아 같이 하면 뭐든 되는 사람',
    does: '같이 계획한 일을 실제로 해냅니다. 역할을 나누지 않아도 알아서 맞춰집니다.',
    caution: '둘이 잘 맞는다고 내 몫까지 넘기지는 마세요.',
    ring: 0,
    side: 'protect',
  },
  {
    id: 'benefactor',
    name: '은인',
    short: '은인',
    min: 79,
    band: '79~83',
    color: '#8E7DC0',
    soft: '#EDE7F8',
    meaning: '내 길을 한 번 열어 준 사람',
    does: '기회·소개·정보를 내 쪽으로 가져옵니다. 내가 모르던 문을 열어 주는 쪽입니다.',
    caution: '고마움을 미루면 관계가 빚처럼 남습니다. 받은 만큼 말로 표현하세요.',
    ring: 1,
    side: 'protect',
  },
  {
    id: 'truefriend',
    name: '찐친',
    short: '찐친',
    min: 74,
    band: '74~78',
    color: '#5E94A6',
    soft: '#E4F0F3',
    meaning: '꾸미지 않아도 되는 사람',
    does: '만나면 처음부터 편합니다. 한동안 못 봐도 다시 이어집니다.',
    caution: '편한 사이일수록 말이 앞섭니다. 한 번씩 물어보세요.',
    ring: 1,
    side: 'protect',
  },
  {
    id: 'patron',
    name: '조력자',
    short: '조력자',
    min: 69,
    band: '69~73',
    color: '#5FA491',
    soft: '#E4F3ED',
    meaning: '내 일을 옆에서 함께 짊어지는 사람',
    does: '내가 만든 것을 실제로 써 보고, 다음 일을 거들어 주는 방식으로 힘을 보탭니다.',
    caution: '믿음에 기대어 준비 없이 맡기지 마세요. 결과로 답하는 사이입니다.',
    ring: 1,
    side: 'protect',
  },
  {
    id: 'bestie',
    name: '절친',
    short: '절친',
    min: 64,
    band: '64~68',
    color: '#8A88A8',
    soft: '#EFEDF3',
    meaning: '속마음을 꺼내도 되는 사람',
    does: '창피한 이야기까지 꺼냅니다. 내가 틀렸을 때 바로 말해 주는 쪽입니다.',
    caution: '오래된 사이라 고마움을 말하지 않게 됩니다.',
    ring: 2,
    side: 'protect',
  },
  {
    id: 'knight',
    name: '기사',
    short: '기사',
    min: 59,
    band: '59~63',
    color: '#5C82BC',
    soft: '#E6EEF9',
    meaning: '같은 편에 서서 함께 싸우는 사람',
    does: '내가 결정하면 옆에서 같이 움직입니다. 혼자였으면 못 했을 일을 같이 해냅니다.',
    caution: '둘 다 앞으로 나서는 편이라, 방향이 어긋나면 힘이 두 배로 새어 나갑니다.',
    ring: 2,
    side: 'protect',
  },
  {
    id: 'samaritan',
    name: '선한 사마리아인',
    short: '사마리아인',
    min: 54,
    band: '54~58',
    color: '#A97B5F',
    soft: '#F4E8DF',
    meaning: '스쳐 가면서도 한 번은 도와준 사람',
    does: '짧게 만나지만 결정적인 순간에 작은 도움을 줍니다. 오래 이어지지 않아도 기억에 남습니다.',
    caution: '기대를 크게 두면 서운해집니다. 만난 그 순간의 도움으로 충분합니다.',
    ring: 2,
    side: 'protect',
  },
  {
    id: 'competitor',
    name: '선의의 경쟁자',
    short: '경쟁자',
    min: 49,
    band: '49~53',
    color: '#6E8FA8',
    soft: '#E8EFF5',
    meaning: '같은 것을 원해서 서로를 자극하는 사람',
    does: '옆에 있으면 나도 모르게 속도가 붙습니다. 비교가 되지만 그 비교가 나를 깎지는 않습니다.',
    caution: '이기고 싶은 마음이 커지면 내 페이스를 잃습니다. 내 기록만 보세요.',
    ring: 3,
    side: 'tension',
  },
  {
    id: 'nemesis',
    name: '호적수',
    short: '호적수',
    min: 44,
    band: '44~48',
    color: '#7A7286',
    soft: '#EEECF2',
    meaning: '자주 부딪히지만 무시할 수 없는 사람',
    does: '내 약점을 정확히 아는 사람입니다. 그 사람 앞에서만 실수가 드러납니다.',
    caution: '감정이 앞서면 말이 먼저 나갑니다. 사실만 남기고 말하세요.',
    ring: 3,
    side: 'tension',
  },
  {
    id: 'frenemy',
    name: '프레너미',
    short: '프레너미',
    min: 39,
    band: '39~43',
    color: '#8A7A6B',
    soft: '#F1EBE4',
    meaning: '친구인데 자꾸 신경이 쓰이는 사람',
    does: '웃으면서 만나지만 집에 돌아오면 한참 생각나게 하는 쪽입니다.',
    caution: '호의와 경계를 함께 두세요. 다 들어주면 지칩니다.',
    ring: 4,
    side: 'tension',
  },
  {
    id: 'rival',
    name: '라이벌',
    short: '라이벌',
    min: 0,
    band: '38 이하',
    color: '#9A6B62',
    soft: '#F5E7E2',
    meaning: '같은 자리를 두고 겨루는 사람',
    does: '내가 서 있는 자리를 가장 정확히 아는 사람입니다. 그만큼 자극이 됩니다.',
    caution: '이 관계의 목적은 이기는 것이 아니라 나를 다듬는 것입니다.',
    ring: 4,
    side: 'tension',
  },
];

export function tierOfScore(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

/** 13단계에서 몇 번째인지 (1 = 소울메이트) */
export function tierRank(tier: Tier): number {
  return TIERS.findIndex((t) => t.id === tier.id) + 1;
}

export const tierById = (id: TierId): Tier => TIERS.find((t) => t.id === id) ?? TIERS[TIERS.length - 1];

/* ------------------------------ 교차 각 ------------------------------ */

type SynPoint = {
  key: PointKey;
  name: string;
  longitude: number;
  signIndex: number;
  speed: number;
};

const POINT_WEIGHT: Partial<Record<PointKey, number>> = {
  sun: 1,
  moon: 1.05,
  mercury: 0.6,
  venus: 0.95,
  mars: 0.85,
  jupiter: 0.5,
  saturn: 0.62,
  asc: 0.8,
};

const PAIR_BIAS: Record<string, number> = {
  'moon-moon': 1.25,
  'moon-venus': 1.2,
  'sun-moon': 1.25,
  'sun-venus': 1.15,
  'venus-venus': 1.1,
  'venus-mars': 1.15,
  'sun-sun': 1.05,
  'moon-mars': 1.05,
  'saturn-moon': 1.1,
  'asc-sun': 1.05,
  'asc-moon': 1.05,
};

function pointsOf(chart: Chart): SynPoint[] {
  const keys: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'asc'];
  return keys.map((key) => {
    const p = chart.points.find((x) => x.key === key) as ChartPoint;
    return { key, name: p.name, longitude: p.longitude, signIndex: p.signIndex, speed: p.speed };
  });
}

export type RelationAspect = {
  pair: string;
  aName: string;
  bName: string;
  type: string;
  orb: number;
  tone: 'flow' | 'tense';
  contribution: number;
  title: string;
  body: string;
  /** 이 각이 관계의 세 축 중 무엇을 만드는지 */
  axis: 'temp' | 'pull' | 'last';
};

const pairKey = (a: PointKey, b: PointKey) => [a, b].sort().join('-');

type PairText = { title: string; flow: string; tense: string };

const PAIR_TEXT: Record<string, PairText> = {
  'moon-moon': {
    title: '감정의 온도가 같은 자리',
    flow: '기분이 가라앉을 때의 모습까지 닮아서, 말하지 않아도 옆에 있으면 편해요.',
    tense: '기분이 상했을 때 드러내는 방식이 정반대예요. 한쪽은 말하고, 한쪽은 마음을 닫습니다.',
  },
  'moon-venus': {
    title: '마음을 편하게 해 주는 자리',
    flow: '이 사람 앞에서는 긴장이 풀려요. 위로가 말이 아니라 분위기로 옵니다.',
    tense: '좋아하는데 표현이 어긋나요. 챙기는 방식이 서로 다르게 느껴집니다.',
  },
  'moon-mars': {
    title: '감정을 움직이는 자리',
    flow: '이 사람이 부추기면 결심이 빨라져요. 망설일 때 등을 쳐 주는 쪽입니다.',
    tense: '서운함이 화로 바뀌는 속도가 빨라요. 말이 올라오기 전에 자리를 피하는 게 좋습니다.',
  },
  'moon-saturn': {
    title: '마음을 붙잡아 주는 자리',
    flow: '흔들릴 때 이 사람의 한마디가 기준이 돼요. 오래 곁에 있는 쪽입니다.',
    tense: '기대와 부담이 같이 와요. 잘하고 싶어서 오히려 긴장하게 됩니다.',
  },
  'moon-sun': {
    title: '마음과 중심이 함께 맞는 자리',
    flow: '내가 하려는 일을 이 사람이 마음으로 이해해요. 같은 방향을 보는 사이입니다.',
    tense: '원하는 것과 편안한 것이 달라요. 속도를 맞추는 데 시간이 걸립니다.',
  },
  'sun-venus': {
    title: '호감이 자연스럽게 오가는 자리',
    flow: '이 사람 앞에서는 굳이 꾸미지 않아도 괜찮게 보여요. 같이 있으면 사람들이 둘을 묶어 봅니다.',
    tense: '좋아서 맞추다 보면 내 취향이 흐려져요.',
  },
  'sun-mars': {
    title: '추진력이 붙는 자리',
    flow: '같이 있으면 일이 빨리 진행돼요. 서로에게 좋은 자극이 됩니다.',
    tense: '방향이 다르면 경쟁이 돼요. 이기고 지는 싸움으로 번지기 쉽습니다.',
  },
  'sun-jupiter': {
    title: '기회를 키워 주는 자리',
    flow: '이 사람과 엮이면 판이 커져요. 소개와 제안이 이 사람을 통해 옵니다.',
    tense: '기대가 커진 만큼 실망도 커요. 말이 앞서는 약속은 꼭 확인하세요.',
  },
  'sun-saturn': {
    title: '책임을 지워 주는 자리',
    flow: '이 사람이 있어서 내가 끝까지 해내요. 느리지만 결과가 남습니다.',
    tense: '부담이 먼저 느껴져요. 인정을 기대하면 서운해지기 쉽습니다.',
  },
  'venus-venus': {
    title: '취향이 겹치는 자리',
    flow: '좋아하는 것이 비슷해서 같이 고르는 일이 편해요.',
    tense: '좋아하는 방식이 달라 취향 싸움이 나요. 각자 고르는 게 낫습니다.',
  },
  'venus-mars': {
    title: '끌림이 생기는 자리',
    flow: '설명하기 어려운 끌림이 있어요. 처음 만난 순간부터 눈이 갑니다.',
    tense: '끌리는데 자꾸 부딪혀요. 가까워질수록 자존심이 걸립니다.',
  },
  'venus-saturn': {
    title: '오래 가게 만드는 자리',
    flow: '급하지 않게 오래 이어져요. 시간이 지날수록 편해지는 사이입니다.',
    tense: '마음을 확인하는 데 시간이 오래 걸려요. 서두르면 어긋납니다.',
  },
  'mars-mars': {
    title: '행동 속도가 맞는 자리',
    flow: '같이 움직이면 리듬이 맞아요. 말보다 몸이 먼저 맞는 사이입니다.',
    tense: '둘 다 물러서지 않아요. 일정과 역할을 나눠 두면 훨씬 편합니다.',
  },
  'mars-saturn': {
    title: '힘을 다스리는 자리',
    flow: '이 사람이 붙잡아 주면 속도가 안정돼요. 무리수를 두지 않게 됩니다.',
    tense: '하고 싶은데 자꾸 미뤄져요. 압박으로 느껴지면 힘이 빠집니다.',
  },
  'mercury-sun': {
    title: '말이 잘 통하는 자리',
    flow: '내가 하려는 말을 이 사람이 먼저 알아들어요.',
    tense: '같은 말이 다르게 들려요. 중요한 얘기는 글로 남기세요.',
  },
  'mercury-moon': {
    title: '속마음을 꺼내게 하는 자리',
    flow: '이 사람에게는 하지 않으려던 얘기까지 하게 돼요.',
    tense: '말이 앞서서 감정을 건드려요. 농담의 선을 확인하세요.',
  },
  'asc-sun': {
    title: '첫인상이 오래 남는 자리',
    flow: '처음 본 순간부터 호감이 생겨요. 다시 만나도 그 느낌이 이어집니다.',
    tense: '첫인상과 실제가 달라서 오해가 생겨요. 한 번 더 만나 보면 달라집니다.',
  },
  'asc-moon': {
    title: '겉과 속이 맞는 자리',
    flow: '이 사람 앞에서는 꾸미지 않아도 돼요. 표정이 그대로 읽힙니다.',
    tense: '내가 편하다고 생각한 말이 이 사람에게는 무심하게 들려요.',
  },
  'asc-saturn': {
    title: '오래 곁에 남는 자리',
    flow: '처음엔 어색해도 시간이 지나면 없어서는 안 될 사람이 돼요.',
    tense: '처음부터 거리감이 느껴져요. 억지로 가까워지려 하지 마세요.',
  },
};

/** 표의 키는 사람이 읽기 좋은 순서로 적었으므로, 조회할 때 알파벳 순으로 맞춥니다. */
const PAIR_TEXT_BY_KEY: Record<string, PairText> = Object.fromEntries(
  Object.entries(PAIR_TEXT).map(([k, v]) => [k.split('-').sort().join('-'), v]),
);

const FALLBACK_BY_TYPE: Record<string, PairText> = {
  합: {
    title: '두 힘이 한자리에 겹치는 자리',
    flow: '두 기운이 따로 움직이지 않고 같이 가요. 강점도 고집도 함께 커집니다.',
    tense: '한자리에 겹쳐서 서로를 끌어내리기 쉬워요. 한 번에 하나만 다루세요.',
  },
  삼분: {
    title: '서로를 밀어주는 자리',
    flow: '따로 애쓰지 않아도 흐름이 이어져요.',
    tense: '편해서 방심하게 돼요. 고마움을 말로 남기세요.',
  },
  육분: {
    title: '가볍게 이어지는 자리',
    flow: '작은 도움과 연락이 자연스럽게 오가요.',
    tense: '가볍게 넘긴 말이 쌓여요. 한 번씩 확인하세요.',
  },
  사분: {
    title: '부딪혀서 다듬어지는 자리',
    flow: '긴장이 있지만 그 긴장이 일을 앞으로 밀어 줘요.',
    tense: '같은 자리에서 자주 부딪혀요. 역할과 순서를 나누면 풀립니다.',
  },
  대립: {
    title: '정반대에서 마주 보는 자리',
    flow: '서로 다른 것이 서로의 빈자리를 채워 줘요.',
    tense: '원하는 것이 정반대예요. 한쪽이 양보하기보다 규칙을 정하는 편이 낫습니다.',
  },
};

function pairText(pair: string, type: string): PairText {
  return (
    PAIR_TEXT_BY_KEY[pair] ??
    FALLBACK_BY_TYPE[type] ?? {
      title: '서로 다른 점이 만나는 자리',
      flow: '다른 점이 오히려 내 빈자리를 채워 줘요.',
      tense: '다른 점이 부딪혀요. 역할을 나누면 해결됩니다.',
    }
  );
}

function axisOf(pair: string): 'temp' | 'pull' | 'last' {
  const [x, y] = pair.split('-');
  const has = (p: string) => x === p || y === p;
  if (has('moon')) return 'temp';
  if (has('venus') || has('mars') || has('asc')) return 'pull';
  return 'last';
}

/* ------------------- 하우스 오버레이 (옵션 B → v4 · 12하우스 전체) ------------------- */

/**
 * 2026-11-18 박아름 님 측 추가 전달(5개 그룹 하우스 매핑) 반영.
 *
 * v3까지는 1·3·5·7·11하우스만 '친구 친화도' 하나로 묶어 봤습니다.
 * v4는 12하우스 전체를 다섯 그룹의 역할로 나눠 봅니다.
 *
 *   ① 소울메이트 & 운명적 인연 — 7(배우자) · 8(영혼의 결속) · 12(전생의 인연) · 4(가족 같은 편안함)
 *   ② 은인 & 후원자           — 9(정신적 스승) · 11(귀인·인맥) · 2(물질적 은인)
 *   ③ 절친 & 베스트 프렌드    — 3(단짝 대화) · 11(동지·진정한 우정)
 *   ④ 나를 지키는 기사 & 헌신  — 6(헌신·봉사) · 4(정서적 방패)
 *   ⑤ 라이벌 & 경쟁자         — 7(공개된 적) · 10(커리어 경쟁·선망)
 *   (보조) 1하우스(나·첫인상) · 5하우스(연애·창조) — v3의 해석을 그대로 이어 갑니다.
 *
 * 같은 하우스가 두 그룹에 속합니다(7=①⑤, 11=②③, 4=①④). 그래서 7하우스에 길성이 오면
 * '진지한 파트너'로, 흉성이 오면 '공개된 적'으로 읽힙니다. 이 겹침이 v4의 핵심입니다.
 *
 * - 길성(태양·달·수성·금성·목성)은 그룹 점수를 올리고, 흉성(화성·토성)은 내립니다.
 * - 라이벌 그룹은 반대로 흉성이 긴장을 키우고, 길성은 '선의의 경쟁·선망' 정도로만 더합니다.
 * - 방향: 상대 점 → 내 하우스, 내 점 → 상대 하우스 두 방향을 각각 재고 평균합니다
 *   (한쪽 시간을 모르면 그쪽 하우스는 믿을 수 없으므로 시간을 아는 방향만 씁니다).
 */

export type GroupId = 'soulmate' | 'benefactor' | 'bestfriend' | 'knight' | 'rival' | 'self' | 'romance';

export type GroupMeta = {
  id: GroupId;
  name: string;
  short: string;
  houses: number[];
  tone: 'protect' | 'tension';
  /** 이 그룹이 뜻하는 관계의 결 */
  meaning: string;
  /** 1·5하우스 보조 그룹은 다섯 그룹 표에 넣지 않습니다 */
  supplementary?: boolean;
  color: string;
};

export const HOUSE_GROUPS: GroupMeta[] = [
  {
    id: 'soulmate',
    name: '소울메이트 & 운명적 인연',
    short: '운명적 인연',
    houses: [4, 7, 8, 12],
    tone: 'protect',
    meaning: '가족 같은 편안함부터 전생의 인연까지, 이 사람이 내 삶의 중심에 서는 결',
    color: '#B98937',
  },
  {
    id: 'benefactor',
    name: '은인 & 후원자',
    short: '은인·후원',
    houses: [2, 9, 11],
    tone: 'protect',
    meaning: '길을 열어 주고 시야를 넓히고 실질적으로 밀어주는 결',
    color: '#8E7DC0',
  },
  {
    id: 'bestfriend',
    name: '절친 & 베스트 프렌드',
    short: '절친',
    houses: [3, 11],
    tone: 'protect',
    meaning: '말이 통하고 취향과 목표를 나누는 결',
    color: '#5E94A6',
  },
  {
    id: 'knight',
    name: '나를 지키는 기사 & 헌신',
    short: '기사·헌신',
    houses: [4, 6],
    tone: 'protect',
    meaning: '수고를 맡아 주고 위협에서 감싸 주는 결',
    color: '#5C82BC',
  },
  {
    id: 'rival',
    name: '라이벌 & 경쟁자',
    short: '라이벌',
    houses: [7, 10],
    tone: 'tension',
    meaning: '끌리면서도 대립하고 서로를 자극하는 결',
    color: '#9A6B62',
  },
  {
    id: 'self',
    name: '나 · 첫인상',
    short: '첫인상',
    houses: [1],
    tone: 'protect',
    meaning: 'v3에서 이어 온 보조 하우스',
    supplementary: true,
    color: '#C8A15E',
  },
  {
    id: 'romance',
    name: '연애 · 창조',
    short: '연애·창조',
    houses: [5],
    tone: 'protect',
    meaning: 'v3에서 이어 온 보조 하우스',
    supplementary: true,
    color: '#C08A76',
  },
];

/** 화면의 다섯 그룹 표 (1·5하우스 보조는 별도 한 줄로 적습니다) */
export const FIVE_GROUPS: GroupMeta[] = HOUSE_GROUPS.filter((g) => !g.supplementary);

export const groupById = (id: GroupId): GroupMeta =>
  HOUSE_GROUPS.find((g) => g.id === id) ?? HOUSE_GROUPS[0];

/* --------------------------- 하우스별 역할 --------------------------- */

export type HouseRole = {
  group: GroupId;
  /** 그룹 안에서 이 하우스가 갖는 무게 */
  weight: number;
  /** 하우스가 맡는 역할 이름 (화면 표기) */
  role: string;
  /** 길성이 들어왔을 때의 해설 */
  help: string;
  /** 흉성이 들어왔을 때의 해설 */
  strain: string;
};

export const HOUSE_ROLES: Record<number, HouseRole[]> = {
  1: [
    {
      group: 'self',
      weight: 0.9,
      role: '나 · 첫인상',
      help: '첫 만남부터 내 편이 되어 주는 사이예요.',
      strain: '처음부터 서로를 견제하는 느낌이 들어요.',
    },
  ],
  2: [
    {
      group: 'benefactor',
      weight: 0.7,
      role: '물질적 은인',
      help: '돈이나 물건, 소개로 실제 도움을 주는 사람이에요.',
      strain: '돈이나 물건 문제로 서로 부담이 생길 수 있어요.',
    },
  ],
  3: [
    {
      group: 'bestfriend',
      weight: 1.25,
      role: '단짝 대화',
      help: '연락과 대화가 자연스럽게 이어지는 사이예요. 말이 잘 통합니다.',
      strain: '말이 자주 어긋나고 연락이 뜸해지기 쉬워요.',
    },
  ],
  4: [
    {
      group: 'soulmate',
      weight: 0.65,
      role: '가족 같은 편안함',
      help: '가족처럼 마음이 놓이고 편안한 사이예요.',
      strain: '가까울수록 생활 방식이 달라 부딪힐 수 있어요.',
    },
    {
      group: 'knight',
      weight: 0.85,
      role: '정서적 방패',
      help: '힘들 때 나를 감싸 주고 마음을 보듬어 주는 사람이에요.',
      strain: '챙기려는 마음이 간섭처럼 느껴질 수 있어요.',
    },
  ],
  5: [
    {
      group: 'romance',
      weight: 0.6,
      role: '연애 · 창조',
      help: '같이 노는 사이에서 마음이 열려요. 설렘과 즐거움이 생깁니다.',
      strain: '가볍게 만나는 사이로 남기 쉽고, 오래 이어지기는 어려워요.',
    },
  ],
  6: [
    {
      group: 'knight',
      weight: 0.9,
      role: '헌신 · 봉사',
      help: '수고를 마다하지 않고 나를 위해 애써 주는 사람이에요.',
      strain: '한쪽만 애쓰는 사이가 되기 쉬워요.',
    },
  ],
  7: [
    {
      group: 'soulmate',
      weight: 0.85,
      role: '배우자 · 진지한 파트너',
      help: '배우자처럼 오래 함께할 짝으로 이어질 수 있는 사이예요.',
      strain: '가까워질수록 서로 부딪히는 일이 생깁니다.',
    },
    {
      group: 'rival',
      weight: 0.75,
      role: '공개된 적(Open Enemy)',
      help: '가까운 사이이면서 서로에게 좋은 자극이 되는 관계예요.',
      strain: '끌리면서도 자꾸 대립하는, 긴장이 센 사이예요.',
    },
  ],
  8: [
    {
      group: 'soulmate',
      weight: 0.85,
      role: '영혼의 결속',
      help: '마음 깊이 얽히는 강한 끌림이 있는 사이예요. 때로는 집착이나 애증으로 변하기도 합니다.',
      strain: '깊게 얽히면서 집착이나 애증으로 흐르기 쉬워요.',
    },
  ],
  9: [
    {
      group: 'benefactor',
      weight: 0.75,
      role: '정신적 스승',
      help: '정신적인 스승 같은 사람이에요. 시야를 넓혀 주고 영감을 줍니다.',
      strain: '조언이 가르치는 말처럼 느껴져 거리가 생길 수 있어요.',
    },
  ],
  10: [
    {
      group: 'rival',
      weight: 0.9,
      role: '커리어 경쟁 · 선망',
      help: '일과 사회생활에서 서로 자극을 주고받는 사이예요. 좋은 경쟁심이 생깁니다.',
      strain: '같은 자리를 두고 겨루는 사이예요. 일에서 정면으로 부딪힐 수 있습니다.',
    },
  ],
  11: [
    {
      group: 'benefactor',
      weight: 0.85,
      role: '귀인 · 인맥',
      help: '꿈을 응원해 주고 좋은 사람을 이어 주는 귀인 같은 사이예요.',
      strain: '모임에서 서로 견제하는 마음이 생길 수 있어요.',
    },
    {
      group: 'bestfriend',
      weight: 1.3,
      role: '동지 · 진정한 우정',
      help: '취향과 생각, 목표가 잘 맞는 이상적인 친구예요.',
      strain: '같은 모임에서 자꾸 신경이 쓰이는 사이예요.',
    },
  ],
  12: [
    {
      group: 'soulmate',
      weight: 0.6,
      role: '전생의 인연',
      help: '말하지 않아도 통하는, 오래전부터 알던 듯한 사이예요.',
      strain: '말을 아끼다 보면 오해가 쌓이기 쉬워요.',
    },
  ],
};

/* --------------------------- 무게와 기대값 --------------------------- */

export const HOUSE_OVERLAY = {
  /** 그룹별 비중 — 관계의 중심(소울메이트·절친)을 가장 무겁게 */
  groupWeight: {
    soulmate: 1.0,
    benefactor: 0.85,
    bestfriend: 1.0,
    knight: 0.8,
    rival: 1.0,
    self: 0.55,
    romance: 0.5,
  } as Record<GroupId, number>,
  /** 점별 부호·무게 — 길성은 +, 흉성은 − */
  points: {
    sun: 0.85,
    moon: 0.95,
    mercury: 1.0,
    venus: 0.9,
    jupiter: 0.75,
    mars: -0.95,
    saturn: -0.85,
  } as Partial<Record<PointKey, number>>,
  /** 라이벌 그룹에서 길성이 만드는 가벼운 긴장(선의의 경쟁·선망) */
  mildFriction: 0.45,
  /** 라이벌·경쟁 결을 mix에서 깎는 무게 */
  frictionWeight: 0.9,
  /** 그룹 지수가 mix에 실리는 무게 — 평균 근처 기울기 (mix 1점 ≈ 점수 1.4점) */
  mixWeight: 2.4,
  /** 보너스 상한 — mix 기준 ±4 (점수 ±6 정도). 하우스 하나가 등급을 통째로 바꾸지 않게 */
  bonusCap: 4,
  /** 3·11하우스(절친) 활성으로 보는 기준 — 3·11에 들어온 길성 수 */
  activeHits: 2,
  /** 그룹을 '활성'으로 보는 지수 문턱 (표본 3,000쌍 상위 10~25%) */
  activeScore: 0.7,
  /** 시간을 모르는 쌍에서 어센던트 교차 각에 곱하는 배율 */
  unknownAscScale: 0.15,
};

/* --------------------- 성별 조합 궁합 모드 (v5) --------------------- */

/**
 * 2026-11-18 박아름 님 측과 최종 합의한 v5 성별 조합 분기.
 *
 * - 남녀 궁합: 1·4·5·7·8·11하우스에 무게를 싣고, 2·3·6·9·10·12하우스는 총점을 올리는 대신
 *   관계의 차등(물질적 은인 / 소통 / 헌신·기사 / 정신적 스승 / 커리어 경쟁 / 영적 인연)을
 *   나누는 역할·해설 지표로 씁니다.
 * - 남남·여여 우정 궁합: 11하우스(짝꿍)를 가장 무겁게, 7하우스(찐친), 3·5하우스(절친),
 *   9하우스(조력자) 순으로 싣고 8·12하우스는 낮춥니다.
 * - 성별이 하나라도 비어 있으면 v4 공통(중립) 가중치를 그대로 씁니다.
 *
 * 무게를 갈아 끼울 때 점수 분포가 모드마다 달라지면 같은 보정표(CALIBRATION)로는 13단계가
 * 한쪽으로 쏠립니다. 그래서 모드별 계수는 **같은 전체 세기**가 되도록 RMS로 맞춘 뒤 씁니다
 * (`MODE_RMS`). 결과 분포는 `npm run calibrate`가 세 표본(중립·남녀·동성)으로 검증합니다.
 */

export type Gender = 'female' | 'male';

export type CompatMode = 'hetero' | 'sameFemale' | 'sameMale' | 'neutral';

export type CompatModeMeta = {
  id: CompatMode;
  /** 화면 배지 문구 */
  label: string;
  short: string;
  /** 점수를 이끄는 하우스 */
  emphasis: number[];
  /** 점수 대신 역할·해설 지표로 읽는 하우스 */
  indicators: number[];
  /** 인물 상세에 붙이는 한 줄 설명 */
  note: string;
};

const SAME_SEX_NOTE =
  '11하우스(짝꿍)를 가장 무겁게, 7하우스(찐친), 3·5하우스(절친), 9하우스(조력자) 순으로 싣고 8·12하우스는 낮췄습니다.';

export const COMPAT_MODES: Record<CompatMode, CompatModeMeta> = {
  hetero: {
    id: 'hetero',
    label: '남녀 궁합 기준',
    short: '남녀',
    emphasis: [1, 4, 5, 7, 8, 11],
    indicators: [2, 3, 6, 9, 10, 12],
    note: '1·4·5·7·8·11하우스에 무게를 싣고, 2·3·6·9·10·12하우스는 점수보다 관계의 역할(물질·소통·헌신·스승·경쟁·영적 인연)을 나누는 지표로 읽습니다.',
  },
  sameFemale: {
    id: 'sameFemale',
    label: '여여 우정 궁합 기준',
    short: '여여',
    emphasis: [3, 5, 7, 9, 11],
    indicators: [8, 12],
    note: SAME_SEX_NOTE,
  },
  sameMale: {
    id: 'sameMale',
    label: '남남 우정 궁합 기준',
    short: '남남',
    emphasis: [3, 5, 7, 9, 11],
    indicators: [8, 12],
    note: SAME_SEX_NOTE,
  },
  neutral: {
    id: 'neutral',
    label: '공통 기준',
    short: '공통',
    emphasis: [],
    indicators: [],
    note: '성별을 넣지 않아 v4 공통 가중치로 계산했습니다. 성별을 넣으면 남녀·동성 우정 가중치로 갈립니다.',
  },
};

export const compatModeMeta = (mode: CompatMode): CompatModeMeta => COMPAT_MODES[mode];

/** 저장·초대 링크에서 온 값을 안전하게 되돌립니다(구버전 데이터는 undefined). */
export function normalizeGender(value: unknown): Gender | undefined {
  return value === 'female' || value === 'male' ? value : undefined;
}

/** 두 사람의 성별 조합 → 궁합 모드. 하나라도 비면 중립(v4 공통). */
export function compatModeOf(a?: unknown, b?: unknown): CompatMode {
  const x = normalizeGender(a);
  const y = normalizeGender(b);
  if (!x || !y) return 'neutral';
  if (x === y) return x === 'female' ? 'sameFemale' : 'sameMale';
  return 'hetero';
}

/**
 * 모드별 무게 배율. 하우스 배율 × 그룹 배율을 곱해서 쓰고, 마지막에 MODE_RMS로 전체 세기를 맞춥니다.
 * 값 하나를 바꾸면 `npm run calibrate`로 세 표본 분포를 다시 확인하세요.
 */
export const MODE_TUNING: Record<CompatMode, { houses: Record<number, number>; groups: Partial<Record<GroupId, number>> }> = {
  neutral: { houses: {}, groups: {} },
  hetero: {
    houses: { 1: 1.5, 2: 0.7, 3: 0.6, 4: 1.4, 5: 1.7, 6: 0.85, 7: 1.4, 8: 1.3, 9: 0.85, 10: 0.85, 11: 1.2, 12: 0.75 },
    groups: { soulmate: 1.15, benefactor: 0.9, bestfriend: 0.85, knight: 0.9, rival: 1.0, self: 1.0, romance: 0.95 },
  },
  sameFemale: {
    houses: { 1: 1.0, 2: 0.9, 3: 1.2, 4: 0.95, 5: 1.15, 6: 0.95, 7: 1.45, 8: 0.55, 9: 1.15, 10: 0.9, 11: 1.7, 12: 0.5 },
    groups: { soulmate: 1.0, benefactor: 1.05, bestfriend: 1.1, knight: 1.0, rival: 0.5, self: 1.0, romance: 1.0 },
  },
  sameMale: {
    houses: { 1: 1.0, 2: 0.9, 3: 1.2, 4: 0.95, 5: 1.15, 6: 0.95, 7: 1.45, 8: 0.55, 9: 1.15, 10: 0.9, 11: 1.7, 12: 0.5 },
    groups: { soulmate: 1.0, benefactor: 1.05, bestfriend: 1.1, knight: 1.0, rival: 0.5, self: 1.0, romance: 1.0 },
  },
};

/**
 * 모드·하우스·그룹에 걸린 배율 (RMS 보정 전).
 * 표에 적은 배율을 그대로 씁니다 — 세 모드가 같은 차트 3,000쌍을 보는 짝지은 표본에서
 * 13단계 점유율이 목표 대비 1.2%p 안쪽으로 유지되는 것을 `npm run calibrate`로 확인했습니다.
 */
function modeTilt(mode: CompatMode, house: number, group: GroupId): number {
  const tuning = MODE_TUNING[mode];
  return (tuning.houses[house] ?? 1) * (tuning.groups[group] ?? 1);
}

/** 한 하우스에 실린 무게의 크기(점 하나당) — RMS 보정에 씁니다. */
function houseMagnitude(mode: CompatMode, house: number): number {
  return (HOUSE_ROLES[house] ?? []).reduce((sum, role) => {
    const base = role.weight * (role.group === 'rival' ? 1 : HOUSE_OVERLAY.groupWeight[role.group]);
    return sum + base * modeTilt(mode, house, role.group);
  }, 0);
}

/** 모드별 전체 세기 보정값 — 공통(v4)과 같은 RMS가 되도록 맞춥니다. */
export const MODE_RMS: Record<CompatMode, number> = (() => {
  const houses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const base = houses.reduce((s, h) => s + houseMagnitude('neutral', h) ** 2, 0);
  const out = {} as Record<CompatMode, number>;
  (Object.keys(MODE_TUNING) as CompatMode[]).forEach((mode) => {
    const cur = houses.reduce((s, h) => s + houseMagnitude(mode, h) ** 2, 0);
    out[mode] = base > 0 && cur > 0 ? Number(Math.sqrt(base / cur).toFixed(6)) : 1;
  });
  return out;
})();

/** 모드에 따라 역할 이름을 갈아 끼우는 자리 (동성 우정은 11=짝꿍, 7=찐친, 3·5=절친, 9=조력자) */
const MODE_ROLE_LABEL: Partial<Record<CompatMode, Record<number, string>>> = {
  sameFemale: { 11: '짝꿍 동지', 7: '찐친 파트너', 3: '절친 대화', 5: '절친 놀이', 9: '조력자' },
  sameMale: { 11: '짝꿍 동지', 7: '찐친 파트너', 3: '절친 대화', 5: '절친 놀이', 9: '조력자' },
};

function roleLabelOf(mode: CompatMode, house: number, base: string): string {
  return MODE_ROLE_LABEL[mode]?.[house] ?? base;
}

/**
 * 동성 우정 모드에서 해설 문장을 갈아 끼우는 자리.
 * 7하우스 기본 해설은 '배우자·반려자', 5하우스는 '연애 설렘'이라 그대로 두면 우정 궁합에 어긋납니다.
 */
const SAME_ROLE_TEXT: Record<number, { help: string; strain: string }> = {
  7: {
    help: '꾸미지 않아도 통하는 단짝 같은 사이예요. 한동안 못 봐도 다시 이어집니다.',
    strain: '가까울수록 생활 방식이 달라 부딪힐 수 있어요. 선을 정해 두면 편합니다.',
  },
  5: {
    help: '같이 노는 사이에서 마음이 열려요. 취미와 놀이를 함께하는 절친 사이입니다.',
    strain: '가볍게 만나는 사이로 남기 쉽고, 오래 이어지기는 어려워요.',
  },
};

const MODE_ROLE_TEXT: Partial<Record<CompatMode, Record<number, { help: string; strain: string }>>> = {
  sameFemale: SAME_ROLE_TEXT,
  sameMale: SAME_ROLE_TEXT,
};

function roleTextOf(mode: CompatMode, house: number, role: HouseRole, tone: 'help' | 'strain'): string {
  const override = MODE_ROLE_TEXT[mode]?.[house];
  if (override) return override[tone];
  return tone === 'help' ? role.help : role.strain;
}

/** 한 점이 한 하우스에 들어왔을 때 그룹 점수에 더하는 값 (rival은 긴장 값) */
function bondOfPoint(mode: CompatMode, house: number, role: HouseRole, pointWeight: number): number {
  if (role.group === 'rival') return 0;
  return (
    role.weight *
    MODE_RMS[mode] *
    modeTilt(mode, house, role.group) *
    HOUSE_OVERLAY.groupWeight[role.group] *
    pointWeight
  );
}

function frictionOfPoint(mode: CompatMode, house: number, role: HouseRole, pointWeight: number): number {
  if (role.group !== 'rival') return 0;
  const magnitude = Math.abs(pointWeight);
  return (
    role.weight *
    MODE_RMS[mode] *
    modeTilt(mode, house, role.group) *
    magnitude *
    (pointWeight > 0 ? HOUSE_OVERLAY.mildFriction : 1)
  );
}

const OVERLAY_POINTS: PointKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

/**
 * 아무 정보가 없을 때의 기대값 — 행성이 12하우스에 고르게 퍼진다고 봤을 때의 합.
 * 이 값을 빼야 '평균보다 어느 쪽인지'가 남습니다(표본 중앙값 0). 모드마다 무게가 달라
 * 기대값도 모드마다 따로 잽니다.
 */
function expectedBond(mode: CompatMode, group?: GroupId): number {
  let total = 0;
  OVERLAY_POINTS.forEach((key) => {
    const pw = HOUSE_OVERLAY.points[key] ?? 0;
    for (let h = 1; h <= 12; h += 1) {
      (HOUSE_ROLES[h] ?? []).forEach((role) => {
        if (group && role.group !== group) return;
        total += bondOfPoint(mode, h, role, pw) / 12;
      });
    }
  });
  return total;
}

function expectedFriction(mode: CompatMode, group?: GroupId): number {
  let total = 0;
  OVERLAY_POINTS.forEach((key) => {
    const pw = HOUSE_OVERLAY.points[key] ?? 0;
    for (let h = 1; h <= 12; h += 1) {
      (HOUSE_ROLES[h] ?? []).forEach((role) => {
        if (group && role.group !== group) return;
        total += frictionOfPoint(mode, h, role, pw) / 12;
      });
    }
  });
  return total;
}

const MODES: CompatMode[] = ['neutral', 'hetero', 'sameFemale', 'sameMale'];

export const OVERLAY_BASELINE_BY_MODE: Record<CompatMode, number> = Object.fromEntries(
  MODES.map((mode) => [
    mode,
    Number((expectedBond(mode) - HOUSE_OVERLAY.frictionWeight * expectedFriction(mode)).toFixed(4)),
  ]),
) as Record<CompatMode, number>;

export const GROUP_BASELINE_BY_MODE: Record<CompatMode, Record<GroupId, number>> = Object.fromEntries(
  MODES.map((mode) => [
    mode,
    Object.fromEntries(
      HOUSE_GROUPS.map((g) => [
        g.id,
        Number((g.id === 'rival' ? expectedFriction(mode, g.id) : expectedBond(mode, g.id)).toFixed(4)),
      ]),
    ),
  ]),
) as Record<CompatMode, Record<GroupId, number>>;

/** 공통(v4) 기대값 — 화면·문서에서 기준값으로 씁니다. */
export const OVERLAY_BASELINE = OVERLAY_BASELINE_BY_MODE.neutral;
export const GROUP_BASELINE = GROUP_BASELINE_BY_MODE.neutral;

/* --------------------------- 그룹 해설 문장 --------------------------- */

type ProtectLevel = 'active' | 'warm' | 'neutral' | 'dim' | 'strained';
type RivalLevel = 'tense' | 'watch' | 'neutral' | 'calm';
export type GroupLevel = ProtectLevel | RivalLevel;

const GROUP_LINES: Record<GroupId, Partial<Record<GroupLevel, string>>> = {
  soulmate: {
    active: '가족처럼 편안한 사이이면서, 말하지 않아도 마음이 통하는 사람이에요. 오래 곁에 둘수록 더 가까워지는 인연입니다.',
    warm: '마음이 열려 있어 인연의 끈이 닿아 있는 편이에요. 조급해하지 않고 시간을 들이면 가장 소중한 인연으로 깊어질 수 있습니다.',
    neutral: '지금은 두 사람 사이가 크게 가까워지는 때는 아니에요. 천천히 알아 가면 좋은 사이로 자리 잡을 수 있습니다.',
    dim: '가까워질수록 생활 습관이 달라 부딪히는 일이 생길 수 있어요. 서로의 방식을 인정해 주면 한결 편해집니다.',
    strained: '끌리는 마음과 부담스러운 마음이 함께 드는 사이예요. 너무 깊이 얽히기보다 서로 편한 거리를 정해 두는 게 좋습니다.',
  },
  benefactor: {
    active: '인연이 닿으면 일이 풀리는 사람이에요. 소개나 조언, 실질적인 도움을 이 사람을 통해 받게 됩니다.',
    warm: '필요할 때 한 번씩 손을 내밀어 주는 사람이에요. 고마운 마음을 말로 전하면 인연이 더 오래갑니다.',
    neutral: '지금은 큰 도움을 기대하기는 어려워요. 먼저 물어보면 생각보다 잘 도와주는 사람입니다.',
    dim: '기대한 만큼 돕지는 못할 수 있어요. 부탁할 일이 있다면 구체적으로 말하는 게 서로에게 편합니다.',
    strained: '조언이 가끔 잔소리처럼 느껴질 수 있어요. 필요한 것만 받아들이면 편한 사이로 지낼 수 있습니다.',
  },
  bestfriend: {
    active: '말이 잘 통하고 좋아하는 것도 비슷한 사이예요. 연락이 끊겨도 다시 만나면 금방 가까워집니다.',
    warm: '처음엔 편하게 말하기 어려워도, 연락을 자주 하면 금세 가까워지는 사이예요.',
    neutral: '특별히 가깝지도 멀지도 않은 사이예요. 자주 만나는 쪽이 결국 더 친해집니다.',
    dim: '가만히 두면 연락이 뜸해지기 쉬워요. 만날 약속을 먼저 정해 두면 좋습니다.',
    strained: '말이 자꾸 어긋나는 사이예요. 중요한 이야기는 얼굴 보고 하거나 글로 남기는 게 좋습니다.',
  },
  knight: {
    active: '힘들 때 먼저 나서서 챙겨 주는 사람이에요. 내가 약해질 때 이 사람이 앞에 서 줍니다.',
    warm: '한쪽이 먼저 챙기고 밀어주는 사이예요. 고마움을 말로 표현하면 서로 편해집니다.',
    neutral: '먼저 챙겨 주는 편은 아니에요. 부탁하면 도와주는 정도라고 생각하면 됩니다.',
    dim: '한쪽만 애쓰는 사이가 되기 쉬워요. 할 일을 미리 나눠 두면 서로 지치지 않습니다.',
    strained: '챙기려는 마음이 간섭처럼 느껴질 수 있어요. 서로 지켜 줄 선을 미리 이야기해 두면 좋습니다.',
  },
  rival: {
    tense: '끌리면서도 자꾸 부딪히는 사이예요. 서로에게 자극이 되지만, 힘을 빼고 말하면 훨씬 편해집니다.',
    watch: '서로를 견제하는 마음이 조금 섞여 있어요. 비교하는 대신 내 페이스에 집중하면 좋은 자극이 됩니다.',
    neutral: '경쟁하는 느낌은 거의 없어요. 부담 없이 편하게 지내도 되는 사이입니다.',
    calm: '자주 부딪힐 일이 없는 사이예요. 편안한 마음으로 오래 지낼 수 있습니다.',
  },
  self: {},
  romance: {},
};

const GROUP_LEVEL_LABEL: Record<GroupLevel, string> = {
  active: '활성',
  warm: '부드러움',
  neutral: '보통',
  dim: '흐림',
  strained: '긴장',
  tense: '강한 긴장',
  watch: '견제',
  calm: '가라앉음',
};

export const levelLabel = (level: GroupLevel): string => GROUP_LEVEL_LABEL[level];

function protectLevelOf(score: number, active: boolean): ProtectLevel {
  if (active) return 'active';
  if (score >= 0.2) return 'warm';
  if (score <= -1.0) return 'strained';
  if (score <= -0.5) return 'dim';
  return 'neutral';
}

function rivalLevelOf(score: number): RivalLevel {
  if (score >= 0.7) return 'tense';
  if (score >= 0.35) return 'watch';
  if (score <= -0.6) return 'calm';
  return 'neutral';
}

/* --------------------------- 오버레이 계산 --------------------------- */

export type HouseOverlayHit = {
  /** 'mine' = 상대 점이 내 하우스에 들어옴, 'theirs' = 내 점이 상대 하우스에 들어옴 */
  direction: 'mine' | 'theirs';
  house: number;
  houseTitle: string;
  houseShort: string;
  /** 이 하우스가 속한 그룹 */
  group: GroupId;
  groupName: string;
  /** 그룹 안에서의 역할 이름 (예: 배우자 · 진지한 파트너) */
  role: string;
  /** 모드에 따라 갈아 끼운 역할 이름 (동성 우정: 11 짝꿍 동지, 7 찐친 파트너 …) */
  roleLabel: string;
  pointKey: PointKey;
  pointName: string;
  tone: 'help' | 'strain';
  /** 정렬·표시용 세기 (그룹 무게가 실린 절댓값) */
  weight: number;
  line: string;
};

export type GroupReading = {
  id: GroupId;
  name: string;
  short: string;
  housesLabel: string;
  tone: 'protect' | 'tension';
  score: number;
  level: GroupLevel;
  levelLabel: string;
  /** 이 그룹이 지금 이 관계에서 하는 말 한 문장 */
  line: string;
  color: string;
};

/** 점수 대신 역할로 읽는 하우스 신호 (남녀 궁합의 2·3·6·9·10·12, 동성의 8·12) */
export type RoleSignal = {
  house: number;
  houseShort: string;
  /** 역할 이름 (예: 물질적 은인) */
  role: string;
  tone: 'help' | 'strain' | 'none';
  /** 그 하우스에 들어온 길성·흉성의 대표 해설 */
  line: string;
};

export type HouseOverlay = {
  /** 12하우스 전체를 하나로 합친 지수 (0 근처 = 평균, 양수 = 수호 쪽) */
  houseScore: number;
  /** 다섯 그룹별 해설 (1·5하우스 보조는 제외) */
  groups: GroupReading[];
  /** 이 관계의 중심 결 한 문장 */
  signature: string;
  /** 친구 친화도(3·11하우스 절친 그룹 지수) — 화면에 따로 표기합니다 */
  friendHouseScore: number;
  /** mix에 더해지는 보너스 (houseScore × mixWeight, 상한 ±4) */
  bonus: number;
  /** 실제로 반영한 방향 수 (0 = 둘 다 시간 모름, 1 = 한쪽만 시간 앎, 2 = 양방향) */
  directions: number;
  /** 3·11하우스(절친·동지)가 길성으로 열렸는지 */
  friendHousesActive: boolean;
  /** 3·11하우스에 들어온 길성의 수 */
  friendHouseHits: number;
  hits: HouseOverlayHit[];
  line: string;
  /** 적용된 성별 조합 궁합 모드 (v5) */
  mode: CompatMode;
  /** 화면 배지 문구 (예: '남녀 궁합 기준' / '여여 우정 궁합 기준' / '공통 기준') */
  modeLabel: string;
  /** 모드가 무엇을 무겁게 보는지 한 줄 */
  modeNote: string;
  /** 점수를 이끄는 하우스 */
  emphasis: number[];
  /** 역할·해설 지표로 읽는 하우스 */
  indicators: number[];
  /** 지표 하우스별 역할 신호 */
  roleSignals: RoleSignal[];
};

/** 하우스 오버레이를 쓸 수 없는 쪽(시간 모름)을 판정합니다. */
export function isTimeUnknown(chart: Chart): boolean {
  return chart.unknownTime ?? !chart.timeKnown;
}

const ascSignOf = (chart: Chart): number =>
  (chart.rising ?? chart.points.find((p) => p.key === 'asc'))!.signIndex;

/** Whole Sign: 상대 점의 자리 → 내 차트의 하우스 */
function houseOfSign(hostAscSign: number, guestSignIndex: number): number {
  return ((guestSignIndex - hostAscSign + 12) % 12) + 1;
}

type DirectionSplit = {
  bond: number;
  friction: number;
  byGroup: Record<GroupId, number>;
};

const emptySplit = (): DirectionSplit => ({
  bond: 0,
  friction: 0,
  byGroup: Object.fromEntries(HOUSE_GROUPS.map((g) => [g.id, 0])) as Record<GroupId, number>,
});

function overlayHits(host: Chart, guest: Chart, direction: 'mine' | 'theirs', mode: CompatMode): HouseOverlayHit[] {
  const hostAsc = ascSignOf(host);
  const hits: HouseOverlayHit[] = [];
  OVERLAY_POINTS.forEach((key) => {
    const point = guest.points.find((p) => p.key === key);
    if (!point) return;
    const pointWeight = HOUSE_OVERLAY.points[key];
    if (!pointWeight) return;
    const house = houseOfSign(hostAsc, point.signIndex);
    const meta = HOUSE_META[house - 1];
    (HOUSE_ROLES[house] ?? []).forEach((role) => {
      const bond = bondOfPoint(mode, house, role, pointWeight);
      const friction = frictionOfPoint(mode, house, role, pointWeight);
      const line = roleTextOf(mode, house, role, pointWeight > 0 ? 'help' : 'strain');
      const group = groupById(role.group);
      hits.push({
        direction,
        house,
        houseTitle: meta.title,
        houseShort: meta.short,
        group: role.group,
        groupName: group.name,
        role: role.role,
        roleLabel: roleLabelOf(mode, house, role.role),
        pointKey: key,
        pointName: point.name,
        tone: pointWeight > 0 ? 'help' : 'strain',
        weight: Number((Math.abs(bond) + Math.abs(friction)).toFixed(3)),
        line,
      });
    });
  });
  return hits.sort((a, b) => b.weight - a.weight);
}

function splitOf(hits: HouseOverlayHit[], direction: 'mine' | 'theirs', mode: CompatMode): DirectionSplit {
  const split = emptySplit();
  hits
    .filter((h) => h.direction === direction)
    .forEach((h) => {
      const pointWeight = HOUSE_OVERLAY.points[h.pointKey] ?? 0;
      const role = (HOUSE_ROLES[h.house] ?? []).find((r) => r.group === h.group && r.role === h.role);
      if (!role) return;
      const bond = bondOfPoint(mode, h.house, role, pointWeight);
      const friction = frictionOfPoint(mode, h.house, role, pointWeight);
      split.bond += bond;
      split.friction += friction;
      split.byGroup[role.group] += bond + friction;
    });
  return split;
}

const avg = (list: number[]) => (list.length ? list.reduce((s, n) => s + n, 0) / list.length : 0);

function groupReadingOf(meta: GroupMeta, score: number, friendHits: number): GroupReading {
  const level: GroupLevel =
    meta.tone === 'tension'
      ? rivalLevelOf(score)
      : protectLevelOf(
          score,
          meta.id === 'bestfriend'
            ? friendHits >= HOUSE_OVERLAY.activeHits && score >= HOUSE_OVERLAY.activeScore
            : score >= HOUSE_OVERLAY.activeScore,
        );
  const line = GROUP_LINES[meta.id][level] ?? '이 관계에서는 특별히 드러나는 부분이 없어요.';
  return {
    id: meta.id,
    name: meta.name,
    short: meta.short,
    housesLabel: meta.houses.slice().sort((a, b) => a - b).join('·'),
    tone: meta.tone,
    score: Number(score.toFixed(3)),
    level,
    levelLabel: GROUP_LEVEL_LABEL[level],
    line,
    color: meta.color,
  };
}

/**
 * 두 차트의 하우스 오버레이 → 12하우스 다섯 그룹 지수.
 * 방향별 합을 낸 뒤 쓸 수 있는 방향만 평균합니다(분포가 같으므로 평균이 곧 정규화).
 * `mode`는 성별 조합 궁합 모드(v5) — 비워 두면 v4 공통 가중치입니다.
 */
export function overlayOf(me: Chart, other: Chart, mode: CompatMode = 'neutral'): HouseOverlay {
  const modeMeta = compatModeMeta(mode);
  const meUnknown = isTimeUnknown(me);
  const otherUnknown = isTimeUnknown(other);
  const usable: Array<'mine' | 'theirs'> = [];
  if (!meUnknown) usable.push('mine'); // 내 하우스는 정확 → 상대 점을 내 하우스에
  if (!otherUnknown) usable.push('theirs'); // 상대 하우스가 정확 → 내 점을 상대 하우스에

  if (!usable.length) {
    const groups = FIVE_GROUPS.map((g) => groupReadingOf(g, 0, 0)).map((g) => ({
      ...g,
      level: (g.tone === 'tension' ? 'neutral' : 'neutral') as GroupLevel,
      levelLabel: '반영 안 됨',
      line: '둘 다 태어난 시각을 몰라서 이 부분은 보지 못했어요.',
    }));
    return {
      houseScore: 0,
      groups,
      signature:
        '둘 다 태어난 시각을 몰라 이 부분은 보지 못했어요. 별자리 사이의 각도만으로 살펴봤습니다.',
      friendHouseScore: 0,
      bonus: 0,
      directions: 0,
      friendHousesActive: false,
      friendHouseHits: 0,
      hits: [],
      line: '둘 다 태어난 시각을 몰라서 이 부분은 보지 못했어요. 별자리 사이의 각도만으로 살펴봤습니다.',
      mode,
      modeLabel: modeMeta.label,
      modeNote: modeMeta.note,
      emphasis: modeMeta.emphasis,
      indicators: modeMeta.indicators,
      roleSignals: modeMeta.indicators.map((house) => ({
        house,
        houseShort: HOUSE_META[house - 1].short,
        role: roleLabelOf(mode, house, (HOUSE_ROLES[house] ?? [])[0]?.role ?? HOUSE_META[house - 1].title),
        tone: 'none' as const,
        line: '둘 다 태어난 시각을 몰라서 이 자리는 보지 못했어요.',
      })),
    };
  }

  const hits = usable
    .flatMap((dir) => (dir === 'mine' ? overlayHits(me, other, 'mine', mode) : overlayHits(other, me, 'theirs', mode)))
    .sort((a, b) => b.weight - a.weight);

  const splits = usable.map((dir) => splitOf(hits, dir, mode));
  const houseScore = Number(
    (avg(splits.map((s) => s.bond)) -
      HOUSE_OVERLAY.frictionWeight * avg(splits.map((s) => s.friction)) -
      OVERLAY_BASELINE_BY_MODE[mode]).toFixed(3),
  );

  const friendHits = hits.filter(
    (h) => (h.house === 3 || h.house === 11) && h.group === 'bestfriend' && h.tone === 'help',
  ).length;

  const groupScores = Object.fromEntries(
    HOUSE_GROUPS.map((g) => [g.id, avg(splits.map((s) => s.byGroup[g.id])) - GROUP_BASELINE_BY_MODE[mode][g.id]]),
  ) as Record<GroupId, number>;

  const groups = FIVE_GROUPS.map((g) => groupReadingOf(g, groupScores[g.id], friendHits));

  const friendReading = groups.find((g) => g.id === 'bestfriend')!;
  const friendHousesActive = friendReading.level === 'active';
  const rivalReading = groups.find((g) => g.id === 'rival')!;
  const soulmateReading = groups.find((g) => g.id === 'soulmate')!;
  const benefactorReading = groups.find((g) => g.id === 'benefactor')!;
  const knightReading = groups.find((g) => g.id === 'knight')!;

  const topProtect = [...groups]
    .filter((g) => g.tone === 'protect')
    .sort((a, b) => b.score - a.score)[0];

  const signature =
    topProtect && topProtect.level === 'active'
      ? `가장 가까운 사이는 '${topProtect.name}'예요. ${topProtect.line}`
      : topProtect && topProtect.level === 'warm'
        ? `마음이 가장 잘 통하는 부분은 '${topProtect.name}'이에요. ${topProtect.line}`
        : rivalReading.level === 'tense' || rivalReading.level === 'watch'
          ? `딱히 가까운 쪽은 없고, '${rivalReading.name}'의 긴장이 남아 있어요. ${rivalReading.line}`
          : '어느 쪽으로도 크게 기울지 않은, 무난한 사이예요.';

  const head = friendHousesActive
    ? '연락과 모임에서 이 사람이 내 편이 되어 주는 사이예요.'
    : soulmateReading.level === 'active'
      ? '가족처럼 편안하거나 마음이 깊이 통하는 사이예요.'
      : benefactorReading.level === 'active'
        ? '이 사람을 통해 기회와 소개가 들어오는 사이예요.'
        : knightReading.level === 'active'
          ? '내가 약해질 때 대신 나서 주는 사이예요.'
          : rivalReading.level === 'tense'
            ? '끌리면서도 자꾸 부딪히는 사이예요.'
            : houseScore >= 0.6
              ? '여러 자리가 부드럽게 이어져 있어 금방 가까워지는 사이예요.'
              : houseScore <= -0.6
                ? '처음엔 거리가 조금 있는 사이예요.'
                : '한쪽으로 크게 기울지 않은 무난한 사이예요.';
  const tail =
    usable.length === 1 ? ' 한쪽은 태어난 시각을 몰라서, 시간을 아는 쪽 기준으로 살펴봤습니다.' : '';

  /* 평균 근처는 mixWeight만큼 기울고, 극단은 bonusCap에서 눌립니다(부드러운 상한) */
  const gain = HOUSE_OVERLAY.mixWeight / HOUSE_OVERLAY.bonusCap;
  const bonus = Number((HOUSE_OVERLAY.bonusCap * Math.tanh(houseScore * gain)).toFixed(3));

  /* 점수 대신 역할로 읽는 하우스 — 그 하우스에 길성이 더 들어왔는지 흉성이 더 들어왔는지만 봅니다 */
  const roleSignals: RoleSignal[] = modeMeta.indicators.map((house) => {
    const houseHits = hits.filter((h) => h.house === house);
    const helpSum = houseHits.filter((h) => h.tone === 'help').reduce((s, h) => s + h.weight, 0);
    const strainSum = houseHits.filter((h) => h.tone === 'strain').reduce((s, h) => s + h.weight, 0);
    const base = (HOUSE_ROLES[house] ?? [])[0];
    const tone: RoleSignal['tone'] =
      helpSum > strainSum + 0.08 ? 'help' : strainSum > helpSum + 0.08 ? 'strain' : 'none';
    return {
      house,
      houseShort: HOUSE_META[house - 1].short,
      role: roleLabelOf(mode, house, base?.role ?? HOUSE_META[house - 1].title),
      tone,
      line:
        tone === 'none'
          ? '이 자리는 길성과 흉성이 엇비슷하게 들어와 어느 쪽으로도 기울지 않았습니다.'
          : base
            ? roleTextOf(mode, house, base, tone)
            : '',
    };
  });

  return {
    houseScore,
    groups,
    signature,
    friendHouseScore: friendReading.score,
    bonus,
    directions: usable.length,
    friendHousesActive,
    friendHouseHits: friendHits,
    hits,
    line: `${head}${tail}`,
    mode,
    modeLabel: modeMeta.label,
    modeNote: modeMeta.note,
    emphasis: modeMeta.emphasis,
    indicators: modeMeta.indicators,
    roleSignals,
  };
}

/* ------------------------------ 관계 ------------------------------ */

export type Relation = {
  id: string;
  name: string;
  chart: Chart;
  score: number;
  tier: Tier;
  axes: { warmth: number; pull: number; lasting: number };
  top: RelationAspect | null;
  tension: RelationAspect | null;
  aspects: RelationAspect[];
  signName: string;
  signGlyph: string;
  guardian: Guardian;
  keyword2027: string;
  line2027: string;
  headline: string;
  summary: string;
  /** 보정표에 넣기 전 원점수 (세 축 mix + 친구 친화도 보너스) */
  mix: number;
  /** 하우스 오버레이 친구 친화도 지수 (3·11하우스 절친 그룹) */
  friendHouseScore: number;
  /** 12하우스 전체를 다섯 그룹으로 합친 지수 (0 근처 = 평균) */
  houseScore: number;
  /** 다섯 그룹별 해설 (소울메이트·은인·절친·기사·라이벌) */
  groups: GroupReading[];
  /** 이 관계의 중심 결 한 문장 */
  signature: string;
  /** 하우스 오버레이 상세 (양방향, 시간 모름 보정 반영) */
  overlay: HouseOverlay;
  /** 성별 조합 궁합 모드 (v5) — 성별이 비면 'neutral' */
  compatMode: CompatMode;
  /** 화면에 쓰는 모드 이름 (남녀 궁합 기준 / 여여 우정 궁합 기준 / 남남 우정 궁합 기준 / 공통 기준) */
  compatModeLabel: string;
  /** 둘 중 한쪽이라도 출생 시각을 모르는지 */
  timeUnknown: boolean;
  /** 등급이 왜 이렇게 나왔는지 — 친구 계열은 3·11하우스 근거를 붙입니다 */
  tierNote: string;
  /** 지도 좌표(0~1000 정규화) */
  x: number;
  y: number;
  ring: number;
  /** 이 사람에게 내가 어떤 사람인지 (내 쪽 각 기준 한 줄) */
  mirrored: string;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/* ------------------------------ 점수 ------------------------------ */

/**
 * 세 축의 기준점·기울기·비중. 각 축은 32~97 사이로 누른 뒤 가중 평균합니다.
 * 값을 바꾸면 아래 CALIBRATION도 `scripts/calibrate.ts`로 다시 뽑아야 합니다.
 */
export const AXES = {
  temp: { label: '감정의 온도', base: 64, slope: 15, weight: 0.38 },
  pull: { label: '끌림의 세기', base: 63, slope: 12, weight: 0.3 },
  last: { label: '오래 가는 힘', base: 62, slope: 14, weight: 0.32 },
} as const;

export type AxisKey = keyof typeof AXES;

/** 각 목록 → 세 축 점수 */
export function axesOf(aspects: RelationAspect[]): { warmth: number; pull: number; lasting: number } {
  const sum = (axis: AxisKey) =>
    aspects.filter((a) => a.axis === axis).reduce((s, a) => s + a.contribution, 0);
  return {
    warmth: clamp(AXES.temp.base + sum('temp') * AXES.temp.slope, 32, 97),
    pull: clamp(AXES.pull.base + sum('pull') * AXES.pull.slope, 32, 97),
    lasting: clamp(AXES.last.base + sum('last') * AXES.last.slope, 32, 97),
  };
}

/**
 * 세 축을 하나로 합친 값(mix). 보정표에 넣기 전의 원점수입니다.
 * `overlayBonus`는 하우스 오버레이가 만든 소통·우정 보너스(mix 단위, ±bonusCap)입니다.
 */
export function mixOf(aspects: RelationAspect[], overlayBonus = 0): number {
  const a = axesOf(aspects);
  return (
    a.warmth * AXES.temp.weight +
    a.pull * AXES.pull.weight +
    a.lasting * AXES.last.weight +
    overlayBonus
  );
}

/**
 * 보정표 — [mix, 점수] 쌍. mix가 높을수록 점수가 높습니다.
 * 2026-11-18 표본 3,000쌍(기준 1992-12-15 09:30 서울)에서 잰 mix 분포를
 * 13단계가 모두 살아 있도록 나눈 값입니다. 산출 방식은 SCORING_SPEC.md.
 * 표 사이 구간은 직선으로 이어 붙이고, 양 끝은 잘라 씁니다.
 *
 * v4 (2026-11-18): 12하우스 전체를 다섯 그룹으로 넣고 다시 뽑았습니다(표본 3,000쌍).
 * v3 (2026-11-18): 13단계 유지 + ‘찐친’·‘절친’ 자리 맞바꿈 후 재보정.
 * v2: 하우스 오버레이(옵션 B)·시간 모름 보정(옵션 A) 반영
 * v1: [41.10,24] [52.38,39] … [79.76,94] [88.98,99]
 */
export const CALIBRATION: Array<[number, number]> = [
  [40.93, 24],
  [51.93, 39],
  [54.87, 44],
  [57.02, 49],
  [59.26, 54],
  [61.48, 59],
  [63.70, 64],
  [65.72, 69],
  [68.27, 74],
  [70.44, 79],
  [72.88, 84],
  [75.63, 89],
  [79.50, 94],
  [91.14, 99],
];

/** mix → 24~99점 */
export function scoreOfMix(mix: number): number {
  const first = CALIBRATION[0];
  const last = CALIBRATION[CALIBRATION.length - 1];
  if (mix <= first[0]) return first[1];
  if (mix >= last[0]) return last[1];
  for (let i = 1; i < CALIBRATION.length; i += 1) {
    const [hiMix, hiScore] = CALIBRATION[i];
    if (mix > hiMix) continue;
    const [loMix, loScore] = CALIBRATION[i - 1];
    const ratio = (mix - loMix) / (hiMix - loMix);
    return Math.round(loScore + ratio * (hiScore - loScore));
  }
  return last[1];
}

const FRIEND_TIERS: TierId[] = ['buddy', 'truefriend', 'bestie'];

/**
 * 등급이 나온 이유 한 줄 — v4는 다섯 그룹(12하우스) 가운데 어느 결이
 * 등급을 밀어 올리거나 끌어내렸는지까지 적습니다.
 */
function tierNoteOf(tier: Tier, overlay: HouseOverlay): string {
  if (overlay.directions === 0) {
    return '두 사람 모두 출생 시각을 몰라 하우스 오버레이는 빠졌습니다. 어센던트 각도 15%만 반영했습니다.';
  }
  const tail =
    overlay.directions === 1 ? ' (한쪽 출생 시각만 알아 시간을 아는 쪽 방향만 반영)' : '';
  const top = [...overlay.groups]
    .filter((g) => g.tone === 'protect')
    .sort((a, b) => b.score - a.score)[0];
  const rival = overlay.groups.find((g) => g.id === 'rival')!;
  const topOpen = Boolean(top) && (top.level === 'active' || top.level === 'warm');
  const rivalHot = rival.level === 'tense' || rival.level === 'watch';
  const verb = top && top.level === 'active' ? '열려' : '부드럽게 열려';
  const rivalPush = rival.level === 'tense' ? '긴장이 커' : '견제가 섞여';
  const rivalWith = rival.level === 'tense' ? '긴장이 함께 있어' : '견제가 함께 있어';
  const topLabel = top ? `${top.housesLabel}하우스(${top.short})` : '수호 쪽 하우스';

  if (tier.side === 'tension') {
    if (rivalHot) {
      return topOpen
        ? `${topLabel}도 ${verb} 있지만, 7·10하우스(라이벌)의 ${rivalPush} ${tier.name} 자리로 내려왔습니다.${tail}`
        : `7·10하우스(라이벌)의 ${rivalPush} ${tier.name} 자리로 내려왔습니다.${tail}`;
    }
    return `7·10하우스(라이벌)는 크게 열리지 않았지만 교차 각의 마찰이 커 ${tier.name} 자리에 섰습니다.${tail}`;
  }

  if (topOpen && rivalHot) {
    return `${topLabel}가 ${verb} 있지만 7·10하우스(라이벌)의 ${rivalWith} ${tier.name} 자리에 머물렀습니다.${tail}`;
  }
  if (topOpen) {
    const friendBit =
      FRIEND_TIERS.includes(tier.id) && overlay.friendHousesActive
        ? ` (3·11하우스에 길성 ${overlay.friendHouseHits}개)`
        : '';
    const end =
      overlay.bonus >= 0.5
        ? `${tier.name} 자리까지 올라왔습니다${friendBit}`
        : `${tier.name} 자리에 섰습니다${friendBit}`;
    return `${topLabel}가 ${verb} ${end}.${tail}`;
  }
  if (overlay.bonus <= -0.5) {
    return `수호 쪽 하우스가 흐려 교차 각의 힘으로 ${tier.name} 자리에 머물렀습니다.${tail}`;
  }
  return `수호 쪽 하우스는 크게 열리지 않았고 교차 각의 힘으로 ${tier.name} 자리에 섰습니다.${tail}`;
}

export function relationOf(
  me: Chart,
  other: Chart,
  name: string,
  genders?: { me?: unknown; other?: unknown },
): Relation {
  const mode = compatModeOf(genders?.me, genders?.other);
  const pa = pointsOf(me);
  const pb = pointsOf(other);
  const aspects: RelationAspect[] = [];
  const timeUnknown = isTimeUnknown(me) || isTimeUnknown(other);
  /* 옵션 A — 시간 모름 쌍에서는 정오 근사 어센던트가 점수를 흔들지 않도록 0.15로 낮춥니다 */
  const ascScale = timeUnknown ? HOUSE_OVERLAY.unknownAscScale : 1;

  for (const x of pa) {
    for (const y of pb) {
      const found = findAspect(x.longitude, y.longitude);
      if (!found) continue;
      const pair = pairKey(x.key, y.key);
      const ascPair = x.key === 'asc' || y.key === 'asc';
      const weight =
        (POINT_WEIGHT[x.key] ?? 0.6) * (POINT_WEIGHT[y.key] ?? 0.6) * (PAIR_BIAS[pair] ?? 1) * (ascPair ? ascScale : 1);
      const falloff = 1 - (found.orb / found.maxOrb) * 0.55;
      const contribution = weight * (found.tone === 'flow' ? 1 : -1) * falloff;
      const text = pairText(pair, found.type);
      aspects.push({
        pair,
        aName: x.name,
        bName: y.name,
        type: found.type,
        orb: found.orb,
        tone: found.tone,
        contribution: Number(contribution.toFixed(3)),
        title: text.title,
        body: found.tone === 'flow' ? text.flow : text.tense,
        axis: axisOf(pair),
      });
    }
  }

  aspects.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const overlay = overlayOf(me, other, mode);
  const { warmth, pull, lasting } = axesOf(aspects);
  const mix = mixOf(aspects, overlay.bonus);
  const score = scoreOfMix(mix);

  const tier = tierOfScore(score);
  const tierNote = tierNoteOf(tier, overlay);
  const top = aspects.find((a) => a.tone === 'flow') ?? null;
  const tension = aspects.find((a) => a.tone === 'tense') ?? null;

  const otherSign = SIGNS[other.sun.signIndex];
  const keyword = yearKeyword2027(other);
  const mySign = SIGNS[me.sun.signIndex];

  const headline = `${otherSign.name} · ${tier.name}`;
  const summary = top
    ? `가장 힘이 실린 자리는 ${top.aName}${josaOf(top.aName, '과와')} ${top.bName}의 ${top.type}이에요. ${top.title}.`
    : '세게 이어지는 자리는 많지 않아요. 대신 생활의 규칙이 관계를 지탱합니다.';

  const mirrored = `${other.nickname || name}에게 나는 ${mySign.name} 기운의 사람으로 보여요. ${
    tier.id === 'angel' || tier.id === 'buddy' || tier.id === 'benefactor' || tier.id === 'bestie'
      ? '이 사람이 내게 기대는 만큼, 나도 먼저 연락하면 사이가 더 단단해져요.'
      : '내가 먼저 손을 내밀면 이 사람도 천천히 마음을 열어요.'
  }`;

  return {
    id: `${name}-${other.seed}`,
    name,
    chart: other,
    score,
    tier,
    axes: { warmth, pull, lasting },
    top,
    tension,
    aspects,
    signName: otherSign.name,
    signGlyph: otherSign.glyph,
    guardian: guardianOfSign(other.sun.signIndex),
    keyword2027: keyword.keyword,
    line2027: keyword.line,
    headline,
    summary,
    mix,
    friendHouseScore: overlay.friendHouseScore,
    houseScore: overlay.houseScore,
    groups: overlay.groups,
    signature: overlay.signature,
    overlay,
    compatMode: mode,
    compatModeLabel: COMPAT_MODES[mode].label,
    timeUnknown,
    tierNote,
    mirrored,
    x: 0,
    y: 0,
    ring: tier.ring,
  };
}

/* ------------------------------ 지도 배치 ------------------------------ */

/** 나를 중심(0)으로, 등급이 높을수록 안쪽 궤도에 놓습니다. */
export function layoutMap(relations: Relation[]): Relation[] {
  const rings = new Map<number, Relation[]>();
  relations.forEach((r) => {
    const list = rings.get(r.ring) ?? [];
    list.push(r);
    rings.set(r.ring, list);
  });

  const sorted = [...relations].sort((a, b) => b.score - a.score);
  const placed: Relation[] = [];
  const ringOrder = [0, 1, 2, 3, 4];

  ringOrder.forEach((ring) => {
    const list = (rings.get(ring) ?? []).sort((a, b) => b.score - a.score);
    list.forEach((r, i) => {
      const radius = [22, 29, 35, 40, 44][ring] + (ring === 0 ? 0 : (i % 2) * 1.2);
      const offset = [0, 2.1, 4.2, 1.05, 3.15][ring];
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 + offset - Math.PI / 2;
      placed.push({
        ...r,
        ring,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      });
    });
  });

  /* 겹침이 심하면 살짝 밀어 둡니다 */
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8 && dist > 0.001) {
          const push = (8 - dist) / 2;
          placed[i] = { ...a, x: a.x + (dx / dist) * push, y: a.y + (dy / dist) * push };
          placed[j] = { ...b, x: b.x - (dx / dist) * push, y: b.y - (dy / dist) * push };
        }
      }
    }
  }

  return placed.sort((a, b) => b.score - a.score);
}

/* ------------------------------ 집계 ------------------------------ */

export type MapBalance = {
  /** 주는 쪽/받는 쪽 균형 문구 */
  label: string;
  line: string;
  counts: Record<TierId, number>;
  average: number;
  strongest: Relation | null;
};

export function balanceOf(relations: Relation[]): MapBalance {
  const counts: Record<TierId, number> = {
    soulmate: 0,
    angel: 0,
    buddy: 0,
    benefactor: 0,
    bestie: 0,
    patron: 0,
    truefriend: 0,
    knight: 0,
    samaritan: 0,
    competitor: 0,
    nemesis: 0,
    frenemy: 0,
    rival: 0,
  };
  relations.forEach((r) => {
    counts[r.tier.id] += 1;
  });
  const average = relations.length
    ? Math.round(relations.reduce((s, r) => s + r.score, 0) / relations.length)
    : 0;
  const high =
    counts.soulmate +
    counts.angel +
    counts.buddy +
    counts.benefactor +
    counts.bestie +
    counts.patron +
    counts.truefriend +
    counts.knight +
    counts.samaritan;
  const low = counts.competitor + counts.nemesis + counts.frenemy + counts.rival;
  const label = !relations.length
    ? '아직 비어 있는 지도'
    : high > low
      ? '받는 기운이 큰 지도'
      : low > high
        ? '긴장이 많은 지도'
        : '주고받는 기운이 균형인 지도';
  const line = !relations.length
    ? '이름과 생일을 넣으면 이 자리에 첫 사람이 올라옵니다.'
    : high > low
      ? '도움을 받는 쪽이 많습니다. 지금은 받을 때이고, 그 힘을 어디에 쓸지가 다음 한 해를 정합니다.'
      : low > high
        ? '서로 자극하는 사이가 많습니다. 긴장은 나를 깎기도 하고 벼리기도 합니다. 오래 갈 사람을 한 명은 남겨 두세요.'
        : '도움을 받는 자리와 자극이 되는 자리가 함께 있습니다. 한쪽으로 기울지 않은, 실제 사람 관계에 가까운 지도입니다.';

  return {
    label,
    line,
    counts,
    average,
    strongest: relations.length ? [...relations].sort((a, b) => b.score - a.score)[0] : null,
  };
}

/** 방사형 지도에서 '나'를 중심으로 한 각도 */
export function angleOf(r: Relation): number {
  return (Math.atan2(r.y - 50, r.x - 50) * 180) / Math.PI;
}
