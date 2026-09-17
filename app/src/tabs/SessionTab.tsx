import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Msg, ToastState } from '../types';
import { ISSUE_CHIPS } from '../data';
import { VoteGauge } from '../components/VoteGauge';
import type { VoteCounts } from '../lib/useVotes';

interface SessionTabProps {
  topicTitle: string;
  sessionLabel: string;
  isMyTurn: boolean;
  mySeatLabel: string;
  otherSeatLabel: string;
  myTeamMember2?: string | null;
  otherTeamMember2?: string | null;
  isTeamMember2?: boolean;
  voteCounts?: VoteCounts;
  voteALabel?: string;
  voteBLabel?: string;
  ackLeft: number;
  ackLimit: number;
  msgs: Msg[];
  onAck: (id: number) => void;
  logRef: RefObject<HTMLDivElement | null>;
  toast: ToastState | null;
  handLeft: number;
  handLimit?: number;
  isHost?: boolean;
  onEndSession?: () => void;
  onRaiseHand: () => void;
  onDeclareChange: () => void;
  onLeave: () => void;
  draft: string;
  onDraftChange: (v: string) => void;
  // false: 엔터로 보내는 한 줄(카카오톡처럼 즉시 채팅창에 올라가지만 발언권은
  // 그대로 나한테 남는다). true: [종료] 버튼(내 발언을 마치고 상대에게
  // 순서를 넘긴다 — 더 할 말이 없으면 빈 채로 눌러도 된다).
  onSend: (endTurn: boolean) => void;
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
  myTeamMember2 = null,
  otherTeamMember2 = null,
  isTeamMember2 = false,
  voteCounts,
  voteALabel = 'A',
  voteBLabel = 'B',
  ackLeft,
  ackLimit,
  msgs,
  onAck,
  logRef,
  toast,
  handLeft,
  handLimit = 2,
  isHost = false,
  onEndSession,
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
  const canType = !closed && !muted && (isTeamMember2 ? handLeft > 0 : isMyTurn);
  // 생각이 바뀜: 상대가 한마디도 안 했는데 내 생각이 바뀔 수는 없으니,
  // 상대의 실제 발언이 최소 한 번은 있어야 쓸 수 있다.
  const opponentHasSpoken = msgs.some((m) => m.who === 'other' && m.kind === 'chat');
  const canDeclareChange = !closed && opponentHasSpoken;
  // 스틸맨: 상대 주장을 요약하는 기능이라 내 차례(내가 말할 시간)가 아니라
  // 상대 차례일 때만 쓴다 — 세션이 끝났으면(상대가 "종료"를 선언했으면) 당연히 못 쓴다.
  const canStillman = !closed && !isMyTurn;
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);
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
            {myTeamMember2 && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#c9c6cd', marginTop: 2 }}>+ {myTeamMember2}</div>
            )}
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
            {otherTeamMember2 && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#c9c6cd', marginTop: 2 }}>+ {otherTeamMember2}</div>
            )}
          </div>
        </div>
      </div>

      {voteCounts && <VoteGauge counts={voteCounts} aLabel={voteALabel} bLabel={voteBLabel} />}

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

      <div style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '0 20px 4px' }}>
        {isHost && !closed && onEndSession && (
          <button
            onClick={onEndSession}
            style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#78747e', padding: '4px 2px' }}
          >
            🛑 토론 종료 · 방장
          </button>
        )}
        {isHost && closed && (
          <button
            onClick={onLeave}
            style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#a05a7a', padding: '4px 2px' }}
          >
            나가기
          </button>
        )}
        {!isHost && (
          <button
            onClick={onLeave}
            style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#a05a7a', padding: '4px 2px' }}
          >
            {leaveLabel}
          </button>
        )}
      </div>

      {topicTitle === 'AI 생성물에 저작권을 인정해야 하는가' && (
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
      )}

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
                {!m.acked && !closed && (
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
                  {m.flagged && !m.disputed && !closed && (
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
                {showEndorse && m.canEndorse && !closed && (
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
            disabled={closed}
            style={{
              cursor: closed ? 'not-allowed' : 'pointer',
              opacity: closed ? 0.5 : 1,
              background: '#F3F1F5',
              border: 'none',
              borderRadius: 999,
              padding: '13px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#17171a',
            }}
          >
            ✋ {handLeft}/{handLimit}
          </button>
          <button
            onClick={onDeclareChange}
            disabled={!canDeclareChange}
            style={{
              cursor: canDeclareChange ? 'pointer' : 'not-allowed',
              opacity: canDeclareChange ? 1 : 0.5,
              flex: 1,
              background: '#FBDFEC',
              border: 'none',
              borderRadius: 999,
              padding: '13px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#8d3f70',
            }}
          >
            🔁 생각이 바뀜
          </button>
          <button
            onClick={onOpenStillman}
            disabled={!canStillman}
            style={{
              cursor: canStillman ? 'pointer' : 'not-allowed',
              opacity: canStillman ? 1 : 0.5,
              background: '#F3F1F5',
              border: 'none',
              borderRadius: 999,
              padding: '13px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#17171a',
            }}
          >
            🫱 스틸맨
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              // 카카오톡처럼: 엔터를 치면 그 자리에서 바로 메시지가 올라간다
              // (발언권은 그대로 나에게 남는다, 여러 줄을 이어서 보낼 수
              // 있음). Shift+Enter는 줄바꿈. 실제로 순서를 상대에게 넘기는
              // 건 오직 [종료] 버튼뿐이다.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canType && draft.trim()) onSend(false);
              }
            }}
            rows={1}
            enterKeyHint="send"
            placeholder={
              closed
                ? '세션이 종료됐습니다'
                : muted
                  ? `${mutedSecondsLeft}초 후 다시 발언할 수 있어요`
                  : isMyTurn
                    ? '메시지를 입력하고 Enter로 보내세요'
                    : isTeamMember2
                      ? '팀 대표의 의견에 덧붙이기 · Enter로 보내세요'
                      : '상대 차례를 기다리는 중…'
            }
            disabled={!canType}
            style={{
              flex: 1,
              minWidth: 0,
              background: '#F3F1F5',
              border: 'none',
              borderRadius: 20,
              padding: '14px 18px',
              fontSize: 14,
              lineHeight: 1.4,
              fontFamily: 'inherit',
              color: '#17171a',
              outline: 'none',
              opacity: canType ? 1 : 0.6,
              resize: 'none',
              maxHeight: 120,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={() => onSend(!isTeamMember2)}
            disabled={!canType || (isTeamMember2 && !draft.trim())}
            title={isTeamMember2 ? undefined : '발언을 마치고 상대에게 순서를 넘깁니다'}
            style={{
              cursor: canType && !(isTeamMember2 && !draft.trim()) ? 'pointer' : 'not-allowed',
              flex: 'none',
              background: canType && !(isTeamMember2 && !draft.trim()) ? '#17171a' : '#EFEDF2',
              color: canType && !(isTeamMember2 && !draft.trim()) ? '#fff' : '#a9a5af',
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
