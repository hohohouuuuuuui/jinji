import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface CustomRoomSummary {
  id: string;
  topic_id: string;
  topic_title: string;
  status: 'waiting' | 'active';
  host_nickname: string | null;
  seat_a: string | null;
  seat_b: string | null;
  allow_profanity: boolean;
  duration_minutes: number;
  created_at: string;
}

// Live list of user-created rooms still open (waiting for an opponent, or
// already active) so a second person has somewhere to actually find and
// join a room someone else just made. Also returns a manual refetch so the
// creator's own view can update immediately instead of waiting on the
// realtime round-trip.
export function useCustomRooms(): [CustomRoomSummary[], () => void] {
  const [rooms, setRooms] = useState<CustomRoomSummary[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, topic_id, topic_title, status, host_nickname, seat_a, seat_b, allow_profanity, duration_minutes, created_at')
      .eq('is_custom', true)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });
    // 방어적 중복 제거: 같은 id가 혹시라도 두 번 오더라도 목록에 한 번만 보이게.
    const rows = (data as CustomRoomSummary[]) ?? [];
    const deduped = Array.from(new Map(rows.map((r) => [r.id, r])).values());
    setRooms(deduped);
  }, []);

  useEffect(() => {
    load();

    // is_custom=true인 방 변경에만 반응한다 — 필터 없이 테이블 전체를 구독하면
    // 이 목록과 무관한 다른 방(자동 매칭, 발언 순서 등)의 변경에도 매번
    // 다시 불러오면서 목록이 잠깐씩 깜빡이는 원인이 됐다.
    const channel = supabase
      .channel('custom-rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'is_custom=eq.true' }, () => load())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [load]);

  return [rooms, load];
}
