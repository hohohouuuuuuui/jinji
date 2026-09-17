import { useSpectate } from '../lib/useSpectate';
import { useVotes } from '../lib/useVotes';
import { VoteGauge } from '../components/VoteGauge';

interface ClashSpectatorTabProps {
  topicId: string;
  nickname: string;
  // false면 읽기 전용 관전만 된다(2번방) — true면 A/B 투표까지 가능하다(3번방, 커스텀 격돌방).
  allowVote?: boolean;
  onExit: () => void;
}

export function ClashSpectatorTab({ topicId, nickname, allowVote = true, onExit }: ClashSpectatorTabProps) {
  const { room, messages } = useSpectate(topicId);
  const { counts, myVote, castVote } = useVotes(allowVote ? (room?.id ?? null) : null, nickname);

  const aLabel = room?.seat_a ?? 'A';
  const bLabel = room?.seat_b ?? 'B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'jz-fade .25s ease' }}>
      <div style={{ flex: 'none', margin: '0 16px', background: '#17171a', borderRadius: 22, padding: '13px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button
            onClick={onExit}
            style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#c9c6cd', padding: 0 }}
          >
            ← 목록으로
          </button>
          <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: '#F7B3D4' }}>
            👀 관전 중
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginTop: 9 }}>
          {room ? room.topic_title : '불러오는 중…'}
        </div>
      </div>

      {room && allowVote && <VoteGauge counts={counts} aLabel={aLabel} bLabel={bLabel} />}

      {room && allowVote && (
        <div style={{ flex: 'none', display: 'flex', gap: 8, padding: '8px 16px 4px' }}>
          <button
            onClick={() => castVote('A')}
            disabled={myVote === 'A'}
            style={{
              flex: 1,
              cursor: myVote === 'A' ? 'default' : 'pointer',
              background: myVote === 'A' ? '#F586AE' : '#FEF7FA',
              border: '1.5px solid #F586AE',
              borderRadius: 999,
              padding: '11px 0',
              fontSize: 12.5,
              fontWeight: 700,
              color: myVote === 'A' ? '#fff' : '#b0568f',
            }}
          >
            {myVote === 'A' ? `✓ ${aLabel} 지지` : `${aLabel}에게 투표`}
          </button>
          <button
            onClick={() => castVote('B')}
            disabled={myVote === 'B'}
            style={{
              flex: 1,
              cursor: myVote === 'B' ? 'default' : 'pointer',
              background: myVote === 'B' ? '#8ED4F0' : '#EEF9FD',
              border: '1.5px solid #8ED4F0',
              borderRadius: 999,
              padding: '11px 0',
              fontSize: 12.5,
              fontWeight: 700,
              color: myVote === 'B' ? '#fff' : '#1f5a75',
            }}
          >
            {myVote === 'B' ? `✓ ${bLabel} 지지` : `${bLabel}에게 투표`}
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!room && <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>방을 찾을 수 없어요</div>}
        {room &&
          messages
            .filter((m) => m.seat !== 'SYS')
            .map((m) => (
              <div
                key={m.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: m.seat === 'A' ? 'flex-start' : 'flex-end', gap: 5 }}
              >
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, color: '#78747e', padding: '0 4px' }}>
                  {m.sender}
                </div>
                <div
                  style={{
                    maxWidth: '84%',
                    background: m.seat === 'A' ? '#F3F1F5' : '#F7B3D4',
                    borderRadius: 22,
                    padding: '13px 17px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: m.seat === 'A' ? '#17171a' : '#3d1029',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
