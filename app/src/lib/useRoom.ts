import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { AXIS_LABEL_KO } from './moderation';
import { endorseChangeFor } from './useProfile';
import type { LogBadge, MessageRow, ModerationResult, RoomKind, RoomRow, Seat } from './db-types';

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

// join()/rejoin()/recoverMyRoom() 모두 "방에 붙었다"는 결과를 이 형태로
// 돌려준다 — 호출한 쪽(App.tsx)이 room state가 다음 렌더에 반영되길
// 기다리지 않고(그 사이 다른 화면으로 넘어갔을 수 있는 stale closure
// 문제 없이) 곧바로 그 방 row를 갖고 화면을 결정할 수 있게 하기 위해서다.
export type AttachResult = { status: 'waiting' | 'active' | 'closed'; room: RoomRow } | { status: 'error' } | null;

interface UseRoomResult {
  phase: MatchPhase;
  room: RoomRow | null;
  mySeat: Seat | null;
  isTeamMember2: boolean;
  messages: MessageRow[];
  error: string | null;
  join: (
    topicId: string,
    topicTitle: string,
    vsAI?: boolean,
    skipBriefing?: boolean,
    kind?: RoomKind,
  ) => Promise<AttachResult>;
  createCustomRoom: (topicTitle: string, rules: CreateRoomRules, kind: RoomKind) => Promise<string | null>;
  rejoin: (topicId: string) => Promise<AttachResult>;
  recoverMyRoom: () => Promise<AttachResult>;
  joinTeamSecondSeat: (topicId: string, side: Seat) => Promise<boolean>;
  endSessionAsHost: () => Promise<boolean>;
  leave: () => void;
  cancelJoin: () => Promise<void>;
  send: (text: string, endTurn: boolean) => Promise<ModerationResult | null>;
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

// Supabase가 던지는 PostgrestError는 Error를 상속하지 않는 평범한 객체라
// `err instanceof Error`가 항상 false다 — 그걸 몰랐던 `String(err)` 폴백은
// "[object Object]" 같은 읽을 수 없는 문구를 화면에 그대로 띄웠다.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return String(err);
}

// finishAndLog()(참가자)와 endSessionAsHost()(방장) 둘 다 "내 참여를 기록으로
// 남긴다"는 동작은 똑같다 — 방장도 세션을 끝내는 순간이 곧 자신의 참가 완료
// 시점이므로 참가기록에 남아야 한다. 단, 실제로 발언을 하나도 안 남겼다면
// (예: 방장이 아무 말 없이 바로 종료) 참가기록 자체를 만들지 않는다.
async function writeParticipationLog(room: RoomRow, mySeat: Seat, nickname: string, messages: MessageRow[]) {
  // seat만으로 거르면 2:2 토론방에서 같은 팀 2명의 발언이 섞인다 — sender(닉네임)로
  // 걸러야 내 발언만 정확히 모인다.
  // kind==='chat'만 실제 발언이다 — 방장이 "종료"를 누르면 시스템 메시지
  // ("방장이 토론을 종료했습니다.")가 sender: nickname으로 들어가는데, 이건
  // 시스템이 남긴 안내지 방장의 발언이 아니다. 이걸 걸러내지 않으면 한
  // 마디도 안 한 방장이 "단순 방장으로 참가"했을 뿐인데도 그 안내 문구가
  // 어록처럼 참가기록에 남는다.
  const myMessageTexts = messages.filter((m) => m.sender === nickname && m.kind === 'chat').map((m) => m.text);
  if (myMessageTexts.length === 0) return;

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

  let quote = `"${myMessageTexts[myMessageTexts.length - 1]}"`;
  try {
    const summarized = await callApi<{ quote: string }>('/api/summarize-quote', {
      topic: room.topic_title,
      myMessages: myMessageTexts,
    });
    if (summarized.quote) quote = `"${summarized.quote}"`;
  } catch (err) {
    console.error('quote summarization failed', err);
  }

  await supabase.from('logs').insert({
    nickname,
    topic_title: room.topic_title,
    quote,
    badges,
  });
}

