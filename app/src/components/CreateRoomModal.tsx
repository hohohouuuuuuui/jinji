import { useState } from 'react';
import type { CreateRoomRules } from '../lib/useRoom';
import type { RoomKind } from '../lib/db-types';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (topicTitle: string, rules: CreateRoomRules, kind: RoomKind) => void;
  creating: boolean;
  error?: string | null;
}

const DURATION_OPTIONS = [30, 60, 90, 120];
const HAND_LIMIT_OPTIONS = [1, 2, 3, 5];
const KIND_OPTIONS: { value: RoomKind; label: string; note: string }[] = [
  { value: 'chat', label: '대화', note: '1:1' },
  { value: 'debate', label: '토론', note: '2:2 팀' },
  { value: 'clash', label: '격돌', note: '관전 투표' },
];

export function CreateRoomModal({ open, onClose, onCreate, creating, error }: CreateRoomModalProps) {
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState<RoomKind>('chat');
  const [allowProfanity, setAllowProfanity] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [handLimit, setHandLimit] = useState(2);

  if (!open) return null;

  function submit() {
    if (!topic.trim() || creating) return;
    onCreate(topic.trim(), { allowProfanity, durationMinutes, handLimit }, kind);
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(17,17,19,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'jz-fade .2s ease',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 26,
          padding: '24px 20px',
          width: '100%',
          maxHeight: '90%',
          overflowY: 'auto',
          animation: 'jz-pop .3s ease',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.6, color: '#17171a' }}>방 만들기</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#4a4750', marginTop: 6 }}>
          직접 방을 만들면 방장이 되고, 세션 규칙을 정할 수 있어요.
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4750', marginTop: 18 }}>방 종류</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setKind(opt.value)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 14,
                padding: '10px 0',
                background: kind === opt.value ? '#17171a' : '#F3F1F5',
                color: kind === opt.value ? '#fff' : '#4a4750',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 2, opacity: 0.75 }}>{opt.note}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4750', marginTop: 18 }}>주제</div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 재택근무가 사무실 근무보다 생산적인가"
          style={{
            width: '100%',
            marginTop: 6,
            background: '#F3F1F5',
            border: 'none',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            color: '#17171a',
            outline: 'none',
          }}
        />

        <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4750', marginTop: 18 }}>
          대화·토론 총 시간
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {DURATION_OPTIONS.map((min) => (
            <button
              key={min}
              onClick={() => setDurationMinutes(min)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 999,
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 700,
                background: durationMinutes === min ? '#17171a' : '#F3F1F5',
                color: durationMinutes === min ? '#fff' : '#4a4750',
              }}
            >
              {min >= 60 ? `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ''}` : `${min}분`}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4750', marginTop: 18 }}>
          손들기 횟수 (세션당)
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {HAND_LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setHandLimit(n)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 999,
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 700,
                background: handLimit === n ? '#17171a' : '#F3F1F5',
                color: handLimit === n ? '#fff' : '#4a4750',
              }}
            >
              {n}회
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            background: '#F3F1F5',
            borderRadius: 16,
            padding: '12px 14px',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#17171a' }}>욕설 허용</div>
            <div style={{ fontSize: 10.5, color: '#78747e', marginTop: 2 }}>
              기본은 비허용. 조롱·인신공격은 허용해도 계속 금지돼요.
            </div>
          </div>
          <button
            onClick={() => setAllowProfanity((v) => !v)}
            aria-label="욕설 허용 토글"
            style={{
              cursor: 'pointer',
              border: 'none',
              width: 44,
              height: 26,
              borderRadius: 999,
              background: allowProfanity ? '#F586AE' : '#E4E1E8',
              position: 'relative',
              flex: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: allowProfanity ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .15s ease',
              }}
            />
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, background: '#FDECEC', borderRadius: 14, padding: '12px 14px', fontSize: 12, lineHeight: 1.55, color: '#c0392b', fontWeight: 500 }}>
            방을 만들지 못했어요: {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#4a4750' }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!topic.trim() || creating}
            style={{
              flex: 1,
              cursor: topic.trim() && !creating ? 'pointer' : 'not-allowed',
              background: topic.trim() && !creating ? '#17171a' : '#E4E1E8',
              color: topic.trim() && !creating ? '#fff' : '#a9a5af',
              border: 'none',
              borderRadius: 999,
              padding: 15,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {creating ? '만드는 중…' : '방 만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
