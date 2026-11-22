import { useMemo, useState } from 'react';
import { CITIES, findCity, searchCities, type City } from '../lib/cities';
import type { Gender } from '../lib/relations';
import { Arrow } from './ui';

export type IntakeSubmit = {
  nickname: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeKnown: boolean;
  city: City;
  relation: string;
  /** 성별(선택) — 궁합 가중치 분기에만 쓰고 지도에는 표시하지 않습니다 */
  gender?: Gender;
};

export type IntakeMode = 'me' | 'join' | 'person';

type Props = {
  mode?: IntakeMode;
  submitLabel: string;
  onSubmit: (value: IntakeSubmit) => void;
  /** 초대받은 지도 주인의 이름 (join 모드에서 안내에 씁니다) */
  hostName?: string;
  compact?: boolean;
};

const RELATIONS = ['친구', '연인', '가족', '동료', '기타'];

const GENDERS: Array<{ id: Gender; label: string }> = [
  { id: 'female', label: '여성' },
  { id: 'male', label: '남성' },
];

function digitsOnly(value: string, max: number): string {
  return value.replace(/[^0-9]/g, '').slice(0, max);
}

function parseDate(value: string): { year: number; month: number; day: number } | null {
  if (value.length !== 8) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  if (year < 1900 || year > 2026 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTime(value: string): { hour: number; minute: number } | null {
  if (value.length !== 4) return null;
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(2, 4));
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export default function IntakeForm({ mode = 'me', submitLabel, onSubmit, hostName, compact }: Props) {
  const [nickname, setNickname] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeKnown, setTimeKnown] = useState(true);
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState<City | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [relation, setRelation] = useState('친구');
  /** 비워 두면(미선택) v4 공통 가중치로 계산합니다 */
  const [gender, setGender] = useState<Gender | null>(null);
  const [agree, setAgree] = useState(mode === 'me');
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => searchCities(cityQuery, 6), [cityQuery]);

  const dateParts = parseDate(date);
  const timeParts = timeKnown ? parseTime(time) : { hour: 12, minute: 0 };

  const submit = () => {
    if (!dateParts) {
      setError('생년월일 8자리를 확인해 주세요. 예) 1992년 3월 15일 → 19920315');
      return;
    }
    if (timeKnown && !timeParts) {
      setError('태어난 시간 4자리를 확인해 주세요. 예) 오전 9시 30분 → 0930');
      return;
    }
    const picked = city ?? findCity(cityQuery) ?? null;
    if (!picked) {
      setError('태어난 도시를 목록에서 골라 주세요. 도시에 따라 별자리 자리가 조금 달라져요.');
      return;
    }
    if (mode === 'join' && !agree) {
      setError('이용약관과 개인정보처리방침 동의가 필요합니다.');
      return;
    }
    setError(null);
    onSubmit({
      nickname: nickname.trim() || (mode === 'me' ? '나' : '친구'),
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      hour: timeParts!.hour,
      minute: timeParts!.minute,
      timeKnown,
      city: picked,
      relation,
      gender: gender ?? undefined,
    });
  };

  return (
    <div className={compact ? '' : 'card p-5 sm:p-6'}>
      {mode === 'join' && (
        <div className="mb-4 rounded-xl bg-lilac-100 px-3.5 py-2.5 text-[13.5px] leading-[1.6] text-lilac-500">
          {hostName ? `${hostName}님의 지도에 초대되었습니다.` : '초대받은 지도에 참여합니다.'} 이름과 생일만 넣으면 지도에 자리가 생깁니다.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="intake-name">
            {mode === 'me' ? '닉네임 (선택)' : '이름 또는 별명'}
          </label>
          <input
            id="intake-name"
            className="field"
            placeholder={mode === 'me' ? '지도에 표시될 이름' : '실명 대신 별명을 권합니다'}
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 14))}
            autoComplete="nickname"
          />
          <p className="field-hint">
            {mode === 'me'
              ? '비워 두면 ‘나’로 표시됩니다. 지도를 공유하면 이 이름이 보입니다.'
              : '이 이름은 지도에 표시되며, 지도를 공유하면 다른 사람에게도 보입니다.'}
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="intake-date">
            생년월일
          </label>
          <input
            id="intake-date"
            className="field"
            placeholder="19920315"
            inputMode="numeric"
            value={date}
            onChange={(e) => setDate(digitsOnly(e.target.value, 8))}
          />
          <p className="field-hint">
            숫자 8자리 · 예) 1992년 3월 15일 → {dateParts ? `${dateParts.year}. ${dateParts.month}. ${dateParts.day}.` : '19920315'}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="field-label !mb-0" htmlFor="intake-time">
              태어난 시간
            </label>
            <button
              type="button"
              onClick={() => setTimeKnown((v) => !v)}
              aria-pressed={!timeKnown}
              className={`rounded-full px-2.5 py-1 text-[12.5px] transition ${
                timeKnown ? 'text-ink-400 hover:bg-cream-200' : 'bg-night-800 text-cream-50'
              }`}
            >
              시간 모름
            </button>
          </div>
          <input
            id="intake-time"
            className="field disabled:bg-cream-100 disabled:text-ink-400"
            placeholder="0930"
            inputMode="numeric"
            value={timeKnown ? time : ''}
            disabled={!timeKnown}
            onChange={(e) => setTime(digitsOnly(e.target.value, 4))}
          />
          <p className="field-hint">
            {timeKnown
              ? '24시간제 4자리 · 예) 오전 9시 30분 → 0930'
              : '시간을 모르면 낮 12시 기준으로 계산해요. 그만큼 별자리 자리가 조금 달라질 수 있어요.'}
          </p>
        </div>

        <div className="relative">
          <label className="field-label" htmlFor="intake-city">
            태어난 도시
          </label>
          <input
            id="intake-city"
            className="field"
            placeholder="서울"
            value={city ? city.name : cityQuery}
            onChange={(e) => {
              setCity(null);
              setCityQuery(e.target.value);
              setCityOpen(true);
            }}
            onFocus={() => setCityOpen(true)}
            autoComplete="off"
          />
          {cityOpen && suggestions.length > 0 && !city && (
            <ul className="absolute z-20 mt-1 max-h-[186px] w-full overflow-y-auto rounded-xl border border-cream-300 bg-white py-1 shadow-lift">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[14.5px] hover:bg-cream-100"
                    onClick={() => {
                      setCity(c);
                      setCityQuery(c.name);
                      setCityOpen(false);
                    }}
                  >
                    <span>{c.name}</span>
                    <span className="text-[12.5px] text-ink-400">
                      {c.region} · {c.tz >= 0 ? `UTC+${c.tz}` : `UTC${c.tz}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="field-hint">
            도시 이름만 적어도 돼요. {CITIES.length}개 도시의 위치로 별자리 자리를 계산해요.
          </p>
        </div>

        <div className="sm:col-span-2">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span className="field-label !mb-0">성별 (선택)</span>
            <span className="text-[12px] text-ink-400">궁합 가중치에만 쓰고 지도에는 표시하지 않습니다</span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="성별 선택">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                data-testid={`gender-${g.id}`}
                aria-pressed={gender === g.id}
                onClick={() => setGender((prev) => (prev === g.id ? null : g.id))}
                className={`rounded-full border px-3.5 py-1.5 text-[13.5px] transition ${
                  gender === g.id
                    ? 'border-night-800 bg-night-800 text-cream-50'
                    : 'border-cream-300 bg-white text-ink-600 hover:bg-cream-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {gender
              ? '두 사람 성별이 모두 있으면 남녀 궁합 / 동성 우정 궁합 가중치로 계산합니다.'
              : '비워 두면 공통 가중치로 계산합니다. 두 사람 성별이 모두 있어야 궁합 가중치가 갈립니다.'}
          </p>
        </div>

        {mode === 'person' && (
          <div className="sm:col-span-2">
            <span className="field-label">어떤 사이인가요</span>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelation(r)}
                  className={`rounded-full border px-3 py-1.5 text-[13.5px] transition ${
                    relation === r
                      ? 'border-night-800 bg-night-800 text-cream-50'
                      : 'border-cream-300 bg-white text-ink-600 hover:bg-cream-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {mode === 'join' && (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-white/70 p-3 text-[13px] leading-[1.6] text-ink-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-gold-500"
          />
          <span>
            만 14세 이상이며, 입력한 이름·생년월일·성별(선택)을 지도 관계 계산에 이용하는 데 동의합니다. (필수)
            생년월일시 원본은 지도에 표시되지 않습니다.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-blush-100 px-3 py-2 text-[13.5px] text-blush-500">
          {error}
        </p>
      )}

      <button onClick={submit} className="btn-primary mt-4 w-full">
        {submitLabel}
        <Arrow className="h-4 w-4" />
      </button>

      <p className="mt-3 text-center text-[12px] leading-[1.6] text-ink-400">
        서양 점성술 상징으로 계산한 참고용 콘텐츠예요 · 의학적·투자적 조언이 아닙니다
      </p>
    </div>
  );
}
