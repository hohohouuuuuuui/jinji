export type MsgRole = 'other' | 'me' | 'sys';

export interface Msg {
  id: number;
  who: MsgRole;
  text: string;
  kind?: string;
  done?: boolean;
  acked?: boolean;
  disputed?: boolean;
  flagged?: boolean;
  sender?: string;
  /** true only for a "생각이 바뀜" declaration made by the OTHER participant, not yet endorsed. */
  canEndorse?: boolean;
}

export type Tab = 'home' | 'session' | 'spar' | 'shelf';

export type ToastTone = 'warn' | 'good';

export interface ToastState {
  tone: ToastTone;
  text: string;
}
