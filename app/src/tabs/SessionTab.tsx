import type { RefObject } from 'react';
import type { Msg, ToastState } from '../types';
import { ISSUE_CHIPS } from '../data';

interface SessionTabProps {
  sessionLabel: string;
  ackLeft: number;
  ackLimit: number;
  msgs: Msg[];
  onAck: (index: number) => void;
  logRef: RefObject<HTMLDivElement | null>;
  toast: ToastState | null;
  handLeft: number;
  onRaiseHand: () => void;
  onDeclareChange: () => void;
  onMockTest: () => void;
  showMockButton: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
}

export function SessionTab({
  sessionLabel,
  ackLeft,
  ackLimit,
  msgs,
  onAck,
  logRef,
  toast,
  handLeft,
  onRaiseHand,
  onDeclareChange,
  onMockTest,
  showMockButton,
  draft,
  onDraftChange,
  onSend,
}: SessionTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'jz-fade .25s ease' }}>
      <div style={{ flex: 'none', margin: '0 16px', background: '#17171a', borderRadius: 22, padding: '13px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F586AE', animation: 'jz-blink 3s infinite' }} />
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: '#F7B3D4' }}>
            진행 중 · 1번 방
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1.2, color: '#8f8b93' }}>
            자리
          </span>
          <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 16, lineHeight: 1, color: '#fff' }}>{sessionLabel}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginTop: 9 }}>
          AI 생성물의 저작권
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 13 }}>
          <div style={{ flex: 1, background: '#26262b', borderRadius: 14, padding: '9px 10px', border: '1.5px solid #F586AE' }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#F7B3D4' }}>
              발언 중 · 나
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', marginTop: 3 }}>성장 애벌레</div>
          </div>
          <div style={{ flex: 1, background: '#26262b', borderRadius: 14, padding: '9px 10px' }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#78747e' }}>
              상대
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c9c6cd', marginTop: 3 }}>상대 번데기</div>
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
            background: '#FBDFEC',
            color: '#8d3f70',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F586AE' }} />내 차례
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
        {msgs.map((m, i) => {
          if (m.who === 'other') {
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, animation: 'jz-up .3s ease' }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: '#78747e', paddingLeft: 4 }}>
                  상대
                </div>
                <div style={{ maxWidth: '84%', background: '#F3F1F5', borderRadius: 22, padding: '13px 17px', fontSize: 14, lineHeight: 1.6, color: '#17171a' }}>
                  {m.text}
                </div>
                {!m.acked && (
                  <button
                    onClick={() => onAck(i)}
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
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, animation: 'jz-up .3s ease' }}>
                <div style={{ maxWidth: '84%', background: '#F7B3D4', borderRadius: 22, padding: '13px 17px', fontSize: 14, lineHeight: 1.6, color: '#3d1029' }}>
                  {m.text}
                </div>
                {m.done && <div style={{ fontSize: 10, color: '#4a4750', paddingRight: 6 }}>발언 종료</div>}
              </div>
            );
          }
          return (
            <div key={i} style={{ alignSelf: 'center', background: '#17171a', borderRadius: 999, padding: '9px 18px', fontSize: 11.5, fontWeight: 700, color: '#F7B3D4', animation: 'jz-pop .3s ease' }}>
              {m.text}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 'none', padding: '8px 16px 14px', borderTop: '1px solid #EFEDF2' }}>
        {toast && toast.tone === 'warn' && (
          <div style={{ background: '#FFF3D6', borderRadius: 20, padding: '13px 16px', marginBottom: 9, fontSize: 12.5, lineHeight: 1.55, color: '#63510f', fontWeight: 500, animation: 'jz-up .25s ease' }}>
            태도가 아니라 생각을 겨누고 있나요? · 조롱 감지 1차
          </div>
        )}
        {toast && toast.tone === 'good' && (
          <div style={{ background: '#FBDFEC', borderRadius: 20, padding: '13px 16px', marginBottom: 9, fontSize: 12.5, lineHeight: 1.55, color: '#8d3f70', fontWeight: 500, animation: 'jz-up .25s ease' }}>
            {toast.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 7, marginBottom: 9 }}>
          <button
            onClick={onRaiseHand}
            style={{ cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: '13px 16px', fontSize: 12, fontWeight: 700, color: '#17171a' }}
          >
            ✋ {handLeft}/3
          </button>
          <button
            onClick={onDeclareChange}
            style={{ cursor: 'pointer', flex: 1, background: '#FBDFEC', border: 'none', borderRadius: 999, padding: '13px 16px', fontSize: 12, fontWeight: 700, color: '#8d3f70' }}
          >
            🔁 생각이 바뀜
          </button>
          {showMockButton && (
            <button
              onClick={onMockTest}
              style={{ cursor: 'pointer', background: '#fff', border: '1.5px dashed #cbc7d1', borderRadius: 999, padding: '13px 15px', fontSize: 12, fontWeight: 500, color: '#4a4750' }}
            >
              조롱
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="발언대에서 말하기"
            style={{ flex: 1, minWidth: 0, background: '#F3F1F5', border: 'none', borderRadius: 999, padding: '14px 18px', fontSize: 14, color: '#17171a', outline: 'none' }}
          />
          <button
            onClick={onSend}
            style={{ cursor: 'pointer', flex: 'none', background: '#17171a', color: '#fff', border: 'none', borderRadius: 999, padding: '14px 19px', fontSize: 13, fontWeight: 700 }}
          >
            종료
          </button>
        </div>
      </div>
    </div>
  );
}
