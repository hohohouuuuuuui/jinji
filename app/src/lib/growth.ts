export type GrowthStage = 'larva' | 'butterfly' | 'butterfly_super' | 'butterfly_legend';

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
  badges: string[];
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
// 환산한다. 예전엔 "생각이 바뀜" 누적 횟수를 그대로 LV로 보여줘서 보통
// 한 자리수를 못 넘었는데, 이제 여러 활동을 합쳐 레벨 100까지 설계한다.
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

// 진화 4단계 — 레벨 구간마다 다른 모습으로 보인다(분기 없이 하나의
// 정해진 순서). 레벨 1~100 구간에 고르게 걸쳐 있다.
export const TIERS: Tier[] = [
  { minLevel: 1, stage: 'larva', label: '성장 애벌레', badges: [] },
  { minLevel: 25, stage: 'butterfly', label: '성충 논객', badges: ['철학 날개', '기술 날개'] },
  { minLevel: 55, stage: 'butterfly_super', label: '초성충', badges: ['철학 날개', '기술 날개', '초월의 뿔'] },
  { minLevel: 85, stage: 'butterfly_legend', label: '전설의 진지충', badges: ['철학 날개', '기술 날개', '초월의 뿔', '🔥 각성'] },
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
    stage: tier.stage,
    tierLabel: tier.label,
    subLabel,
    badges: tier.badges,
    dotsFilled: level >= MAX_LEVEL ? 4 : Math.min(4, Math.floor((xpIntoLevel / XP_PER_LEVEL) * 4)),
    dotsTotal: 4,
  };
}

// "?" 미리보기 버튼용: 지금 단계 기준으로 앞으로 나올 다음 단계를 최대
// `max`개까지만 보여준다(한꺼번에 다 보여주면 스포일러라서 일부러 제한).
export function upcomingTiers(level: number, max = 3): Tier[] {
  return TIERS.filter((t) => t.minLevel > level).slice(0, max);
}
