// 진지충 레벨(Lv.0~100) 관련 공용 타입/이름표. 실제 캐릭터 그림은
// `src/lib/characterImages.ts`가 public/characters/의 업로드된 이미지로
// 매핑해서 그린다 — 이 파일은 5레벨 단위의 이름 있는 큰 단계만 정의한다.
export type EvolutionStageKey =
  | 'lv0'
  | 'lv5'
  | 'lv10'
  | 'lv15'
  | 'lv20'
  | 'lv25'
  | 'lv30'
  | 'lv35'
  | 'lv40'
  | 'lv45'
  | 'lv50'
  | 'lv55'
  | 'lv60'
  | 'lv65'
  | 'lv70'
  | 'lv75'
  | 'lv80'
  | 'lv85'
  | 'lv90'
  | 'lv95'
  | 'lv100';

export interface EvolutionTier {
  minLevel: number;
  stage: EvolutionStageKey;
  label: string;
}

export const EVOLUTION_TIERS: EvolutionTier[] = [
  { minLevel: 1, stage: 'lv0', label: '호기심 가득 애벌레' },
  { minLevel: 5, stage: 'lv5', label: '공부 시작 애벌레' },
  { minLevel: 10, stage: 'lv10', label: '지식 수집 애벌레' },
  { minLevel: 15, stage: 'lv15', label: '노트북 애벌레' },
  { minLevel: 20, stage: 'lv20', label: '아이디어 애벌레' },
  { minLevel: 25, stage: 'lv25', label: '똑똑한 애벌레' },
  { minLevel: 30, stage: 'lv30', label: '탐구하는 애벌레' },
  { minLevel: 35, stage: 'lv35', label: 'AI 애벌레' },
  { minLevel: 40, stage: 'lv40', label: '하늘을 나는 애벌레' },
  { minLevel: 45, stage: 'lv45', label: '우주 탐험가 애벌레' },
  { minLevel: 50, stage: 'lv50', label: '우주 유랑 애벌레' },
  { minLevel: 55, stage: 'lv55', label: '음악하는 애벌레' },
  { minLevel: 60, stage: 'lv60', label: '자신감 애벌레' },
  { minLevel: 65, stage: 'lv65', label: '지식 마스터 애벌레' },
  { minLevel: 70, stage: 'lv70', label: '힙한 애벌레' },
  { minLevel: 75, stage: 'lv75', label: '마법사 애벌레' },
  { minLevel: 80, stage: 'lv80', label: '로켓 애벌레' },
  { minLevel: 85, stage: 'lv85', label: '사이버 애벌레' },
  { minLevel: 90, stage: 'lv90', label: '다중지식 애벌레' },
  { minLevel: 95, stage: 'lv95', label: '뇌절 시작 애벌레' },
  { minLevel: 100, stage: 'lv100', label: '완전 뇌절 진지충' },
];
