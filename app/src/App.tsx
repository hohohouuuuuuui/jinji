import { useEffect, useRef, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { StatusBar } from './components/StatusBar';
import { BottomNav } from './components/BottomNav';
import { BriefingModal } from './components/BriefingModal';
import { ChangeModal } from './components/ChangeModal';
import { HomeTab } from './tabs/HomeTab';
import { SessionTab } from './tabs/SessionTab';
import { SparTab } from './tabs/SparTab';
import { ShelfTab } from './tabs/ShelfTab';
import { INITIAL_MSGS, OTHER_REPLIES, SPAR_STEPS } from './data';
import type { Msg, Tab, ToastState } from './types';

const ACK_LIMIT = 3;
const SHOW_MOCK_BUTTON = true;

function fmt(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [briefing, setBriefing] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [countdown, setCountdown] = useState(295);
  const [sessionSec, setSessionSec] = useState(1080);
  const [ackLeft, setAckLeft] = useState(ACK_LIMIT);
  const [changed, setChanged] = useState(5);
  const [hand, setHand] = useState(2);
  const [draft, setDraft] = useState('');
  const [sparDraft, setSparDraft] = useState('');
  const [sparStep, setSparStep] = useState(0);
  const [sparFb, setSparFb] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

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
      if (pending.current) clearTimeout(pending.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, tab]);

  function showToast(tone: ToastState['tone'], text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tone, text });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  function ack(i: number) {
    if (ackLeft <= 0) {
      showToast('good', `인정권을 모두 썼습니다 · ${ACK_LIMIT}회`);
      return;
    }
    setAckLeft((left) => left - 1);
    setMsgs((prev) => prev.map((m, k) => (k === i ? { ...m, acked: true } : m)));
    showToast('good', '상호 인정 기록 · 양측 성장 +1');
  }

  function send() {
    if (pending.current) return;
    const text =
      draft.trim() || '예측 가능성으로는 우연히 좋은 결과가 나온 경우를 설명할 수 없습니다.';
    const nth = msgs.filter((m) => m.who === 'other').length;
    const reply = OTHER_REPLIES[Math.min(nth, OTHER_REPLIES.length - 1)];
    setMsgs((prev) => [...prev, { who: 'me', text, done: true }]);
    setDraft('');
    pending.current = setTimeout(() => {
      pending.current = null;
      setMsgs((prev) => [...prev, { who: 'other', text: reply, acked: false }]);
    }, 1100);
  }

  function raiseHand() {
    if (hand <= 0) {
      showToast('good', '손들기를 모두 썼습니다');
      return;
    }
    setHand((h) => h - 1);
    showToast('good', '발언권 요청 · 다음 턴에 앞당겨집니다');
  }

  function mockTest() {
    if (!SHOW_MOCK_BUTTON) return;
    showToast('warn', 'mock');
  }

  function confirmChange() {
    setChangeOpen(false);
    setChanged((c) => c + 1);
    setMsgs((prev) => [...prev, { who: 'sys', text: '생각이 바뀜 선언 🔁' }]);
    showToast('good', '기록됨 · 다음 티어 변태 조건 충족');
  }

  function sparAnswer() {
    setSparFb(SPAR_STEPS[Math.min(sparStep, SPAR_STEPS.length - 1)].fb);
    setSparStep((s) => s + 1);
    setSparDraft('');
  }

  return (
    <PhoneFrame>
      <StatusBar />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'home' && (
          <HomeTab countdownLabel={fmt(countdown)} onOpenBriefing={() => setBriefing(true)} />
        )}

        {tab === 'session' && (
          <SessionTab
            sessionLabel={fmt(sessionSec)}
            ackLeft={ackLeft}
            ackLimit={ACK_LIMIT}
            msgs={msgs}
            onAck={ack}
            logRef={logRef}
            toast={toast}
            handLeft={hand}
            onRaiseHand={raiseHand}
            onDeclareChange={() => setChangeOpen(true)}
            onMockTest={mockTest}
            showMockButton={SHOW_MOCK_BUTTON}
            draft={draft}
            onDraftChange={setDraft}
            onSend={send}
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
          />
        )}

        {tab === 'shelf' && <ShelfTab changedCount={changed} />}
      </div>

      <BottomNav tab={tab} onChange={setTab} />

      <BriefingModal
        open={briefing}
        read={briefRead}
        onClose={() => setBriefing(false)}
        onToggleRead={() => setBriefRead((r) => !r)}
        onEnter={() => {
          if (briefRead) {
            setBriefing(false);
            setTab('session');
          }
        }}
      />

      <ChangeModal open={changeOpen} onCancel={() => setChangeOpen(false)} onConfirm={confirmChange} />

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
