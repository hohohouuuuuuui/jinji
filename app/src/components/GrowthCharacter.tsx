import { imageForLevel } from '../lib/characterImages';
import type { GrowthStage } from '../lib/growth';

interface GrowthCharacterProps {
  stage: GrowthStage;
  size?: 'small' | 'large' | 'tiny';
}

const SIZES = {
  large: 132,
  small: 92,
  tiny: 44,
};

function levelFromStage(stage: GrowthStage): number {
  return Number(stage.slice(2));
}

// 메인 화면(시간표)·참가기록·도감이 전부 이 컴포넌트로 캐릭터를 그린다 —
// 업로드된 90장짜리 캐릭터 이미지 세트를 레벨에 맞춰 보여준다.
export function GrowthCharacter({ stage, size = 'large' }: GrowthCharacterProps) {
  const px = SIZES[size];
  const level = levelFromStage(stage);
  return (
    <img
      src={imageForLevel(level)}
      alt={`레벨 ${level} 캐릭터`}
      width={px}
      height={px}
      style={{ display: 'block', objectFit: 'contain', imageRendering: 'pixelated' }}
    />
  );
}
