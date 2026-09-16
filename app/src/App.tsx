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
import { SparTab } from './tabs/SparTab';
import { ShelfTab } from './tabs/ShelfTab';
import { useRoom } from './lib/useRoom';
import type { CreateRoomRules } from './lib/useRoom';
import type { RoomKind } from './lib/db-types';
import { useCustomRooms } from './lib/useCustomRooms';
import type { CustomRoomSummary } from './lib/useCustomRooms';
import { useVotes } from './lib/useVotes';
import { ClashSpectatorTab } from './tabs/ClashSpectatorTab';
import { SCHEDULE } from './data';
import { useProfile } from './lib/useProfile';
import { supabase } from './lib/supabase';
import { MODERATION_TOAST } from './lib/moderation';
import type { Msg, Tab, ToastState } from './types';
import type { MessageRow, Seat } from './lib/db-types';

const NICKNAME_KEY = 'jinji.nickname';
const ACK_LIMIT = 3;
const HAND_LIMIT = 2;

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
  const clashVotes = useVotes(room?.kind === 'clash' ? room.id : null, nickname);

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

  // Open the briefing the moment a real match completes (either side).
  useEffect(() => {
    if (phase === 'active' && !wasActive.current) {
      wasActive.current = true;
      setBriefRead(false);
      setSessionSec((room?.duration_minutes ?? 18) * 60);
      setBriefingOpen(true);
    }
    if (phase === 'idle') {
      wasActive.current = false;
      setJoiningTopicId(null);
      setSessionView('list');
    }
    if (phase === 'active' || phase === 'error') {
      setJoiningTopicId(null);
    }
  }, [phase]);

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
      await roomApi.joinTeamSecondSeat(topicId, side);
      refetchCustomRooms();
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
    await roomApi.join(topicId, topicTitle, false, false, scheduleKind);
    refetchCustomRooms();
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
      setJoiningTopicId(topicId);
      setCreateRoomOpen(false);
      refetchCustomRooms();
    }
  }

  async function handleEndSessionAsHost() {
    await roomApi.endSessionAsHost();
    // 실시간 갱신을 기다리지 않고 바로 반영 — 그래야 토론방 목록에서 방금
    // 종료한 방이 곧장 "진행 중" 목록에서 빠진다.
    refetchCustomRooms();
  }

  async function handleNicknameSubmit(name: string) {
    localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
    // 3장 온보딩: 진짜 대화를 한 번도 해본 적 없는 닉네임이면 스파링 체험을 제안한다.
    const { count } = await supabase
      .from('logs')
      .select('id', { count: 'exact', head: true })
      .eq('nickname', name);
    if (!count) setShowOnboarding(true);
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

  // 로컬 세션(room/mySeat)이 이미 붙어있으면 그걸 우선 쓰고, 새로고침 등으로
  // 잃어버렸다면 실시간 목록(customRooms)에서 내가 방장인 방을 찾아 보여준다
  // — 그래야 "내가 만든 방"이 토론방 탭에서 사라지지 않는다.
  // customRooms엔 오늘 종료된 방도 (시간표에 보여주려고) 들어있으므로, 여기서는
  // 아직 열려있는 방만 "내가 참여 중인 방" 후보로 본다.
  const myOwnCustomRoom = customRooms.find(
    (r): r is CustomRoomSummary & { status: 'waiting' | 'active' } => r.host_nickname === nickname && r.status !== 'closed',
  );
  // room.status === 'closed'면 이미 끝난 토론이다 — phase는 로컬 상태라 종료 후에도
  // 'active'에 머물러 있으므로, 실제 방 상태를 따로 확인해서 "진행 중"으로
  // 잘못 보이지 않게 한다.
  const myRoom =
    room && mySeat && (phase === 'active' || phase === 'waiting') && room.status !== 'closed'
      ? { topicTitle: room.topic_title, status: phase === 'active' ? ('active' as const) : ('waiting' as const) }
      : myOwnCustomRoom
        ? { topicTitle: myOwnCustomRoom.topic_title, status: myOwnCustomRoom.status }
        : null;

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
                onCancelApply={handleCancelApply}
                onOpenCreateRoom={() => setCreateRoomOpen(true)}
                customRooms={customRooms}
              />
            )}

            {tab === 'session' && spectateTopicId && (
              <ClashSpectatorTab topicId={spectateTopicId} nickname={nickname} onExit={() => setSpectateTopicId(null)} />
            )}

            {tab === 'session' && !spectateTopicId && sessionView === 'list' && (
              <SessionsListTab
                nickname={nickname}
                customRooms={customRooms}
                myRoom={myRoom}
                onEnterMyRoom={async () => {
                  if (room && mySeat) {
                    if (phase === 'active') setSessionView('chat');
                    return;
                  }
                  if (myOwnCustomRoom) {
                    const status = await roomApi.rejoinAsHost(myOwnCustomRoom.topic_id);
                    if (status === 'active') setSessionView('chat');
                  }
                }}
                onJoinRoom={handleEnterRoom}
              />
            )}

            {tab === 'session' && !spectateTopicId && sessionView === 'chat' && room && mySeat && (
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
