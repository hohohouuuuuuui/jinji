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
import { SPAR_STEPS } from './data';
import { useRoom } from './lib/useRoom';
import type { ModerationAxis } from './lib/db-types';
import type { Msg, Tab, ToastState } from './types';

const NICKNAME_KEY = 'jinji.nickname';
const ACK_LIMIT = 3;
const HAND_LIMIT = 2;

function fmt(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MODERATION_TOAST: Record<ModerationAxis, string | null> = {
  none: null,
  profanity: '비속어가 감지됐어요 · 표현을 다듬어볼까요?',
  disrespect: '존댓말에서 벗어난 표현이 감지됐어요 · 1차 경고',
  personal_attack: '주장이 아니라 사람을 겨눈 것 같아요 · 인신공격 감지',
  mockery: '태도가 아니라 생각을 겨누고 있나요? · 조롱 감지 1차',
};

export default function App() {
  const [nickname, setNickname] = useState<string | null>(() => localStorage.getItem(NICKNAME_KEY));
  const [tab, setTab] = useState<Tab>('home');
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [countdown, setCountdown] = useState(295);
  const [sessionSec, setSessionSec] = useState(1080);
  const [changed, setChanged] = useState(0);
  const [draft, setDraft] = useState('');
  const [sparDraft, setSparDraft] = useState('');
  const [sparStep, setSparStep] = useState(0);
  const [sparFb, setSparFb] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [joiningTopicId, setJoiningTopicId] = useState<string | null>(null);

  const roomApi = useRoom(nickname);
  const { phase, room, mySeat, messages } = roomApi;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
      setSessionSec((s) => (tab === 'session' ? Math.max(0, s - 1) : s));
    }, 1000);
    return () => clearInterval(t);
  }, [tab]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, tab]);

  // Open the briefing the moment a match completes (either side).
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
    await roomApi.declareChange();
    setChanged((c) => c + 1);
    showToast('good', '기록됨 · 다음 티어 변태 조건 충족');
  }

  function sparAnswer() {
    setSparFb(SPAR_STEPS[Math.min(sparStep, SPAR_STEPS.length - 1)].fb);
    setSparStep((s) => s + 1);
    setSparDraft('');
  }

  function sparRestart() {
    setSparStep(0);
    setSparFb('');
    setSparDraft('');
  }

  const msgs: Msg[] = messages.map((m) => ({
    id: m.id,
    who: m.seat === 'SYS' ? 'sys' : m.seat === mySeat ? 'me' : 'other',
    text: m.text,
    done: m.seat !== 'SYS',
    acked: m.acked,
  }));

  const ackLeft = (mySeat === 'A' ? room?.acks_left_a : room?.acks_left_b) ?? ACK_LIMIT;
  const handLeft = (mySeat === 'A' ? room?.hand_left_a : room?.hand_left_b) ?? HAND_LIMIT;
  const otherSeatLabel = (mySeat === 'A' ? room?.seat_b : room?.seat_a) ?? '상대';
  const isMyTurn = room?.turn === mySeat;

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
                matchingTopicId={joiningTopicId}
                matchError={phase === 'error' ? roomApi.error : null}
                onEnterRoom={(topicId, topicTitle, vsAI) => {
                  setJoiningTopicId(topicId);
                  roomApi.join(topicId, topicTitle, vsAI);
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
                onDeclareChange={() => setChangeOpen(true)}
                onLeave={handleLeaveSession}
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
              />
            )}

            {tab === 'spar' && (
              <SparTab
                sparStep={sparStep}
                sparFb={sparFb}
                sparDraft={sparDraft}
                onSparDraftChange={setSparDraft}
                onSparAnswer={sparAnswer}
                onGoHome={() => setTab('home')}
                onRestart={sparRestart}
              />
            )}

            {tab === 'shelf' && <ShelfTab changedCount={changed} nickname={nickname} />}
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
