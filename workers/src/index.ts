/**
 * 「나의 수호천사」 결제 확인 Worker (Cloudflare Workers Free)
 * ==================================================================
 * 정적 사이트(Cloudflare Pages)는 금액을 위조할 수 있으므로,
 * 결제 요청과 결제 확인은 이 Worker 에서만 처리합니다.
 * '별의 속삭임'(projects/ziwei-app/workers)의 같은 구조를 상품·테마 없이 옮겼습니다.
 *
 *   POST /api/payapp/request    결제 요청 → 페이앱 결제창 주소(payurl)
 *   POST /api/payapp/feedback   페이앱 웹훅 → 검증 후 해금 토큰 발급·KV 저장
 *   GET  /api/payapp/status     주문 상태·토큰 조회 (returnurl 복귀 후 사용)
 *   GET  /api/payapp/verify     해금 토큰 검증
 *   GET  /api/health            배포 확인용
 *
 * 필요한 시크릿(wrangler secret put)
 *   PAYAPP_REQUESTKEY    페이앱 결제 KEY     (해시 생성용, 클라이언트 노출 금지)
 *   PAYAPP_LINKVAL       페이앱 연동 VALUE   (웹훅 위조 차단)
 *   UNLOCK_TOKEN_SECRET  해금 토큰 서명 키   (아무 긴 임의 문자열)
 *
 * 환경 변수(vars)
 *   PAYAPP_USERID        페이앱 아이디(가맹점 ID)
 *   APP_ORIGIN           사이트 주소 (예: https://suho-angel.pages.dev)
 *   APP_BASE_PATH        사이트 하위 경로 (Cloudflare Pages 는 '/')
 *   ALLOWED_ORIGINS      추가 허용 오리진(콤마 구분, 프리뷰·로컬 테스트용)
 *   PAYTYPE              결제수단 (기본 card,kakaopay,naverpay)
 *   PAYAPP_API_BASE      (선택) 페이앱 API 주소 — 테스트용으로만 바꿉니다
 */
import { goodsName, resolveProduct } from './catalog';
import { PAYAPP_ENDPOINT, kstTimestamp, postPayApp } from './payapp';
import { sha256Hex, signToken, verifyToken, type UnlockPayload } from './token';

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  PAYAPP_KV?: KVNamespaceLike;
  PAYAPP_USERID?: string;
  PAYAPP_REQUESTKEY?: string;
  PAYAPP_LINKVAL?: string;
  UNLOCK_TOKEN_SECRET?: string;
  APP_ORIGIN?: string;
  APP_BASE_PATH?: string;
  ALLOWED_ORIGINS?: string;
  PAYTYPE?: string;
  PAYAPP_API_BASE?: string;
  /** KV 없이 로컬에서 흐름만 확인할 때 사용 (배포 환경에서는 절대 설정하지 않습니다) */
  IN_MEMORY_STORE?: string;
}

type OrderStatus = 'requested' | 'paid' | 'canceled';

type OrderRecord = {
  orderId: string;
  productId: string;
  relationId: string;
  price: number;
  goodname: string;
  status: OrderStatus;
  createdAt: string;
  mulNo?: string;
  payState?: string;
  payType?: string;
  paidAt?: string;
  canceledAt?: string;
  token?: string;
  recvphoneMasked?: string;
};

const ORDER_TTL = 60 * 60 * 24 * 180; // 180일
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365; // 1년

/* ------------------------------------------------------------------ */
/* 저장소 — KV, 없으면(로컬 테스트) 메모리                              */
/* ------------------------------------------------------------------ */

const memoryStore = new Map<string, string>();

async function storeGet(env: Env, key: string): Promise<string | null> {
  if (env.PAYAPP_KV) return env.PAYAPP_KV.get(key);
  if (env.IN_MEMORY_STORE === '1') return memoryStore.get(key) ?? null;
  return null;
}

async function storePut(env: Env, key: string, value: string, ttl = ORDER_TTL): Promise<void> {
  if (env.PAYAPP_KV) {
    await env.PAYAPP_KV.put(key, value, { expirationTtl: ttl });
    return;
  }
  if (env.IN_MEMORY_STORE === '1') memoryStore.set(key, value);
}

async function storeDelete(env: Env, key: string): Promise<void> {
  if (env.PAYAPP_KV) {
    await env.PAYAPP_KV.delete(key);
    return;
  }
  if (env.IN_MEMORY_STORE === '1') memoryStore.delete(key);
}

