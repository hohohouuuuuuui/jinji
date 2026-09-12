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
  briefing: Briefing | null;
  acks_left_a: number;
  acks_left_b: number;
  hand_left_a: number;
  hand_left_b: number;
  changed_a: number;
  changed_b: number;
  created_at: string;
}

export interface MessageRow {
  id: number;
  room_id: string;
  seat: Seat | 'SYS';
  sender: string;
  text: string;
  acked: boolean;
  moderation: ModerationResult | null;
  created_at: string;
}

export type ModerationAxis = 'profanity' | 'disrespect' | 'personal_attack' | 'mockery' | 'none';

export interface ModerationResult {
  flagged: boolean;
  axis: ModerationAxis;
  reason: string;
}