// 방을 닫는(status: 'closed') 모든 경로(방장 종료, 3회 위반 자동 종료,
// AI 3회 위반 자동 종료, 대표 발언자 나가기)가 공유한다. update()가 조용히
// 실패하면(네트워크 문제 등) 실제 DB는 그대로 active인데 화면만 닫힌 것처럼
// 보이는 문제가 있었다 — 업데이트된 row를 직접 확인하고, 실패하면 몇 번
// 재시도한다.
async function closeRoomWithRetry(roomId: string, extraFields: Record<string, unknown> = {}): Promise<RoomRow | null> {
  let closedRow: RoomRow | null = null;
  for (let attempt = 0; attempt < 3 && !closedRow; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
    const { data, error } = await supabase
      .from('rooms')
      .update({ ...extraFields, status: 'closed' })
      .eq('id', roomId)
      .select()
      .maybeSingle();
    if (error) console.error('room close update failed', error);
    if (data) closedRow = data as RoomRow;
  }
  return closedRow;
}

export function useRoom(nickname: string | null): UseRoomResult {
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [mySeat, setMySeat] = useState<Seat | null>(null);
  const [isTeamMember2, setIsTeamMember2] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const stopRoomPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
  }, []);
  // 방장은 "종료"를 누르는 순간 자기 참가기록을 남기지만, 참가자는 그런
  // 전용 버튼이 없다 — "나가기 · 참가기록 남기기"를 직접 눌러야만 기록이
  // 남다 보니, 방장이 먼저 종료해버리면 참가자는 누르는 걸 잊고 그냥
  // 다른 탭으로 넘어가서 기록이 안 남는 경우가 많았다. 방 id별로 한 번만
  // 기록하도록 추적해서, 아래에서 방이 닫히는 순간 참가자도 자동으로
  // 기록되게 한다(수동으로 "나가기"를 눌러도 중복 기록되지 않게).
  const loggedRoomIdsRef = useRef<Set<string>>(new Set());

  const subscribe = useCallback(
    (roomId: string) => {
      channelRef.current?.unsubscribe();
      stopRoomPolling();
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

      // realtime이 이벤트를 놓치는 경우를 대비한 안전망 — 채팅방 안에서는
      // 턴·인정권·뮤트·종료 여부가 계속 바뀌는데, 이걸 하나라도 놓치면
      // 상대가 답장했는데도 "상대 차례"로 멈춰있거나, 3회 위반/AI 3회
      // 위반으로 방이 닫혔는데도 계속 진행 중으로 보여 대화가 사실상
      // 막혀버린다. 주기적 재조회와 탭 복귀 시 재조회를 안전망으로 건다.
      const poll = async () => {
        const [{ data: roomRow }, { data: msgRows }] = await Promise.all([
          supabase.from('rooms').select('*').eq('id', roomId).maybeSingle(),
          supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
        ]);
        if (roomRow) setRoom(roomRow as RoomRow);
        if (msgRows) setMessages(msgRows as MessageRow[]);
      };
      pollTimerRef.current = setInterval(poll, 8000);
      const onVisible = () => {
        if (document.visibilityState === 'visible') poll();
      };
      document.addEventListener('visibilitychange', onVisible);
      visibilityHandlerRef.current = onVisible;
    },
    [stopRoomPolling],
  );

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
      stopRoomPolling();
    };
  }, [stopRoomPolling]);

  // briefing을 반환한다 — DB만 업데이트하고 끝내면, 이 함수를 부른 쪽이
  // 곧바로 room.briefing을 써야 할 때(예: 매칭 직후 브리핑 모달을 여는
  // 순간) realtime이 그 UPDATE를 되돌려줄 때까지 기다려야 해서 null로
  // 보일 수 있다.
  const generateBriefingIfNeeded = useCallback(async (roomRow: RoomRow): Promise<RoomRow['briefing']> => {
    if (roomRow.briefing) return roomRow.briefing;
    try {
      const briefing = await callApi<RoomRow['briefing']>('/api/briefing', { topic: roomRow.topic_title });
      await supabase.from('rooms').update({ briefing }).eq('id', roomRow.id).is('briefing', null);
      return briefing;
    } catch (err) {
      console.error('briefing generation failed', err);
      return null;
    }
  }, []);

  const join = useCallback(
    async (
      topicId: string,
      topicTitle: string,
      vsAI = false,
      skipBriefing = false,
      kind: RoomKind = 'chat',
    ): Promise<AttachResult> => {
      if (!nickname) return null;
      setIsTeamMember2(false);
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

          const finalCreated = created as RoomRow;
          setRoom(finalCreated);
          setMySeat('A');
          setPhase('active');
          setMessages([]);
          subscribe(created.id);
          // 브리핑 생성(AI 호출)을 기다리지 않고 바로 입장시킨다 — 기다리면
          // 그동안 "입장 신청 완료" 버튼에 멈춰있는 것처럼 보인다. 대신
          // 브리핑 모달이 "AI가 브리핑을 준비하고 있어요…" placeholder로
          // 뜬 채 기다리다가, 완성되는 대로 room 상태에 반영해 자동으로
          // 채워지게 한다.
          if (!skipBriefing) {
            generateBriefingIfNeeded(finalCreated).then((briefing) => {
              setRoom((prev) => (prev && prev.id === finalCreated.id ? { ...prev, briefing } : prev));
            });
          }
          return { status: 'active', room: finalCreated };
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
            const finalJoined = joined as RoomRow;
            setRoom(finalJoined);
            setMySeat('B');
            setPhase('active');
            subscribe(joined.id);
            const { data: existingMsgs } = await supabase
              .from('messages')
              .select('*')
              .eq('room_id', joined.id)
              .order('created_at', { ascending: true });
            setMessages((existingMsgs as MessageRow[]) ?? []);
            // 브리핑 생성을 기다리지 않고 바로 입장시킨다(위 vs_ai 분기와 동일한 이유).
            generateBriefingIfNeeded(finalJoined).then((briefing) => {
              setRoom((prev) => (prev && prev.id === finalJoined.id ? { ...prev, briefing } : prev));
            });
            return { status: 'active', room: finalJoined };
          }
          // Someone else grabbed it between our select and update — fall through to create our own.
        }

        const { data: created, error: createErr } = await supabase
          .from('rooms')
          .insert({ topic_id: topicId, topic_title: topicTitle, seat_a: nickname, status: 'waiting', kind })
          .select()
          .single();

        if (createErr || !created) {
          throw createErr ?? new Error('room creation failed');
        }

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
        return { status: 'waiting', room: created as RoomRow };
      } catch (err) {
        console.error('join failed', err);
        setError(errorMessage(err));
        setPhase('error');
        return { status: 'error' };
      }
    },
    [nickname, subscribe, generateBriefingIfNeeded],
  );

  // 방 생성: 방장이 직접 주제와 규칙(욕설 허용 여부·총 시간·손들기 횟수)을
  // 정해서 대기방을 만든다. 다른 사람이 기존 join()으로 이 topic_id를
  // 찾아 들어오면 자동으로 매칭된다 — 방 찾기/합류 로직은 그대로 재사용.
  const createCustomRoom = useCallback(
    async (topicTitle: string, rules: CreateRoomRules, kind: RoomKind): Promise<string | null> => {
      if (!nickname) return null;
      setPhase('matching');
      setError(null);
      setIsTeamMember2(false);
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
            kind,
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
        setError(errorMessage(err));
        setPhase('error');
        return null;
      }
    },
    [nickname, subscribe],
  );

  // 방 하나를 로컬 상태(room/mySeat/phase/messages)로 붙인다 — 방장이든
  // 참가자(2번째 팀원 포함)든 내 닉네임이 있는 자리를 찾아 그쪽으로 앉는다.
  // rejoin()/recoverMyRoom() 둘 다 이 로직을 공유한다.
  const applyRoomRow = useCallback(
    async (row: RoomRow): Promise<{ status: 'waiting' | 'active' | 'closed'; room: RoomRow }> => {
      // 대화가 이미 있었던 방(진행 중이든, 방금 닫혔든)은 메시지 기록을
      // 먼저 다 불러온 다음에 room/messages를 한꺼번에 반영한다 — room만
      // 먼저 반영하고 messages는 await 끝나고 나중에 반영하면, 그 사이
      // "방은 closed인데 messages는 아직 비어있는" 렌더가 한 번 끼어서
      // (아래 참가기록 자동 남기기 useEffect가 그 타이밍에 걸리면) 발언을
      // 실제로 했는데도 빈 messages로 판정해 참가기록을 놓치는 버그가 있었다.
      let msgs: MessageRow[] = [];
      if (row.status !== 'waiting') {
        const { data: existingMsgs } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', row.id)
          .order('created_at', { ascending: true });
        msgs = (existingMsgs as MessageRow[]) ?? [];
      }

      const onSeatA = row.seat_a === nickname || row.team_a_member2 === nickname;
      setRoom(row);
      setMySeat(onSeatA ? 'A' : 'B');
      setIsTeamMember2(row.team_a_member2 === nickname || row.team_b_member2 === nickname);
      setPhase(row.status === 'active' ? 'active' : 'waiting');
      subscribe(row.id);
      setMessages(msgs);
      return { status: row.status, room: row };
    },
    [nickname, subscribe],
  );

  // 특정 방(topic_id)에 다시 붙는다 — 새로고침 등으로 로컬 상태를 잃었거나,
  // 지금 붙어있는 방과 다른 내 방으로 전환해 들어갈 때 쓴다. 방장/참가자
  // 상관없이 내 닉네임이 들어있는 자리를 찾는다. 방금 닫힌 방도 찾을 수
  // 있어야 참가자가 뒤늦게(realtime을 놓치고) 다시 들어와도 참가기록이
  // 남는다.
  const rejoin = useCallback(
    async (topicId: string): Promise<AttachResult> => {
      if (!nickname) return null;
      const { data: existing } = await supabase
        .from('rooms')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const row = existing as RoomRow | null;
      if (!row) return null;
      const mine = row.seat_a === nickname || row.seat_b === nickname || row.team_a_member2 === nickname || row.team_b_member2 === nickname;
      if (!mine) return null;

      return applyRoomRow(row);
    },
    [nickname, applyRoomRow],
  );

  // topic_id도 몰라도(어느 방인지 기억 못 해도) 찾을 수 있게 전체 열린
  // 방에서 내 닉네임이 어느 자리든 있는지 뒤진다. 새로고침 등으로 로컬
  // 상태를 완전히 잃었을 때 앱이 켜지자마자 한 번 불러서 쓴다. 리허설
  // (vs_ai)은 제외.
  const recoverMyRoom = useCallback(async (): Promise<AttachResult> => {
    if (!nickname) return null;
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .in('status', ['waiting', 'active'])
      .eq('vs_ai', false)
      .order('created_at', { ascending: false });

    const mine = ((data as RoomRow[] | null) ?? []).find(
      (r) => r.seat_a === nickname || r.seat_b === nickname || r.team_a_member2 === nickname || r.team_b_member2 === nickname,
    );
    if (!mine) return null;
    return applyRoomRow(mine);
  }, [nickname, applyRoomRow]);

  // 2:2 토론방의 2번째 팀원으로 합류한다 — 대표 발언자(seat_a/seat_b)는
  // 그대로 두고, team_a_member2/team_b_member2 칸에 내 닉네임만 채운다.
  // 이미 그 팀에 2번째 팀원이 있으면 실패(false)한다.
  const joinTeamSecondSeat = useCallback(
    async (topicId: string, side: Seat): Promise<boolean> => {
      if (!nickname) return false;
      const memberField = side === 'A' ? 'team_a_member2' : 'team_b_member2';
      const { data: target } = await supabase
        .from('rooms')
        .select('*')
        .eq('topic_id', topicId)
        .eq('kind', 'debate')
        .in('status', ['waiting', 'active'])
        .is(memberField, null)
        .maybeSingle();

      if (!target) return false;

      const { data: updated } = await supabase
        .from('rooms')
        .update({ [memberField]: nickname })
        .eq('id', target.id)
        .is(memberField, null)
        .select()
        .maybeSingle();

      if (!updated) return false;

      setRoom(updated as RoomRow);
      setMySeat(side);
      setIsTeamMember2(true);
      setPhase('active');
      subscribe(updated.id);
      const { data: existingMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', updated.id)
        .order('created_at', { ascending: true });
      setMessages((existingMsgs as MessageRow[]) ?? []);
      return true;
    },
    [nickname, subscribe],
  );

  // 방장 전용 종료 권한: 참가자 한쪽이 조용히 나가는 것과 달리, 방장이
  // 끝내면 즉시 양쪽 모두에게 종료가 통지되고 세션이 닫힌다.
  const endSessionAsHost = useCallback(async (): Promise<boolean> => {
    if (!room || !nickname || room.host_nickname !== nickname || room.status === 'closed') return false;
    await supabase.from('messages').insert({
      room_id: room.id,
      seat: 'SYS',
      sender: nickname,
      text: '방장이 토론을 종료했습니다.',
      kind: 'session_closed',
    });

    const closedRow = await closeRoomWithRetry(room.id);
    if (!closedRow) return false;

    if (mySeat && !loggedRoomIdsRef.current.has(room.id)) {
      loggedRoomIdsRef.current.add(room.id);
      await writeParticipationLog(room, mySeat, nickname, messages);
    }
    // realtime 왕복을 기다리지 않고 바로 반영한다 — 안 그러면 방장 화면이
    // 잠깐(혹은 연결이 불안정하면 계속) "진행 중"으로 남아 종료 버튼을 또
    // 누를 수 있고, 그러면 참가기록이 중복으로 쌓인다.
    setRoom(closedRow);
    return true;
  }, [room, nickname, mySeat, messages]);

  // 방장이 종료하거나 상대가 먼저 나가서 방이 닫히면, 참가자도 "나가기"를
  // 따로 누르지 않아도 자동으로 참가기록을 남긴다 — 예전에는 참가자가 그
  // 버튼을 직접 눌러야만 기록됐는데, 많은 참가자가 그냥 다른 탭으로
  // 넘어가버려서 방장만 기록이 남고 참가자는 기록이 안 남는 문제가 있었다.
  useEffect(() => {
    if (!room || !mySeat || !nickname) return;
    if (room.status !== 'closed') return;
    if (room.host_nickname === nickname) return; // 방장은 endSessionAsHost에서 이미 기록함.
    if (loggedRoomIdsRef.current.has(room.id)) return;
    loggedRoomIdsRef.current.add(room.id);
    writeParticipationLog(room, mySeat, nickname, messages);
  }, [room, mySeat, nickname, messages]);

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
    stopRoomPolling();
    setRoom(null);
    setMySeat(null);
    setIsTeamMember2(false);
    setMessages([]);
    setPhase('idle');
  }, [stopRoomPolling]);

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

  // text만 보내면(엔터) 발언권은 그대로 나한테 남는다 — 카카오톡처럼 여러
  // 줄을 잇달아 보낼 수 있다. endTurn=true([종료] 버튼)를 줘야만 실제로
  // 상대에게 순서가 넘어간다. 대표 발언자는 더 할 말이 없어도(빈 텍스트)
  // [종료]만 눌러 순서를 넘길 수 있다 — 그 외의 빈 텍스트 호출은 무시한다.
  const send = useCallback(
    async (text: string, endTurn: boolean) => {
      if (!room || !mySeat || !nickname || room.status === 'closed') return null;
      const mutedUntil = mySeat === 'A' ? room.muted_until_a : room.muted_until_b;
      if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) return null;

      const trimmed = text.trim();
      const passingEmptyTurn = endTurn && !isTeamMember2 && !trimmed;
      if (!trimmed && !passingEmptyTurn) return null;

      // 2번째 팀원은 원래 발언 순서가 아니라 손들기 토큰을 소모해 덧붙이는
      // 발언이다 — 남은 손들기가 없으면 보낼 수 없고, 보내도 순서(turn)는
      // 그대로 대표 발언자 차례를 유지한다.
      const handField = mySeat === 'A' ? 'hand_left_a' : 'hand_left_b';
      const handLeft = mySeat === 'A' ? room.hand_left_a : room.hand_left_b;
      if (isTeamMember2 && handLeft <= 0) return null;

      let moderation: ModerationResult | null = null;
      if (trimmed) {
        try {
          moderation = await callApi<ModerationResult>('/api/moderate', { text: trimmed });
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
          text: trimmed,
          kind: 'chat',
          moderation,
        });
      }

      // 이번 send() 호출에서 room 테이블에 적용할 필드 변경을 전부 모아
      // 한 번의 update로 보낸다 — 턴/손들기 토큰과 위반 처리를 따로따로
      // 보내면, 엔터로 같은 차례에 연달아 보낼 때 그 사이 로컬 room
      // 상태가 아직 최신화되지 않아 다음 send()가 오래된 값(예: 위반
      // 횟수)을 기준으로 계산해버려 카운트가 누락될 수 있다.
      const roomUpdate: Record<string, unknown> = {};
      if (isTeamMember2) {
        roomUpdate[handField] = handLeft - 1;
      } else if (endTurn) {
        roomUpdate.turn = mySeat === 'A' ? 'B' : 'A';
      }

      // 6장 모더레이션 경고 처리: 1차는 비공개 토스트(App.tsx)뿐이지만,
      // 2차는 30초 발언정지, 3차는 세션 종료 — AI와 동일한 잣대를 사람에게도.
      let justClosed = false;
      if (trimmed && moderation?.flagged) {
        const violationsField = mySeat === 'A' ? 'violations_a' : 'violations_b';
        const violations = (mySeat === 'A' ? room.violations_a : room.violations_b) + 1;
        roomUpdate[violationsField] = violations;

        if (violations >= 3) {
          justClosed = true;
          await supabase.from('messages').insert({
            room_id: room.id,
            seat: 'SYS',
            sender: 'system',
            text: '세션이 종료되었습니다 · 반복된 규정 위반',
            kind: 'session_closed',
          });
          const closedRow = await closeRoomWithRetry(room.id, roomUpdate);
          if (closedRow) setRoom(closedRow);
        } else if (violations === 2) {
          const mutedField = mySeat === 'A' ? 'muted_until_a' : 'muted_until_b';
          roomUpdate[mutedField] = new Date(Date.now() + MUTE_SECONDS * 1000).toISOString();
        }
      }

      if (!justClosed && Object.keys(roomUpdate).length > 0) {
        const { data: updated } = await supabase.from('rooms').update(roomUpdate).eq('id', room.id).select().maybeSingle();
        if (updated) setRoom(updated as RoomRow);
      }

      // AI 상대는 내 턴이 진짜로 끝났을 때만(엔터로 보내는 중간 문장에는
      // 반응하지 않고, [종료]로 순서를 넘겼을 때) 응답한다.
      if (room.vs_ai && mySeat === 'A' && room.status === 'active' && endTurn && !justClosed) {
        const history = messages.map((m) => ({ seat: m.seat, text: m.text }));
        if (trimmed) history.push({ seat: 'A', text: trimmed });
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
                const closedRow = await closeRoomWithRetry(room.id, { ai_strikes: strikes });
                if (closedRow) setRoom(closedRow);
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
    [room, mySeat, isTeamMember2, nickname, messages],
  );

  const ack = useCallback(
    async (messageId: number) => {
      if (!room || !mySeat || room.status === 'closed') return;
      const leftField = mySeat === 'A' ? 'acks_left_a' : 'acks_left_b';
      const left = mySeat === 'A' ? room.acks_left_a : room.acks_left_b;
      if (left <= 0) return;
      await supabase.from('messages').update({ acked: true }).eq('id', messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, acked: true } : m)));
      // realtime 왕복을 기다리지 않고 바로 반영 — 안 그러면 연달아 인정
      // 버튼을 누를 때 아직 갱신 안 된 남은 인정권 수를 기준으로 계산해
      // 실제로는 다 썼는데도 더 쓸 수 있는 것처럼 보일 수 있다.
      const { data: updated } = await supabase
        .from('rooms')
        .update({ [leftField]: left - 1 })
        .eq('id', room.id)
        .select()
        .maybeSingle();
      if (updated) setRoom(updated as RoomRow);
    },
    [room, mySeat],
  );

  const raiseHand = useCallback(async () => {
    if (!room || !mySeat || room.status === 'closed') return;
    const leftField = mySeat === 'A' ? 'hand_left_a' : 'hand_left_b';
    const left = mySeat === 'A' ? room.hand_left_a : room.hand_left_b;
    if (left <= 0) return;
    const { data: updated } = await supabase
      .from('rooms')
      .update({ [leftField]: left - 1 })
      .eq('id', room.id)
      .select()
      .maybeSingle();
    if (updated) setRoom(updated as RoomRow);
  }, [room, mySeat]);

  const declareChange = useCallback(async () => {
    if (!room || !mySeat || !nickname || room.status === 'closed') return;
    // 상대가 한마디도 안 했는데 생각이 바뀔 수는 없다 — 상대의 실제 발언이
    // 최소 한 번은 있어야 선언할 수 있다.
    const otherSeat: Seat = mySeat === 'A' ? 'B' : 'A';
    const opponentHasSpoken = messages.some((m) => m.seat === otherSeat && m.kind === 'chat');
    if (!opponentHasSpoken) return;
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
  }, [room, mySeat, nickname, messages]);

  // 7-1 어뷰징 방지: 자기 선언만으로는 진지벌레 레벨에 반영되지 않는다.
  // 상대가 이 메시지에 동의(endorse)해야 실제 프로필의 changed_count가 오른다.
  const endorseMindChange = useCallback(
    async (messageId: number, declarerNickname: string) => {
      if (room?.status === 'closed') return;
      await supabase.from('messages').update({ acked: true }).eq('id', messageId);
      await endorseChangeFor(declarerNickname);
    },
    [room],
  );

  // 6장 오탐 대비: 세션당 1회, 내가 받은 경고를 스스로 이의제기해 무효화할 수 있다.
  const dispute = useCallback(
    async (messageId: number) => {
      if (!room || !mySeat || room.status === 'closed') return;
      const usedField = mySeat === 'A' ? 'dispute_used_a' : 'dispute_used_b';
      const used = mySeat === 'A' ? room.dispute_used_a : room.dispute_used_b;
      if (used) return;

      const violationsField = mySeat === 'A' ? 'violations_a' : 'violations_b';
      const violations = Math.max(0, (mySeat === 'A' ? room.violations_a : room.violations_b) - 1);
      // 2차 경고로 걸린 발언정지(뮤팅)도 그 위반이 무효 처리되는 것과
      // 함께 풀어준다 — 안 그러면 위반 카운트는 취소됐는데 화면엔
      // "N초간 발언이 제한됩니다" 타이머가 계속 떠 있고 실제로도 그
      // 시간이 다 지나야만 다시 입력할 수 있는 문제가 있었다.
      const mutedField = mySeat === 'A' ? 'muted_until_a' : 'muted_until_b';

      await supabase.from('messages').update({ disputed: true }).eq('id', messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, disputed: true } : m)));
      const { data: updated } = await supabase
        .from('rooms')
        .update({ [usedField]: true, [violationsField]: violations, [mutedField]: null })
        .eq('id', room.id)
        .select()
        .maybeSingle();
      // realtime 왕복을 기다리지 않고 바로 반영 — 안 그러면 뮤팅 타이머가
      // 실제로는 풀렸는데도 잠깐(또는 이벤트를 놓치면 계속) 화면에 남는다.
      if (updated) setRoom(updated as RoomRow);
    },
    [room, mySeat],
  );

  // 7장 스틸맨 배지: 상대의 최근 발언을 얼마나 정확하게 요약했는지 AI가 판정한다.
  const submitStillman = useCallback(
    async (summary: string): Promise<StillmanResult> => {
      if (!room || !mySeat || !nickname || room.status === 'closed') return { good: false, feedback: '' };
      // 스틸맨은 상대 차례일 때만(내 차례엔 발언에 집중해야 하니) 쓸 수 있다.
      if (room.turn === mySeat) return { good: false, feedback: '' };
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
    // 방이 이미 닫혀서 자동으로(위 useEffect) 기록됐다면 여기서 또 남기지 않는다.
    if (!loggedRoomIdsRef.current.has(room.id)) {
      loggedRoomIdsRef.current.add(room.id);
      await writeParticipationLog(room, mySeat, nickname, messages);
    }
    // 나간 사람이 다시 채워지지 않는 자리를 그대로 두면(대표 발언자든
    // 2번째 팀원이든) 상대만 영원히 답장을 기다리게 되고, 나 자신도
    // 다음에 새로고침하면 recoverMyRoom()이 "아직 열려있는 내 방"으로
    // 착각해 다시 끌고 들어온다. 1:1(대화/격돌)은 누구든 나가면 바로
    // 종료되지만, 토론(2:2)은 같은 편(대표+2번째 팀원)이 둘 다 나가야
    // 종료된다 — 한쪽이 남아있으면 그 편은 계속 대화를 이어갈 수 있다.
    if (room.status !== 'closed') {
      if (room.kind === 'debate') {
        const memberField = mySeat === 'A' ? 'team_a_member2' : 'team_b_member2';
        const seatField = mySeat === 'A' ? 'seat_a' : 'seat_b';
        const myField = isTeamMember2 ? memberField : seatField;
        const { data: updated } = await supabase
          .from('rooms')
          .update({ [myField]: null })
          .eq('id', room.id)
          .select()
          .maybeSingle();
        const row = updated as RoomRow | null;
        const sideNowEmpty = row ? (mySeat === 'A' ? !row.seat_a && !row.team_a_member2 : !row.seat_b && !row.team_b_member2) : false;
        if (sideNowEmpty) {
          await supabase.from('messages').insert({
            room_id: room.id,
            seat: 'SYS',
            sender: nickname,
            text: `${nickname}님이 나가서 세션이 종료되었습니다.`,
            kind: 'session_closed',
          });
          await closeRoomWithRetry(room.id);
        }
      } else {
        await supabase.from('messages').insert({
          room_id: room.id,
          seat: 'SYS',
          sender: nickname,
          text: `${nickname}님이 나가서 세션이 종료되었습니다.`,
          kind: 'session_closed',
        });
        await closeRoomWithRetry(room.id);
      }
    }
    leave();
  }, [room, mySeat, nickname, messages, leave, isTeamMember2]);

  return {
    phase,
    room,
    mySeat,
    isTeamMember2,
    messages,
    error,
    join,
    createCustomRoom,
    rejoin,
    recoverMyRoom,
    joinTeamSecondSeat,
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
