import { GrowthCharacter } from './GrowthCharacter';
import { LEVEL_BANDS, type EvolutionStageKey } from '../icons/evolutionData';
import type { GrowthInfo } from '../lib/growth';

interface GrowthPreviewModalProps {
  open: boolean;
  growth: GrowthInfo;
  onClose: () => void;
}

const ALL_LEVELS = Array.from({ length: 101 }, (_, i) => i);

// "?" 버튼으로 여는 진화 도감 — 카드 한 장씩 스크롤하던 예전 방식 대신,
// Lv.0~100 전체 101단계를 참고 이미지처럼 촘촘한 그리드로 보여준다.
// 아직 도달 못한 레벨은 잠금(회색) 처리해서 스포일러는 피하면서도 전체
// 여정이 한눈에 보이게 한다. 메인 화면 캐릭터와 동일한 도감 그림을 쓴다.
export function GrowthPreviewModal({ open, growth, onClose }: GrowthPreviewModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(17,17,19,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        animation: 'jz-fade .2s ease',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '16px 14px',
          width: '100%',
          maxHeight: '88%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'jz-pop .3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 'none', padding: '0 4px' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.6, color: '#17171a' }}>진지충 진화 도감</div>
            <div style={{ fontSize: 10.5, color: '#78747e', marginTop: 3 }}>
              LV.{growth.level} · {growth.tierLabel} ({growth.level + 1}/101 해금)
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', width: 26, height: 26, borderRadius: '50%', fontSize: 11, color: '#4a4750', flex: 'none' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 5,
          }}
        >
          {ALL_LEVELS.map((level) => {
            const key = `lv${level}` as EvolutionStageKey;
            const unlocked = growth.level >= level;
            const isCurrent = level === growth.level;
            const band = LEVEL_BANDS[key];
            return (
              <div
                key={level}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: isCurrent ? '#FBE9AE' : band.bg,
                  borderRadius: 10,
                  padding: '5px 2px 4px',
                  border: isCurrent ? '1.5px solid #E3A93A' : '1px solid transparent',
                  opacity: unlocked ? 1 : 0.4,
                  filter: unlocked ? 'none' : 'grayscale(85%)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 7.5,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 999,
                    color: isCurrent ? '#7a5a12' : '#fff',
                    background: isCurrent ? 'transparent' : band.color,
                  }}
                >
                  Lv.{level}
                </span>
                <div style={{ marginTop: 2 }}>
                  {unlocked ? (
                    <GrowthCharacter stage={key} size="tiny" />
                  ) : (
                    <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                      🔒
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
