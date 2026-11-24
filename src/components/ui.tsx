import { useEffect, useRef, type ReactNode } from 'react';
import type { Guardian } from '../lib/guardians';
import type { Tier } from '../lib/relations';
import { BASE_PATH } from '../config/env';

/* ------------------------------ 아이콘 ------------------------------ */

export function Star({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.6l2.4 6.6 6.9.4-5.4 4.3 1.9 6.7L12 16.9 6.2 20.6l1.9-6.7L2.7 9.6l6.9-.4L12 2.6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="none">
      <path d="M4 10h11M11 5.5L15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="none">
      <rect x="4.4" y="8.6" width="11.2" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.2 8.4V6.6a2.8 2.8 0 015.6 0v1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Close({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ 섹션 ------------------------------ */

export function SectionHead({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-title mt-1.5">{title}</h2>
        {lead && <p className="section-lead max-w-[560px]">{lead}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------ 점수 막대 ------------------------------ */

export function ScoreBar({
  label,
  value,
  color = '#C8A15E',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13.5px] text-ink-600">{label}</span>
        <span className="num text-[14px] font-medium text-ink-800">{value}</span>
      </div>
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-cream-200">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(6, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ------------------------------ 등급 배지 ------------------------------ */

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'px-2 py-[3px] text-[12px]' : 'px-2.5 py-1 text-[13px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cls}`}
      style={{ backgroundColor: tier.soft, color: tier.color, boxShadow: `inset 0 0 0 1px ${tier.color}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
      {tier.name}
    </span>
  );
}

/* ------------------------------ 수호 고양이 ------------------------------ */

export function GuardianAvatar({
  guardian,
  size = 56,
  ring,
  className = '',
}: {
  guardian: Guardian;
  size?: number;
  ring?: string;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex overflow-hidden rounded-full bg-cream-100 ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 3.5px ${ring}` : '0 0 0 2px #fff',
      }}
    >
      <img
        src={`${BASE_PATH}${guardian.file.replace(/^\//, '')}`}
        alt={`수호 고양이 ${guardian.name}`}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </span>
  );
}

/* ------------------------------ 모달 ------------------------------ */

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <button aria-label="닫기" className="absolute inset-0 bg-night-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] bg-cream-50 p-5 shadow-lift outline-none animate-sheetUp sm:rounded-[24px] ${
          wide ? 'sm:max-w-[720px]' : 'sm:max-w-[480px]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-display text-[20px] leading-tight">{title}</h3>
        {sub && <p className="mt-1 text-[14px] text-ink-500">{sub}</p>}
      </div>
      <button onClick={onClose} aria-label="닫기" className="rounded-full p-1.5 text-ink-400 hover:bg-cream-200 hover:text-ink-700">
        <Close className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------ 잠금 카드 ------------------------------ */

export function LockedCard({
  title,
  preview,
  price,
  onUnlock,
  note,
}: {
  title: string;
  preview: string;
  price: string;
  onUnlock: () => void;
  note?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-cream-200 bg-white p-4">
      <p className="text-[14.5px] font-medium text-ink-800">{title}</p>
      <p className="mt-2 select-none text-[14px] leading-[1.7] text-ink-500 blur-[3px]">{preview}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-[13px] text-gold-600">
          <LockIcon className="h-3.5 w-3.5" /> {price}
        </span>
        <button onClick={onUnlock} className="btn-ghost !px-3 !py-1.5 !text-[13.5px]">
          잠금 해제
        </button>
      </div>
      {note && <p className="mt-2 text-[12px] leading-[1.5] text-ink-400">{note}</p>}
    </div>
  );
}

/* ------------------------------ 토스트 ------------------------------ */

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(id);
  }, [message, onDone]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto rounded-full bg-night-800 px-4 py-2.5 text-[14px] text-cream-50 shadow-lift animate-rise">
        {message}
      </div>
    </div>
  );
}

/* ------------------------------ 접이식 ------------------------------ */

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-t border-cream-200 py-3 first:border-t-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] text-ink-600">
        <span>{summary}</span>
        <span className="text-ink-400 transition group-open:rotate-45">＋</span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
