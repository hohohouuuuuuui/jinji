export type GrowthStage = 'larva' | 'butterfly';

export interface GrowthInfo {
  stage: GrowthStage;
  tierLabel: string;
  subLabel: string;
  dotsFilled: number;
  dotsTotal: number;
}

const TIERS: { min: number; label: string }[] = [
  { min: 10, label: '전설의 진지충' },
  { min: 3, label: '초성충' },
  { min: 1, label: '성충 논객' },
  { min: 0, label: '성장 애벌레' },
];

const DOTS_TOTAL = 4;

export function getGrowth(changedCount: number): GrowthInfo {
  const tier = TIERS.find((t) => changedCount >= t.min) ?? TIERS[TIERS.length - 1];
  const stage: GrowthStage = changedCount >= 1 ? 'butterfly' : 'larva';
  const subLabel =
    changedCount === 0
      ? '생각이 바뀜 0회 · 아직 애벌레예요'
      : `생각이 바뀜 누적 ${changedCount}회`;

  return {
    stage,
    tierLabel: tier.label,
    subLabel,
    dotsFilled: Math.min(DOTS_TOTAL, changedCount),
    dotsTotal: DOTS_TOTAL,
  };
}
