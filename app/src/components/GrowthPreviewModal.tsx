import { imageForLevel } from '../lib/characterImages';
import type { GrowthInfo } from '../lib/growth';

interface GrowthPreviewModalProps {
  open: boolean;
  growth: GrowthInfo;
  onClose: () => void;
}

const ALL_LEVELS = Array.from({ length: 101 }, (_, i) => i);

// "?" 버튼으로 여는 진화 도감 — Lv.0~100 전체 101단계를 한 화면에
// 그리드로 보여준다. 잠금 없이 전부 다 보이고, 이미 지난 레벨은 연한
// 보라, 지금 레벨은 연한 노랑, 아직 안 깬 레벨은 회색 배경으로 구분한다.
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
              LV.{growth.level} · {growth.tierLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', width: 26, height: 26, borderRadius: '50%', fontSize: 11, color: '#4a4750', flex: 'none' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10, padding: '0 4px', fontSize: 9.5, fontWeight: 700, color: '#4a4750' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: '#E4D8FA' }} /> 지난 레벨
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: '#FBE9AE' }} /> 지금 레벨
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: '#E2E2E6' }} /> 아직 안 깬 레벨
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 5,
          }}
        >
          {ALL_LEVELS.map((level) => {
            const isCurrent = level === growth.level;
            const isPast = level < growth.level;
            const bg = isCurrent ? '#FBE9AE' : isPast ? '#E4D8FA' : '#E2E2E6';
            return (
              <div
                key={level}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: bg,
                  borderRadius: 10,
                  padding: '5px 2px 4px',
                  border: isCurrent ? '1.5px solid #E3A93A' : '1px solid transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 7.5,
                    fontWeight: 700,
                    color: isCurrent ? '#7a5a12' : isPast ? '#5a4a8f' : '#6f6f78',
                  }}
                >
                  Lv.{level}
                </span>
                <img
                  src={imageForLevel(level)}
                  alt={`레벨 ${level} 캐릭터`}
                  width={44}
                  height={44}
                  style={{ display: 'block', marginTop: 2, objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
