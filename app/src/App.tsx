import { useEffect, useRef, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { StatusBar } from './components/StatusBar';
import { BottomNav } from './components/BottomNav';
import { BriefingModal } from './components/BriefingModal';
import { ChangeModal } from './components/ChangeModal';
import { NicknameGate } from './components/NicknameGate';
import { WaitingModal } from './components/WaitingModal';
import { HomeTab } from './tabs/HomeTab';
import { SessionTab } from './tabs/SessionTab';
import { SparTab } from './tabs/SparTab';
import { ShelfTab } from './tabs/ShelfTab';
import { useRoom } from './lib/useRoom';
import { useProfile } from './lib/useProfile';
import { MODERATION_TOAST } from './lib/moderation';
import type { Msg, Tab, ToastState } from './types';

const NICKNAME_KEY = 'jinji.nickname';
const ACK_LIMIT = 3;
const HAND_LIMIT = 2;

function fmt(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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
  const [changeContext, setChangeContext] = useState<'main' | 'spar'>('main');

  const [sparTopicInput, setSparTopicInput] = useState('');
  const [sparTopicError, setSparTopicError] = useState<string | null>(null);
  const [sparValidating, setSparValidating] = useState(false);
  const [sparChatDraft, setSparChatDraft] = useState('');
  const [sparSessionSec, setSparSessionSec] = useState(1080);

  const roomApi = useRoom(nickname);
  const { phase, room, mySeat, messages } = roomApi;

  const sparRoomApi = useRoom(nickname);
  const { changedCount, bumpChanged } = useProfile(nickname);

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

  function handleNicknameSubmit(name: string) {
    localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
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
    setTab('shelf');
  }

  async function confirmChange() {
    setChangeOpen(false);
    if (changeContext === 'spar') {
      await sparRoomApi.declareChange();
    } else {
      await roomApi.declareChange();
      await bumpChanged();
    }
    showToast('good', '기록됨 · 다음 티어 변태 조건 충족');
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

  const msgs: Msg[] = messages.map((m) => ({
    id: m.id,
    who: m.seat === 'SYS' ? 'sys' : m.seat === mySeat ? 'me' : 'other',
    text: m.text,
    done: m.seat !== 'SYS',
    acked: m.acked,
  }));

  const sparMsgs: Msg[] = sparRoomApi.messages.map((m) => ({
    id: m.id,
    who: m.seat === 'SYS' ? 'sys' : m.seat === 'A' ? 'me' : 'other',
    text: m.text,
    done: m.seat !== 'SYS',
    acked: m.acked,
  }));

  const ackLeft = (mySeat === 'A' ? room?.acks_left_a : room?.acks_left_b) ?? ACK_LIMIT;
  const handLeft = (mySeat === 'A' ? room?.hand_left_a : room?.hand_left_b) ?? HAND_LIMIT;
  const otherSeatLabel = (mySeat === 'A' ? room?.seat_b : room?.seat_a) ?? '상대';
  const isMyTurn = room?.turn === mySeat;

  const sparRoom = sparRoomApi.room;
  const sparClosed = sparRoom?.status === 'closed';
  const sparIsMyTurn = sparRoom?.turn === 'A' && !sparClosed;

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
                onEnterRoom={(topicId, topicTitle) => {
                  setJoiningTopicId(topicId);
                  roomApi.join(topicId, topicTitle);
                }}
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

            {tab === 'shelf' && <ShelfTab changedCount={changedCount} nickname={nickname} />}
          </div>

          <BottomNav tab={tab} onChange={setTab} />

          <WaitingModal
            open={phase === 'waiting'}
            topicTitle={room?.topic_title ?? ''}
            onCancel={() => roomApi.leave()}
          />

          <BriefingModal
            open={briefingOpen}
            read={briefRead}
            roomLabel={room ? `${room.topic_title} · 입장 전 브리핑` : ''}
            title={room?.topic_title ?? ''}
            briefing={room?.briefing ?? null}
            onClose={() => setBriefingOpen(false)}
            onToggleRead={() => setBriefRead((r) => !r)}
            onEnter={() => {
              if (briefRead && room?.briefing) {
                setBriefingOpen(false);
                setTab('session');
              }
            }}
          />

          <ChangeModal open={changeOpen} onCancel={() => setChangeOpen(false)} onConfirm={confirmChange} />
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
