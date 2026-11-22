import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * 배포 경로
 *   Cloudflare Pages : https://<project>.pages.dev/  → base '/'  (기본값)
 *   로컬 프리뷰       : http://127.0.0.1:4183/
 *   GitHub Pages     : VITE_BASE_PATH=/suho-angel/ npm run build
 *
 * 이번 단계는 로컬 구축·검증까지만 진행합니다(GitHub 푸시·외부 배포 없음).
 */
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5183, strictPort: true },
  preview: { host: '127.0.0.1', port: 4183, strictPort: true },
});
