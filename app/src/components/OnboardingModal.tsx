interface OnboardingModalProps {
  open: boolean;
  onTry: () => void;
  onSkip: () => void;
}

export function OnboardingModal({ open, onTry, onSkip }: OnboardingModalProps) {
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
      <div style={{ background: '#fff', borderRadius: 26, padding: '28px 22px', width: '100%', textAlign: 'center', animation: 'jz-pop .3s ease' }}>
        <div style={{ fontSize: 34 }}>👋</div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.6, color: '#17171a', marginTop: 10 }}>
          처음이시네요
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#4a4750', marginTop: 8 }}>
          규칙은 설명보다 체감이 빨라요. 실제 대화 전에 AI와 짧게 리허설해볼까요?
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={onSkip}
            style={{ flex: 1, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#4a4750' }}
          >
            건너뛰기
          </button>
          <button
            onClick={onTry}
            style={{ flex: 1, cursor: 'pointer', background: '#17171a', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#fff' }}
          >
            리허설 해보기
          </button>
        </div>
      </div>
    </div>
  );
}
