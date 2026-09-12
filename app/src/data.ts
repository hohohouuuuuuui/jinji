export interface SparStep {
  q: string;
  fb: string;
}

export const SPAR_STEPS: SparStep[] = [
  {
    q: '가장 확신하는 주장 하나. 그게 틀렸을 가능성이 큰 지점은?',
    fb: '지금 누른 발언 종료가 내 턴의 끝입니다. 이 신호 없이 상대는 끼어들지 않습니다.',
  },
  {
    q: '상대가 "ㅋㅋ 그걸 왜 진지하게"라고 답했습니다. 무엇이 작동해야 할까요?',
    fb: '조롱·비꼼 축이 작동합니다. 상대에게만 조용히 1차 경고가 갑니다.',
  },
];

export interface ScheduleRoom {
  id: 1 | 2 | 3 | 4 | 5;
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
  vsAI?: boolean;
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
    room: { id: 5, color: '#8A6BD6' },
    time: '상시',
    status: '즉시 시작',
    title: 'AI 논객과 즉석 격돌',
    tags: [
      { label: '1:1 격돌', bg: '#EFE9FB', color: '#5b3fa3' },
      { label: 'AI 상대', bg: '#F3F1F5', color: '#4a4750' },
    ],
    seats: { top: '∞', bottom: '상시' },
    cta: 'AI와 시작하기',
    topicId: 'vs-ai',
    vsAI: true,
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

export interface StatBar {
  emoji: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}

export const SHELF_STATS: StatBar[] = [
  { emoji: '👂', label: '끝까지 들음', value: 32, pct: 80, color: '#F586AE' },
  { emoji: '🔁', label: '생각이 바뀜', value: 5, pct: 18, color: '#8ED4F0' },
  { emoji: '🫱', label: '스틸맨', value: 12, pct: 30, color: '#F6CF5C' },
  { emoji: '👀', label: '브리핑 완독', value: 40, pct: 100, color: '#8FD8A4' },
];

export const ISSUE_CHIPS = ['쟁점 1 창작적 기여', '2 공정이용', '3 권리 주체'];

export const RULES = ['비속어', '존대 이탈', '인신공격', '조롱 · 비꼼'];
