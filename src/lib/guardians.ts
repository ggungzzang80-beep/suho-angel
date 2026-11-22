/**
 * 수호 고양이 14종 (guardians.ts)
 * ------------------------------------------------------------------
 * projects/ziwei-app/public/guardians/*.webp 의 고양이 수호 일러스트 14장을
 * 이 프로젝트의 '수호 가디언' 캐릭터로 다시 이름 붙여 씁니다.
 * 원본 별 이름(자미·태양·태음 …)과 성격을 그대로 살려, 태양 자리부터 물고기 자리까지
 * 12자리에 한 마리씩 배정하고 남는 두 마리(곳간냥·든든냥)는 관계 등급 연출에 씁니다.
 */

export type Guardian = {
  id: string;
  /** 파일명 (public/guardians/{id}.webp) */
  file: string;
  name: string;
  /** 원본 별 이름 */
  star: string;
  trait: string;
  /** 이 고양이가 곁에 있을 때의 한 줄 */
  line: string;
};

export const GUARDIANS: Guardian[] = [
  {
    id: 'taeyang',
    file: '/guardians/taeyang.webp',
    name: '해냥',
    star: '태양성',
    trait: '한낮의 햇살',
    line: '어두운 얘기를 하다가도 창문을 열어 주는 쪽',
  },
  {
    id: 'taeeum',
    file: '/guardians/taeeum.webp',
    name: '달냥',
    star: '태음성',
    trait: '조용한 달빛',
    line: '말하지 않아도 기분을 먼저 알아채는 쪽',
  },
  {
    id: 'jami',
    file: '/guardians/jami.webp',
    name: '별냥',
    star: '자미성',
    trait: '한밤의 북극성',
    line: '흔들릴 때 기준을 다시 세워 주는 쪽',
  },
  {
    id: 'cheongi',
    file: '/guardians/cheongi.webp',
    name: '꾀냥',
    star: '천기성',
    trait: '재빠른 지혜',
    line: '막힌 길을 옆으로 돌아가게 해 주는 쪽',
  },
  {
    id: 'cheondong',
    file: '/guardians/cheondong.webp',
    name: '새싹냥',
    star: '천동성',
    trait: '봄의 새순',
    line: '지친 날에 작은 재미를 다시 심어 주는 쪽',
  },
  {
    id: 'cheonbu',
    file: '/guardians/cheonbu.webp',
    name: '곳간냥',
    star: '천부성',
    trait: '든든한 곳간',
    line: '필요한 걸 미리 챙겨 두는 쪽',
  },
  {
    id: 'cheonryang',
    file: '/guardians/cheonryang.webp',
    name: '든든냥',
    star: '천량성',
    trait: '오래된 나무',
    line: '서두르지 않아도 결국 해내게 해 주는 쪽',
  },
  {
    id: 'cheonsang',
    file: '/guardians/cheonsang.webp',
    name: '이슬냥',
    star: '천상성',
    trait: '새벽의 이슬',
    line: '세심하게 다듬어 완성으로 밀어 주는 쪽',
  },
  {
    id: 'chilsal',
    file: '/guardians/chilsal.webp',
    name: '칼냥',
    star: '칠살성',
    trait: '벼린 칼날',
    line: '결정적인 순간에 등을 밀어 주는 쪽',
  },
  {
    id: 'geomun',
    file: '/guardians/geomun.webp',
    name: '글냥',
    star: '거문성',
    trait: '먹빛 서재',
    line: '내 이야기를 끝까지 들어 주는 쪽',
  },
  {
    id: 'mugok',
    file: '/guardians/mugok.webp',
    name: '돈냥',
    star: '무곡성',
    trait: '단단한 금고',
    line: '현실적인 계산을 대신해 주는 쪽',
  },
  {
    id: 'pagun',
    file: '/guardians/pagun.webp',
    name: '바람냥',
    star: '파군성',
    trait: '거센 바람',
    line: '한 번쯤 과감하게 질러 보게 만드는 쪽',
  },
  {
    id: 'tamnang',
    file: '/guardians/tamnang.webp',
    name: '꽃냥',
    star: '탐랑성',
    trait: '활짝 핀 꽃',
    line: '분위기를 부드럽게 풀어 주는 쪽',
  },
  {
    id: 'yeomjeong',
    file: '/guardians/yeomjeong.webp',
    name: '불꽃냥',
    star: '염정성',
    trait: '꺼지지 않는 불꽃',
    line: '끝까지 파고들 힘을 주는 쪽',
  },
];

export const GUARDIAN_BY_ID: Record<string, Guardian> = Object.fromEntries(
  GUARDIANS.map((g) => [g.id, g]),
);

/** 12자리 → 수호 고양이 */
export const SIGN_GUARDIAN: string[] = [
  'chilsal', // 양자리
  'mugok', // 황소자리
  'geomun', // 쌍둥이자리
  'taeeum', // 게자리
  'taeyang', // 사자자리
  'cheonsang', // 처녀자리
  'tamnang', // 천칭자리
  'yeomjeong', // 전갈자리
  'pagun', // 사수자리
  'jami', // 염소자리
  'cheongi', // 물병자리
  'cheondong', // 물고기자리
];

export function guardianOfSign(signIndex: number): Guardian {
  return GUARDIAN_BY_ID[SIGN_GUARDIAN[((signIndex % 12) + 12) % 12]];
}
