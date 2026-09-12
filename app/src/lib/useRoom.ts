import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { LogBadge, MessageRow, ModerationResult, RoomRow, Seat } from './db-types';

export type MatchPhase = 'idle' | 'matching' | 'waiting' | 'active' | 'error';

const ACK_LIMIT = 3;
const AI_OPPONENT_NAME = 'AI 논객';

interface UseRoomResult {
  phase: MatchPhase;
  room: RoomRow | null;
  mySeat: Seat | null;
  messages: MessageRow[];
  error: string | null;
  join: (topicId: string, topicTitle: string, vsAI?: boolean) => Promise<void>;
  leave: () => void;
  send: (text: string) => Promise<ModerationResult | null>;
  ack: (messageId: number) => Promise<void>;
  raiseHand: () => Promise<void>;
  declareChange: () => Promise<void>;
  finishAndLog: () => Promise<void>;
}

async function callApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useRoom(nickname: string | null): UseRoomResult {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [mySeat, setMySeat] = useState<Seat | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribe = useCallback((roomId: string) => {
    channelRef.current?.unsubscribe();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as RoomRow),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as MessageRow]),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        },
      )
      .subscribe();
    channelRef.current = channel;
  }, []);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  const generateBriefingIfNeeded = useCallback(async (roomRow: RoomRow) => {
    if (roomRow.briefing) return;
    try {
      const briefing = await callApi<RoomRow['briefing']>('/api/briefing', { topic: roomRow.topic_title });
      await supabase.from('rooms').update({ briefing }).eq('id', roomRow.id).is('briefing', null);
    } catch (err) {
      console.error('briefing generation failed', err);
    }
  }, []);

  const join = useCallback(
    async (topicId: string, topicTitle: string, vsAI = false) => {
      if (!nickname) return;
      setPhase('matching');
      setError(null);
      try {
        if (vsAI) {
          const { data: created, error: createErr } = await supabase
            .from('rooms')
            .insert({
              topic_id: topicId,
              topic_title: topicTitle,
              seat_a: nickname,
              seat_b: AI_OPPONENT_NAME,
              status: 'active',
              vs_ai: true,
            })
            .select()
            .single();

          if (createErr || !created) throw createErr ?? new Error('room creation failed');

          setRoom(created as RoomRow);
          setMySeat('A');
          setPhase('active');
          setMessages([]);
          subscribe(created.id);
          await generateBriefingIfNeeded(created as RoomRow);
          return;
        }

        const { data: waitingRoom } = await supabase
          .from('rooms')
          .select('*')
          .eq('topic_id', topicId)
          .eq('status', 'waiting')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (waitingRoom) {
          const { data: joined } = await supabase
            .from('rooms')
            .update({ seat_b: nickname, status: 'active' })
            .eq('id', waitingRoom.id)
            .eq('status', 'waiting')
            .select()
            .maybeSingle();

          if (joined) {
            setRoom(joined as RoomRow);
            setMySeat('B');
            setPhase('active');
            subscribe(joined.id);
            const { data: existingMsgs } = await supabase
              .from('messages')
              .select('*')
              .eq('room_id', joined.id)
              .order('created_at', { ascending: true });
            setMessages((existingMsgs as MessageRow[]) ?? []);
            await generateBriefingIfNeeded(joined as RoomRow);
            return;
          }
          // Someone else grabbed it between our select and update — fall through to create our own.
        }

        const { data: created, error: createErr } = await supabase
          .from('rooms')
          .insert({ topic_id: topicId, topic_title: topicTitle, seat_a: nickname, status: 'waiting' })
          .select()
          .single();

        if (createErr || !created) {
          throw createErr ?? new Error('room creation failed');
        }

        setRoom(created as RoomRow);
        setMySeat('A');
        setPhase('waiting');
        setMessages([]);
        subscribe(created.id);
      } catch (err) {
        console.error('join failed', err);
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    },
    [nickname, subscribe, generateBriefingIfNeeded],
  );

  // When the waiting side's room flips to 'active' via realtime, move phase forward.
  useEffect(() => {
    if (phase === 'waiting' && room?.status === 'active') {
      setPhase('active');
      supabase
        .from('messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => setMessages((data as MessageRow[]) ?? []));
    }
  }, [phase, room]);

  const leave = useCallback(() => {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setRoom(null);
    setMySeat(null);
    setMessages([]);
    setPhase('idle');
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!room || !mySeat || !nickname) return null;
      let moderation: ModerationResult | null = null;
      try {
        moderation = await callApi<ModerationResult>('/api/moderate', { text });
      } catch (err) {
        console.error('moderation call failed', err);
      }

      await supabase.from('messages').insert({
        room_id: room.id,
        seat: mySeat,
        sender: nickname,
        text,
        moderation,
      });

      const nextTurn: Seat = mySeat === 'A' ? 'B' : 'A';
      await supabase.from('rooms').update({ turn: nextTurn }).eq('id', room.id);

      if (room.vs_ai && mySeat === 'A') {
        const history = messages
          .map((m) => ({ seat: m.seat, text: m.text }))
          .concat([{ seat: 'A', text }]);
        callApi<{ text: string }>('/api/opponent', { topic: room.topic_title, history })
          .then(async (reply) => {
            await supabase.from('messages').insert({
              room_id: room.id,
              seat: 'B',
              sender: AI_OPPONENT_NAME,
              text: reply.text,
            });
            await supabase.from('rooms').update({ turn: 'A' }).eq('id', room.id);
          })
          .catch((err) => console.error('opponent reply failed', err));
      }

      return moderation;
    },
    [room, mySeat, nickname, messages],
  );

  const ack = useCallback(
    async (messageId: number) => {
      if (!room || !mySeat) return;
      const leftField = mySeat === 'A' ? 'acks_left_a' : 'acks_left_b';
      const left = mySeat === 'A' ? room.acks_left_a : room.acks_left_b;
      if (left <= 0) return;
      await supabase.from('messages').update({ acked: true }).eq('id', messageId);
      await supabase
        .from('rooms')
        .update({ [leftField]: left - 1 })
        .eq('id', room.id);
    },
    [room, mySeat],
  );

  const raiseHand = useCallback(async () => {
    if (!room || !mySeat) return;
    const leftField = mySeat === 'A' ? 'hand_left_a' : 'hand_left_b';
    const left = mySeat === 'A' ? room.hand_left_a : room.hand_left_b;
    if (left <= 0) return;
    await supabase
      .from('rooms')
      .update({ [leftField]: left - 1 })
      .eq('id', room.id);
  }, [room, mySeat]);

  const declareChange = useCallback(async () => {
    if (!room || !mySeat || !nickname) return;
    const changedField = mySeat === 'A' ? 'changed_a' : 'changed_b';
    const changed = mySeat === 'A' ? room.changed_a : room.changed_b;
    await supabase.from('messages').insert({
      room_id: room.id,
      seat: 'SYS',
      sender: nickname,
      text: '생각이 바뀜 선언 🔁',
    });
    await supabase
      .from('rooms')
      .update({ [changedField]: changed + 1 })
      .eq('id', room.id);
  }, [room, mySeat, nickname]);

  const finishAndLog = useCallback(async () => {
    if (!room || !mySeat || !nickname) {
      leave();
      return;
    }
    const changed = mySeat === 'A' ? room.changed_a : room.changed_b;
    const receivedAcks = ACK_LIMIT - (mySeat === 'A' ? room.acks_left_b : room.acks_left_a);

    const badges: LogBadge[] = [];
    if (changed > 0) {
      badges.push({
        label: `🔁 생각 바뀜${changed > 1 ? ` ${changed}` : ''}`,
        bg: '#FBDFEC',
        color: '#8d3f70',
      });
    }
    if (receivedAcks > 0) {
      badges.push({ label: `🤍 인정 ${receivedAcks}`, bg: '#F3F1F5', color: '#4a4750' });
    }
    if (badges.length === 0) {
      badges.push({ label: '참가 완료', bg: '#F3F1F5', color: '#4a4750' });
    }

    const myMessages = messages.filter((m) => m.seat === mySeat);
    const lastMine = myMessages[myMessages.length - 1];
    const quote = lastMine ? `"${lastMine.text}"` : `"${room.topic_title}"에 참가했다.`;

    await supabase.from('logs').insert({
      nickname,
      topic_title: room.topic_title,
      quote,
      badges,
    });

    leave();
  }, [room, mySeat, nickname, messages, leave]);

  return { phase, room, mySeat, messages, error, join, leave, send, ack, raiseHand, declareChange, finishAndLog };
}
