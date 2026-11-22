/**
 * 사업자 정보 · 정책 문서 (legal.ts)
 * ------------------------------------------------------------------
 * 전자상거래법이 요구하는 사업자 정보 표시와, 페이앱(PayApp) 심사에 필요한
 * 이용약관 · 개인정보처리방침 · 환불/청약철회 정책을 한 곳에서 관리합니다.
 * '별의 속삭임'(projects/ziwei-app)의 같은 모듈을 '나의 수호천사'에 맞게 옮겨 썼습니다.
 *
 * 값은 빌드 시 환경변수(VITE_BIZ_*)로 덮어쓸 수 있습니다.
 *   VITE_BIZ_COMPANY 상호 · VITE_BIZ_REG_NO 사업자등록번호 · VITE_BIZ_CEO 대표자
 *   VITE_BIZ_TELECOM_NO 통신판매업 신고번호 · VITE_BIZ_ADDRESS 주소
 *   VITE_BIZ_PHONE 전화 · VITE_BIZ_EMAIL 고객센터 메일 · VITE_BIZ_PRIVACY_OFFICER 보호책임자
 *   VITE_BIZ_HOSTING 호스팅 · VITE_BIZ_EFFECTIVE_DATE 정책 시행일
 *
 * [심사 반려를 부르는 문구 배제 원칙] — 아래 표현은 쓰지 않습니다.
 *   · "100% 맞습니다" · "반드시" · "무조건" 같은 단정·보장
 *   · 실제로는 유료인데 "평생 무료"처럼 보이게 하는 표기
 *   · "최고" · "1위" · "유일" 같은 비교·우월 표현
 *   · 질병·투자·법률 판단을 대신한다는 인상(의학적·투자적 조언 아님을 명시)
 *   · 결제 없이 전체가 열린다는 오해(잠금 콘텐츠의 가격·범위를 결제 전에 고지)
 */

const env = import.meta.env as Record<string, string | undefined>;

function value(keys: string[], fallback: string): string {
  for (const key of keys) {
    const raw = env[key];
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  }
  return fallback;
}

export const PENDING_TELECOM_NO = '확인 후 기입(환경변수 VITE_BIZ_TELECOM_NO)';

export const BUSINESS = {
  company: value(['VITE_BIZ_COMPANY'], '모브릭'),
  registrationNo: value(['VITE_BIZ_REG_NO'], '409-37-46363'),
  representative: value(['VITE_BIZ_CEO', 'VITE_BIZ_REPRESENTATIVE'], '박진영'),
  mailOrderNo: value(['VITE_BIZ_TELECOM_NO', 'VITE_BIZ_MAIL_ORDER_NO'], PENDING_TELECOM_NO),
  address: value(['VITE_BIZ_ADDRESS'], '인천광역시 검단구 고산후로95번길 24, 4층 401호 -X245호(당하동, 그린프라자)'),
  tel: value(['VITE_BIZ_PHONE', 'VITE_BIZ_TEL'], '010-9573-5868'),
  email: value(['VITE_BIZ_EMAIL'], 'ggungzzang80@naver.com'),
  privacyOfficer: value(['VITE_BIZ_PRIVACY_OFFICER'], '박진영'),
  hosting: value(['VITE_BIZ_HOSTING'], 'Cloudflare, Inc.'),
  paymentAgency: value(['VITE_PAYMENT_AGENCY'], '페이앱(PayApp)'),
  effectiveDate: value(['VITE_BIZ_EFFECTIVE_DATE'], '2026-11-18'),
} as const;

export function businessRows(): Array<{ label: string; value: string; pending: boolean }> {
  const rows: Array<[string, string]> = [
    ['상호', BUSINESS.company],
    ['대표자', BUSINESS.representative],
    ['사업자등록번호', BUSINESS.registrationNo],
    ['통신판매업 신고번호', BUSINESS.mailOrderNo],
    ['사업장 주소', BUSINESS.address],
    ['대표 전화', BUSINESS.tel],
    ['고객센터 이메일', BUSINESS.email],
    ['개인정보 보호책임자', BUSINESS.privacyOfficer],
    ['호스팅 제공자', BUSINESS.hosting],
    ['결제대행', BUSINESS.paymentAgency],
  ];
  return rows.map(([label, v]) => ({ label, value: v, pending: v.startsWith('확인 후 기입') }));
}

