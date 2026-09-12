interface StillmanModalProps {
  open: boolean;
  text: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
  feedback: string | null;
  good: boolean;
}

export function StillmanModal({
  open,
  text,
  onTextChange,
  onSubmit,
  onClose,
  submitting,
  feedback,
  good,
}: StillmanModalProps) {
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
      <div style={{ background: '#fff', borderRadius: 26, padding: '24px 20px', width: '100%', animation: 'jz-pop .3s ease' }}>
        <div style={{ fontSize: 30, textAlign: 'center' }}>🫱</div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5, color: '#17171a', marginTop: 8, textAlign: 'center' }}>
          스틸맨 시도
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#4a4750', marginTop: 6, textAlign: 'center' }}>
          상대 주장을 왜곡 없이, 상대보다 더 명확하게 요약해보세요
        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="상대의 입장을 한두 문장으로 요약해보세요"
          rows={4}
          style={{
            width: '100%',
            marginTop: 16,
            background: '#F3F1F5',
            border: 'none',
            borderRadius: 16,
            padding: '13px 15px',
            fontSize: 14,
            color: '#17171a',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />

        {feedback && (
          <div
            style={{
              marginTop: 12,
              background: good ? '#E5F5E9' : '#FFF3D6',
              color: good ? '#3a5f48' : '#63510f',
              borderRadius: 16,
              padding: '12px 14px',
              fontSize: 12.5,
              lineHeight: 1.55,
              fontWeight: 500,
            }}
          >
            {good ? '🫱 스틸맨 인정! ' : ''}
            {feedback}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#4a4750' }}
          >
            닫기
          </button>
          <button
            onClick={onSubmit}
            disabled={!text.trim() || submitting}
            style={{
              flex: 1,
              cursor: text.trim() && !submitting ? 'pointer' : 'not-allowed',
              background: text.trim() && !submitting ? '#17171a' : '#E4E1E8',
              color: text.trim() && !submitting ? '#fff' : '#a9a5af',
              border: 'none',
              borderRadius: 999,
              padding: 15,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {submitting ? '판정 중…' : '제출'}
          </button>
        </div>
      </div>
    </div>
  );
}
