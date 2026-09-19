import { EVOLUTION_TIERS, type EvolutionStageKey } from '../icons/evolutionData';

export type GrowthStage = EvolutionStageKey;

export interface ProfileCounts {
  changedCount: number;
  listenedCount: number;
  briefedCount: number;
  stillmanCount: number;
}

export interface Tier {
  minLevel: number;
  stage: GrowthStage;
  label: string;
}

export interface GrowthInfo {
  level: number;
  maxLevel: number;
  stage: GrowthStage;
  tierLabel: string;
  subLabel: string;
  badges: string[];
  dotsFilled: number;
  dotsTotal: number;
}

const MAX_LEVEL = 100;
// 레벨당 필요한 경험치 — "생각이 바뀜"(가장 어렵고, 상대가 동의해야만
// 오르는 지표)을 가장 무겁게, 스틸맨(AI 판정 통과)을 그 다음으로, 끝까지
// 듣기·브리핑 완독은 매 세션마다 자연히 쌓이니 가볍게 쳐서 경험치(XP)로
// 환산한다.
const XP_WEIGHTS = { changed: 25, stillman: 12, briefed: 4, listened: 2 } as const;
const XP_PER_LEVEL = 40;

export function computeXp(counts: ProfileCounts): number {
  return (
    counts.changedCount * XP_WEIGHTS.changed +
    counts.stillmanCount * XP_WEIGHTS.stillman +
    counts.briefedCount * XP_WEIGHTS.briefed +
    counts.listenedCount * XP_WEIGHTS.listened
  );
}

function levelFromXp(xp: number): number {
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
}

// 진화 도감 — 5레벨마다 한 단계씩, 총 21단계(Lv.1~100). 분기 없이 하나의
// 정해진 순서로 쭉 이어진다.
export const TIERS: Tier[] = EVOLUTION_TIERS;

const MILESTONE_BADGES = [
  { minLevel: 25, label: '지식인 배지' },
  { minLevel: 50, label: '우주인 배지' },
  { minLevel: 75, label: '마법사 배지' },
  { minLevel: 100, label: '🔥 뇌절 끝판왕' },
];

export function tierForLevel(level: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (level >= t.minLevel) current = t;
  }
  return current;
}

export function getGrowth(counts: ProfileCounts): GrowthInfo {
  const xp = computeXp(counts);
  const level = levelFromXp(xp);
  const tier = tierForLevel(level);
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  const subLabel =
    counts.changedCount === 0
      ? `LV.${level} · 생각이 바뀜 0회`
      : `LV.${level} · 생각이 바뀜 누적 ${counts.changedCount}회`;

  return {
    level,
    maxLevel: MAX_LEVEL,
    // 메인 화면·참가기록 캐릭터는 5단계 단위가 아니라 "지금 레벨" 그
    // 자체의 도감 그림을 쓴다 — 레벨이 오를 때마다 매번 조금씩 달라진다.
    stage: `lv${level}` as GrowthStage,
    tierLabel: tier.label,
    subLabel,
    badges: MILESTONE_BADGES.filter((b) => level >= b.minLevel).map((b) => b.label),
    dotsFilled: level >= MAX_LEVEL ? 4 : Math.min(4, Math.floor((xpIntoLevel / XP_PER_LEVEL) * 4)),
    dotsTotal: 4,
  };
}

// "?" 도감 버튼용: 전체 21단계를 한 화면에 그리드로 보여주고, 아직
// 도달하지 못한 단계는 잠금 처리한다.
export function upcomingTiers(level: number, max = 3): Tier[] {
  return TIERS.filter((t) => t.minLevel > level).slice(0, max);
}
