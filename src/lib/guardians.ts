/**
 * 수호 고양이 12종 + 곁들임 2종 (guardians.ts)
 * ------------------------------------------------------------------
 * public/guardians/*.webp 의 고양이 수호 일러스트 14장을 이 프로젝트의
 * '수호 가디언' 캐릭터로 다시 이름 붙여 씁니다.
 *
 * - 화면에 보이는 수호 고양이는 **열두 별자리에 한 마리씩, 12종**입니다.
 *   (이전에는 14종을 나란히 두고 '태양 별자리마다 한 마리'라고 적어 12자리와 숫자가 맞지 않았습니다.)
 * - 남는 두 마리(곳간냥·든든냥)는 자리가 없는 곁들임 캐릭터로, 관계 등급 연출용으로만 둡니다. → 화면 목록에는 넣지 않습니다.
 * - 자미두수 별 이름(태양성·자미성 …)은 이 앱의 서양 점성술 화면과 섞이므로 데이터에서 뺐습니다.
 */

export type Guardian = {
  id: string;
  /** 파일명 (public/guardians/{id}.webp) */
  file: string;
  name: string;
  /** 배정된 별자리 (0=양자리). 곁들임 캐릭터는 null */
  signIndex: number | null;
  trait: string;
  /** 이 고양이가 곁에 있을 때의 한 줄 */
  line: string;
};

export const GUARDIANS: Guardian[] = [
  {
    id: 'chilsal',
    file: '/guardians/chilsal.webp',
    name: '칼냥',
    signIndex: 0, // 양자리
    trait: '벼린 칼날',
    line: '결정적인 순간에 등을 밀어 주는 쪽',
  },
  {
    id: 'mugok',
    file: '/guardians/mugok.webp',
    name: '돈냥',
    signIndex: 1, // 황소자리
    trait: '단단한 금고',
    line: '현실적인 계산을 대신해 주는 쪽',
  },
  {
    id: 'geomun',
    file: '/guardians/geomun.webp',
    name: '글냥',
    signIndex: 2, // 쌍둥이자리
    trait: '먹빛 서재',
    line: '내 이야기를 끝까지 들어 주는 쪽',
  },
  {
    id: 'taeeum',
    file: '/guardians/taeeum.webp',
    name: '달냥',
    signIndex: 3, // 게자리
    trait: '조용한 달빛',
    line: '말하지 않아도 기분을 먼저 알아채는 쪽',
  },
  {
    id: 'taeyang',
    file: '/guardians/taeyang.webp',
    name: '해냥',
    signIndex: 4, // 사자자리
    trait: '한낮의 햇살',
    line: '어두운 얘기를 하다가도 창문을 열어 주는 쪽',
  },
  {
    id: 'cheonsang',
    file: '/guardians/cheonsang.webp',
    name: '이슬냥',
    signIndex: 5, // 처녀자리
    trait: '새벽의 이슬',
    line: '세심하게 다듬어 완성으로 밀어 주는 쪽',
  },
  {
    id: 'tamnang',
    file: '/guardians/tamnang.webp',
    name: '꽃냥',
    signIndex: 6, // 천칭자리
    trait: '활짝 핀 꽃',
    line: '분위기를 부드럽게 풀어 주는 쪽',
  },
  {
    id: 'yeomjeong',
    file: '/guardians/yeomjeong.webp',
    name: '불꽃냥',
    signIndex: 7, // 전갈자리
    trait: '꺼지지 않는 불꽃',
    line: '끝까지 파고들 힘을 주는 쪽',
  },
  {
    id: 'pagun',
    file: '/guardians/pagun.webp',
    name: '바람냥',
    signIndex: 8, // 사수자리
    trait: '거센 바람',
    line: '한 번쯤 과감하게 질러 보게 만드는 쪽',
  },
  {
    id: 'jami',
    file: '/guardians/jami.webp',
    name: '별냥',
    signIndex: 9, // 염소자리
    trait: '한밤의 북극성',
    line: '흔들릴 때 기준을 다시 세워 주는 쪽',
  },
  {
    id: 'cheongi',
    file: '/guardians/cheongi.webp',
    name: '꾀냥',
    signIndex: 10, // 물병자리
    trait: '재빠른 지혜',
    line: '막힌 길을 옆으로 돌아가게 해 주는 쪽',
  },
  {
    id: 'cheondong',
    file: '/guardians/cheondong.webp',
    name: '새싹냥',
    signIndex: 11, // 물고기자리
    trait: '봄의 새순',
    line: '지친 날에 작은 재미를 다시 심어 주는 쪽',
  },
  /* 자리가 없는 곁들임 캐릭터 — 관계 등급 연출용, 수호 고양이 목록에는 넣지 않습니다 */
  {
    id: 'cheonbu',
    file: '/guardians/cheonbu.webp',
    name: '곳간냥',
    signIndex: null,
    trait: '든든한 곳간',
    line: '필요한 걸 미리 챙겨 두는 쪽',
  },
  {
    id: 'cheonryang',
    file: '/guardians/cheonryang.webp',
    name: '든든냥',
    signIndex: null,
    trait: '오래된 나무',
    line: '서두르지 않아도 결국 해내게 해 주는 쪽',
  },
];

export const GUARDIAN_BY_ID: Record<string, Guardian> = Object.fromEntries(
  GUARDIANS.map((g) => [g.id, g]),
);

/** 별자리 순서대로 놓인 수호 고양이 12종 (화면 목록에는 이것만 씁니다) */
export const SIGN_GUARDIANS: Guardian[] = Array.from({ length: 12 }, (_, i) => {
  const found = GUARDIANS.find((g) => g.signIndex === i);
  if (!found) throw new Error(`수호 고양이 누락: ${i}번 자리`);
  return found;
});

/** 12자리 → 수호 고양이 id */
export const SIGN_GUARDIAN: string[] = SIGN_GUARDIANS.map((g) => g.id);

export function guardianOfSign(signIndex: number): Guardian {
  return SIGN_GUARDIANS[((signIndex % 12) + 12) % 12];
}
