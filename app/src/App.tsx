import { useEffect, useRef, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { StatusBar } from './components/StatusBar';
import { BottomNav } from './components/BottomNav';
import { BriefingModal } from './components/BriefingModal';
import { ChangeModal } from './components/ChangeModal';
import { NicknameGate } from './components/NicknameGate';
import { OnboardingModal } from './components/OnboardingModal';
import { StillmanModal } from './components/StillmanModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { HomeTab } from './tabs/HomeTab';
import { SessionTab } from './tabs/SessionTab';
import { SessionsListTab } from './tabs/SessionsListTab';
import type { MyRoomEntry } from './tabs/SessionsListTab';
import { WaitingRoomTab } from './tabs/WaitingRoomTab';
import { SparTab } from './tabs/SparTab';
import { ShelfTab } from './tabs/ShelfTab';
import { useRoom } from './lib/useRoom';
import type { CreateRoomRules } from './lib/useRoom';
import type { RoomKind } from './lib/db-types';
import { useCustomRooms } from './lib/useCustomRooms';
import { useMyScheduleRooms } from './lib/useMyScheduleRooms';
import { useVotes } from './lib/useVotes';
import { ClashSpectatorTab } from './tabs/ClashSpectatorTab';
import { SCHEDULE } from './data';
import { useProfile } from './lib/useProfile';
import { supabase } from './lib/supabase';
import { MODERATION_TOAST } from './lib/moderation';
import type { Msg, Tab, ToastState } from './types';
import type { MessageRow, RoomRow, Seat } from './lib/db-types';

const NICKNAME_KEY = 'jinji.nickname';
const BRIEFED_ROOMS_KEY = 'jinji.briefedRoomIds';
const ACK_LIMIT = 3;
const HAND_LIMIT = 2;

// 입장 전 브리핑은 방마다 처음 한 번만 보여준다 — 재접속/재입장할 때마다
// 다시 뜨면 대화 흐름이 계속 끊긴다. 이미 본 방 id는 브라우저에 기억해둔다.
function hasSeenBriefing(roomId: string): boolean {
  try {
    const raw = localStorage.getItem(BRIEFED_ROOMS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(roomId);
  } catch {
    return false;
  }
}

function markBriefingSeen(roomId: string) {
  try {
    const raw = localStorage.getItem(BRIEFED_ROOMS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(roomId)) {
      // 무한히 쌓이지 않게 최근 200개만 유지.
      const next = [...ids, roomId].slice(-200);
      localStorage.setItem(BRIEFED_ROOMS_KEY, JSON.stringify(next));
    }
  } catch {
    // localStorage를 못 쓰는 환경이면 그냥 매번 보여주는 쪽으로 안전하게 둔다.
  }
}

function fmt(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toMsgs(rows: MessageRow[], mySeat: Seat, myNickname: string): Msg[] {
  return rows.map((m) => ({
    id: m.id,
    who: m.seat === 'SYS' ? 'sys' : m.seat === mySeat ? 'me' : 'other',
    text: m.text,
    kind: m.kind,
    done: m.seat !== 'SYS',
    acked: m.acked,
    disputed: m.disputed,
    flagged: !!m.moderation?.flagged,
    sender: m.sender,
    canEndorse: m.kind === 'change_declare' && !m.acked && m.sender !== myNickname,
  }));
}

function isMuted(until: string | null | undefined): boolean {
  return !!until && new Date(until).getTime() > Date.now();
}

function mutedSecondsLeft(until: string | null | undefined): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 1000));
}

