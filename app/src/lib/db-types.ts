export type Seat = 'A' | 'B';
export type RoomStatus = 'waiting' | 'active' | 'closed';

export interface Briefing {
  terms: string[];
  issues: string[];
  objections: string[];
}

export interface RoomRow {
  id: string;
  topic_id: string;
  topic_title: string;
  status: RoomStatus;
  seat_a: string | null;
  seat_b: string | null;
  turn: Seat;
  vs_ai: boolean;
  ai_strikes: number;
  briefing: Briefing | null;
  acks_left_a: number;
  acks_left_b: number;
  hand_left_a: number;
  hand_left_b: number;
  changed_a: number;
  changed_b: number;
  violations_a: number;
  violations_b: number;
  muted_until_a: string | null;
  muted_until_b: string | null;
  dispute_used_a: boolean;
  dispute_used_b: boolean;
  host_nickname: string | null;
  is_custom: boolean;
  allow_profanity: boolean;
  duration_minutes: number;
  hand_limit: number;
  created_at: string;
}

export interface LogBadge {
  label: string;
  bg: string;
  color: string;
}

export interface LogRow {
  id: number;
  nickname: string;
  topic_title: string;
  quote: string;
  badges: LogBadge[];
  created_at: string;
}

export interface ProfileRow {
  nickname: string;
  changed_count: number;
  listened_count: number;
  briefed_count: number;
  stillman_count: number;
  updated_at: string;
}

export type MessageKind = 'chat' | 'change_declare' | 'session_closed' | 'ai_warning' | 'stillman';

export interface MessageRow {
  id: number;
  room_id: string;
  seat: Seat | 'SYS';
  sender: string;
  text: string;
  kind: MessageKind;
  acked: boolean;
  disputed: boolean;
  moderation: ModerationResult | null;
  created_at: string;
}

export type ModerationAxis = 'profanity' | 'disrespect' | 'personal_attack' | 'mockery' | 'none';

export interface ModerationResult {
  flagged: boolean;
  axis: ModerationAxis;
  reason: string;
}
