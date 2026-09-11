interface ChangeModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChangeModal({ open, onCancel, onConfirm }: ChangeModalProps) {
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
        padding: 30,
        animation: 'jz-fade .2s ease',
      }}
    >
      <div style={{ background: '#fff', borderRadius: 26, padding: '26px 20px', width: '100%', textAlign: 'center', animation: 'jz-pop .3s ease' }}>
        <div style={{ fontSize: 34 }}>🔁</div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.6, color: '#17171a', marginTop: 10 }}>
          생각이 바뀜을 선언?
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#4a4750', marginTop: 8 }}>다음 티어로 가는 유일한 조건</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#4a4750' }}
          >
            아직
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, cursor: 'pointer', background: '#17171a', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#fff' }}
          >
            선언
          </button>
        </div>
      </div>
    </div>
  );
}
