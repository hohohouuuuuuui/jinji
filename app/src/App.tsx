import { useEffect, useRef, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { StatusBar } from './components/StatusBar';
import { BottomNav } from './components/BottomNav';
import { BriefingModal } from './components/BriefingModal';
import { ChangeModal } from './components/ChangeModal';
import { NicknameGate } from './components/NicknameGate';
import { WaitingModal } from './components/WaitingModal';
import { OnboardingModal } from './components/OnboardingModal';
import { StillmanModal } from './components/StillmanModal';
import { HomeTab } from './tabs/HomeTab';
import { SessionTab } from './tabs/SessionTab';
import { SparTab } from './tabs/SparTab';
import { ShelfTab } from './tabs/ShelfTab';
import { useRoom } from './lib/useRoom';
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
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [countdown, setCountdown] = useState(295);
  const [sessionSec, setSessionSec] = useState(1080);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [joiningTopicId, setJoiningTopicId] = useState<string | null>(null);
  const [seatBumps, setSeatBumps] = useState<Record<string, number>>({});
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
  const { phase, room, mySeat, messages } = roomApi;

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
      setSessionSec(1080);
      setBriefingOpen(true);
    }
    if (phase === 'idle') {
      wasActive.current = false;
      setJoiningTopicId(null);
    }
    if (phase === 'active' || phase === 'error') {
      if (phase === 'error' && joiningTopicId) {
        const failedTopicId = joiningTopicId;
        setSeatBumps((prev) => ({ ...prev, [failedTopicId]: Math.max(0, (prev[failedTopicId] ?? 0) - 1) }));
      }
      setJoiningTopicId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function handleCancelApply(topicId: string) {
    setSeatBumps((prev) => ({ ...prev, [topicId]: Math.max(0, (prev[topicId] ?? 0) - 1) }));
    setJoiningTopicId(null);
    roomApi.cancelJoin();
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
    // Rehearsal is just practice — no participation-log entry, unlike a real session.
    sparRoomApi.leave();
    setSparTopicInput('');
  }

  const msgs: Msg[] = mySeat && nickname ? toMsgs(messages, mySeat, nickname) : [];
  const sparMsgs: Msg[] = nickname ? toMsgs(sparRoomApi.messages, 'A', nickname) : [];

  const ackLeft = (mySeat === 'A' ? room?.acks_left_a : room?.acks_left_b) ?? ACK_LIMIT;
  const handLeft = (mySeat === 'A' ? room?.hand_left_a : room?.hand_left_b) ?? HAND_LIMIT;
  const otherSeatLabel = (mySeat === 'A' ? room?.seat_b : room?.seat_a) ?? '상대';
  const isMyTurn = room?.turn === mySeat;
  const myMutedUntil = room ? (mySeat === 'A' ? room.muted_until_a : room.muted_until_b) : null;
  const otherMutedUntil = room ? (mySeat === 'A' ? room.muted_until_b : room.muted_until_a) : null;
  const muted = isMuted(myMutedUntil);
  const otherMuted = isMuted(otherMutedUntil);

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
                matchingTopicId={joiningTopicId}
                matchError={phase === 'error' ? roomApi.error : null}
                seatBumps={seatBumps}
                onEnterRoom={(topicId, topicTitle) => {
                  setJoiningTopicId(topicId);
                  setSeatBumps((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? 0) + 1 }));
                  roomApi.join(topicId, topicTitle);
                }}
                onCancelApply={handleCancelApply}
              />
            )}

            {tab === 'session' && room && mySeat && (
              <SessionTab
                topicTitle={room.topic_title}
                sessionLabel={fmt(sessionSec)}
                isMyTurn={isMyTurn}
                mySeatLabel={nickname}
                otherSeatLabel={otherSeatLabel}
                ackLeft={ackLeft}
                ackLimit={ACK_LIMIT}
                msgs={msgs}
                onAck={handleAck}
                logRef={logRef}
                toast={toast}
                handLeft={handLeft}
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

          <BottomNav tab={tab} onChange={setTab} />

          <WaitingModal
            open={phase === 'waiting'}
            topicTitle={room?.topic_title ?? ''}
            onCancel={() => joiningTopicId && handleCancelApply(joiningTopicId)}
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
