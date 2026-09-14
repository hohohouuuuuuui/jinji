import { RULES } from '../data';

interface SparTabProps {
  topicInput: string;
  onTopicInputChange: (v: string) => void;
  onStart: () => void;
  starting: boolean;
  topicError?: string | null;
}

export function SparTab({ topicInput, onTopicInputChange, onStart, starting, topicError }: SparTabProps) {
  const canStart = topicInput.trim().length > 0 && !starting;

  return (
    <div style={{ padding: '2px 20px 24px', animation: 'jz-fade .25s ease' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.6, color: '#4a4750', marginTop: 8 }}>
        REHEARSAL ROOM
      </div>
      <h2 style={{ margin: '5px 0 4px', fontSize: 25, fontWeight: 900, letterSpacing: -1.2, color: '#17171a' }}>리허설룸</h2>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#4a4750', lineHeight: 1.6 }}>
        원하는 주제를 직접 입력하면, AI와 1:1로 실전처럼 대화·토론해볼 수 있어요. 매칭 대기 없이 바로 시작하고, 몇 번이든 다시 할 수 있어요.
      </p>

      <div style={{ background: '#F3F1F5', borderRadius: 26, padding: 22 }}>
        <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 14, color: '#4a4750' }}>연습하고 싶은 주제</div>
        <input
          value={topicInput}
          onChange={(e) => onTopicInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) onStart();
          }}
          placeholder="예: 반려동물 보유세, 도입해야 하는가"
          style={{
            width: '100%',
            marginTop: 12,
            background: '#fff',
            border: topicError ? '1.5px solid #c0392b' : 'none',
            borderRadius: 999,
            padding: '14px 18px',
            fontSize: 14,
            color: '#17171a',
            outline: 'none',
          }}
        />
        {topicError && (
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.55, color: '#c0392b', fontWeight: 500 }}>
            {topicError}
          </div>
        )}
        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: '100%',
            marginTop: 12,
            cursor: canStart ? 'pointer' : 'not-allowed',
            background: canStart ? '#17171a' : '#E4E1E8',
            color: canStart ? '#fff' : '#a9a5af',
            border: 'none',
            borderRadius: 999,
            padding: 15,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {starting ? '시작하는 중…' : 'AI와 시작하기'}
        </button>
      </div>

      <div style={{ marginTop: 14, background: '#17171a', borderRadius: 20, padding: '16px 18px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F7B3D4' }}>AI도 같은 규칙을 지켜요</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#c9c6cd', marginTop: 6 }}>
          상대가 사람이든 AI든 조롱·인신공격은 감지됩니다. AI가 규칙을 3번 어기면 그 세션은 자동으로 종료돼요 — 판정이 한쪽에만 유리하지 않다는 걸 직접 확인해보세요.
        </div>
      </div>

      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750', marginTop: 28 }}>
        참가 규정
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
        {RULES.map((rule, i) => {
          const isLast = i === RULES.length - 1;
          return (
            <span
              key={rule}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '10px 16px',
                borderRadius: 999,
                background: isLast ? '#FBDFEC' : '#F3F1F5',
                color: isLast ? '#8d3f70' : '#4a4750',
              }}
            >
              {rule}
            </span>
          );
        })}
      </div>
    </div>
  );
}
