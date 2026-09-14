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
    setRooms((data as CustomRoomSummary[]) ?? []);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('custom-rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => load())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [load]);

  return [rooms, load];
}
