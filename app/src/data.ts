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
  seats: { top: string; topColor?: string; bottom: string };
  cta?: string;
  topicId?: string;
  lockedNote?: string;
  featured?: boolean;
}

export const SCHEDULE: ScheduleRowData[] = [
  {
    room: { id: 1, color: '#F586AE' },
    time: '20:05',
    status: '',
    title: 'AI 생성물에 저작권을 인정해야 하는가',
    tags: [
      { label: '1:1 대화', bg: '#fff', color: '#8d3f70' },
      { label: 'AI 브리핑', bg: '#fff', color: '#4a4750' },
    ],
    seats: { top: '1', bottom: '/4명' },
    cta: '입장 신청하기',
    topicId: 'ai-copyright',
    featured: true,
  },
  {
    room: { id: 2, color: '#8ED4F0' },
    time: '21:00',
    status: '신청중',
    title: '가장 후회하는 선택',
    tags: [
      { label: '1:1 대화', bg: '#E6F5FC', color: '#1f5a75' },
      { label: '3일 진행', bg: '#F3F1F5', color: '#4a4750' },
    ],
    seats: { top: '1', bottom: '/2명' },
  },
  {
    room: { id: 3, color: '#17171a' },
    time: '22:00',
    status: '관전가능',
    title: '능력주의는 공정한가',
    tags: [
      { label: '1:1 격돌', bg: '#F3F1F5', color: '#4a4750' },
      { label: '관전 214', bg: '#F3F1F5', color: '#4a4750' },
    ],
    seats: { top: '마감', topColor: '#b0568f', bottom: '/2명' },
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
