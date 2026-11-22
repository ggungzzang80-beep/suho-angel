/**
 * 상품표 (products.ts)
 * ------------------------------------------------------------------
 * 금액은 화면이 아니라 이 표에서만 정합니다. Worker 도 같은 표를 씁니다.
 * 소액결제(3,900~6,900원) 중심으로 잡고, 지도 전체 해금만 묶음 상품으로 둡니다.
 */

export type ProductId = 'relation-deep' | 'self-deep' | 'year-flow' | 'map-all';

export type Product = {
  id: ProductId;
  name: string;
  price: number;
  /** 가격 표기용 */
  priceText: string;
  tagline: string;
  bullets: string[];
  /** 잠금 화면에서 보여줄 짧은 이름 */
  short: string;
};

export const PRODUCTS: Record<ProductId, Product> = {
  'relation-deep': {
    id: 'relation-deep',
    name: '관계 심층 리포트',
    price: 3900,
    priceText: '3,900원',
    short: '관계 심층',
    tagline: '한 사람과의 관계를 각도별로 끝까지',
    bullets: [
      '두 사람의 교차 각 전체 목록과 오브',
      '가장 강한 흐름 3개와 마찰 3개의 해석',
      '이 관계에서 내가 조심할 말과 timing',
      '올해 이 사람과의 흐름 12개월',
    ],
  },
  'self-deep': {
    id: 'self-deep',
    name: '개인 심층 리포트',
    price: 6900,
    priceText: '6,900원',
    short: '개인 심층',
    tagline: '내 천궁도 하나를 끝까지 읽기',
    bullets: [
      '10년 변곡점 전체 (목성·토성 이동)',
      '직업적 재능과 맞는 분야 3갈래',
      '금전 흐름 10년 곡선',
      '관계에서 반복되는 패턴과 그림자',
    ],
  },
  'year-flow': {
    id: 'year-flow',
    name: '연도·월별 흐름 리포트',
    price: 4900,
    priceText: '4,900원',
    short: '연도·월별',
    tagline: '2027년을 열두 달로 나눠서',
    bullets: [
      '월별 주제와 온도(점수) 12개',
      '목성·토성이 내 하우스를 지나는 구간',
      '결정을 미룰 달과 밀어붙일 달',
      '2027년 한 줄 키워드',
    ],
  },
  'map-all': {
    id: 'map-all',
    name: '지도 전체 해금',
    price: 12900,
    priceText: '12,900원',
    short: '지도 전체',
    tagline: '지도에 있는 모든 사람 + 내 심층까지',
    bullets: [
      '지도에 올라온 모든 사람의 관계 심층',
      '내 개인 심층 리포트',
      '연도·월별 흐름 리포트',
      '사람이 추가될 때마다 새 관계도 열람',
    ],
  },
};

export const PRODUCT_ORDER: ProductId[] = ['relation-deep', 'self-deep', 'year-flow', 'map-all'];
