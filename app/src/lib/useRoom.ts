import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { AXIS_LABEL_KO } from './moderation';
import { endorseChangeFor } from './useProfile';
import type { LogBadge, MessageRow, ModerationResult, RoomRow, Seat } from './db-types';

export type MatchPhase = 'idle' | 'matching' | 'waiting' | 'active' | 'error';

const ACK_LIMIT = 3;
const MUTE_SECONDS = 30;
const AI_OPPONENT_NAME = 'AI 논객';

export interface StillmanResult {
  good: boolean;
  feedback: string;
}

export interface CreateRoomRules {
  allowProfanity: boolean;
  durationMinutes: number;
  handLimit: number;
}

interface UseRoomResult {
  phase: MatchPhase;
  room: RoomRow | null;
  mySeat: Seat | null;
  messages: MessageRow[];
  error: string | null;
  join: (topicId: string, topicTitle: string, vsAI?: boolean, skipBriefing?: boolean) => Promise<void>;
  createCustomRoom: (topicTitle: string, rules: CreateRoomRules) => Promise<string | null>;
  endSessionAsHost: () => Promise<void>;
  leave: () => void;
  cancelJoin: () => Promise<void>;
  send: (text: string) => Promise<ModerationResult | null>;
  ack: (messageId: number) => Promise<void>;
  raiseHand: () => Promise<void>;
  declareChange: () => Promise<void>;
  endorseMindChange: (messageId: number, declarerNickname: string) => Promise<void>;
  dispute: (messageId: number) => Promise<void>;
  submitStillman: (summary: string) => Promise<StillmanResult>;
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
  const cancelledRef = useRef(false);

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
    async (topicId: string, topicTitle: string, vsAI = false, skipBriefing = false) => {
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
          if (!skipBriefing) await generateBriefingIfNeeded(created as RoomRow);
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

        if (cancelledRef.current) {
          cancelledRef.current = false;
          await supabase.from('rooms').delete().eq('id', created.id).eq('status', 'waiting');
          return;
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

  // 방 생성: 방장이 직접 주제와 규칙(욕설 허용 여부·총 시간·손들기 횟수)을
  // 정해서 대기방을 만든다. 다른 사람이 기존 join()으로 이 topic_id를
  // 찾아 들어오면 자동으로 매칭된다 — 방 찾기/합류 로직은 그대로 재사용.
  const createCustomRoom = useCallback(
    async (topicTitle: string, rules: CreateRoomRules): Promise<string | null> => {
      if (!nickname) return null;
      setPhase('matching');
      setError(null);
      try {
        const topicId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { data: created, error: createErr } = await supabase
          .from('rooms')
          .insert({
            topic_id: topicId,
            topic_title: topicTitle,
            seat_a: nickname,
            status: 'waiting',
            host_nickname: nickname,
            is_custom: true,
            allow_profanity: rules.allowProfanity,
            duration_minutes: rules.durationMinutes,
            hand_limit: rules.handLimit,
            hand_left_a: rules.handLimit,
            hand_left_b: rules.handLimit,
          })
          .select()
          .single();

        if (createErr || !created) throw createErr ?? new Error('room creation failed');

        if (cancelledRef.current) {
          cancelledRef.current = false;
          await supabase.from('rooms').delete().eq('id', created.id).eq('status', 'waiting');
          return null;
        }

        setRoom(created as RoomRow);
        setMySeat('A');
        setPhase('waiting');
        setMessages([]);
        subscribe(created.id);
        return topicId;
      } catch (err) {
        console.error('createCustomRoom failed', err);
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
        return null;
      }
    },
    [nickname, subscribe],
  );

  // 방장 전용 종료 권한: 참가자 한쪽이 조용히 나가는 것과 달리, 방장이
  // 끝내면 즉시 양쪽 모두에게 종료가 통지되고 세션이 닫힌다.
  const endSessionAsHost = useCallback(async () => {
    if (!room || !nickname || room.host_nickname !== nickname || room.status === 'closed') return;
    await supabase.from('messages').insert({
      room_id: room.id,
      seat: 'SYS',
      sender: nickname,
      text: '방장이 토론을 종료했습니다.',
      kind: 'session_closed',
    });
    await supabase.from('rooms').update({ status: 'closed' }).eq('id', room.id);
  }, [room, nickname]);

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

  // Cancel a pending application before a match is found: remove the
  // waiting room we created so nobody matches into an abandoned seat.
  // If join() is still mid-flight (no room yet), flag it so it cleans
  // up the row itself the moment it's created instead of leaving it stuck.
  const cancelJoin = useCallback(async () => {
    if (room && mySeat === 'A' && room.status === 'waiting') {
      await supabase.from('rooms').delete().eq('id', room.id).eq('status', 'waiting');
    } else if (phase === 'matching') {
      cancelledRef.current = true;
    }
    leave();
  }, [room, mySeat, phase, leave]);

  const send = useCallback(
    async (text: string) => {
      if (!room || !mySeat || !nickname || room.status === 'closed') return null;
      const mutedUntil = mySeat === 'A' ? room.muted_until_a : room.muted_until_b;
      if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) return null;

      let moderation: ModerationResult | null = null;
      try {
        moderation = await callApi<ModerationResult>('/api/moderate', { text });
      } catch (err) {
        console.error('moderation call failed', err);
      }

      // 방장이 욕설 허용으로 완화했다면 profanity 축만 눈감아준다.
      // 조롱·인신공격 축은 방장 권한으로도 해제할 수 없다.
      if (moderation?.flagged && moderation.axis === 'profanity' && room.allow_profanity) {
        moderation = { ...moderation, flagged: false };
      }

      await supabase.from('messages').insert({
        room_id: room.id,
        seat: mySeat,
        sender: nickname,
        text,
        kind: 'chat',
        moderation,
      });

      const nextTurn: Seat = mySeat === 'A' ? 'B' : 'A';
      await supabase.from('rooms').update({ turn: nextTurn }).eq('id', room.id);

      // 6장 모더레이션 경고 처리: 1차는 비공개 토스트(App.tsx)뿐이지만,
      // 2차는 30초 발언정지, 3차는 세션 종료 — AI와 동일한 잣대를 사람에게도.
      let justClosed = false;
      if (moderation?.flagged) {
        const violationsField = mySeat === 'A' ? 'violations_a' : 'violations_b';
        const violations = (mySeat === 'A' ? room.violations_a : room.violations_b) + 1;

        if (violations >= 3) {
          justClosed = true;
          await supabase.from('messages').insert({
            room_id: room.id,
            seat: 'SYS',
            sender: 'system',
            text: '세션이 종료되었습니다 · 반복된 규정 위반',
            kind: 'session_closed',
          });
          await supabase
            .from('rooms')
            .update({ [violationsField]: violations, status: 'closed' })
            .eq('id', room.id);
        } else if (violations === 2) {
          const mutedField = mySeat === 'A' ? 'muted_until_a' : 'muted_until_b';
          await supabase
            .from('rooms')
            .update({
              [violationsField]: violations,
              [mutedField]: new Date(Date.now() + MUTE_SECONDS * 1000).toISOString(),
            })
            .eq('id', room.id);
        } else {
          await supabase
            .from('rooms')
            .update({ [violationsField]: violations })
            .eq('id', room.id);
        }
      }

      if (room.vs_ai && mySeat === 'A' && room.status === 'active' && !justClosed) {
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
              kind: 'chat',
            });

            // Hold the AI to the same moderation as a human: 3 flagged
            // replies and the session ends, same as it would for a person.
            let aiModeration: ModerationResult | null = null;
            try {
              aiModeration = await callApi<ModerationResult>('/api/moderate', { text: reply.text });
            } catch (err) {
              console.error('AI self-moderation call failed', err);
            }

            if (aiModeration?.flagged) {
              const strikes = room.ai_strikes + 1;
              await supabase.from('messages').insert({
                room_id: room.id,
                seat: 'SYS',
                sender: 'system',
                text: `⚠️ AI 발언 경고 ${strikes}/3 · ${AXIS_LABEL_KO[aiModeration.axis]}`,
                kind: 'ai_warning',
              });
              if (strikes >= 3) {
                await supabase.from('messages').insert({
                  room_id: room.id,
                  seat: 'SYS',
                  sender: 'system',
                  text: 'AI가 규칙을 3회 위반해 세션이 종료되었습니다.',
                  kind: 'session_closed',
                });
                await supabase.from('rooms').update({ ai_strikes: strikes, status: 'closed' }).eq('id', room.id);
                return;
              }
              await supabase.from('rooms').update({ ai_strikes: strikes, turn: 'A' }).eq('id', room.id);
              return;
            }

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
      kind: 'change_declare',
    });
    await supabase
      .from('rooms')
      .update({ [changedField]: changed + 1 })
      .eq('id', room.id);
  }, [room, mySeat, nickname]);

  // 7-1 어뷰징 방지: 자기 선언만으로는 진지벌레 레벨에 반영되지 않는다.
  // 상대가 이 메시지에 동의(endorse)해야 실제 프로필의 changed_count가 오른다.
  const endorseMindChange = useCallback(async (messageId: number, declarerNickname: string) => {
    await supabase.from('messages').update({ acked: true }).eq('id', messageId);
    await endorseChangeFor(declarerNickname);
  }, []);

  // 6장 오탐 대비: 세션당 1회, 내가 받은 경고를 스스로 이의제기해 무효화할 수 있다.
  const dispute = useCallback(
    async (messageId: number) => {
      if (!room || !mySeat) return;
      const usedField = mySeat === 'A' ? 'dispute_used_a' : 'dispute_used_b';
      const used = mySeat === 'A' ? room.dispute_used_a : room.dispute_used_b;
      if (used) return;

      const violationsField = mySeat === 'A' ? 'violations_a' : 'violations_b';
      const violations = Math.max(0, (mySeat === 'A' ? room.violations_a : room.violations_b) - 1);

      await supabase.from('messages').update({ disputed: true }).eq('id', messageId);
      await supabase
        .from('rooms')
        .update({ [usedField]: true, [violationsField]: violations })
        .eq('id', room.id);
    },
    [room, mySeat],
  );

  // 7장 스틸맨 배지: 상대의 최근 발언을 얼마나 정확하게 요약했는지 AI가 판정한다.
  const submitStillman = useCallback(
    async (summary: string): Promise<StillmanResult> => {
      if (!room || !mySeat || !nickname) return { good: false, feedback: '' };
      const opponentSeat: Seat = mySeat === 'A' ? 'B' : 'A';
      const opponentText = messages
        .filter((m) => m.seat === opponentSeat)
        .map((m) => m.text)
        .join('\n');

      let result: StillmanResult;
      try {
        result = await callApi<StillmanResult>('/api/stillman', {
          topic: room.topic_title,
          opponentText,
          summary,
        });
      } catch (err) {
        console.error('stillman check failed', err);
        return { good: false, feedback: '판정 중 오류가 발생했어요. 다시 시도해주세요.' };
      }

      if (result.good) {
        await supabase.from('messages').insert({
          room_id: room.id,
          seat: 'SYS',
          sender: nickname,
          text: '🫱 스틸맨 인정 · 상대 입장을 정확히 요약함',
          kind: 'stillman',
        });
      }

      return result;
    },
    [room, mySeat, nickname, messages],
  );

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

  return {
    phase,
    room,
    mySeat,
    messages,
    error,
    join,
    createCustomRoom,
    endSessionAsHost,
    leave,
    cancelJoin,
    send,
    ack,
    raiseHand,
    declareChange,
    endorseMindChange,
    dispute,
    submitStillman,
    finishAndLog,
  };
}
