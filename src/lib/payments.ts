/**
 * 페이앱(PayApp) 결제 연동 스캐폴드 (payments.ts)
 * ------------------------------------------------------------------
 * 흐름
 *   1) 결제 버튼 → POST {worker}/api/payapp/request (상품 ID만 보냄, 금액은 Worker가 확정)
 *   2) 응답의 payurl → 페이앱 결제창 → 결제
 *   3) 페이앱이 Worker로 결과 통보(feedback) → HMAC 서명된 해금 토큰 발급
 *   4) returnurl 로 돌아온 화면이 주문 상태를 조회해 잠금을 해제
 *
 * Worker 주소가 없는 빌드(이번 프로토타입)는 이 모듈을 호출하지 않고,
 * 화면에서 '미리보기 모드'로 동작합니다. 실제 결제 요청은 나가지 않습니다.
 */
import { PAYAPP_WORKER_URL, PAYMENTS_LIVE } from '../config/env';
import type { ProductId } from './products';

const PENDING_KEY = 'suho-angel.pendingOrder.v1';

export type PendingOrder = {
  orderId: string;
  productId: ProductId;
  price: number;
  /** 어떤 사람의 리포트인지 (관계 심층) */
  relationId?: string;
  createdAt: number;
};

export type RequestResult = { payurl: string; mulNo: string; orderId: string };
export type OrderStatus = {
  status: 'requested' | 'paid' | 'canceled';
  productId: ProductId | null;
  token?: string;
  paidAt?: string;
};
export type VerifyResult = { valid: boolean; productId: ProductId | null; orderId?: string; paidAt?: string };

const endpoint = (path: string) => `${PAYAPP_WORKER_URL}${path}`;

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 200) || `결제 서버 응답을 읽지 못했습니다. (${res.status})`);
  }
}

export function isPaymentLive(): boolean {
  return PAYMENTS_LIVE;
}

export async function requestPayAppPayment(params: {
  productId: ProductId;
  relationId?: string;
  recvphone: string;
  buyerName?: string;
}): Promise<RequestResult> {
  const res = await fetch(endpoint('/api/payapp/request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await readJson<{
    state: string;
    errorMessage?: string;
    payurl?: string;
    mulNo?: string;
    orderId?: string;
  }>(res);
  if (!res.ok || data.state !== '1' || !data.payurl || !data.orderId) {
    throw new Error(data.errorMessage || '결제 요청을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  return { payurl: data.payurl, mulNo: data.mulNo ?? '', orderId: data.orderId };
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatus> {
  const res = await fetch(endpoint(`/api/payapp/status?orderId=${encodeURIComponent(orderId)}`), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('주문 상태를 확인하지 못했습니다.');
  return readJson<OrderStatus>(res);
}

export async function verifyUnlockToken(token: string, productId: ProductId): Promise<VerifyResult> {
  const res = await fetch(
    endpoint(`/api/payapp/verify?token=${encodeURIComponent(token)}&productId=${encodeURIComponent(productId)}`),
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) return { valid: false, productId: null };
  return readJson<VerifyResult>(res);
}

export function savePendingOrder(order: PendingOrder): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(order));
  } catch {
    /* 저장이 막힌 브라우저는 무시 */
  }
}

export function readPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOrder;
    if (!parsed?.orderId || !parsed.productId) return null;
    if (Date.now() - (parsed.createdAt ?? 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingOrder(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

export function readReturnedOrderId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get('pay_order');
  return id && id.length > 0 ? id : null;
}

export function cleanReturnUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('pay_order')) return;
  url.searchParams.delete('pay_order');
  url.searchParams.delete('pay_status');
  window.history.replaceState({}, '', url.toString());
}

/** 페이앱 결제 요청에 필요한 휴대폰 번호 검사 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '');
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : null;
}
