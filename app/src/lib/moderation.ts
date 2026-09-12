import type { ModerationAxis } from './db-types';

export const AXIS_LABEL_KO: Record<ModerationAxis, string> = {
  none: '없음',
  profanity: '비속어',
  disrespect: '존대 이탈',
  personal_attack: '인신공격',
  mockery: '조롱·비꼼',
};

export const MODERATION_TOAST: Record<ModerationAxis, string | null> = {
  none: null,
  profanity: '비속어가 감지됐어요 · 표현을 다듬어볼까요?',
  disrespect: '존댓말에서 벗어난 표현이 감지됐어요 · 1차 경고',
  personal_attack: '주장이 아니라 사람을 겨눈 것 같아요 · 인신공격 감지',
  mockery: '태도가 아니라 생각을 겨누고 있나요? · 조롱 감지 1차',
};