/* ------------------------------------------------------------------ */

export type LegalDocId = 'terms' | 'privacy' | 'refund';
export type LegalBlock = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };
export type LegalDoc = {
  id: LegalDocId;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const SERVICE = '나의 수호천사';
const UPDATED = BUSINESS.effectiveDate;

const COMPANY_SECTION: LegalSection = {
  title: '사업자 정보',
  blocks: [
    {
      kind: 'ul',
      items: [
        `상호: ${BUSINESS.company}`,
        `대표자: ${BUSINESS.representative}`,
        `사업자등록번호: ${BUSINESS.registrationNo}`,
        `통신판매업 신고번호: ${BUSINESS.mailOrderNo}`,
        `사업장 주소: ${BUSINESS.address}`,
        `대표 전화: ${BUSINESS.tel}`,
        `고객센터 이메일: ${BUSINESS.email}`,
        `개인정보 보호책임자: ${BUSINESS.privacyOfficer}`,
        `호스팅 제공자: ${BUSINESS.hosting}`,
        `결제대행: ${BUSINESS.paymentAgency}`,
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: 'terms',
    title: '이용약관',
    summary: '서비스 이용 조건, 결제와 환불, 책임 범위를 정한 기본 약속입니다.',
    updated: UPDATED,
    sections: [
      {
        title: '제1조 (목적)',
        blocks: [
          {
            kind: 'p',
            text: `이 약관은 ${BUSINESS.company}(이하 "회사")가 운영하는 ${SERVICE}(이하 "서비스")의 이용과 관련하여 회사와 이용자 사이의 권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.`,
          },
        ],
      },
      {
        title: '제2조 (정의)',
        blocks: [
          {
            kind: 'ul',
            items: [
              '"서비스"란 회사가 제공하는 웹 기반 관계 지도 및 리포트 서비스를 말합니다.',
              '"이용자"란 이 약관에 따라 서비스를 이용하는 자를 말합니다.',
              '"지도 개설자"란 자신의 생년월일 정보를 입력해 지도를 처음 만든 이용자를 말합니다.',
              '"참여자"란 초대 링크를 통해 지도에 자신의 정보를 올린 이용자를 말합니다.',
              '"유료 콘텐츠"란 개인 심층 리포트, 연도·월별 흐름 리포트, 관계 심층 리포트 등 회사가 정한 가격으로 제공하는 디지털 콘텐츠를 말합니다.',
            ],
          },
        ],
      },
      {
        title: '제3조 (약관의 효력과 변경)',
        blocks: [
          {
            kind: 'p',
            text: '이 약관은 서비스 화면에 게시하여 효력이 발생합니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 시행일 7일 전부터 공지합니다. 이용자에게 불리한 변경은 30일 전에 공지합니다.',
          },
        ],
      },
      {
        title: '제4조 (서비스의 내용)',
        blocks: [
          {
            kind: 'p',
            text: '서비스는 입력한 생년월일·태어난 시간·태어난 도시를 바탕으로 서양 점성술(Whole Sign 하우스) 방식의 상징적 해석을 제공합니다. 제공되는 모든 해석은 전통적 상징 체계에 기반한 참고 콘텐츠이며, 의학적·법률적·투자적 판단의 근거가 되지 않습니다.',
          },
          {
            kind: 'ul',
            items: [
              '무료: 내 별자리 세 축, 원소 균형, 관계 지도 생성 및 등급 표시',
              '유료: 개인 심층 리포트, 연도·월별 흐름 리포트, 관계 심층 리포트',
            ],
          },
        ],
      },
      {
        title: '제5조 (이용계약의 성립)',
        blocks: [
          {
            kind: 'p',
            text: '이용계약은 이용자가 필수 항목에 동의하고 지도에 참여하거나 유료 콘텐츠의 결제를 완료한 때에 성립합니다. 회사는 다음 각 호에 해당하는 경우 승낙을 거절하거나 사후에 계약을 취소할 수 있습니다.',
          },
          {
            kind: 'ul',
            items: [
              '타인의 정보를 허락 없이 입력한 경우',
              '만 14세 미만 아동이 법정대리인의 동의 없이 이용한 경우',
              '서비스 운영을 방해하거나 자동화된 수단으로 과도하게 요청한 경우',
            ],
          },
        ],
      },
      {
        title: '제6조 (결제)',
        blocks: [
          {
            kind: 'ul',
            items: [
              `유료 콘텐츠의 결제는 ${BUSINESS.paymentAgency}를 통해 이루어집니다.`,
              '결제 금액과 제공 범위는 결제 화면에 표시된 내용과 같습니다.',
              '회사는 결제 완료 후 이용자가 결제한 콘텐츠를 즉시 열람할 수 있도록 합니다.',
              '결제 정보는 결제대행사의 정책에 따라 처리되며, 회사는 카드번호 전체를 저장하지 않습니다.',
            ],
          },
        ],
      },
      {
        title: '제7조 (청약철회 및 환불)',
        blocks: [
          {
            kind: 'p',
            text: '청약철회와 환불은 「환불 및 청약철회 정책」에 따릅니다. 디지털 콘텐츠의 성격상 열람을 시작한 경우 청약철회가 제한될 수 있으며, 회사는 결제 전에 그 사실을 고지하고 동의를 받습니다.',
          },
        ],
      },
      {
        title: '제8조 (이용자의 의무)',
        blocks: [
          {
            kind: 'ul',
            items: [
              '지도에 다른 사람의 정보를 올릴 때에는 그 사람의 동의를 받아야 합니다.',
              '지도와 리포트는 개인적 감상과 참고를 위한 것이며, 상업적 재배포·복제·판매할 수 없습니다.',
              '서비스 화면의 해석 문구를 다른 사람의 의사결정을 유도하는 자료로 사용해서는 안 됩니다.',
            ],
          },
        ],
      },
      {
        title: '제9조 (서비스의 변경·중단)',
        blocks: [
          {
            kind: 'p',
            text: '회사는 서비스의 내용을 변경하거나 일부를 중단할 수 있습니다. 중단 시 유료 콘텐츠를 결제한 이용자에게는 남은 기간에 상당하는 금액을 환불하거나 동등한 콘텐츠를 제공합니다.',
          },
        ],
      },
      {
        title: '제10조 (지식재산권)',
        blocks: [
          {
            kind: 'p',
            text: '서비스의 화면, 캐릭터 이미지, 해석 문구, 계산 엔진에 대한 권리는 회사에 있습니다. 이용자는 서비스가 제공하는 공유 기능의 범위를 넘어 복제·배포할 수 없습니다.',
          },
        ],
      },
      {
        title: '제11조 (책임의 제한)',
        blocks: [
          {
            kind: 'p',
            text: '회사는 천재지변, 통신 장애 등 회사의 통제를 벗어난 사유로 서비스를 제공하지 못한 경우 책임을 지지 않습니다. 서비스의 해석 내용을 신뢰하여 이용자가 내린 결정과 그 결과에 대해서는 회사가 책임을 지지 않습니다.',
          },
        ],
      },
      {
        title: '제12조 (분쟁의 해결)',
        blocks: [
          {
            kind: 'p',
            text: '회사와 이용자는 분쟁을 원만히 해결하기 위해 성실히 협의합니다. 협의가 이루어지지 않을 경우 관할 법원은 민사소송법에 따른 법원으로 합니다.',
          },
        ],
      },
      COMPANY_SECTION,
      { title: '부칙', blocks: [{ kind: 'p', text: `이 약관은 ${UPDATED}부터 시행합니다.` }] },
    ],
  },

  privacy: {
    id: 'privacy',
    title: '개인정보처리방침',
    summary: '무엇을 받고, 어디에 쓰고, 언제 지우는지 정리했습니다.',
    updated: UPDATED,
    sections: [
      {
        title: '1. 총칙',
        blocks: [
          {
            kind: 'p',
            text: `${BUSINESS.company}는 이용자의 개인정보를 소중하게 생각하며, 「개인정보 보호법」 등 관련 법령을 따릅니다. 이 방침은 서비스가 어떤 정보를 어떤 목적으로 처리하는지 알려 드립니다.`,
          },
        ],
      },
      {
        title: '2. 수집하는 개인정보 항목과 수집 방법',
        blocks: [
          {
            kind: 'ul',
            items: [
              '필수: 닉네임(또는 별명), 생년월일, 태어난 시간 또는 "시간 모름" 여부, 태어난 도시',
              '선택: 성별(해석 문구 조정용), 관계 표시(친구·연인·가족·동료)',
              '결제 시: 결제대행사가 처리하는 결제 정보(회사는 카드번호 전체를 저장하지 않습니다)',
              '자동 수집: 접속 기록, 브라우저 종류, 기기 정보, 서비스 이용 기록',
            ],
          },
          {
            kind: 'p',
            text: '정보는 이용자가 직접 입력하는 방식과, 초대 링크를 통해 참여자가 입력하는 방식으로 수집됩니다.',
          },
        ],
      },
      {
        title: '3. 개인정보의 처리 목적',
        blocks: [
          {
            kind: 'ul',
            items: [
              '천궁도 계산과 관계 지도 생성',
              '지도 개설자와 참여자 사이의 관계 점수·등급 표시',
              '유료 콘텐츠 제공과 결제 확인',
              '서비스 문의 응대와 부정 이용 방지',
            ],
          },
        ],
      },
      {
        title: '4. 보유 및 이용 기간',
        blocks: [
          {
            kind: 'ul',
            items: [
              '지도 정보: 지도가 유지되는 동안 보관하며, 개설자가 지도를 삭제하면 즉시 파기합니다.',
              '참여자의 생년월일시: 지도에 표시되는 정보는 닉네임·별자리·등급이며, 생년월일시 원본은 관계 계산 목적으로만 저장되고 다른 참여자에게 표시되지 않습니다.',
              '결제 기록: 전자상거래법에 따라 5년간 보관합니다.',
              '접속 기록: 통신비밀보호법에 따라 3개월간 보관합니다.',
            ],
          },
        ],
      },
      {
        title: '5. 개인정보의 제3자 제공',
        blocks: [
          {
            kind: 'p',
            text: '회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 결제 처리를 위해 결제대행사에 결제에 필요한 최소 정보를 전달하며, 법령에 따라 요구되는 경우에는 예외로 합니다.',
          },
        ],
      },
      {
        title: '6. 개인정보 처리의 위탁',
        blocks: [
          {
            kind: 'ul',
            items: [
              `${BUSINESS.hosting}: 서비스 호스팅 및 데이터 보관`,
              `${BUSINESS.paymentAgency}: 결제 처리 및 결제 확인`,
            ],
          },
        ],
      },
      {
        title: '7. 개인정보의 파기 절차와 방법',
        blocks: [
          {
            kind: 'p',
            text: '보유 기간이 끝나거나 목적이 달성된 정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄합니다.',
          },
        ],
      },
      {
        title: '8. 이용자의 권리와 행사 방법',
        blocks: [
          {
            kind: 'p',
            text: '이용자는 언제든지 자신의 정보를 조회·정정·삭제하거나 처리 정지를 요청할 수 있습니다. 지도에서 자신의 기록을 삭제하는 기능을 제공하며, 고객센터로 요청해도 같은 처리를 받을 수 있습니다.',
          },
        ],
      },
      {
        title: '9. 쿠키와 브라우저 저장소',
        blocks: [
          {
            kind: 'p',
            text: '서비스는 입력한 값을 다시 입력하지 않도록 브라우저 저장소(로컬 스토리지)를 사용할 수 있습니다. 이 정보는 서버로 전송되지 않으며, 브라우저 설정에서 언제든 삭제할 수 있습니다.',
          },
        ],
      },
      {
        title: '10. 개인정보의 안전성 확보 조치',
        blocks: [
          {
            kind: 'ul',
            items: [
              '전송 구간 암호화(HTTPS)',
              '접근 권한 최소화와 접근 기록 보관',
              '결제 정보의 비저장 원칙(결제대행사 처리)',
            ],
          },
        ],
      },
      {
        title: '11. 개인정보 보호책임자',
        blocks: [
          {
            kind: 'ul',
            items: [
              `성명: ${BUSINESS.privacyOfficer}`,
              `이메일: ${BUSINESS.email}`,
              `전화: ${BUSINESS.tel}`,
            ],
          },
        ],
      },
      {
        title: '12. 방침의 변경',
        blocks: [
          {
            kind: 'p',
            text: '이 방침이 바뀌면 시행일 7일 전부터 서비스 화면에 알립니다. 중요한 변경은 30일 전에 알립니다.',
          },
        ],
      },
      COMPANY_SECTION,
      { title: '시행일', blocks: [{ kind: 'p', text: `이 방침은 ${UPDATED}부터 적용됩니다.` }] },
    ],
  },

  refund: {
    id: 'refund',
    title: '환불 및 청약철회 정책',
    summary: '디지털 콘텐츠의 청약철회 기간과 환불 기준을 정리했습니다.',
    updated: UPDATED,
    sections: [
      {
        title: '1. 적용 범위',
        blocks: [
          {
            kind: 'p',
            text: '이 정책은 서비스에서 판매하는 모든 유료 콘텐츠(개인 심층 리포트, 연도·월별 흐름 리포트, 관계 심층 리포트)에 적용됩니다.',
          },
        ],
      },
      {
        title: '2. 콘텐츠의 성격',
        blocks: [
          {
            kind: 'p',
            text: '유료 콘텐츠는 결제 즉시 생성되어 화면에서 바로 열람할 수 있는 디지털 콘텐츠입니다. 실물 상품의 배송이 없습니다.',
          },
        ],
      },
      {
        title: '3. 청약철회 가능 기간',
        blocks: [
          {
            kind: 'ul',
            items: [
              '결제일로부터 7일 이내, 그리고 콘텐츠를 열람하기 전까지 청약철회가 가능합니다.',
              '콘텐츠를 열람한 후에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 청약철회가 제한될 수 있습니다.',
              '다만 콘텐츠에 오류가 있거나 표시된 내용과 다르게 제공된 경우에는 열람 여부와 관계없이 환불해 드립니다.',
            ],
          },
        ],
      },
      {
        title: '4. 청약철회 제한 사전 고지와 동의',
        blocks: [
          {
            kind: 'p',
            text: '회사는 결제 화면에서 "결제 즉시 콘텐츠가 열람되며, 열람을 시작하면 청약철회가 제한됩니다"라는 문구를 표시하고 이용자의 동의를 받습니다. 동의 없이 결제가 이루어진 경우에는 청약철회를 제한하지 않습니다.',
          },
        ],
      },
      {
        title: '5. 환불 요청 방법',
        blocks: [
          {
            kind: 'ul',
            items: [
              `고객센터 이메일(${BUSINESS.email}) 또는 대표 전화(${BUSINESS.tel})로 요청`,
              '결제 일시, 결제 금액, 콘텐츠 이름을 함께 알려 주시면 처리가 빠릅니다.',
            ],
          },
        ],
      },
      {
        title: '6. 환불 처리 기한',
        blocks: [
          {
            kind: 'p',
            text: '환불이 확정되면 3영업일 이내에 결제 수단의 취소 또는 계좌 환급을 진행합니다. 카드 결제의 경우 카드사 처리 기간에 따라 실제 반영까지 영업일 기준 3~7일이 더 걸릴 수 있습니다.',
          },
        ],
      },
      {
        title: '7. 부분 환불',
        blocks: [
          {
            kind: 'p',
            text: '여러 콘텐츠를 한 번에 결제한 경우, 열람하지 않은 콘텐츠에 해당하는 금액은 부분 환불이 가능합니다.',
          },
        ],
      },
      {
        title: '8. 문의처',
        blocks: [
          {
            kind: 'ul',
            items: [
              `상호: ${BUSINESS.company}`,
              `대표자: ${BUSINESS.representative}`,
              `이메일: ${BUSINESS.email}`,
              `전화: ${BUSINESS.tel}`,
            ],
          },
        ],
      },
      COMPANY_SECTION,
      { title: '시행일', blocks: [{ kind: 'p', text: `이 정책은 ${UPDATED}부터 적용됩니다.` }] },
    ],
  },
};

export const LEGAL_ORDER: LegalDocId[] = ['terms', 'privacy', 'refund'];
export const LEGAL_LINK_LABEL: Record<LegalDocId, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
  refund: '환불 정책',
};
