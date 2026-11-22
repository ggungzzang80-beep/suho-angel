import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeChart, type Chart } from './lib/astro';
import { findCity } from './lib/cities';
import { guardianOfSign } from './lib/guardians';
import { buildInsights } from './lib/natal';
import { withJosa } from './lib/korean';
import type { ProductId } from './lib/products';
import { balanceOf, layoutMap, normalizeGender, relationOf, type Relation } from './lib/relations';
import CheckoutModal from './components/CheckoutModal';
import IntakeForm, { type IntakeSubmit } from './components/IntakeForm';
import Landing from './components/Landing';
import { LegalFooter, LegalModal, useLegalModal } from './components/Legal';
import PersonSheet from './components/PersonSheet';
import ResultView from './components/ResultView';
import { Modal, SectionHead, SheetHeader, Toast } from './components/ui';

const STORE_KEY = 'suho-angel.v1';

type Person = { id: string; name: string; relation: string; input: IntakeSubmit };

type Saved = { me: IntakeSubmit | null; people: Person[]; unlocked: string[] };

type Invite = { n: string; d: string; t: string; k: boolean; c: string; g?: string };

/* ------------------------------ 저장 ------------------------------ */

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { me: null, people: [], unlocked: [] };
    const parsed = JSON.parse(raw) as Saved;
    // 도시 객체는 id 로 저장하고, 불러올 때 다시 찾습니다.
    const restore = (v: IntakeSubmit | null): IntakeSubmit | null => {
      if (!v?.city) return null;
      const city = findCity(v.city.name) ?? v.city;
      /* 성별은 v5에서 추가됐습니다 — 구버전 데이터에 없으면 undefined(공통 가중치) */
      return { ...v, city, gender: normalizeGender(v.gender) };
    };
    return {
      me: restore(parsed.me ?? null),
      people: (parsed.people ?? []).map((p) => ({ ...p, input: restore(p.input)! })).filter((p) => p.input),
      unlocked: parsed.unlocked ?? [],
    };
  } catch {
    return { me: null, people: [], unlocked: [] };
  }
}

function persist(saved: Saved) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch {
    /* 저장이 막힌 브라우저는 무시 */
  }
}

/* ------------------------------ 초대 링크 ------------------------------ */

