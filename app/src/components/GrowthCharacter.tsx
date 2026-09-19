import { CaterpillarPixel } from '../icons/CaterpillarPixel';
import { ButterflyPixel } from '../icons/ButterflyPixel';
import { CrownPixel } from '../icons/CrownPixel';
import type { GrowthStage } from '../lib/growth';

interface GrowthCharacterProps {
  stage: GrowthStage;
  size?: 'small' | 'large';
}

// 4단계(성장 애벌레 → 성충 논객 → 초성충 → 전설의 진지충) 캐릭터를 한
// 군데서 그린다 — 기존에 만들어둔 애벌레/나비 픽셀아트를 그대로 재사용하고,
// 상위 두 단계는 은은한 글로우(초성충)와 왕관(전설의 진지충)만 얹어서
// 시각적으로 달라 보이게 한다(완전히 새로 그리는 대신, 검증된 기존
// 그림체를 재사용해 일관성을 유지).
export function GrowthCharacter({ stage, size = 'large' }: GrowthCharacterProps) {
  if (stage === 'larva') {
    return size === 'large' ? <CaterpillarPixel width={240} height={148} /> : <CaterpillarPixel />;
  }

  const butterflyProps = size === 'large' ? {} : { width: 100, height: 84 };
  const glow =
    stage === 'butterfly_legend'
      ? 'drop-shadow(0 0 10px rgba(246,207,92,0.75))'
      : stage === 'butterfly_super'
        ? 'drop-shadow(0 0 8px rgba(142,212,240,0.65))'
        : 'none';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', filter: glow }}>
      <ButterflyPixel {...butterflyProps} />
      {stage === 'butterfly_legend' && (
        <div style={{ position: 'absolute', top: size === 'large' ? -10 : -6, left: '50%', transform: 'translateX(-50%)' }}>
          <CrownPixel width={size === 'large' ? 40 : 20} height={size === 'large' ? 17 : 8} />
        </div>
      )}
    </div>
  );
}
