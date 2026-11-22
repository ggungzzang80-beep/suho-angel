import { useState } from 'react';
import { isPaymentLive, normalizePhone, requestPayAppPayment, savePendingOrder } from '../lib/payments';
import { PRODUCTS, type ProductId } from '../lib/products';
import { Modal, SheetHeader } from './ui';

export default function CheckoutModal({
  open,
  productId,
  relationId,
  relationName,
  onClose,
  onComplete,
}: {
  open: boolean;
  productId: ProductId;
  relationId?: string;
  relationName?: string;
  onClose: () => void;
  onComplete: (productId: ProductId, relationId?: string) => void;
}) {
  const product = PRODUCTS[productId];
  const live = isPaymentLive();
  const [agree, setAgree] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!agree) {
      setError('결제 전 안내(열람 후 청약철회 제한)에 동의해 주세요.');
      return;
    }
    if (!live) {
      onComplete(productId, relationId);
      onClose();
      return;
    }
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError('휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await requestPayAppPayment({ productId, relationId, recvphone: normalized });
      savePendingOrder({ orderId: result.orderId, productId, price: product.price, relationId, createdAt: Date.now() });
      window.location.href = result.payurl;
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제를 시작하지 못했습니다.');
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="checkout-title">
      <SheetHeader title={product.name} sub={relationName ? `${relationName}님과의 리포트` : product.tagline} onClose={onClose} />

      <div className="rounded-2xl border border-cream-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13.5px] text-ink-500">결제 금액</p>
          <p className="num font-display text-[22px] text-ink-900">{product.priceText}</p>
        </div>
        <ul className="mt-3 space-y-1.5">
          {product.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-[13px] leading-[1.65] text-ink-600">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gold-500" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {live ? (
        <div className="mt-3">
          <label className="field-label" htmlFor="pay-phone">
            휴대폰 번호 (결제 안내 수신)
          </label>
          <input
            id="pay-phone"
            className="field"
            inputMode="tel"
            placeholder="01012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-cream-100 px-3 py-2.5 text-[12.5px] leading-[1.7] text-ink-600">
          지금은 <span className="font-medium">결제 연동 전 미리보기 빌드</span>입니다. 실제 결제는 나가지 않으며, 아래 버튼으로
          열린 화면을 확인할 수 있습니다.
        </div>
      )}

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.65] text-ink-600">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold-500" />
        <span>
          결제 즉시 콘텐츠가 열람되며, 열람을 시작하면 청약철회가 제한된다는 안내를 확인했습니다. (필수)
        </span>
      </label>

      {error && <p className="mt-2 rounded-lg bg-blush-100 px-3 py-2 text-[13px] text-blush-500">{error}</p>}

      <button onClick={pay} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? '결제창을 여는 중…' : live ? `${product.priceText} 결제하기` : '미리보기로 열어보기'}
      </button>
      <p className="mt-2 text-center text-[12px] leading-[1.6] text-ink-400">
        결제대행 페이앱(PayApp) · 결제 전 이용약관·환불 정책을 확인해 주세요
      </p>
    </Modal>
  );
}
