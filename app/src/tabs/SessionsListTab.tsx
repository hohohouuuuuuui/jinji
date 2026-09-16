import { SCHEDULE } from '../data';
import { useTopicSeatCounts } from '../lib/useTopicSeatCounts';
import type { CustomRoomSummary } from '../lib/useCustomRooms';

function parseCapacity(bottom: string): number {
  const digits = bottom.match(/\d+/);
  return digits ? Number(digits[0]) : Infinity;
}

const KIND_LABEL = { chat: '대화', debate: '토론', clash: '격돌' } as const;

function isParticipant(r: CustomRoomSummary, nickname: string): boolean {
  return r.host_nickname === nickname || r.seat_a === nickname || r.seat_b === nickname || r.team_a_member2 === nickname || r.team_b_member2 === nickname;
}

function customRoomCta(r: CustomRoomSummary): string {
  if (r.kind === 'debate' && r.status === 'active') return '팀 합류하기';
  return '참여하기';
}

export interface MyRoomEntry {
  topicId: string;
  topicTitle: string;
  status: 'waiting' | 'active';
}

interface SessionsListTabProps {
  nickname: string;
  customRooms: CustomRoomSummary[];
  myRooms: MyRoomEntry[];
  onEnterMyRoom: (topicId: string) => void;
  onJoinRoom: (topicId: string, topicTitle: string) => void;
}

export function SessionsListTab({ nickname, customRooms, myRooms, onEnterMyRoom, onJoinRoom }: SessionsListTabProps) {
  const topicIds = SCHEDULE.filter((row) => row.topicId).map((row) => row.topicId!);
  const seatCounts = useTopicSeatCounts(topicIds);
  const myTopicIds = new Set(myRooms.map((r) => r.topicId));

  const joinableSchedule = SCHEDULE.filter((row) => {
    if (row.room.locked || !row.topicId || myTopicIds.has(row.topicId)) return false;
    const count = seatCounts[row.topicId] ?? 0;
    return count < parseCapacity(row.seats.bottom);
  });
  const joinableCustom = customRooms.filter((r) => {
    if (isParticipant(r, nickname)) return false;
    if (r.status === 'waiting') return true;
    if (r.status !== 'active') return false;
    // 진행 중인 2:2 토론방은 남은 팀 자리가 있으면 들어갈 수 있다.
    if (r.kind === 'debate') return !r.team_a_member2 || !r.team_b_member2;
    return false;
  });

  return (
    <div style={{ padding: '18px 20px 24px', animation: 'jz-fade .25s ease' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, letterSpacing: -0.8, color: '#17171a' }}>토론방</h2>
      <p style={{ margin: 0, fontSize: 12, color: '#78747e' }}>참여 중인 방과 참여할 수 있는 방을 한눈에 확인해요</p>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#17171a' }}>참여중인 방 · 참여예정인 방</div>
        {myRooms.length === 0 ? (
          <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>참여 중인 방이 없어요</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {myRooms.map((r) =>
              r.status === 'active' ? (
                <button
                  key={r.topicId}
                  onClick={() => onEnterMyRoom(r.topicId)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: '#FEF7FA',
                    border: '1.5px solid #F586AE',
                    borderRadius: 16,
                    padding: '13px 15px',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#17171a' }}>{r.topicTitle}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b0568f', marginTop: 4 }}>진행 중 · 눌러서 입장</div>
                </button>
              ) : (
                // 상대가 아직 안 왔어도(대기 중이어도) 바로 들어가서 기다릴 수 있다.
                <button
                  key={r.topicId}
                  onClick={() => onEnterMyRoom(r.topicId)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: '#F3F1F5',
                    border: '1.5px solid transparent',
                    borderRadius: 16,
                    padding: '13px 15px',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#17171a' }}>{r.topicTitle}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#78747e', marginTop: 4 }}>상대를 기다리는 중 · 눌러서 입장</div>
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#17171a' }}>참여할 방</div>
        {joinableCustom.length === 0 && joinableSchedule.length === 0 ? (
          <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>참여할 수 있는 방이 없어요</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {joinableCustom.map((r) => (
              <button
                key={r.id}
                onClick={() => onJoinRoom(r.topic_id, r.topic_title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: '#F3F1F5',
                  border: 'none',
                  borderRadius: 16,
                  padding: '13px 15px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#17171a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    👑 {r.topic_title}
                  </div>
                  <div style={{ fontSize: 11, color: '#78747e', marginTop: 3 }}>
                    {KIND_LABEL[r.kind]} · 방장 {r.host_nickname} · {r.status === 'active' ? '진행중' : '모집중'}
                  </div>
                </div>
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: '#b0568f' }}>{customRoomCta(r)}</span>
              </button>
            ))}
            {joinableSchedule.map((row) => (
              <button
                key={row.topicId}
                onClick={() => onJoinRoom(row.topicId!, row.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: '#F3F1F5',
                  border: 'none',
                  borderRadius: 16,
                  padding: '13px 15px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#17171a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.room.id}번 방 · {row.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#78747e', marginTop: 3 }}>{row.time}</div>
                </div>
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, color: '#b0568f' }}>참여하기</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
