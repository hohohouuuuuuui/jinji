export type MsgRole = 'other' | 'me' | 'sys';

export interface Msg {
  id: number;
  who: MsgRole;
  text: string;
  done?: boolean;
  acked?: boolean;
}

export type Tab = 'home' | 'session' | 'spar' | 'shelf';

export type ToastTone = 'warn' | 'good';

export interface ToastState {
  tone: ToastTone;
  text: string;
}
