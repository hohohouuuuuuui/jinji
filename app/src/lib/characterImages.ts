// 사용자가 올려준 90장짜리 캐릭터 이미지 세트(character_001.png~090.png,
// public/characters/)를 레벨 0~100(101단계)에 고르게 매핑한다. 이미지
// 수가 레벨 수보다 적어서 일부 인접 레벨은 같은 그림을 공유한다.
const TOTAL_IMAGES = 90;
const MAX_LEVEL = 100;

export function imageForLevel(level: number): string {
  const clamped = Math.max(0, Math.min(MAX_LEVEL, level));
  const index = Math.max(1, Math.min(TOTAL_IMAGES, Math.round(1 + (clamped / MAX_LEVEL) * (TOTAL_IMAGES - 1))));
  return `/characters/character_${String(index).padStart(3, '0')}.png`;
}
