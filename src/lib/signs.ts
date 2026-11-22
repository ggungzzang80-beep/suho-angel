/**
 * 별자리 · 행성 · 하우스 사전 (signs.ts)
 * ------------------------------------------------------------------
 * 서양 점성술(Whole Sign) 화면에서 쓰는 상징 사전입니다.
 * - 12자리: 성격·연애·돈·일·그림자 + '곁에 있을 때의 나' 한 줄
 * - 10행성 + 어센던트·MC·포춘·릴리트·버텍스
 * - 12하우스(Whole Sign): 자리 하나가 하우스 하나
 */

export type Element = '불' | '흙' | '공기' | '물';
export type Modality = '활동' | '고정' | '변통';

export type SignInfo = {
  index: number;
  name: string;
  glyph: string;
  en: string;
  element: Element;
  modality: Modality;
  ruler: string;
  keyword: string;
  identity: string;
  love: string;
  money: string;
  work: string;
  shadow: string;
  /** 관계 지도에서 이 사람이 곁에 있을 때 */
  presence: string;
};

export const SIGNS: SignInfo[] = [
  {
    index: 0,
    name: '양자리',
    glyph: '♈',
    en: 'Aries',
    element: '불',
    modality: '활동',
    ruler: '화성',
    keyword: '먼저 움직이는 사람',
    identity:
      '생각이 떠오르면 몸이 먼저 움직이는 사람입니다. 시작이 무섭지 않아서 늘 남들보다 반 발짝 앞에 서 있습니다.',
    love: '좋아하면 숨기지 못합니다. 연락도 고백도 빠르고, 상대가 망설이면 흥미가 식는 편입니다.',
    money: '돈이 들어오는 길은 새 일을 벌이는 쪽입니다. 대신 벌리는 만큼 씀씀이도 빠릅니다.',
    work: '혼자 끌고 가는 개척 업무에서 강합니다. 반복·정리 업무는 오래 못 버팁니다.',
    shadow: '급하게 결론 내고 중간에 지루해하는 것.',
    presence: '망설이는 나를 대신해 첫걸음을 떼어 주는 사람.',
  },
  {
    index: 1,
    name: '황소자리',
    glyph: '♉',
    en: 'Taurus',
    element: '흙',
    modality: '고정',
    ruler: '금성',
    keyword: '감각으로 확인하는 사람',
    identity:
      '말보다 감각을 믿는 사람입니다. 좋은 것과 아닌 것을 몸으로 먼저 알고, 한 번 정하면 쉽게 흔들리지 않습니다.',
    love: '천천히, 오래 봅니다. 함께 있는 시간과 스킨십이 애정의 언어입니다.',
    money: '돈을 모으는 재주가 있습니다. 대신 맛있는 것·예쁜 것 앞에서는 지갑이 열립니다.',
    work: '결과물의 질을 끝까지 끌어올리는 일에 강합니다. 갑작스러운 변경은 힘들어합니다.',
    shadow: '익숙한 것에 머물다 기회를 놓치는 것.',
    presence: '내가 흔들릴 때 자리를 잡아 주는 사람.',
  },
  {
    index: 2,
    name: '쌍둥이자리',
    glyph: '♊',
    en: 'Gemini',
    element: '공기',
    modality: '변통',
    ruler: '수성',
    keyword: '말과 정보로 연결되는 사람',
    identity:
      '궁금한 게 많고, 그것을 말로 바꾸는 속도가 빠릅니다. 사람과 사람 사이를 이어주는 자리에 자주 섭니다.',
    love: '대화가 곧 애정입니다. 말이 통하지 않으면 마음도 금방 멀어집니다.',
    money: '여러 갈래의 수입을 동시에 굴리는 쪽입니다. 대신 벌인 곳마다 관리가 필요합니다.',
    work: '기획·글·영업처럼 말과 정보를 다루는 일이 맞습니다.',
    shadow: '벌려놓고 마무리하지 못하는 것.',
    presence: '내 얘기를 가장 재미있게 들어 주는 사람.',
  },
  {
    index: 3,
    name: '게자리',
    glyph: '♋',
    en: 'Cancer',
    element: '물',
    modality: '활동',
    ruler: '달',
    keyword: '기억으로 사람을 품는 사람',
    identity:
      '정서의 기억이 오래 남는 사람입니다. 겉은 조용해도 안에서는 늘 누군가를 걱정하고 챙기고 있습니다.',
    love: '한 번 마음을 열면 오래갑니다. 안전하다고 느끼는 사람에게만 진짜 모습을 보입니다.',
    money: '집·가족·안전과 연결된 지출이 많습니다. 비상금을 만들어 두면 마음이 놓입니다.',
    work: '돌봄·교육·조직의 살림을 맡는 자리에서 강합니다.',
    shadow: '서운함을 말하지 않고 쌓아두는 것.',
    presence: '내가 아프다는 말을 하기 전에 알아채는 사람.',
  },
  {
    index: 4,
    name: '사자자리',
    glyph: '♌',
    en: 'Leo',
    element: '불',
    modality: '고정',
    ruler: '태양',
    keyword: '빛나야 움직이는 사람',
    identity:
      '자기 자신을 하나의 작품처럼 다듬는 사람입니다. 인정받을 때 힘이 나고, 무시당할 때 가장 크게 다칩니다.',
    love: '표현이 분명하고 시원합니다. 상대가 자기 자랑을 들어주면 마음이 열립니다.',
    money: '자기 관리와 취향에 쓰는 돈이 많습니다. 대신 그 감각이 수입으로 돌아오는 구조를 만들 수 있습니다.',
    work: '무대가 있는 일, 사람 앞에 서는 일에서 능력이 드러납니다.',
    shadow: '체면 때문에 손해를 감수하는 것.',
    presence: '내 장점을 남들 앞에서 크게 말해 주는 사람.',
  },
  {
    index: 5,
    name: '처녀자리',
    glyph: '♍',
    en: 'Virgo',
    element: '흙',
    modality: '변통',
    ruler: '수성',
    keyword: '고쳐서 완성하는 사람',
    identity:
      '디테일이 눈에 먼저 들어오는 사람입니다. 좋은 의미로는 정확하고, 나쁜 의미로는 스스로를 몰아붙입니다.',
    love: '챙겨주는 방식으로 사랑합니다. 말보다 실제 행동이 많은 편입니다.',
    money: '새는 돈을 정확히 찾아냅니다. 가계부·구독 정리에 강합니다.',
    work: '검토·분석·관리 업무에서 대체 불가능해집니다.',
    shadow: '완벽하지 않으면 시작도 못 하는 것.',
    presence: '내가 놓친 것을 조용히 챙겨 주는 사람.',
  },
  {
    index: 6,
    name: '천칭자리',
    glyph: '♎',
    en: 'Libra',
    element: '공기',
    modality: '활동',
    ruler: '금성',
    keyword: '균형을 맞추는 사람',
    identity:
      '관계의 온도를 재는 감각이 뛰어난 사람입니다. 누구 편도 들지 않으려다 정작 자기 마음을 미루기도 합니다.',
    love: '함께 있는 시간과 예의를 중요하게 봅니다. 관계가 거칠어지면 가장 먼저 지칩니다.',
    money: '보기 좋은 소비에 약합니다. 대신 사람을 통해 돈이 들어오는 길이 열립니다.',
    work: '협상·중재·디자인처럼 균형이 필요한 일에 맞습니다.',
    shadow: '결정을 미루다 남의 기준에 맞춰버리는 것.',
    presence: '갈등의 한가운데서 말투를 부드럽게 바꿔 주는 사람.',
  },
  {
    index: 7,
    name: '전갈자리',
    glyph: '♏',
    en: 'Scorpio',
    element: '물',
    modality: '고정',
    ruler: '명왕성',
    keyword: '끝까지 파고드는 사람',
    identity:
      '얕게 넘어가지 못하는 사람입니다. 한 번 관심을 두면 속까지 알고 싶어 하고, 그래서 사람을 정확히 봅니다.',
    love: '신뢰가 전부입니다. 한 번 금이 가면 좀처럼 돌아오지 않습니다.',
    money: '남이 모르는 곳에서 자산을 키우는 데 능합니다. 공동 자금·투자 감각이 있습니다.',
    work: '조사·연구·위기 관리에서 강합니다.',
    shadow: '의심이 길어져 혼자 결론 내리는 것.',
    presence: '내가 숨기고 싶은 얘기까지 함께 들고 가 주는 사람.',
  },
  {
    index: 8,
    name: '사수자리',
    glyph: '♐',
    en: 'Sagittarius',
    element: '불',
    modality: '변통',
    ruler: '목성',
    keyword: '더 넓은 곳을 보는 사람',
    identity:
      '지금 자리보다 저 너머를 먼저 보는 사람입니다. 답답한 규칙보다는 스스로 납득할 수 있는 이유를 원합니다.',
    love: '구속을 싫어하고 함께 성장하는 관계를 원합니다. 거짓말은 가장 빨리 알아챕니다.',
    money: '배움과 여행에 쓰고, 그 경험이 다시 수입이 되는 구조를 만듭니다.',
    work: '교육·콘텐츠·해외·기획처럼 시야를 넓히는 일이 맞습니다.',
    shadow: '약속을 가볍게 여기고 시작만 많은 것.',
    presence: '내 시야를 한 칸 넓혀 주는 사람.',
  },
  {
    index: 9,
    name: '염소자리',
    glyph: '♑',
    en: 'Capricorn',
    element: '흙',
    modality: '활동',
    ruler: '토성',
    keyword: '쌓아서 증명하는 사람',
    identity:
      '감정보다 결과로 말하는 사람입니다. 남보다 늦게 출발해도 결국 가장 높은 곳에 서 있습니다.',
    love: '표현은 느리지만 책임은 확실합니다. 말보다 오래 곁에 있는 쪽입니다.',
    money: '계획적으로 모읍니다. 큰돈은 늘 계산서를 확인하고 움직입니다.',
    work: '조직·관리·장기 프로젝트에서 신뢰를 얻습니다.',
    shadow: '쉬지 못하고 모든 걸 혼자 감당하는 것.',
    presence: '내가 벌인 일을 끝까지 책임지게 해 주는 사람.',
  },
  {
    index: 10,
    name: '물병자리',
    glyph: '♒',
    en: 'Aquarius',
    element: '공기',
    modality: '고정',
    ruler: '천왕성',
    keyword: '남과 다른 각도로 보는 사람',
    identity:
      '모두가 당연하다고 할 때 "왜?"를 먼저 묻는 사람입니다. 가까운 사람보다 넓은 사람들과 더 잘 통합니다.',
    love: '친구 같은 관계를 원합니다. 감정보다 이해를 먼저 확인합니다.',
    money: '새로운 방식·기술·플랫폼에서 수입을 만듭니다.',
    work: '기술·연구·기획처럼 관성을 깨는 일이 맞습니다.',
    shadow: '가까운 사람의 감정을 뒤로 미루는 것.',
    presence: '내가 당연하게 여긴 것을 다시 질문하게 하는 사람.',
  },
  {
    index: 11,
    name: '물고기자리',
    glyph: '♓',
    en: 'Pisces',
    element: '물',
    modality: '변통',
    ruler: '해왕성',
    keyword: '분위기를 읽는 사람',
    identity:
      '말 이전의 공기를 읽는 사람입니다. 그래서 사람들이 자주 이야기를 꺼내고, 대신 자기 경계를 잃기 쉽습니다.',
    love: '상대에게 스며듭니다. 좋아하면 상대의 하루를 다 알고 싶어 합니다.',
    money: '돈의 경계가 흐려지기 쉽습니다. 자동이체와 한도를 정해두면 훨씬 편해집니다.',
    work: '감성·치유·창작·서비스 업에서 강합니다.',
    shadow: '거절하지 못해 떠안는 것.',
    presence: '설명하지 않아도 내 편에 서 주는 사람.',
  },
];