function encodeInvite(inv: Invite): string {
  const json = JSON.stringify(inv);
  const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeInvite(value: string): Invite | null {
  try {
    const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const parsed = JSON.parse(json) as Invite;
    if (!parsed?.d || parsed.d.length !== 8) return null;
    return parsed;
  } catch {
    return null;
  }
}

function toInput(v: IntakeSubmit): IntakeSubmit {
  return { ...v, city: v.city };
}

function chartOf(v: IntakeSubmit): Chart {
  return computeChart({
    nickname: v.nickname,
    year: v.year,
    month: v.month,
    day: v.day,
    timeKnown: v.timeKnown,
    hour: v.hour,
    minute: v.minute,
    city: v.city,
  });
}

/* ------------------------------ 앱 ------------------------------ */

export default function App() {
  const [saved, setSaved] = useState<Saved>(() => loadSaved());
  const [invite, setInvite] = useState<Invite | null>(null);
  const [joined, setJoined] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ productId: ProductId; relationId?: string; relationName?: string } | null>(null);
  const legal = useLegalModal();

  /* 초대 링크 확인 */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('invite');
    if (!raw) return;
    const decoded = decodeInvite(raw);
    if (decoded) setInvite(decoded);
  }, []);

  useEffect(() => {
    persist(saved);
  }, [saved]);

  const meChart = useMemo(() => (saved.me ? chartOf(saved.me) : null), [saved.me]);

  const people = useMemo(() => {
    if (!meChart) return [];
    return saved.people.map((p) => {
      const chart = chartOf(p.input);
      /* v5 — 두 사람 성별이 모두 있을 때만 남녀·동성 궁합 가중치로 갈립니다 */
      return relationOf(meChart, chart, p.name, { me: saved.me?.gender, other: p.input.gender });
    });
  }, [saved.people, meChart]);

  const layout = useMemo(() => layoutMap(people), [people]);
  const balance = useMemo(() => balanceOf(layout), [layout]);
  const insights = useMemo(() => (meChart ? buildInsights(meChart) : null), [meChart]);
  const unlocked = useMemo(() => new Set(saved.unlocked), [saved.unlocked]);

  const notify = useCallback((message: string) => setToast(message), []);

  const handleMe = (v: IntakeSubmit) => {
    setSaved({ me: toInput(v), people: [], unlocked: [] });
    window.scrollTo({ top: 0 });
  };

  const handleJoin = (v: IntakeSubmit) => {
    const host: Person | null = invite
      ? {
          id: `invite-${invite.d}`,
          name: invite.n || '초대한 사람',
          relation: '초대한 사람',
          input: {
            nickname: invite.n || '초대한 사람',
            year: Number(invite.d.slice(0, 4)),
            month: Number(invite.d.slice(4, 6)),
            day: Number(invite.d.slice(6, 8)),
            hour: invite.k ? Number(invite.t.slice(0, 2)) : 12,
            minute: invite.k ? Number(invite.t.slice(2, 4)) : 0,
            timeKnown: invite.k,
            city: findCity(invite.c) ?? v.city,
            relation: '초대한 사람',
            gender: normalizeGender(invite.g),
          },
        }
      : null;
    setSaved({ me: toInput(v), people: host ? [host] : [], unlocked: [] });
    setJoined(true);
    window.scrollTo({ top: 0 });
    notify(host ? `${host.name}님의 지도에 자리를 올렸습니다.` : '지도에 자리를 올렸습니다.');
  };

  const addPerson = (v: IntakeSubmit) => {
    const person: Person = {
      id: `p-${Date.now().toString(36)}`,
      name: v.nickname || '친구',
      relation: v.relation,
      input: toInput(v),
    };
    setSaved((prev) => ({ ...prev, people: [...prev.people, person] }));
    setAddOpen(false);
    notify(`${withJosa(person.name, '이가')} 지도에 올라갔습니다.`);
    window.setTimeout(() => {
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const removePerson = (r: Relation) => {
    setSaved((prev) => ({ ...prev, people: prev.people.filter((p) => p.name !== r.name || p.input.day !== r.chart.day) }));
    setSelected(null);
    notify('지도에서 지웠습니다.');
  };

  const addDemoPeople = () => {
    if (joined || !saved.me) return;
    const samples: Array<[string, string, IntakeSubmit]> = [
      [
        '지우',
        '친구',
        { nickname: '지우', year: 1994, month: 7, day: 22, hour: 14, minute: 20, timeKnown: true, city: findCity('서울')!, relation: '친구' },
      ],
      [
        '현우',
        '동료',
        { nickname: '현우', year: 1987, month: 2, day: 3, hour: 12, minute: 0, timeKnown: false, city: findCity('부산')!, relation: '동료' },
      ],
      [
        '수민',
        '가족',
        { nickname: '수민', year: 1990, month: 11, day: 9, hour: 7, minute: 45, timeKnown: true, city: findCity('인천')!, relation: '가족' },
      ],
    ];
    setSaved((prev) => ({
      ...prev,
      people: [
        ...prev.people,
        ...samples.map(([name, relation, input], i) => ({
          id: `demo-${i}`,
          name,
          relation,
          input,
        })),
      ],
    }));
    notify('예시 친구 3명을 올렸습니다. 지우기로 지울 수 있어요.');
  };

  const shareLink = (name?: string): string => {
    if (!saved.me) return window.location.href;
    const target = name && saved.people.find((p) => p.name === name);
    const src = target ? target.input : saved.me;
    const inv: Invite = {
      n: src.nickname,
      d: `${src.year}${String(src.month).padStart(2, '0')}${String(src.day).padStart(2, '0')}`,
      t: `${String(src.hour).padStart(2, '0')}${String(src.minute).padStart(2, '0')}`,
      k: src.timeKnown,
      c: src.city.name,
      g: src.gender,
    };
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?invite=${encodeInvite(inv)}`;
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      notify('복사가 막힌 브라우저입니다. 주소창의 링크를 직접 복사해 주세요.');
    }
  };

  const copyRoom = () => {
    if (!insights) return;
    const lines = [`${saved.me?.nickname || '나'}의 방 · 2027년`, ''];
    const groups = new Map<string, string[]>();
    const push = (k: string, n: string) => groups.set(k, [...(groups.get(k) ?? []), n]);
    push(insights.houseOf2027.keyword, saved.me?.nickname || '나');
    layout.forEach((r) => push(r.keyword2027, r.name));
    groups.forEach((names, key) => lines.push(`· ${key} — ${names.join(', ')}`));
    lines.push('', shareLink());
    void copy(lines.join('\n'), '단톡방에 붙일 2027년 요약을 복사했습니다.');
  };

  const openCheckout = (productId: ProductId, relationId?: string, relationName?: string) => {
    setCheckout({ productId, relationId, relationName });
  };

  const completeCheckout = (productId: ProductId, relationId?: string) => {
    const insightIds = ['decade', 'career', 'money', 'monthly', 'people'];
    setSaved((prev) => {
      const next = new Set(prev.unlocked);
      next.add(productId);
      if (productId === 'self-deep' || productId === 'map-all') insightIds.forEach((id) => next.add(id));
      if (productId === 'map-all') layout.forEach((r) => next.add(r.id));
      if (relationId) next.add(relationId);
      return { ...prev, unlocked: [...next] };
    });
    notify('리포트가 열렸습니다.');
  };

  const reset = () => {
    setSaved({ me: null, people: [], unlocked: [] });
    setInvite(null);
    setJoined(false);
    window.scrollTo({ top: 0 });
  };

  const selectedRelation = layout.find((r) => r.id === selected) ?? null;

  /* ----- 렌더 ----- */

  const legalModal = <LegalModal open={legal.open} id={legal.id} onClose={legal.close} onChange={legal.change} />;

  if (!saved.me || !meChart || !insights) {
    if (invite && !saved.me) {
      return (
        <div className="min-h-screen">
          <div className="wrap py-8">
            <p className="eyebrow">초대</p>
            <h1 className="mt-2 font-display text-[26px] leading-snug">
              {invite.n || '친구'}님의 지도에
              <br />
              내 자리를 올리기
            </h1>
            <p className="mt-2 max-w-[480px] text-[14.5px] leading-[1.75] text-ink-600">
              이름과 생일만 넣으면 {invite.n || '친구'}님과 어떤 인연인지, 내 2027년 한 줄까지 함께 뜹니다.
            </p>
            <div className="mt-5">
              <IntakeForm mode="join" hostName={invite.n} submitLabel="지도에 이름 올리기" onSubmit={handleJoin} />
            </div>
            <p className="mt-4 text-[12.5px] leading-[1.7] text-ink-400">
              프로토타입 빌드입니다. 지금은 서버에 저장되지 않고 이 브라우저 안에서만 관계가 계산됩니다.
            </p>
          </div>
          <LegalFooter onOpen={legal.openWith} />
          {legalModal}
          {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
      );
    }

    return (
      <div>
        <Landing onSubmit={handleMe} onOpenLegal={legal.openAll} />
        <div className="wrap -mt-6 flex justify-center">
          <button onClick={addDemoPeople} className="hidden" aria-hidden="true" />
        </div>
        <LegalFooter onOpen={legal.openWith} />
        {legalModal}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div>
      {joined && (
        <div className="bg-lilac-100">
          <div className="wrap py-2 text-center text-[13px] text-lilac-500">
            초대받은 지도에 자리를 올렸습니다 · 프로토타입이라 이 브라우저에만 저장됩니다
          </div>
        </div>
      )}

      <ResultView
        meLabel={saved.me.nickname || '나'}
        chart={meChart}
        insights={insights}
        guardian={guardianOfSign(meChart.sun.signIndex)}
        relations={layout}
        balance={balance}
        unlocked={unlocked}
        onAddPerson={() => setAddOpen(true)}
        onSelectPerson={(r) => setSelected(r.id)}
        onRemovePerson={removePerson}
        onShare={() => void copy(shareLink(), '초대 링크를 복사했습니다. 친구에게 붙여 주세요.')}
        onUnlockInsight={(id) => openCheckout('self-deep')}
        onOpenProduct={(id) => openCheckout(id)}
        onReset={reset}
        onCopyRoom={copyRoom}
      />

      {!layout.length && (
        <div className="wrap -mt-4">
          <button onClick={addDemoPeople} className="btn-text !text-[13px] text-ink-500">
            예시 친구 3명을 넣어 지도를 먼저 둘러보기
          </button>
        </div>
      )}

      <div className="wrap mt-10">
        <SectionHead
          eyebrow="Note"
          title="이 지도를 읽는 법"
          lead="등급은 사람의 가치가 아니라, 지금 두 사람 사이에서 어떤 힘이 오가는지를 나타냅니다. 사람이 바뀌면 지도도 바뀝니다."
        />
        <div className="card p-5">
          <ul className="space-y-2 text-[13.5px] leading-[1.8] text-ink-600">
            <li>· 중심에 가까울수록 지금 내게 힘이 되는 사람입니다. 멀다고 나쁜 사이는 아닙니다.</li>
            <li>· 점수는 두 사람의 행성 교차 각으로만 계산합니다. 만난 기간이나 친밀도는 반영되지 않습니다.</li>
            <li>· 그렇게 나온 값을 같은 방식으로 계산한 표본과 견주어 0~99로 옮기고, 열세 단계로 나눕니다.</li>
            <li>· 생년월일시 원본은 지도에 표시되지 않고, 닉네임·별자리·등급만 보입니다.</li>
            <li>· 시간을 모르면 정오 기준으로 계산하므로, 달·어센던트 기반 등급은 달라질 수 있습니다.</li>
          </ul>
        </div>
      </div>

      <div className="wrap">
        <LegalFooter onOpen={legal.openWith} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} labelledBy="add-title">
        <SheetHeader
          title="사람 추가"
          sub="생일만 알면 됩니다. 시간을 모르면 체크해 주세요."
          onClose={() => setAddOpen(false)}
        />
        <IntakeForm mode="person" compact submitLabel="지도에 추가" onSubmit={addPerson} />
      </Modal>

      <Modal open={Boolean(selectedRelation)} onClose={() => setSelected(null)} labelledBy="person-title">
        {selectedRelation && (
          <PersonSheet
            relation={selectedRelation}
            unlocked={unlocked.has(selectedRelation.id) || unlocked.has('map-all')}
            onUnlock={() => openCheckout('relation-deep', selectedRelation.id, selectedRelation.name)}
            onRemove={() => removePerson(selectedRelation)}
            onClose={() => setSelected(null)}
          />
        )}
      </Modal>

      <CheckoutModal
        open={Boolean(checkout)}
        productId={checkout?.productId ?? 'self-deep'}
        relationId={checkout?.relationId}
        relationName={checkout?.relationName}
        onClose={() => setCheckout(null)}
        onComplete={completeCheckout}
      />

      {legalModal}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
