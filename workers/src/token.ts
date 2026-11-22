/**
 * 해금 토큰 (token.ts)
 * ------------------------------------------------------------------
 * 결제가 확인된 주문에만 발급하는 서명 토큰입니다.
 *   v1.<base64url(payload)>.<hex(HMAC-SHA256)>
 * 서버(Worker)가 가진 UNLOCK_TOKEN_SECRET 없이는 만들 수 없으므로,
 * 브라우저에서 토큰을 위조해 리포트를 여는 경로를 막습니다.
 */

export type UnlockPayload = {
  v: 1;
  /** 상품 ID */
  p: string;
  /** 어떤 사람의 관계 리포트인지 (관계 심층일 때만 값이 있습니다) */
  r?: string;
  /** 주문 번호 (var1) */
  o: string;
  /** 페이앱 결제 요청 번호 */
  m: string;
  /** 발급 시각 (epoch seconds) */
  iat: number;
  /** 만료 시각 (epoch seconds) */
  exp: number;
};

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return toHex(digest);
}

export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return toHex(signature);
}

function base64url(text: string): string {
  let binary = '';
  for (const byte of encoder.encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** 길이·내용을 끝까지 비교합니다(조기 반환으로 서명을 추측하지 못하게). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(payload: UnlockPayload, secret: string): Promise<string> {
  const body = base64url(JSON.stringify(payload));
  const signature = await hmacHex(secret, `v1.${body}`);
  return `v1.${body}.${signature}`;
}

export async function verifyToken(token: string, secret: string): Promise<UnlockPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const [, body, signature] = parts;
  const expected = await hmacHex(secret, `v1.${body}`);
  if (!safeEqual(expected, signature)) return null;
  const json = fromBase64url(body);
  if (!json) return null;
  try {
    const payload = JSON.parse(json) as UnlockPayload;
    if (payload.v !== 1 || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
