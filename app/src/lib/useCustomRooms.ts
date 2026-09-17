import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { RoomKind } from './db-types';

export interface CustomRoomSummary {
  id: string;
  topic_id: string;
  topic_title: string;
  status: 'waiting' | 'active' | 'closed';
  host_nickname: string | null;
  seat_a: string | null;
  seat_b: string | null;
  allow_profanity: boolean;
  duration_minutes: number;
  kind: RoomKind;
  team_a_member2: string | null;
  team_b_member2: string | null;
  created_at: string;
}

// Live list of user-created rooms so both 시간표(오늘의 방 목록)와 토론방 탭이
// 같은 데이터를 쓴다 — 아직 열려있는 방(waiting/active)만 보여주고, 종료된
// 방은 (대화/토론/격돌 종류와 상관없이) 끝나는 즉시 목록에서 빠진다.
export function useCustomRooms(): [CustomRoomSummary[], () => void] {
  const [rooms, setRooms] = useState<CustomRoomSummary[]>([]);
  // load()가 겹쳐 호출되면(디바운스된 realtime 알림 + 직접 refetch 등)
  // 네트워크 지연 때문에 응답이 요청 순서와 다르게 도착할 수 있다 — 오래된
  // 요청의 응답이 나중에 도착해 최신 상태를 덮어쓰면 방이 잠깐 사라졌다
  // 나타나는 것처럼 보인다. 매 호출마다 번호를 매겨 "가장 마지막에 보낸
  // 요청"의 응답만 실제로 반영한다.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const { data } = await supabase
      .from('rooms')
      .select(
        'id, topic_id, topic_title, status, host_nickname, seat_a, seat_b, allow_profanity, duration_minutes, kind, team_a_member2, team_b_member2, created_at',
      )
      .eq('is_custom', true)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });
    if (requestId !== requestIdRef.current) return; // 더 최근 요청이 이미 나간 뒤라 이 응답은 버린다.
    // 방어적 중복 제거: 같은 id가 혹시라도 두 번 오더라도 목록에 한 번만 보이게.
    const rows = (data as CustomRoomSummary[]) ?? [];
    const deduped = Array.from(new Map(rows.map((r) => [r.id, r])).values());
    setRooms(deduped);
  }, []);

  useEffect(() => {
    load();

    // 디바운스: 짧은 시간 안에 여러 postgres_changes 이벤트가 몰려도 한 번만
    // 다시 불러온다 — 방 하나가 활발히 채팅 중일 때(메시지마다 turn/hand_left 등
    // rooms 행이 계속 바뀜) 목록이 매번 깜빡이는 걸 막아준다.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(load, 400);
    };

    // is_custom=true인 방 변경에만 반응한다 — 필터 없이 테이블 전체를 구독하면
    // 이 목록과 무관한 다른 방(자동 매칭 등)의 변경에도 매번 다시 불러오게 된다.
    // UPDATE 이벤트는 목록에 실제로 영향 있는 필드(상태/방 종류/팀원 등)가
    // 바뀌었을 때만 반응한다 — 턴 넘김·손들기·인정권 같은 채팅 중 수시로
    // 바뀌는 필드는 무시한다(REPLICA IDENTITY FULL이라 old 값도 함께 온다).
    const channel = supabase
      .channel('custom-rooms-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: 'is_custom=eq.true' },
        (payload) => {
          if (payload.eventType !== 'UPDATE') {
            scheduleLoad();
            return;
          }
          const before = payload.old as Partial<CustomRoomSummary> | null;
          const after = payload.new as Partial<CustomRoomSummary> | null;
          const listRelevant =
            !before ||
            !after ||
            before.status !== after.status ||
            before.kind !== after.kind ||
            before.host_nickname !== after.host_nickname ||
            before.topic_title !== after.topic_title ||
            before.team_a_member2 !== after.team_a_member2 ||
            before.team_b_member2 !== after.team_b_member2;
          if (listRelevant) scheduleLoad();
        },
      )
      .subscribe();

    // realtime 연결이 끊기거나 이벤트를 놓치는 경우(방장이 방을 종료했는데
    // 다른 사람 화면엔 계속 "진행중"으로 남는 등)에 대비한 안전망 — 주기적
    // 재조회와, 탭을 다시 들여다볼 때 재조회를 추가해서 realtime 하나만
    // 믿지 않게 한다.
    const pollTimer = setInterval(load, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
      channel.unsubscribe();
    };
  }, [load]);

  return [rooms, load];
}
