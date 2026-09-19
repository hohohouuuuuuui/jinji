import { EvolutionCharacterPixel } from '../icons/EvolutionCharacterPixel';
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

// 21단계(Lv.1~100, 5레벨마다) 캐릭터를 한 군데서 그린다. 모두 같은 진지충
// 얼굴을 기본 뼈대로 두고, 단계마다 안경/책/헤드폰/왕관 같은 장식만
// 바꿔 붙이는 방식이라 일관성 있게 이어지면서도 단계별로 구별된다.
export function GrowthCharacter({ stage, size = 'large' }: GrowthCharacterProps) {
  const px = SIZES[size];
  const glow = stage === 'lv95' || stage === 'lv100';
  return <EvolutionCharacterPixel stage={stage} width={px} height={px} glow={glow} />;
}