export const ELEMENT_MEANING: Record<Element, string> = {
  불: '불 — 밀어붙이는 힘과 열정',
  흙: '흙 — 감각과 현실 감각',
  공기: '공기 — 말과 정보, 연결',
  물: '물 — 감정과 직관',
};

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export type PointKey = PlanetKey | 'asc' | 'mc' | 'fortune' | 'lilith' | 'vertex';

export const PLANET_META: Record<PointKey, { name: string; short: string; glyph: string; means: string }> = {
  sun: { name: '태양', short: 'Sun', glyph: '☉', means: '나의 중심과 의지' },
  moon: { name: '달', short: 'Moon', glyph: '☾', means: '감정과 안전 욕구' },
  mercury: { name: '수성', short: 'Mercury', glyph: '☿', means: '말과 사고 방식' },
  venus: { name: '금성', short: 'Venus', glyph: '♀', means: '애정과 취향' },
  mars: { name: '화성', short: 'Mars', glyph: '♂', means: '추진력과 분노' },
  jupiter: { name: '목성', short: 'Jupiter', glyph: '♃', means: '확장과 행운' },
  saturn: { name: '토성', short: 'Saturn', glyph: '♄', means: '책임과 제약' },
  uranus: { name: '천왕성', short: 'Uranus', glyph: '♅', means: '돌파와 개성' },
  neptune: { name: '해왕성', short: 'Neptune', glyph: '♆', means: '환상과 공감' },
  pluto: { name: '명왕성', short: 'Pluto', glyph: '♇', means: '재생과 몰입' },
  asc: { name: '어센던트', short: 'ASC', glyph: 'AC', means: '첫인상과 삶의 시작점' },
  mc: { name: 'MC', short: 'MC', glyph: 'MC', means: '사회적 자리와 방향' },
  fortune: { name: '포춘', short: 'Fortune', glyph: '⊗', means: '행운이 모이는 자리' },
  lilith: { name: '릴리트', short: 'Lilith', glyph: '⚸', means: '숨겨 둔 욕망' },
  vertex: { name: '버텍스', short: 'Vertex', glyph: 'Vx', means: '피할 수 없이 만나는 인연' },
};

