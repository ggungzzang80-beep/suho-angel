/**
 * 상품표 (catalog.ts)
 * ------------------------------------------------------------------
 * 결제 금액은 절대 브라우저가 보낸 값을 쓰지 않습니다.
 * 웹앱(src/lib/products.ts)과 같은 표를 그대로 가져와 서버가 다시 계산합니다.
 * → 화면에 보인 가격과 실제 청구 금액이 어긋나면 결제를 시작하지 않습니다.
 */
import { PRODUCTS, type Product, type ProductId } from '../../src/lib/products';

export type ResolvedProduct = {
  product: Product;
  /** 관계 심층 리포트의 대상 사람 (없으면 '') */
  relationId: string;
  price: number;
};

const PRODUCT_IDS = new Set(Object.keys(PRODUCTS));

export function isProductId(value: string): value is ProductId {
  return PRODUCT_IDS.has(value);
}

/**
 * @param expectedPrice 화면이 표시한 금액 (있으면 대조용으로만 사용)
 */
export function resolveProduct(
  productId: string,
  relationId: string,
  expectedPrice?: number,
): { ok: true; value: ResolvedProduct } | { ok: false; reason: string } {
  if (!isProductId(productId)) return { ok: false, reason: '알 수 없는 상품입니다.' };

  const product = PRODUCTS[productId];
  const price = product.price;
  if (price < 1000) return { ok: false, reason: '결제 최소 금액(1,000원)보다 낮은 상품입니다.' };
  if (productId === 'relation-deep' && !relationId) {
    return { ok: false, reason: '어떤 사람의 리포트인지 확인해 주세요.' };
  }
  if (typeof expectedPrice === 'number' && Number.isFinite(expectedPrice) && expectedPrice !== price) {
    return { ok: false, reason: '화면에 표시된 금액과 서버 금액이 다릅니다. 새로고침 후 다시 시도해 주세요.' };
  }
  return { ok: true, value: { product, relationId: relationId.slice(0, 80), price } };
}

/** 페이앱에 표시할 상품명 — 사이트 이름을 붙여 결제 내역에서 알아보기 쉽게 합니다. */
export function goodsName(product: Product): string {
  return `나의 수호천사 - ${product.name}`;
}