export default function App() {
  const [nickname, setNickname] = useState<string | null>(() => localStorage.getItem(NICKNAME_KEY));
  const [tab, setTab] = useState<Tab>('home');
  const [sessionView, setSessionView] = useState<'list' | 'chat'>('list');
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [countdown, setCountdown] = useState(295);
  const [sessionSec, setSessionSec] = useState(1080);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [joiningTopicId, setJoiningTopicId] = useState<string | null>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  // roomApi(useRoom 훅)는 시간표 매칭(join)과 방 만들기(createCustomRoom) 양쪽에서
  // 공유한다 — 방 만들기가 실패했을 때 그 에러를 시간표 매칭 실패로 착각해 엉뚱한
  // 방(1번/2번 등)에 "매칭에 실패했어요" 문구가 뜨는 걸 막으려고, 방금 에러를
  // 일으킨 게 어느 쪽 동작이었는지 따로 기록해둔다.
  const [errorSource, setErrorSource] = useState<'match' | 'create' | null>(null);
  const [spectateTopicId, setSpectateTopicId] = useState<string | null>(null);
  const [changeContext, setChangeContext] = useState<'main' | 'spar'>('main');

  const [sparTopicInput, setSparTopicInput] = useState('');
  const [sparTopicError, setSparTopicError] = useState<string | null>(null);
  const [sparValidating, setSparValidating] = useState(false);
  const [sparChatDraft, setSparChatDraft] = useState('');
  const [sparSessionSec, setSparSessionSec] = useState(1080);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stillmanOpen, setStillmanOpen] = useState(false);
  const [stillmanContext, setStillmanContext] = useState<'main' | 'spar'>('main');
  const [stillmanText, setStillmanText] = useState('');
  const [stillmanFeedback, setStillmanFeedback] = useState<string | null>(null);
  const [stillmanGood, setStillmanGood] = useState(false);
  const [stillmanSubmitting, setStillmanSubmitting] = useState(false);

  const roomApi = useRoom(nickname);
  const { phase, room, mySeat, isTeamMember2, messages } = roomApi;
  const [customRooms, refetchCustomRooms] = useCustomRooms();
  const [myScheduleRooms, refetchMyScheduleRooms] = useMyScheduleRooms(nickname);
  const clashVotes = useVotes(room?.kind === 'clash' ? room.id : null, nickname);

  // 새로고침 등으로 방 안에 있던 걸 잊어버린 채 앱이 새로 켜질 수 있다 —
  // 내가 방장이든 참가자(2번째 팀원 포함)든 상관없이, 아직 열려있는 방에
  // 내 닉네임이 자리 잡고 있으면 자동으로 다시 붙어서 "참여 중인 방"
  // 목록에서 사라지지 않게 한다.
  useEffect(() => {
    if (nickname) roomApi.recoverMyRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  const sparRoomApi = useRoom(nickname);
  const { changedCount, listenedCount, briefedCount, stillmanCount, bumpListened, bumpBriefed, bumpStillman } =
    useProfile(nickname);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const sparLogRef = useRef<HTMLDivElement | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
      setSessionSec((s) => (tab === 'session' ? Math.max(0, s - 1) : s));
      setSparSessionSec((s) => (tab === 'spar' && sparRoomApi.phase === 'active' ? Math.max(0, s - 1) : s));
    }, 1000);
    return () => clearInterval(t);
  }, [tab, sparRoomApi.phase]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, tab]);

  useEffect(() => {
    const el = sparLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sparRoomApi.messages.length, tab]);

  // 방금 매칭됐거나(join) 다시 붙은(rejoin) 방을 "처리 완료"로 표시하고,
  // 처음 보는 방이면 브리핑을 띄운다. handleEnterRoom/handleEnterMyRoom
  // 같은 명시적 입장 경로에서 room row를 직접 받은 그 자리에서 불러야
  // stale closure 문제(방금 매칭된 room이 아직 렌더에 반영 안 된 상태에서
  // 판단하는 것) 없이 정확히 판단할 수 있다. true를 반환하면 브리핑을
  // 새로 띄운 것이다(이미 wasActive였다면 아무 것도 안 하고 false).
  function activateRoom(row: RoomRow): boolean {
    if (wasActive.current) return false;
    wasActive.current = true;
    if (!hasSeenBriefing(row.id)) {
      // 여기서 곧바로 "봤다"로 표시한다 — 끝까지 읽고 [입장]을 눌러야만
      // 표시했다면, 사용자가 ✕로 닫거나 브리핑이 뜬 채로 앱을 나갔다가
      // 나중에 그 방(이미 대화 중이던 방)에 다시 들어올 때마다 "딱 한
      // 번만" 뜨기로 한 브리핑이 매번 다시 떴다. "브리핑 완독" 카운트는
      // 별개로 실제로 읽고 [입장]을 눌렀을 때만(bumpBriefed) 올라간다.
      markBriefingSeen(row.id);
      setBriefRead(false);
      setSessionSec((row.duration_minutes ?? 18) * 60);
      setBriefingOpen(true);
      return true;
    }
    return false;
  }

  // 위 activateRoom이 못 잡는 "백그라운드에서 방이 active로 바뀐" 경우를
  // 처리한다 — 대표적으로 (1) 새로고침 직후 recoverMyRoom()이 이미
  // 진행 중인 방을 조용히 다시 붙일 때, (2) 대기 화면(WaitingRoomTab)에
  // 앉아있다가 상대가 실시간으로 들어왔을 때.
  // 지금 그 방의 채팅 화면(session 탭 + sessionView==='chat')을 실제로
  // 보고 있을 때만 브리핑을 띄운다 — tab만으로는 부족하다: "토론방" 탭을
  // 눌러 방 목록만 보는 중이어도 tab은 이미 'session'이라, 목록만 보고
  // 있는데도 느닷없이 브리핑이 뜨는 문제가 있었다. 다른 화면에 있고 아직
  // 못 본 브리핑이면, wasActive를 그대로 false로 남겨서(여기서 처리하지
  // 않고) 나중에 사용자가 그 방에 직접 들어갈 때 activateRoom이 띄우게 한다.
  useEffect(() => {
    if (phase === 'active' && !wasActive.current && room) {
      if (tab === 'session' && sessionView === 'chat') {
        activateRoom(room);
      } else if (hasSeenBriefing(room.id)) {
        // 이미 본 방이면 새로고침해도 하던 대화로 바로 돌아오는 게 자연스럽다.
        wasActive.current = true;
        setTab('session');
        setSessionView('chat');
      }
    }
    if (phase === 'idle') {
      wasActive.current = false;
      setJoiningTopicId(null);
      setSessionView('list');
    }
    // phase가 'active'가 되는 순간 여기서 joiningTopicId를 지우면(예전
    // 코드), handleEnterRoom이 아직 setTab/setSessionView를 호출하기도
    // 전에 — join() 내부에서 메시지를 불러오고 브리핑을 만드는 동안 이미
    // 'active'로 바뀌어 있어서 — 시간표 화면의 버튼이 "입장 신청 완료"에서
    // "참여하기"로 잠깐 되돌아갔다가 화면이 넘어가는 게 보였다(버튼이 계속
    // 바뀌는 것처럼 느껴짐). 이제는 각 입장 경로(handleEnterRoom 등)가
    // 화면 전환과 같은 타이밍에 직접 지운다. 여기서는 실패(error)한
    // 경우만 안전망으로 지운다.
    if (phase === 'error') {
      setJoiningTopicId(null);
    }
  }, [phase, room, tab, sessionView]);

  useEffect(() => {
    if (sparRoomApi.phase === 'active') {
      setSparSessionSec(1080);
    }
  }, [sparRoomApi.phase]);

  function showToast(tone: ToastState['tone'], text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tone, text });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  function handleCancelApply() {
    setJoiningTopicId(null);
    roomApi.cancelJoin();
    refetchCustomRooms();
    refetchMyScheduleRooms();
  }

  // 내가 만들었거나(방장) 이미 들어가 있는 방으로 들어간다 — 상대가 아직
  // 안 왔어도(대기 중이어도) 바로 들어가서 기다릴 수 있다. 매번 Supabase에서
  // 현재 상태를 다시 불러온다 — 로컬 상태를 그대로 믿으면(놓친 realtime
  // 이벤트 때문에) 이미 상대가 들어왔거나 방장이 종료했는데도 옛 화면이
  // 보이는 문제가 반복해서 나왔다(대기중인데 실제론 진행중, 진행중인데
  // 실제론 종료됨). 방 하나 조회라 가벼우니 정확성을 우선한다.
  async function handleEnterMyRoom(topicId: string) {
    const result = await roomApi.rejoin(topicId);
    if (!result || result.status === 'error') return;
    if (result.status === 'active') activateRoom(result.room);
    setTab('session');
    setSessionView('chat');
  }

  async function handleEnterRoom(topicId: string, topicTitle: string) {
    // 진행 중인 격돌방은 참여가 아니라 관전(+투표) — 자리(seat)가 이미 둘 다
    // 찼으니 join()을 그대로 태우면 같은 topic_id로 새 방을 또 만들게 된다.
    const customRoom = customRooms.find((r) => r.topic_id === topicId);
    if (customRoom?.kind === 'clash' && customRoom.status === 'active') {
      setSpectateTopicId(topicId);
      setTab('session');
      return;
    }
    // 2:2 토론방이 이미 대표끼리 매칭돼 있다면, 남은 자리에 2번째 팀원으로
    // 합류한다 — 마찬가지로 join()을 쓰면 안 된다.
    if (customRoom?.kind === 'debate' && customRoom.status === 'active') {
      const side: Seat | null = !customRoom.team_a_member2 ? 'A' : !customRoom.team_b_member2 ? 'B' : null;
      if (!side) return;
      setJoiningTopicId(topicId);
      const joined = await roomApi.joinTeamSecondSeat(topicId, side);
      refetchCustomRooms();
      setJoiningTopicId(null);
      if (joined) {
        setTab('session');
        setSessionView('chat');
      }
      return;
    }

    // 자동생성 2번/3번방(격돌 종류)도 마찬가지: 이미 둘이 꽉 차서 진행 중인
    // 대화가 있으면 새로 매칭하지 않고 그 대화를 관전한다.
    const scheduleKind = SCHEDULE.find((row) => row.topicId === topicId)?.kind ?? 'chat';
    if (scheduleKind === 'clash') {
      const { data: activeRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('topic_id', topicId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (activeRoom) {
        setSpectateTopicId(topicId);
        setTab('session');
        return;
      }
    }

    setJoiningTopicId(topicId);
    setErrorSource('match');
    const result = await roomApi.join(topicId, topicTitle, false, false, scheduleKind);
    refetchCustomRooms();
    refetchMyScheduleRooms();
    if (!result || result.status === 'error') {
      setJoiningTopicId(null);
      return;
    }
    // 매칭 성공(진행중이든 대기중이든) 시 곧장 그 방 화면으로 데려간다 —
    // 예전엔 버튼 라벨만 바뀌고 사용자는 계속 목록에 남아있어서, 방금 누른
    // 버튼이 뭘 했는지 체감이 안 됐다. joiningTopicId도 화면 전환과 같은
    // 타이밍에 지운다 — 미리 지우면(예전 코드) join() 내부가 메시지·브리핑을
    // 마무리하는 동안 시간표의 버튼이 "참여하기"로 잠깐 되돌아갔다가 화면이
    // 넘어가는 게 보였다.
    if (result.status === 'active') activateRoom(result.room);
    setJoiningTopicId(null);
    setTab('session');
    setSessionView('chat');
  }

  function handleNavChange(nextTab: Tab) {
    if (nextTab === 'session') {
      setSessionView('list');
      setSpectateTopicId(null);
    }
    setTab(nextTab);
  }

  async function handleCreateRoom(topicTitle: string, rules: CreateRoomRules, kind: RoomKind) {
    setCreatingRoom(true);
    setErrorSource('create');
    const topicId = await roomApi.createCustomRoom(topicTitle, rules, kind);
    setCreatingRoom(false);
    if (topicId) {
      setCreateRoomOpen(false);
      refetchCustomRooms();
      // 방을 만들었으면 곧장 그 방(대기 화면)으로 들어간다 — 예전엔 모달만
      // 닫히고 시간표에 남아서, 방금 만든 방이 실제로 어디 있는지 직접
      // 찾아 들어가야 했다.
      setTab('session');
      setSessionView('chat');
    }
  }

  async function handleEndSessionAsHost() {
    const ok = await roomApi.endSessionAsHost();
    if (!ok) {
      showToast('warn', '방 종료에 실패했어요 · 다시 시도해주세요');
      return;
    }
    // 실시간 갱신을 기다리지 않고 바로 반영 — 그래야 토론방 목록에서 방금
    // 종료한 방이 곧장 "진행 중" 목록에서 빠진다.
    refetchCustomRooms();
  }

  async function handleNicknameSubmit(name: string) {
    localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
    // 온보딩(스파링 체험 제안) 팝업은 이 닉네임을 "처음 등록하는" 사람에게만
    // 보여준다 — 예전엔 참가기록(logs) 개수로 판단해서, 이미 써본 적 있는
    // 닉네임이라도 진짜 대화를 아직 한 번도 안 끝냈으면 매번 "처음이시네요"가
    // 다시 떴다. profiles 테이블에 이 닉네임 row가 있는지로 "이미 등록된
    // 적 있는 닉네임인지"를 판단한다 — 없으면 지금 이 순간 만들어서
    // 등록하고(그래야 다음부턴 신규가 아님), 있으면 기존 사용자이니 넘어간다.
    const { data: existingProfile } = await supabase.from('profiles').select('nickname').eq('nickname', name).maybeSingle();
    if (!existingProfile) {
      await supabase.from('profiles').insert({ nickname: name });
      setShowOnboarding(true);
    }
  }

  async function handleAck(messageId: number) {
    const left = mySeat === 'A' ? room?.acks_left_a : room?.acks_left_b;
    if (left !== undefined && left <= 0) {
      showToast('good', `인정권을 모두 썼습니다 · ${ACK_LIMIT}회`);
      return;
    }
    await roomApi.ack(messageId);
    showToast('good', '상호 인정 기록 · 양측 성장 +1');
  }

  async function handleRaiseHand() {
    const left = mySeat === 'A' ? room?.hand_left_a : room?.hand_left_b;
    if (left !== undefined && left <= 0) {
      showToast('good', '손들기를 모두 썼습니다');
      return;
    }
    await roomApi.raiseHand();
    showToast('good', '발언권 요청 · 다음 턴에 앞당겨집니다');
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !room || room.turn !== mySeat) return;
    setDraft('');
    const moderation = await roomApi.send(text);
    if (moderation?.flagged) {
      const toastText = MODERATION_TOAST[moderation.axis];
      if (toastText) showToast('warn', toastText);
    }
  }

  async function handleLeaveSession() {
    // 방장은 "종료" 버튼을 누른 시점에 이미 참가기록을 남겼으므로(endSessionAsHost),
    // 나가기에서 또 남기지 않는다 — 다만 성장 카운트 반영과 참가기록 탭 이동은
    // 참가자와 동일하게 해준다.
    if (room?.host_nickname === nickname) {
      roomApi.leave();
      await bumpListened();
      setTab('shelf');
      return;
    }
    await roomApi.finishAndLog();
    await bumpListened();
    setTab('shelf');
  }

  async function confirmChange() {
    setChangeOpen(false);
    // 7-1 어뷰징 방지: 자기 선언만으로는 레벨이 오르지 않는다 — 상대가 동의(endorse)해야
    // 실제 프로필에 반영된다. 여기서는 방·기록용 카운터와 선언 메시지만 남긴다.
    if (changeContext === 'spar') {
      await sparRoomApi.declareChange();
    } else {
      await roomApi.declareChange();
    }
    showToast('good', '선언됨 · 상대가 동의하면 레벨에 반영됩니다');
  }

  async function handleDispute(messageId: number) {
    await roomApi.dispute(messageId);
    showToast('good', '이의제기 접수 · 경고가 취소됐습니다');
  }

  async function handleSparDispute(messageId: number) {
    await sparRoomApi.dispute(messageId);
    showToast('good', '이의제기 접수 · 경고가 취소됐습니다');
  }

  async function handleEndorseChange(messageId: number) {
    const m = messages.find((x) => x.id === messageId);
    if (!m) return;
    await roomApi.endorseMindChange(messageId, m.sender);
    showToast('good', '동의함 · 상대의 진지벌레가 성장했습니다');
  }

  function openStillman(context: 'main' | 'spar') {
    setStillmanContext(context);
    setStillmanText('');
    setStillmanFeedback(null);
    setStillmanGood(false);
    setStillmanOpen(true);
  }

  async function submitStillman() {
    const text = stillmanText.trim();
    if (!text) return;
    setStillmanSubmitting(true);
    const api = stillmanContext === 'spar' ? sparRoomApi : roomApi;
    const result = await api.submitStillman(text);
    setStillmanSubmitting(false);
    setStillmanGood(result.good);
    setStillmanFeedback(result.feedback || (result.good ? '인정되었습니다!' : '조금 더 정확하게 다시 요약해보세요.'));
    if (result.good) {
      if (stillmanContext === 'main') await bumpStillman();
      setTimeout(() => setStillmanOpen(false), 1400);
    }
  }

  function handleSparTopicChange(v: string) {
    setSparTopicInput(v);
    if (sparTopicError) setSparTopicError(null);
  }

  async function startSpar() {
    const topic = sparTopicInput.trim();
    if (!topic) return;
    setSparValidating(true);
    setSparTopicError(null);
    try {
      const res = await fetch('/api/validate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const result = (await res.json()) as { valid: boolean; message: string };
      if (!result.valid) {
        setSparTopicError(
          result.message || '대결 또는 토론이 가능한 주제를 입력해주세요. (예: "OO은 필요한가")',
        );
        return;
      }
    } catch (err) {
      console.error('topic validation failed', err);
      // Fail open: don't block starting just because validation errored.
    } finally {
      setSparValidating(false);
    }
    await sparRoomApi.join('spar', `리허설 · ${topic}`, true, true);
  }

  async function handleSparSend() {
    const text = sparChatDraft.trim();
    const sparRoom = sparRoomApi.room;
    if (!text || !sparRoom || sparRoom.turn !== 'A' || sparRoom.status === 'closed') return;
    setSparChatDraft('');
    const moderation = await sparRoomApi.send(text);
    if (moderation?.flagged) {
      const toastText = MODERATION_TOAST[moderation.axis];
      if (toastText) showToast('warn', toastText);
    }
  }

  async function handleSparAck(messageId: number) {
    const left = sparRoomApi.room?.acks_left_a;
    if (left !== undefined && left <= 0) {
      showToast('good', `인정권을 모두 썼습니다 · ${ACK_LIMIT}회`);
      return;
    }
    await sparRoomApi.ack(messageId);
    showToast('good', '상호 인정 기록 · 양측 성장 +1');
  }

  async function handleSparRaiseHand() {
    const left = sparRoomApi.room?.hand_left_a;
    if (left !== undefined && left <= 0) {
      showToast('good', '손들기를 모두 썼습니다');
      return;
    }
    await sparRoomApi.raiseHand();
    showToast('good', '발언권 요청 · 다음 턴에 앞당겨집니다');
  }

  function handleSparLeave() {
    // 리허설은 연습일 뿐 — 참가기록에 어록을 남기지 않는다.
    sparRoomApi.leave();
    setSparTopicInput('');
  }

  const msgs: Msg[] = mySeat && nickname ? toMsgs(messages, mySeat, nickname) : [];
  const sparMsgs: Msg[] = nickname ? toMsgs(sparRoomApi.messages, 'A', nickname) : [];

  const ackLeft = (mySeat === 'A' ? room?.acks_left_a : room?.acks_left_b) ?? ACK_LIMIT;
  const handLeft = (mySeat === 'A' ? room?.hand_left_a : room?.hand_left_b) ?? HAND_LIMIT;
  const otherSeatLabel = (mySeat === 'A' ? room?.seat_b : room?.seat_a) ?? '상대';
  // 내가 대표 발언자면 내 팀의 2번째 팀원을, 내가 2번째 팀원이면 우리 팀
  // 대표를 "+ 팀원"으로 보여준다 — 둘 다 team_x_member2만 보면 내가 2번째
  // 팀원일 때 내 이름이 내 팀원으로 다시 뜨는 오류가 생긴다.
  const myTeamMember2 = isTeamMember2
    ? ((mySeat === 'A' ? room?.seat_a : room?.seat_b) ?? null)
    : ((mySeat === 'A' ? room?.team_a_member2 : room?.team_b_member2) ?? null);
  const otherTeamMember2 = (mySeat === 'A' ? room?.team_b_member2 : room?.team_a_member2) ?? null;
  const isMyTurn = room?.turn === mySeat;
  const myMutedUntil = room ? (mySeat === 'A' ? room.muted_until_a : room.muted_until_b) : null;
  const otherMutedUntil = room ? (mySeat === 'A' ? room.muted_until_b : room.muted_until_a) : null;
  const muted = isMuted(myMutedUntil);
  const otherMuted = isMuted(otherMutedUntil);

  // "참여중인 방" 목록: 커스텀 방이든 스케줄(자동생성) 방이든, 대기 중이든
  // 진행 중이든 상관없이 내가 자리 잡고 있는 방은 전부 보여준다 — 예전에는
  // roomApi가 붙들고 있는 방 하나만(그것도 진행 중일 때만) 보여서, 방을 여러
  // 개 오가거나 상대를 기다리는 중이면 목록에서 빠져 보였다.
  // customRooms/스케줄 목록 둘 다 각자 실시간 채널로 갱신되므로, 방 전용
  // 채널(roomApi)이 이벤트를 하나 놓쳐도 여기 상태는 최신을 유지한다.
  const myCustomRooms: MyRoomEntry[] = customRooms
    .filter(
      (r) =>
        r.host_nickname === nickname || r.seat_a === nickname || r.seat_b === nickname || r.team_a_member2 === nickname || r.team_b_member2 === nickname,
    )
    .map((r) => ({ topicId: r.topic_id, topicTitle: r.topic_title, status: r.status as 'waiting' | 'active' }));
  const myRooms: MyRoomEntry[] = [
    ...myCustomRooms,
    ...myScheduleRooms.map((r) => ({ topicId: r.topic_id, topicTitle: r.topic_title, status: r.status })),
  ];
  const myScheduleRoomStatus: Record<string, 'waiting' | 'active'> = Object.fromEntries(
    myScheduleRooms.map((r) => [r.topic_id, r.status]),
  );

  const closed = room?.status === 'closed';

  const sparRoom = sparRoomApi.room;
  const sparClosed = sparRoom?.status === 'closed';
  const sparIsMyTurn = sparRoom?.turn === 'A' && !sparClosed;
  const sparMuted = isMuted(sparRoom?.muted_until_a);

  return (
    <PhoneFrame>
      <StatusBar />

      {!nickname ? (
        <NicknameGate onSubmit={handleNicknameSubmit} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {tab === 'home' && (
              <HomeTab
                countdownLabel={fmt(countdown)}
                changedCount={changedCount}
                nickname={nickname}
                matchingTopicId={joiningTopicId}
                matchError={phase === 'error' && errorSource === 'match' ? roomApi.error : null}
                onEnterRoom={handleEnterRoom}
                onEnterMyRoom={handleEnterMyRoom}
                onCancelApply={handleCancelApply}
                onOpenCreateRoom={() => setCreateRoomOpen(true)}
                customRooms={customRooms}
                myScheduleRoomStatus={myScheduleRoomStatus}
              />
            )}

            {tab === 'session' && spectateTopicId && (
              <ClashSpectatorTab topicId={spectateTopicId} nickname={nickname} onExit={() => setSpectateTopicId(null)} />
            )}

            {tab === 'session' && !spectateTopicId && sessionView === 'list' && (
              <SessionsListTab
                nickname={nickname}
                customRooms={customRooms}
                myRooms={myRooms}
                onEnterMyRoom={handleEnterMyRoom}
                onJoinRoom={handleEnterRoom}
              />
            )}

            {tab === 'session' && !spectateTopicId && sessionView === 'chat' && room && mySeat && room.status === 'waiting' && (
              <WaitingRoomTab
                topicTitle={room.topic_title}
                kind={room.kind}
                isHost={mySeat === 'A'}
                onCancel={() => {
                  handleCancelApply();
                  setSessionView('list');
                }}
                onBack={() => setSessionView('list')}
              />
            )}

            {tab === 'session' && !spectateTopicId && sessionView === 'chat' && room && mySeat && room.status !== 'waiting' && (
              <SessionTab
                topicTitle={room.topic_title}
                sessionLabel={fmt(sessionSec)}
                isMyTurn={isMyTurn}
                mySeatLabel={nickname}
                otherSeatLabel={otherSeatLabel}
                myTeamMember2={myTeamMember2}
                otherTeamMember2={otherTeamMember2}
                isTeamMember2={isTeamMember2}
                voteCounts={room.kind === 'clash' ? clashVotes.counts : undefined}
                voteALabel={room.seat_a ?? 'A'}
                voteBLabel={room.seat_b ?? 'B'}
                ackLeft={ackLeft}
                ackLimit={ACK_LIMIT}
                msgs={msgs}
                onAck={handleAck}
                logRef={logRef}
                toast={toast}
                handLeft={handLeft}
                handLimit={room.hand_limit}
                isHost={room.host_nickname === nickname}
                onEndSession={handleEndSessionAsHost}
                closed={closed}
                onRaiseHand={handleRaiseHand}
                onDeclareChange={() => {
                  setChangeContext('main');
                  setChangeOpen(true);
                }}
                onLeave={handleLeaveSession}
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
                onDispute={handleDispute}
                showEndorse
                onEndorseChange={handleEndorseChange}
                onOpenStillman={() => openStillman('main')}
                muted={muted}
                mutedSecondsLeft={mutedSecondsLeft(myMutedUntil)}
                otherMuted={otherMuted}
              />
            )}

            {tab === 'spar' &&
              (sparRoomApi.phase === 'active' && sparRoom && sparRoomApi.mySeat ? (
                <SessionTab
                  topicTitle={sparRoom.topic_title}
                  sessionLabel={fmt(sparSessionSec)}
                  isMyTurn={sparIsMyTurn}
                  mySeatLabel={nickname}
                  otherSeatLabel={sparRoom.seat_b ?? 'AI'}
                  ackLeft={sparRoom.acks_left_a}
                  ackLimit={ACK_LIMIT}
                  msgs={sparMsgs}
                  onAck={handleSparAck}
                  logRef={sparLogRef}
                  toast={toast}
                  handLeft={sparRoom.hand_left_a}
                  onRaiseHand={handleSparRaiseHand}
                  onDeclareChange={() => {
                    setChangeContext('spar');
                    setChangeOpen(true);
                  }}
                  onLeave={handleSparLeave}
                  leaveLabel="나가기"
                  draft={sparChatDraft}
                  onDraftChange={setSparChatDraft}
                  onSend={handleSparSend}
                  kindLabel="리허설"
                  closed={sparClosed}
                  onDispute={handleSparDispute}
                  showEndorse={false}
                  onOpenStillman={() => openStillman('spar')}
                  muted={sparMuted}
                  mutedSecondsLeft={mutedSecondsLeft(sparRoom?.muted_until_a)}
                  otherMuted={false}
                />
              ) : (
                <SparTab
                  topicInput={sparTopicInput}
                  onTopicInputChange={handleSparTopicChange}
                  onStart={startSpar}
                  starting={sparValidating || sparRoomApi.phase === 'matching'}
                  topicError={sparTopicError}
                />
              ))}

            {tab === 'shelf' && (
              <ShelfTab
                changedCount={changedCount}
                listenedCount={listenedCount}
                briefedCount={briefedCount}
                stillmanCount={stillmanCount}
                nickname={nickname}
              />
            )}
          </div>

          <BottomNav tab={tab} onChange={handleNavChange} />

          <CreateRoomModal
            open={createRoomOpen}
            onClose={() => setCreateRoomOpen(false)}
            onCreate={handleCreateRoom}
            creating={creatingRoom}
            error={phase === 'error' && errorSource === 'create' ? roomApi.error : null}
          />

          <BriefingModal
            open={briefingOpen}
            read={briefRead}
            roomLabel={room ? `${room.topic_title} · 입장 전 브리핑` : ''}
            title={room?.topic_title ?? ''}
            briefing={room?.briefing ?? null}
            onClose={() => setBriefingOpen(false)}
            onToggleRead={() => setBriefRead((r) => !r)}
            onEnter={async () => {
              if (briefRead && room?.briefing) {
                setBriefingOpen(false);
                markBriefingSeen(room.id);
                await bumpBriefed();
                setTab('session');
                setSessionView('chat');
              }
            }}
          />

          <ChangeModal open={changeOpen} onCancel={() => setChangeOpen(false)} onConfirm={confirmChange} />

          <OnboardingModal
            open={showOnboarding}
            onTry={() => {
              setShowOnboarding(false);
              setTab('spar');
            }}
            onSkip={() => setShowOnboarding(false)}
          />

          <StillmanModal
            open={stillmanOpen}
            text={stillmanText}
            onTextChange={setStillmanText}
            onSubmit={submitStillman}
            onClose={() => setStillmanOpen(false)}
            submitting={stillmanSubmitting}
            feedback={stillmanFeedback}
            good={stillmanGood}
          />
        </>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 130,
          height: 5,
          borderRadius: 3,
          background: '#17171a',
          opacity: 0.2,
          pointerEvents: 'none',
        }}
      />
    </PhoneFrame>
  );
}