export const PLANET_ORDER: PlanetKey[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

export const POINT_ORDER: PointKey[] = [...PLANET_ORDER, 'asc', 'mc', 'fortune', 'lilith', 'vertex'];

export type HouseMeta = { index: number; title: string; short: string; desc: string };

export const HOUSE_META: HouseMeta[] = [
  { index: 1, title: '1하우스 · 나', short: '나', desc: '첫인상과 몸, 남들이 처음 만나는 나' },
  { index: 2, title: '2하우스 · 내 것', short: '내 것', desc: '내가 버는 돈과 소유, 씀씀이' },
  { index: 3, title: '3하우스 · 말', short: '말', desc: '말과 글, 형제·이웃과의 왕래' },
  { index: 4, title: '4하우스 · 집', short: '집', desc: '집과 가족, 돌아갈 자리' },
  { index: 5, title: '5하우스 · 놀이', short: '놀이', desc: '연애와 놀이, 창작' },
  { index: 6, title: '6하우스 · 일상', short: '일상', desc: '일하는 방식과 루틴, 몸의 리듬' },
  { index: 7, title: '7하우스 · 짝', short: '짝', desc: '연인·배우자·계약 상대' },
  { index: 8, title: '8하우스 · 공유', short: '공유', desc: '공동 자금과 깊은 변화' },
  { index: 9, title: '9하우스 · 배움', short: '배움', desc: '배움과 여행, 신념' },
  { index: 10, title: '10하우스 · 커리어', short: '커리어', desc: '직업과 평판, 사회적 자리' },
  { index: 11, title: '11하우스 · 사람', short: '사람', desc: '네트워크와 희망, 함께하는 사람들' },
  { index: 12, title: '12하우스 · 쉼', short: '쉼', desc: '혼자만의 세계와 숨은 것' },
];

/** 해가 이 하우스를 지날 때의 한 달 주제 (월별 흐름에 씁니다) */
export const HOUSE_MONTH_THEME: string[] = [
  '몸과 첫인상을 새로 고치는 달',
  '수입과 씀씀이를 정리하는 달',
  '연락과 짧은 이동이 잦은 달',
  '집과 가족 쪽에 마음이 가는 달',
  '놀이·연애·창작에 온기가 도는 달',
  '일과 루틴을 다듬는 달',
  '사람과의 약속이 구체해지는 달',
  '공유한 것과 깊은 감정을 다루는 달',
  '배움과 이동, 시야가 넓어지는 달',
  '커리어와 평판이 드러나는 달',
  '모임과 사람들 사이에서 답을 찾는 달',
  '쉬어야 다음이 열리는 달',
];