async function readOrder(env: Env, orderId: string): Promise<OrderRecord | null> {
  const raw = await storeGet(env, `order:${orderId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderRecord;
  } catch {
    return null;
  }
}

async function writeOrder(env: Env, order: OrderRecord): Promise<void> {
  await storePut(env, `order:${order.orderId}`, JSON.stringify(order));
}

/* ------------------------------------------------------------------ */
/* 응답 도우미                                                         */
/* ------------------------------------------------------------------ */

function allowedOrigins(env: Env): string[] {
  const list = [env.APP_ORIGIN ?? '', ...(env.ALLOWED_ORIGINS ?? '').split(',')]
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (env.IN_MEMORY_STORE === '1') list.push('http://127.0.0.1:4183', 'http://127.0.0.1:5183');
  return [...new Set(list)];
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = allowedOrigins(env);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin.replace(/\/+$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (!origin && allowed.length === 1) {
    // 서버 간 호출(페이앱 통보 등)에는 Origin 이 없습니다.
    headers['Access-Control-Allow-Origin'] = allowed[0];
  }
  return headers;
}

function json(data: unknown, status: number, request: Request, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request, env),
    },
  });
}

function text(body: string, status: number, request: Request, env: Env): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(request, env) },
  });
}

/* ------------------------------------------------------------------ */
/* 공통 검증                                                           */
/* ------------------------------------------------------------------ */

function markPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return '***';
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/[^0-9]/g, '');
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null;
  return digits;
}

function newOrderId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `ORD${uuid.slice(0, 20).toUpperCase()}`;
}

function tokenPayload(order: OrderRecord, paidAt: string): UnlockPayload {
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    v: 1,
    p: order.productId,
    r: order.relationId || undefined,
    o: order.orderId,
    m: order.mulNo ?? '',
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };
}

/* ------------------------------------------------------------------ */
/* 1) 결제 요청                                                        */
/* ------------------------------------------------------------------ */

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (!env.PAYAPP_USERID || !env.PAYAPP_REQUESTKEY) {
    return json({ state: '0', errorMessage: '결제 설정이 아직 완료되지 않았습니다.' }, 503, request, env);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ state: '0', errorMessage: '요청 형식을 확인해 주세요.' }, 400, request, env);
  }

  const productId = typeof body.productId === 'string' ? body.productId : '';
  const relationId = typeof body.relationId === 'string' ? body.relationId : '';
  const expectedPrice = typeof body.price === 'number' ? body.price : undefined;
  const recvphone = normalizePhone(body.recvphone);
  const buyerName = typeof body.buyerName === 'string' ? body.buyerName.slice(0, 20) : '';

  if (!recvphone) {
    return json({ state: '0', errorMessage: '휴대폰 번호를 정확히 입력해 주세요.' }, 400, request, env);
  }

  const resolved = resolveProduct(productId, relationId, expectedPrice);
  if (!resolved.ok) {
    return json({ state: '0', errorMessage: resolved.reason }, 400, request, env);
  }
  const { product, price } = resolved.value;

  const orderId = newOrderId();
  const createdAt = new Date().toISOString();
  const order: OrderRecord = {
    orderId,
    productId: product.id,
    relationId: resolved.value.relationId,
    price,
    goodname: goodsName(product),
    status: 'requested',
    createdAt,
    recvphoneMasked: markPhone(recvphone),
  };

  const workerOrigin = new URL(request.url).origin;
  const siteOrigin = (env.APP_ORIGIN ?? '').replace(/\/+$/, '');
  if (!siteOrigin) {
    return json({ state: '0', errorMessage: '사이트 주소(APP_ORIGIN)가 설정되지 않았습니다.' }, 503, request, env);
  }
  const basePath = env.APP_BASE_PATH && env.APP_BASE_PATH.startsWith('/') ? env.APP_BASE_PATH : '/';
  const returnurl = `${siteOrigin}${basePath}?pay_order=${encodeURIComponent(orderId)}`;

  const requestdate = kstTimestamp();
  const hash = await sha256Hex(`${env.PAYAPP_USERID}${requestdate}${env.PAYAPP_REQUESTKEY}`);

  const response = await postPayApp(env.PAYAPP_API_BASE || PAYAPP_ENDPOINT, {
    cmd: 'payrequest',
    userid: env.PAYAPP_USERID,
    requestdate,
    hash,
    goodname: order.goodname,
    price,
    recvphone,
    feedbackurl: `${workerOrigin}/api/payapp/feedback`,
    returnurl,
    var1: orderId,
    var2: product.id,
    openpaytype: env.PAYTYPE || 'card,kakaopay,naverpay',
    memo: buyerName ? `${buyerName} / ${order.goodname}` : order.goodname,
    smsuse: 'n',
    checkretry: 'y',
  });

  if (response.state !== '1' || !response.payurl) {
    return json(
      {
        state: '0',
        errorMessage: response.errorMessage || '결제 요청이 거절되었습니다. 잠시 후 다시 시도해 주세요.',
        errorCode: response.errorCode ?? '',
      },
      502,
      request,
      env,
    );
  }

  order.mulNo = response.mul_no ?? '';
  await writeOrder(env, order);

  return json({ state: '1', orderId, mulNo: order.mulNo, payurl: response.payurl, price }, 200, request, env);
}

/* ------------------------------------------------------------------ */
/* 2) 페이앱 웹훅(결제 통보)                                            */
/* ------------------------------------------------------------------ */

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  if (!env.PAYAPP_USERID || !env.PAYAPP_REQUESTKEY) {
    return text('FAIL: NOT_CONFIGURED', 503, request, env);
  }
  if (!env.UNLOCK_TOKEN_SECRET) {
    return text('FAIL: NO_SECRET', 503, request, env);
  }

  const raw = await request.text();
  const params = new URLSearchParams(raw);

  // (1) 연동 VALUE — 우리 가맹점으로 온 통보인지
  if (env.PAYAPP_LINKVAL && params.get('linkval') !== env.PAYAPP_LINKVAL) {
    return text('FAIL: LINKVAL', 400, request, env);
  }

  // (2) 해시 — 위조 통보 차단 (sha256(userid + responsedate + requestkey))
  const responsedate = params.get('responsedate') ?? '';
  const receivedHash = params.get('hash') ?? '';
  if (!responsedate || !receivedHash) {
    return text('FAIL: NO_HASH', 400, request, env);
  }
  const expectedHash = await sha256Hex(`${env.PAYAPP_USERID}${responsedate}${env.PAYAPP_REQUESTKEY}`);
  if (expectedHash !== receivedHash.toLowerCase()) {
    return text('FAIL: HASH', 400, request, env);
  }

  const orderId = params.get('var1') ?? '';
  const mulNo = params.get('mul_no') ?? '';
  const payState = params.get('pay_state') ?? '';
  const price = Number(params.get('price') ?? '0');

  const order = orderId ? await readOrder(env, orderId) : null;
  if (!order) {
    // 우리가 만든 주문이 아니면 통보를 보관만 하고(수동 확인용) 재시도는 멈춥니다.
    await storePut(
      env,
      `orphan:${Date.now()}`,
      JSON.stringify({ mulNo, orderId, price, payState, receivedAt: new Date().toISOString(), raw: raw.slice(0, 1000) }),
      ORDER_TTL,
    );
    return text('SUCCESS', 200, request, env);
  }

  // (3) 결제 요청 번호·금액 — 요청한 그 건인지
  if (order.mulNo && mulNo && order.mulNo !== mulNo) {
    return text('FAIL: MUL_NO', 400, request, env);
  }
  if (price !== order.price) {
    await storePut(
      env,
      `mismatch:${order.orderId}`,
      JSON.stringify({ mulNo, price, expected: order.price, payState, receivedAt: new Date().toISOString() }),
      ORDER_TTL,
    );
    return text('FAIL: PRICE', 400, request, env);
  }

  // (4) 결제 상태
  if (payState === '4') {
    // 결제 완료 — 이미 처리한 통보면 저장된 토큰을 그대로 씁니다(중복 통보 대비).
    if (order.status === 'paid' && order.token && (await verifyToken(order.token, env.UNLOCK_TOKEN_SECRET))) {
      return text('SUCCESS', 200, request, env);
    }
    const paidAt = params.get('pay_date') || new Date().toISOString();
    const token = await signToken(tokenPayload({ ...order, mulNo: mulNo || order.mulNo }, paidAt), env.UNLOCK_TOKEN_SECRET);
    await writeOrder(env, {
      ...order,
      status: 'paid',
      mulNo: mulNo || order.mulNo,
      payState,
      payType: params.get('pay_type') ?? '',
      paidAt,
      token,
    });
    await storePut(env, `unlock:${order.orderId}`, JSON.stringify({ productId: order.productId, paidAt }), ORDER_TTL);
    return text('SUCCESS', 200, request, env);
  }

  if (['8', '32', '9', '64', '70', '71'].includes(payState)) {
    // 요청취소·승인취소·부분취소 — 해금 토큰을 회수합니다.
    await writeOrder(env, {
      ...order,
      status: 'canceled',
      payState,
      canceledAt: params.get('canceldate') || new Date().toISOString(),
      token: undefined,
    });
    await storeDelete(env, `unlock:${order.orderId}`);
    return text('SUCCESS', 200, request, env);
  }

  // 상태 1(요청)·10(가상계좌 대기) 등은 아직 열지 않습니다.
  await writeOrder(env, { ...order, payState, mulNo: mulNo || order.mulNo });
  return text('SUCCESS', 200, request, env);
}

/* ------------------------------------------------------------------ */
/* 3) 주문 상태 조회                                                    */
/* ------------------------------------------------------------------ */

async function handleStatus(request: Request, env: Env): Promise<Response> {
  const orderId = new URL(request.url).searchParams.get('orderId') ?? '';
  if (!orderId) return json({ status: 'unknown' }, 400, request, env);

  const order = await readOrder(env, orderId);
  if (!order) return json({ status: 'unknown' }, 404, request, env);

  if (order.status !== 'paid') {
    return json({ status: order.status, productId: order.productId }, 200, request, env);
  }

  // 토큰이 만료됐거나 유실됐으면 결제 기록을 근거로 다시 발급합니다.
  let token = order.token;
  const payload = token && env.UNLOCK_TOKEN_SECRET ? await verifyToken(token, env.UNLOCK_TOKEN_SECRET) : null;
  if (!payload && env.UNLOCK_TOKEN_SECRET) {
    token = await signToken(tokenPayload(order, order.paidAt ?? new Date().toISOString()), env.UNLOCK_TOKEN_SECRET);
    await writeOrder(env, { ...order, token });
  }

  return json(
    { status: 'paid', productId: order.productId, relationId: order.relationId, token, paidAt: order.paidAt },
    200,
    request,
    env,
  );
}

/* ------------------------------------------------------------------ */
/* 4) 해금 토큰 검증                                                    */
/* ------------------------------------------------------------------ */

async function handleVerify(request: Request, env: Env): Promise<Response> {
  if (!env.UNLOCK_TOKEN_SECRET) {
    return json({ valid: false, reason: 'NOT_CONFIGURED' }, 503, request, env);
  }
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const productId = url.searchParams.get('productId') ?? '';

  const payload = await verifyToken(token, env.UNLOCK_TOKEN_SECRET);
  if (!payload) return json({ valid: false, reason: 'INVALID_TOKEN' }, 401, request, env);
  if (productId && payload.p !== productId) return json({ valid: false, reason: 'PRODUCT_MISMATCH' }, 403, request, env);

  const unlock = await storeGet(env, `unlock:${payload.o}`);
  if (!unlock) return json({ valid: false, reason: 'REVOKED' }, 403, request, env);

  return json(
    { valid: true, productId: payload.p, relationId: payload.r ?? '', orderId: payload.o, paidAt: JSON.parse(unlock).paidAt },
    200,
    request,
    env,
  );
}

/* ------------------------------------------------------------------ */
/* 라우팅                                                              */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (path === '/api/health' && request.method === 'GET') {
        return json(
          {
            ok: true,
            configured: Boolean(env.PAYAPP_USERID && env.PAYAPP_REQUESTKEY),
            kv: Boolean(env.PAYAPP_KV),
            time: new Date().toISOString(),
          },
          200,
          request,
          env,
        );
      }
      if (path === '/api/payapp/request' && request.method === 'POST') return await handleRequest(request, env);
      if (path === '/api/payapp/feedback' && request.method === 'POST') return await handleFeedback(request, env);
      if (path === '/api/payapp/status' && request.method === 'GET') return await handleStatus(request, env);
      if (path === '/api/payapp/verify' && request.method === 'GET') return await handleVerify(request, env);

      return json({ error: 'NOT_FOUND' }, 404, request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return json({ state: '0', errorMessage: `결제 서버 오류: ${message}` }, 500, request, env);
    }
  },
};
