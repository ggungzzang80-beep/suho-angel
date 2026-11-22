/**
 * 페이앱(PayApp) REST API 호출 (payapp.ts)
 * ------------------------------------------------------------------
 * 문서: https://docs.payapp.kr (REST · POST · application/x-www-form-urlencoded)
 *  - 결제 요청  cmd=payrequest
 *  - 인증       requestdate(14자리) + hash = sha256(userid + requestdate + requestkey)
 *  - 응답       state=1&mul_no=..&payurl=..  (URL-encoded)
 */

export const PAYAPP_ENDPOINT = 'https://api.payapp.kr/oapi/v2';

/** 한국 시간(KST) 기준 yyyymmddhhiiss — Worker 런타임은 UTC 로 돌기 때문에 +9시간 보정합니다. */
export function kstTimestamp(date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}` +
    `${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}${pad(kst.getUTCSeconds())}`
  );
}

export type PayRequestForm = {
  userid: string;
  requestdate: string;
  hash: string;
  goodname: string;
  price: number;
  recvphone: string;
  feedbackurl: string;
  returnurl: string;
  var1: string;
  var2: string;
  openpaytype?: string;
  memo?: string;
  smsuse?: string;
  checkretry?: string;
};

export type PayAppResponse = Record<string, string>;

/** URL-encoded 응답을 객체로 */
export function parseResponse(body: string): PayAppResponse {
  const params = new URLSearchParams(body);
  const out: PayAppResponse = {};
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

export async function postPayApp(
  endpoint: string,
  form: PayRequestForm | Record<string, string | number>,
): Promise<PayAppResponse> {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined || value === null) continue;
    body.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'text/plain',
      },
      body: body.toString(),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return { state: '0', errorMessage: `결제사 응답 오류 (${res.status})`, raw: text.slice(0, 300) };
    }
    return parseResponse(text);
  } finally {
    clearTimeout(timer);
  }
}
