/**
 * 빌드 환경 설정 (env.ts)
 * ------------------------------------------------------------------
 * 같은 코드를 Cloudflare Pages(/)·GitHub Pages(/suho-angel/)·로컬 프리뷰에서
 * 함께 쓰기 위한 스위치입니다.
 */

const env = import.meta.env as Record<string, string | undefined>;

function raw(key: string): string {
  const v = env[key];
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * 결제 확인·잠금 해제를 처리하는 Cloudflare Worker 주소.
 * 비어 있으면 미리보기 모드(결제 연동 전)로 동작합니다.
 *   예) VITE_PAYAPP_WORKER_URL=https://suho-angel-payapp.<계정>.workers.dev
 */
export const PAYAPP_WORKER_URL = raw('VITE_PAYAPP_WORKER_URL').replace(/\/+$/, '');

/** 실제 결제창으로 넘어가는 빌드인지 */
export const PAYMENTS_LIVE = PAYAPP_WORKER_URL.length > 0;

/** 배포 경로 */
export const BASE_PATH = env.BASE_URL ?? '/';

export const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
