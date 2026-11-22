import { useState } from 'react';
import { BUSINESS, LEGAL_DOCS, LEGAL_LINK_LABEL, LEGAL_ORDER, businessRows, type LegalDocId } from '../config/legal';
import { Modal, SheetHeader } from './ui';

export function LegalFooter({ onOpen }: { onOpen: (id: LegalDocId) => void }) {
  const rows = businessRows();
  return (
    <footer className="mt-16 border-t border-cream-200 bg-cream-100/60">
      <div className="wrap py-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {LEGAL_ORDER.map((id) => (
            <button key={id} onClick={() => onOpen(id)} className="text-[13px] text-ink-600 underline-offset-4 hover:underline">
              {LEGAL_LINK_LABEL[id]}
            </button>
          ))}
          <span className="text-[13px] text-ink-500">고객센터 {BUSINESS.email}</span>
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-1 text-[12px] leading-[1.7] text-ink-500 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-1.5">
              <dt className="shrink-0 text-ink-400">{row.label}</dt>
              <dd className={row.pending ? 'text-blush-500' : ''}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[12px] leading-[1.7] text-ink-400">
          나의 수호천사는 서양 점성술(Whole Sign 하우스)의 상징 체계를 참고해 만든 콘텐츠입니다. 의학적·법률적·투자적 판단의
          근거가 아니며, 결과는 사람과의 관계를 돌아보는 참고로만 써 주세요.
        </p>
        <p className="mt-2 text-[12px] text-ink-400">© {BUSINESS.company}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function LegalModal({ open, id, onClose, onChange }: { open: boolean; id: LegalDocId; onClose: () => void; onChange: (id: LegalDocId) => void }) {
  const doc = LEGAL_DOCS[id];
  return (
    <Modal open={open} onClose={onClose} wide labelledBy="legal-title">
      <SheetHeader title={doc.title} sub={`시행일 ${doc.updated} · ${doc.summary}`} onClose={onClose} />
      <div className="mb-4 flex gap-1.5">
        {LEGAL_ORDER.map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            aria-pressed={d === id}
            className={`rounded-full px-3 py-1.5 text-[13px] transition ${
              d === id ? 'bg-night-800 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
            }`}
          >
            {LEGAL_LINK_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="space-y-5">
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h4 className="text-[14px] font-medium text-ink-900">{section.title}</h4>
            {section.blocks.map((block, i) =>
              block.kind === 'p' ? (
                <p key={i} className="mt-1.5 text-[13px] leading-[1.85] text-ink-600">
                  {block.text}
                </p>
              ) : (
                <ul key={i} className="mt-1.5 space-y-1">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-[13px] leading-[1.8] text-ink-600">
                      <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}
      </div>
    </Modal>
  );
}

export function useLegalModal() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<LegalDocId>('terms');
  return {
    open,
    id,
    openWith: (docId: LegalDocId) => {
      setId(docId);
      setOpen(true);
    },
    openAll: () => {
      setOpen(true);
    },
    close: () => setOpen(false),
    change: setId,
  };
}
