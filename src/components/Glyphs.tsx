import { GLYPH_PATHS } from './glyphPaths';
import { SIGNS } from '../lib/signs';

/**
 * 별자리·행성 기호를 글자가 아니라 SVG 로 그립니다.
 *
 * 배경: 기기·OS 기본 폰트에 상징 글꼴이 없으면 ♉·♏ 같은 기호가 □(네모)로 깨졌습니다.
 * 화면에 쓰는 기호는 모두 이 컴포넌트(또는 같은 path)로 그려서 어느 기기에서도 똑같이 보이게 했습니다.
 */

type GlyphProps = {
  /** 기호 문자 (예: '♉') */
  code: string;
  /** 글자 크기에 맞춰 그리고 싶을 때 부모 font-size 를 씁니다 */
  className?: string;
  /** 스크린리더에 읽힐 이름. 없으면 장식으로 처리합니다. */
  label?: string;
  style?: React.CSSProperties;
};

export function Glyph({ code, className = '', label, style }: GlyphProps) {
  const d = GLYPH_PATHS[code];
  if (!d) return <span className={className}>{code}</span>;
  return (
    <svg
      viewBox="0 0 100 100"
      className={`glyph ${className}`.trim()}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** 12자리 기호 (signIndex 0 = 양자리) */
export function SignGlyph({
  signIndex,
  className = '',
  label,
}: {
  signIndex: number;
  className?: string;
  label?: string;
}) {
  const sign = SIGNS[((signIndex % 12) + 12) % 12];
  return <Glyph code={sign.glyph} className={className} label={label ?? sign.name} />;
}

/**
 * SVG 안에서 기호를 그릴 때 — 100×100 상자를 (x, y) 중심으로 size 크기만큼 그립니다.
 * (천궁도 원반처럼 HTML 이 아닌 SVG 좌표계에서 씁니다)
 */
export function glyphTransform(x: number, y: number, size: number): string {
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(size / 100).toFixed(4)}) translate(-50 -50)`;
}
