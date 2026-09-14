const TIME_ZONE = 'Asia/Seoul';
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function kstParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === '24' ? '00' : get('hour'),
    minute: get('minute'),
    weekdayEn: get('weekday'),
  };
}

export function formatKSTClock(date: Date): string {
  const p = kstParts(date);
  return `${p.hour}:${p.minute}`;
}

const EN_TO_KO_WEEKDAY: Record<string, string> = {
  Sun: '일',
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
};

export function formatKSTDateLabel(date: Date): string {
  const p = kstParts(date);
  const weekdayKo = EN_TO_KO_WEEKDAY[p.weekdayEn] ?? WEEKDAYS_KO[date.getDay()];
  return `${p.year}.${p.month}.${p.day} ${weekdayKo}`;
}

// 오늘(KST) 자정의 UTC 시각을 ISO 문자열로 — "방 생성 다음날이 되기 전까지는
// 목록에 남아있는다" 같은, KST 달력 날짜 기준 컷오프를 걸 때 쓴다.
export function kstStartOfTodayISO(): string {
  const p = kstParts(new Date());
  const utcMs = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 0, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}
