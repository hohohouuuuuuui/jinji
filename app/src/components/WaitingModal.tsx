interface WaitingModalProps {
  open: boolean;
  topicTitle: string;
  onClose: () => void;
}

export function WaitingModal({ open, topicTitle, onClose }: WaitingModalProps) {
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
      <div style={{ position: 'relative', background: '#fff', borderRadius: 26, padding: '30px 22px', width: '100%', textAlign: 'center', animation: 'jz-pop .3s ease' }}>
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: '#F3F1F5',
            border: 'none',
            borderRadius: '50%',
            fontSize: 13,
            fontWeight: 700,
            color: '#4a4750',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#F586AE',
            margin: '0 auto',
            animation: 'jz-blink 1.2s infinite',
          }}
        />
        <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5, color: '#17171a', marginTop: 16 }}>
          상대를 기다리는 중
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#4a4750', marginTop: 8 }}>{topicTitle}</div>
        <div style={{ fontSize: 11, color: '#78747e', marginTop: 4 }}>
          같은 방에 다른 사람이 입장하면 자동으로 시작돼요
        </div>
        <div style={{ fontSize: 10.5, color: '#a9a5af', marginTop: 10 }}>
          신청을 취소하려면 시간표에서 "입장 신청 완료" 버튼을 다시 눌러주세요
        </div>
      </div>
    </div>
  );
}
