import type { RefObject } from 'react';
import type { Msg, ToastState } from '../types';
import { ISSUE_CHIPS } from '../data';

interface SessionTabProps {
  topicTitle: string;
  sessionLabel: string;
  isMyTurn: boolean;
  mySeatLabel: string;
  otherSeatLabel: string;
  ackLeft: number;
  ackLimit: number;
  msgs: Msg[];
  onAck: (id: number) => void;
  logRef: RefObject<HTMLDivElement | null>;
  toast: ToastState | null;
  handLeft: number;
  onRaiseHand: () => void;
  onDeclareChange: () => void;
  onLeave: () => void;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  kindLabel?: string;
  closed?: boolean;
  leaveLabel?: string;
  onDispute: (id: number) => void;
  showEndorse: boolean;
  onEndorseChange?: (id: number) => void;
  onOpenStillman: () => void;
  muted: boolean;
  mutedSecondsLeft: number;
  otherMuted: boolean;
}

export function SessionTab({
  topicTitle,
  sessionLabel,
  isMyTurn,
  mySeatLabel,
  otherSeatLabel,
  ackLeft,
  ackLimit,
  msgs,
  onAck,
  logRef,
  toast,
  handLeft,
  onRaiseHand,
  onDeclareChange,
  onLeave,
  draft,
  onDraftChange,
  onSend,
  kindLabel = '진지한 대화',
  closed = false,
  leaveLabel = '나가기 · 참가기록 남기기',
  onDispute,
  showEndorse,
  onEndorseChange,
  onOpenStillman,
  muted,
  mutedSecondsLeft,
  otherMuted,
}: SessionTabProps) {
  const canType = isMyTurn && !closed && !muted;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'jz-fade .25s ease' }}>
      <div style={{ flex: 'none', margin: '0 16px', background: '#17171a', borderRadius: 22, padding: '13px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F586AE', animation: 'jz-blink 3s infinite' }} />
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: '#F7B3D4' }}>
            {closed ? '종료됨' : '진행 중'} · {kindLabel}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1.2, color: '#8f8b93' }}>
            남은시간
          </span>
          <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 16, lineHeight: 1, color: '#fff' }}>{sessionLabel}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginTop: 9 }}>{topicTitle}</div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 13 }}>
          <div
            style={{
              flex: 1,
              background: '#26262b',
              borderRadius: 14,
              padding: '9px 10px',
              border: isMyTurn ? '1.5px solid #F586AE' : '1.5px solid transparent',
            }}
          >
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fontWeight: 700, letterSpacing: 1, color: isMyTurn ? '#F7B3D4' : '#78747e' }}>
              {isMyTurn ? '발언 중 · 나' : '나'}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', marginTop: 3 }}>{mySeatLabel}</div>
          </div>
          <div
            style={{
              flex: 1,
              background: '#26262b',
              borderRadius: 14,
              padding: '9px 10px',
              border: !isMyTurn ? '1.5px solid #F586AE' : '1.5px solid transparent',
            }}
          >
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fontWeight: 700, letterSpacing: 1, color: !isMyTurn ? '#F7B3D4' : '#78747e' }}>
              {!isMyTurn ? '발언 중 · 상대' : '상대'}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c9c6cd', marginTop: 3 }}>{otherSeatLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 8px' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 999,
            background: isMyTurn ? '#FBDFEC' : '#F3F1F5',
            color: isMyTurn ? '#8d3f70' : '#4a4750',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isMyTurn ? '#F586AE' : '#b8b4bd' }} />
          {isMyTurn ? '내 차례' : '상대 차례'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#4a4750' }}>인정권</span>
          {Array.from({ length: ackLimit }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: i < ackLeft ? '#17171a' : '#E4E1E8',
                display: 'inline-block',
              }}
            />
          ))}
        </span>
      </div>

      {otherMuted && (
        <div style={{ flex: 'none', padding: '0 20px 8px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#78747e' }}>상대가 잠시 정리 중이에요</span>
        </div>
      )}

      <div style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end', padding: '0 20px 4px' }}>
        <button
          onClick={onLeave}
          style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#a05a7a', padding: '4px 2px' }}
        >
          {leaveLabel}
        </button>
      </div>

      <div style={{ flex: 'none', display: 'flex', gap: 6, overflowX: 'auto', padding: '0 20px 10px' }}>
        {ISSUE_CHIPS.map((chip) => (
          <span
            key={chip}
            style={{ flex: 'none', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999, background: '#F3F1F5', color: '#4a4750' }}
          >
            {chip}
          </span>
        ))}
      </div>

      <div
        ref={logRef}
        data-log="1"
        style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 10px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {msgs.map((m) => {
          if (m.who === 'other') {
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, animation: 'jz-up .3s ease' }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: '#78747e', paddingLeft: 4 }}>
                  상대
                </div>
                <div style={{ maxWidth: '84%', background: '#F3F1F5', borderRadius: 22, padding: '13px 17px', fontSize: 14, lineHeight: 1.6, color: '#17171a' }}>
                  {m.text}
                </div>
                {!m.acked && (
                  <button
                    onClick={() => onAck(m.id)}
                    style={{ cursor: 'pointer', background: '#fff', border: '2px solid #17171a', borderRadius: 999, padding: '8px 15px', fontSize: 12, fontWeight: 700, color: '#17171a' }}
                  >
                    그건 맞네 🤍
                  </button>
                )}
                {m.acked && (
                  <div style={{ background: '#FBDFEC', borderRadius: 999, padding: '8px 15px', fontSize: 12, fontWeight: 700, color: '#8d3f70', animation: 'jz-pop .3s ease' }}>
                    인정 🤍 +1
                  </div>
                )}
              </div>
            );
          }
          if (m.who === 'me') {
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, animation: 'jz-up .3s ease' }}>
                <div style={{ maxWidth: '84%', background: '#F7B3D4', borderRadius: 22, padding: '13px 17px', fontSize: 14, lineHeight: 1.6, color: '#3d1029' }}>
                  {m.text}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingRight: 6 }}>
                  {m.done && <div style={{ fontSize: 10, color: '#4a4750' }}>발언 종료</div>}
                  {m.flagged && !m.disputed && (
                    <button
                      onClick={() => onDispute(m.id)}
                      style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 10, fontWeight: 700, color: '#c0392b', padding: 0 }}
                    >
                      이의제기
                    </button>
                  )}
                  {m.disputed && <div style={{ fontSize: 10, color: '#78747e' }}>이의제기로 무효 처리됨</div>}
                </div>
              </div>
            );
          }
          if (m.kind === 'change_declare') {
            return (
              <div key={m.id} style={{ alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'jz-pop .3s ease' }}>
                <div style={{ background: '#17171a', borderRadius: 999, padding: '9px 18px', fontSize: 11.5, fontWeight: 700, color: '#F7B3D4' }}>
                  {m.text}
                </div>
                {showEndorse && m.canEndorse && (
                  <button
                    onClick={() => onEndorseChange?.(m.id)}
                    style={{ cursor: 'pointer', background: '#FBDFEC', border: 'none', borderRadius: 999, padding: '7px 16px', fontSize: 11, fontWeight: 700, color: '#8d3f70' }}
                  >
                    동의해서 성장시키기
                  </button>
                )}
                {showEndorse && m.acked && <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5f48' }}>✅ 상대가 동의함</div>}
              </div>
            );
          }
          return (
            <div key={m.id} style={{ alignSelf: 'center', background: '#17171a', borderRadius: 999, padding: '9px 18px', fontSize: 11.5, fontWeight: 700, color: '#F7B3D4', animation: 'jz-pop .3s ease' }}>
              {m.text}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 'none', padding: '8px 16px 14px', borderTop: '1px solid #EFEDF2' }}>
        {toast && toast.tone === 'warn' && (
          <div style={{ background: '#FFF3D6', borderRadius: 20, padding: '13px 16px', marginBottom: 9, fontSize: 12.5, lineHeight: 1.55, color: '#63510f', fontWeight: 500, animation: 'jz-up .25s ease' }}>
            {toast.text}
          </div>
        )}
        {toast && toast.tone === 'good' && (
          <div style={{ background: '#FBDFEC', borderRadius: 20, padding: '13px 16px', marginBottom: 9, fontSize: 12.5, lineHeight: 1.55, color: '#8d3f70', fontWeight: 500, animation: 'jz-up .25s ease' }}>
            {toast.text}
          </div>
        )}

        {muted && (
          <div style={{ background: '#FFF3D6', borderRadius: 20, padding: '13px 16px', marginBottom: 9, fontSize: 12.5, lineHeight: 1.55, color: '#63510f', fontWeight: 500, animation: 'jz-up .25s ease' }}>
            ⚠️ 2차 경고 · {mutedSecondsLeft}초간 발언이 제한됩니다
          </div>
        )}

        <div style={{ display: 'flex', gap: 7, marginBottom: 9 }}>
          <button
            onClick={onRaiseHand}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: '13px 14px', fontSize: 12, fontWeight: 700, color: '#17171a' }}
          >
            ✋ {handLeft}/2
          </button>
          <button
            onClick={onDeclareChange}
            style={{ cursor: 'pointer', flex: 1, background: '#FBDFEC', border: 'none', borderRadius: 999, padding: '13px 14px', fontSize: 12, fontWeight: 700, color: '#8d3f70' }}
          >
            🔁 생각이 바뀜
          </button>
          <button
            onClick={onOpenStillman}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: '13px 14px', fontSize: 12, fontWeight: 700, color: '#17171a' }}
          >
            🫱 스틸맨
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSend();
            }}
            placeholder={
              closed
                ? '세션이 종료됐습니다'
                : muted
                  ? `${mutedSecondsLeft}초 후 다시 발언할 수 있어요`
                  : isMyTurn
                    ? '발언대에서 말하기'
                    : '상대 차례를 기다리는 중…'
            }
            disabled={!canType}
            style={{
              flex: 1,
              minWidth: 0,
              background: '#F3F1F5',
              border: 'none',
              borderRadius: 999,
              padding: '14px 18px',
              fontSize: 14,
              color: '#17171a',
              outline: 'none',
              opacity: canType ? 1 : 0.6,
            }}
          />
          <button
            onClick={onSend}
            disabled={!canType}
            style={{
              cursor: canType ? 'pointer' : 'not-allowed',
              flex: 'none',
              background: canType ? '#17171a' : '#EFEDF2',
              color: canType ? '#fff' : '#a9a5af',
              border: 'none',
              borderRadius: 999,
              padding: '14px 19px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            종료
          </button>
        </div>
      </div>
    </div>
  );
}
