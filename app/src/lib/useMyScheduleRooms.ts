import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { SCHEDULE } from '../data';
import type { RoomKind } from './db-types';

export interface MyScheduleRoomSummary {
  topic_id: string;
  topic_title: string;
  status: 'waiting' | 'active';
  kind: RoomKind;
}

const SCHEDULE_TOPIC_IDS = SCHEDULE.filter((row) => row.topicId).map((row) => row.topicId!);

// 시간표(1/2/3번 자동생성 방)는 커스텀 방과 달리 "실시간 목록" 자체가
// 없어서, 새로고침하거나 방을 여러 개 동시에 오가면 내가 지금 대기 중이거나
// 참여 중인 스케줄 방이 "참여중인 방"에서 빠져 보였다. 여기서 스케줄
// 토픽들만 따로 조회해서 내 닉네임이 낀 열려있는 방을 찾아 목록으로 준다.
export function useMyScheduleRooms(nickname: string | null): [MyScheduleRoomSummary[], () => void] {
  const [rooms, setRooms] = useState<MyScheduleRoomSummary[]>([]);

  const load = useCallback(async () => {
    if (!nickname || SCHEDULE_TOPIC_IDS.length === 0) {
      setRooms([]);
      return;
    }
    const { data } = await supabase
      .from('rooms')
      .select('topic_id, topic_title, status, kind, seat_a, seat_b, team_a_member2, team_b_member2')
      .in('topic_id', SCHEDULE_TOPIC_IDS)
      .in('status', ['waiting', 'active'])
      .eq('vs_ai', false);

    type Row = { topic_id: string; topic_title: string; status: 'waiting' | 'active'; kind: RoomKind; seat_a: string | null; seat_b: string | null; team_a_member2: string | null; team_b_member2: string | null };
    const rows = (data as Row[] | null) ?? [];
    const mine = rows.filter(
      (r) => r.seat_a === nickname || r.seat_b === nickname || r.team_a_member2 === nickname || r.team_b_member2 === nickname,
    );
    setRooms(mine.map((r) => ({ topic_id: r.topic_id, topic_title: r.topic_title, status: r.status, kind: r.kind })));
  }, [nickname]);

  useEffect(() => {
    load();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 400);
    };

    const channel = supabase
      .channel('my-schedule-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'is_custom=eq.false' }, scheduleLoad)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      channel.unsubscribe();
    };
  }, [load]);

  return [rooms, load];
}
