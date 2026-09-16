const KIND_LABEL = { chat: '1:1 대화', debate: '2:2 토론', clash: '1:1 격돌' } as const;

interface WaitingRoomTabProps {
  topicTitle: string;
  kind: 'chat' | 'debate' | 'clash';
  isHost: boolean;
  onCancel: () => void;
  onBack: () => void;
}

// 방을 만들었거나(방장) 이미 들어가 있는데 상대가 아직 없는 상태 —
// 예전에는 이 경우 "참여중인 방" 목록에서 클릭해도 아무 반응이 없었다.
// 이제는 눌러서 바로 들어올 수 있고, 여기서 상대를 기다리다가 상대가
// 들어오면(실시간으로 room.status가 active로 바뀌면) 자동으로 채팅
// 화면으로 넘어간다.
export function WaitingRoomTab({ topicTitle, kind, isHost, onCancel, onBack }: WaitingRoomTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'jz-fade .25s ease' }}>
      <div style={{ flex: 'none', margin: '16px 16px 0', background: '#17171a', borderRadius: 22, padding: '13px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8b4bd' }} />
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: '#c9c6cd' }}>
            대기 중 · {KIND_LABEL[kind]}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginTop: 9 }}>{topicTitle}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 34 }}>⏳</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#17171a' }}>상대를 기다리고 있어요</div>
        <div style={{ fontSize: 12, color: '#78747e', lineHeight: 1.6 }}>
          다른 사람이 들어오면 대화가 자동으로 시작돼요.
          <br />
          다른 탭을 보다가 다시 들어와도 괜찮아요.
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', gap: 8, padding: '10px 20px 20px' }}>
        <button
          onClick={onBack}
          style={{ flex: 1, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 14, fontSize: 13, fontWeight: 700, color: '#17171a' }}
        >
          목록으로
        </button>
        {isHost && (
          <button
            onClick={onCancel}
            style={{ flex: 1, cursor: 'pointer', background: 'none', border: '1.5px solid #e2c3ce', borderRadius: 999, padding: 14, fontSize: 13, fontWeight: 700, color: '#a05a7a' }}
          >
            방 취소하기
          </button>
        )}
      </div>
    </div>
  );
}
