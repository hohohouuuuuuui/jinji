import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { VoteRow, VoteSide } from './db-types';

export interface VoteCounts {
  A: number;
  B: number;
}

// 격돌방 상단 투표 게이지: 관전자가 A/B 중 누구 말이 맞다고 보는지 1인 1표로
// 던지고, 모두에게 실시간으로 같은 집계가 보인다.
export function useVotes(roomId: string | null, nickname: string | null): {
  counts: VoteCounts;
  myVote: VoteSide | null;
  castVote: (side: VoteSide) => Promise<void>;
} {
  const [counts, setCounts] = useState<VoteCounts>({ A: 0, B: 0 });
  const [myVote, setMyVote] = useState<VoteSide | null>(null);

  const load = useCallback(async () => {
    if (!roomId) {
      setCounts({ A: 0, B: 0 });
      setMyVote(null);
      return;
    }
    const { data } = await supabase.from('votes').select('side, voter_nickname').eq('room_id', roomId);
    const rows = (data as Pick<VoteRow, 'side' | 'voter_nickname'>[]) ?? [];
    const next: VoteCounts = { A: 0, B: 0 };
    for (const row of rows) next[row.side]++;
    setCounts(next);
    setMyVote(rows.find((r) => r.voter_nickname === nickname)?.side ?? null);
  }, [roomId, nickname]);

  useEffect(() => {
    load();
    if (!roomId) return;
    const channel = supabase
      .channel(`votes:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, () => load())
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [roomId, load]);

  const castVote = useCallback(
    async (side: VoteSide) => {
      if (!roomId || !nickname) return;
      await supabase.from('votes').upsert({ room_id: roomId, voter_nickname: nickname, side }, { onConflict: 'room_id,voter_nickname' });
      setMyVote(side);
      load();
    },
    [roomId, nickname, load],
  );

  return { counts, myVote, castVote };
}
