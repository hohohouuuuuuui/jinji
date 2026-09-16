import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { MessageRow, RoomRow } from './db-types';

// 격돌방 관전 전용 — 자리를 차지하지 않고 읽기 전용으로 방 상태와 대화를
// 실시간으로 지켜본다. useRoom과 달리 seat_a/seat_b 어디에도 앉지 않는다.
export function useSpectate(topicId: string | null): { room: RoomRow | null; messages: MessageRow[] } {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  useEffect(() => {
    if (!topicId) {
      setRoom(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // 자동생성 방(시간표 topic_id)은 같은 topic_id로 여러 번 방이 만들어질 수
      // 있어서, 그냥 "가장 최근" 행을 고르면 지금은 끝났거나 아무도 안 들어온
      // 낡은 방을 관전하게 될 수 있다 — 지금 진행 중인(active) 방을 우선한다.
      const { data: activeRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('topic_id', topicId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const roomRow =
        activeRoom ??
        (
          await supabase
            .from('rooms')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ).data;
      if (cancelled || !roomRow) return;
      setRoom(roomRow as RoomRow);
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomRow.id)
        .order('created_at', { ascending: true });
      if (!cancelled) setMessages((msgs as MessageRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`spectate:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => setRoom(payload.new as RoomRow),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as MessageRow]),
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [room?.id]);

  return { room, messages };
}
