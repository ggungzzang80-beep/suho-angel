/**
 * 한국어 조사 도우미 (korean.ts)
 * ------------------------------------------------------------------
 * 이름 뒤에 '이/가', '은/는', '을/를'을 받침에 맞춰 붙입니다.
 * 화면 문장과 토스트에서 "수민이(가)" 같은 어색한 표기를 없앱니다.
 */

function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return true; // 한글이 아니면 받침 있는 것으로 취급
  return (code - 0xac00) % 28 !== 0;
}

type Pair = '이가' | '은는' | '을를' | '과와' | '으로로';

const PAIRS: Record<Pair, [string, string]> = {
  이가: ['이', '가'],
  은는: ['은', '는'],
  을를: ['을', '를'],
  과와: ['과', '와'],
  으로로: ['으로', '로'],
};

export function withJosa(word: string, pair: Pair): string {
  const [withB, withoutB] = PAIRS[pair];
  return `${word}${hasBatchim(word) ? withB : withoutB}`;
}

/** 조사만 돌려줍니다 (이름을 이미 따로 감쌀 때) */
export function josaOf(word: string, pair: Pair): string {
  const [withB, withoutB] = PAIRS[pair];
  return hasBatchim(word) ? withB : withoutB;
}
