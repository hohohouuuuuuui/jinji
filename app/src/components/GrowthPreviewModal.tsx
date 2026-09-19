import { GrowthCharacter } from './GrowthCharacter';
import { upcomingTiers } from '../lib/growth';
import type { GrowthInfo } from '../lib/growth';

interface GrowthPreviewModalProps {
  open: boolean;
  growth: GrowthInfo;
  onClose: () => void;
}

// "?" 버튼으로 여는 미리보기 — 지금 내 단계와, 앞으로 나올 단계를 최대
// 3개까지만 보여준다(전부 다 보여주면 스포일러라서 일부러 제한).
export function GrowthPreviewModal({ open, growth, onClose }: GrowthPreviewModalProps) {
  if (!open) return null;
  const upcoming = upcomingTiers(growth.level, 3);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(17,17,19,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'jz-fade .2s ease',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 26,
          padding: '22px 20px',
          width: '100%',
          maxHeight: '82%',
          overflowY: 'auto',
          animation: 'jz-pop .3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.6, color: '#17171a' }}>진지충 진화 단계</div>
            <div style={{ fontSize: 12, color: '#78747e', marginTop: 4 }}>LV.1 ~ LV.{growth.maxLevel} · 총 4단계</div>
          </div>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', width: 30, height: 30, borderRadius: '50%', fontSize: 13, color: '#4a4750' }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 18, background: '#F7F6F9', borderRadius: 18, padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b0568f', letterSpacing: 0.5 }}>현재</div>
          <div style={{ marginTop: 6 }}>
            <GrowthCharacter stage={growth.stage} size="small" />
          </div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 900, color: '#17171a' }}>
            {growth.tierLabel} · LV.{growth.level}
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 12.5, fontWeight: 700, color: '#4a4750' }}>다음 단계</div>
        {upcoming.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>
            이미 가장 높은 단계예요 · 전설의 진지충
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {upcoming.map((tier) => (
              <div
                key={tier.stage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: '#F3F1F5',
                  borderRadius: 16,
                  padding: '12px 14px',
                }}
              >
                <div style={{ flex: 'none', width: 56, display: 'flex', justifyContent: 'center', opacity: 0.55, filter: 'grayscale(40%)' }}>
                  <GrowthCharacter stage={tier.stage} size="small" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#17171a' }}>{tier.label}</div>
                  <div style={{ fontSize: 11, color: '#78747e', marginTop: 2 }}>LV.{tier.minLevel}부터</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
