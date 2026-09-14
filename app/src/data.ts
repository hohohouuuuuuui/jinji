export interface ScheduleRoom {
  id: 1 | 2 | 3 | 4;
  color: string;
  locked?: boolean;
}

export interface ScheduleRowData {
  room: ScheduleRoom;
  time: string;
  day?: string;
  status: string;
  statusColor?: string;
  title: string;
  tags: { label: string; bg: string; color: string }[];
  seats: { top: string; bottom: string };
  cta?: string;
  topicId?: string;
  lockedNote?: string;
  featured?: boolean;
}

const ROOM1 = { id: 1 as const, color: '#F586AE' };
const ROOM2 = { id: 2 as const, color: '#8ED4F0' };
const ROOM3 = { id: 3 as const, color: '#17171a' };

// AI 자동생성 방은 방 번호(1/2/3)별로 딱 하나씩만 둔다 — 나머지는 방 만들기로 채워진다.
export const SCHEDULE: ScheduleRowData[] = [
  {
    room: ROOM1,
    time: '20:05',
    status: '',
    title: 'AI 생성물에 저작권을 인정해야 하는가',
    tags: [
      { label: '1:1 대화', bg: '#fff', color: '#8d3f70' },
      { label: 'AI 브리핑', bg: '#fff', color: '#4a4750' },
    ],
    seats: { top: '0', bottom: '/4명' },
    cta: '입장 신청하기',
    topicId: 'ai-copyright',
    featured: true,
  },
  {
    room: ROOM2,
    time: '21:00',
    status: '신청중',
    title: '가장 후회하는 선택',
    tags: [
      { label: '1:1 대화', bg: '#E6F5FC', color: '#1f5a75' },
      { label: '3일 진행', bg: '#F3F1F5', color: '#4a4750' },
    ],
    seats: { top: '0', bottom: '/2명' },
    cta: '입장 신청하기',
    topicId: 'regret-choice',
  },
  {
    room: ROOM3,
    time: '22:00',
    status: '관전가능',
    title: '능력주의는 공정한가',
    tags: [
      { label: '1:1 격돌', bg: '#F3F1F5', color: '#4a4750' },
      { label: '관전 214', bg: '#F3F1F5', color: '#4a4750' },
    ],
    seats: { top: '0', bottom: '/2명' },
    cta: '입장 신청하기',
    topicId: 'meritocracy',
  },
  {
    room: { id: 4, color: '#17171a', locked: true },
    time: '21:00',
    day: 'THU',
    status: '',
    title: '진지한 결혼',
    tags: [],
    seats: { top: '', bottom: '' },
    lockedNote: '🔒 초성충부터 참가',
  },
];

export const FILTER_CHIPS = ['전체', '1번 방 토론', '2번 방 대화', '3번 방 격돌'];

export const ISSUE_CHIPS = ['쟁점 1 창작적 기여', '2 공정이용', '3 권리 주체'];

export const RULES = ['비속어', '존대 이탈', '인신공격', '조롱 · 비꼼'];
