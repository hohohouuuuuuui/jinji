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
