export interface SparStep {
  q: string;
  fb: string;
}

export const SPAR_STEPS: SparStep[] = [
  {
    q: '연습 발언을 하나 써보세요. 아무 문장이나 좋아요. 다 쓰면 "종료"를 눌러보세요.',
    fb: '방금 누른 "종료"가 내 발언 차례를 끝내는 신호예요. 이 버튼을 누르기 전까지는 상대가 끼어들지 않아요 — 이게 진지한 대화의 기본 규칙입니다.',
  },
  {
    q: '이번엔 상대가 "그걸 그렇게까지 진지하게 받아들여? ㅋㅋ" 라고 답했다고 해볼게요. 아무 문장이나 써서 "종료"를 눌러보세요.',
    fb: '그런 조롱·비꼼은 AI가 자동으로 감지해요. 상대에게만 조용히 "1차 경고"가 뜨고 저는 알림받지 않아요 — 공개적으로 망신 주지 않기 위해서예요.',
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
