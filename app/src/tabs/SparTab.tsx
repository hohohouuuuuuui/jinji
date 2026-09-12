import { RULES, SPAR_STEPS } from '../data';

interface SparTabProps {
  sparStep: number;
  sparFb: string;
  sparDraft: string;
  onSparDraftChange: (v: string) => void;
  onSparAnswer: () => void;
  onGoHome: () => void;
  onRestart: () => void;
}

export function SparTab({
  sparStep,
  sparFb,
  sparDraft,
  onSparDraftChange,
  onSparAnswer,
  onGoHome,
  onRestart,
}: SparTabProps) {
  const done = sparStep >= SPAR_STEPS.length;
  const question = done ? '리허설 종료' : SPAR_STEPS[sparStep].q;
  const stepLabel = done ? '완료' : `${sparStep + 1}/2`;

  return (
    <div style={{ padding: '2px 20px 24px', animation: 'jz-fade .25s ease' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.6, color: '#4a4750', marginTop: 8 }}>
        REHEARSAL ROOM
      </div>
      <h2 style={{ margin: '5px 0 4px', fontSize: 25, fontWeight: 900, letterSpacing: -1.2, color: '#17171a' }}>리허설룸</h2>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#4a4750' }}>첫 참가 전 2턴 연습</p>

      <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
        <div style={{ height: 7, flex: 1, borderRadius: 999, background: '#F586AE' }} />
        <div style={{ height: 7, flex: 1, borderRadius: 999, background: '#EFEDF2' }} />
      </div>

      <div style={{ background: '#F3F1F5', borderRadius: 26, padding: 22 }}>
        <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 14, color: '#4a4750' }}>
          AI 리허설 파트너 · {stepLabel}
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.5, letterSpacing: -0.5, color: '#17171a', marginTop: 10 }}>
          {question}
        </div>
        {sparFb && (
          <div style={{ marginTop: 14, background: '#fff', borderRadius: 20, padding: '13px 16px', fontSize: 12.5, lineHeight: 1.6, fontWeight: 500, color: '#4a4750', animation: 'jz-up .25s ease' }}>
            {sparFb}
          </div>
        )}
      </div>

      {!done && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            value={sparDraft}
            onChange={(e) => onSparDraftChange(e.target.value)}
            placeholder="한 문장으로"
            style={{ flex: 1, minWidth: 0, background: '#F3F1F5', border: 'none', borderRadius: 999, padding: '14px 18px', fontSize: 14, color: '#17171a', outline: 'none' }}
          />
          <button
            onClick={onSparAnswer}
            style={{ cursor: 'pointer', flex: 'none', background: '#17171a', color: '#fff', border: 'none', borderRadius: 999, padding: '14px 19px', fontSize: 13, fontWeight: 700 }}
          >
            종료
          </button>
        </div>
      )}

      {done && (
        <div style={{ marginTop: 12, background: '#17171a', borderRadius: 26, padding: 22, animation: 'jz-pop .3s ease' }}>
          <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 20, color: '#F7B3D4' }}>입장 자격 획득</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={onRestart}
              style={{ flex: 1, cursor: 'pointer', background: '#26262b', color: '#F7B3D4', border: 'none', borderRadius: 999, padding: 14, fontSize: 14, fontWeight: 700 }}
            >
              다시 연습하기
            </button>
            <button
              onClick={onGoHome}
              style={{ flex: 1, cursor: 'pointer', background: '#F586AE', color: '#fff', border: 'none', borderRadius: 999, padding: 14, fontSize: 14, fontWeight: 700 }}
            >
              시간표로
            </button>
          </div>
        </div>
      )}

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
