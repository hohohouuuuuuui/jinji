import type { Briefing } from '../lib/db-types';

interface BriefingModalProps {
  open: boolean;
  read: boolean;
  roomLabel: string;
  title: string;
  briefing: Briefing | null;
  onClose: () => void;
  onToggleRead: () => void;
  onEnter: () => void;
}

export function BriefingModal({
  open,
  read,
  roomLabel,
  title,
  briefing,
  onClose,
  onToggleRead,
  onEnter,
}: BriefingModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(17,17,19,.42)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'jz-fade .2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '88%',
          background: '#fff',
          borderRadius: '26px 26px 42px 42px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'jz-up .3s cubic-bezier(.2,.8,.2,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 'none', background: '#17171a', padding: '18px 22px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, color: '#F7B3D4' }}>
              {roomLabel}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.7, color: '#fff', marginTop: 6 }}>{title}</div>
          </div>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', background: '#26262b', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 14, color: '#c9c6cd' }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 20px' }}>
          {!briefing ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: '#78747e' }}>
              AI가 브리핑을 준비하고 있어요…
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750' }}>
                용어 {briefing.terms.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {briefing.terms.map((term) => (
                  <span key={term} style={{ fontSize: 12, fontWeight: 700, padding: '9px 15px', borderRadius: 999, background: '#F3F1F5', color: '#17171a' }}>
                    {term}
                  </span>
                ))}
              </div>

              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750', marginTop: 26 }}>
                쟁점 {briefing.issues.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {briefing.issues.map((issue) => (
                  <div key={issue} style={{ background: '#F3F1F5', borderRadius: 20, padding: '15px 17px', fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: '#17171a' }}>
                    {issue}
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750', marginTop: 26 }}>
                반대 {briefing.objections.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {briefing.objections.map((obj, i) => (
                  <div
                    key={obj}
                    style={{
                      background: i % 2 === 0 ? '#FBDFEC' : '#E6F5FC',
                      color: i % 2 === 0 ? '#8d3f70' : '#1f5a75',
                      borderRadius: 20,
                      padding: '15px 17px',
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: 1.6,
                    }}
                  >
                    {obj}
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={onToggleRead}
            style={{ width: '100%', marginTop: 24, cursor: 'pointer', background: '#F7F6F9', border: 'none', borderRadius: 999, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}
          >
            {read ? (
              <span style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: '#17171a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                ✓
              </span>
            ) : (
              <span style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: '#fff' }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#17171a' }}>끝까지 읽었습니다</span>
          </button>
        </div>

        <div style={{ flex: 'none', padding: '10px 22px 26px' }}>
          <button
            onClick={onEnter}
            disabled={!read || !briefing}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 999,
              padding: 17,
              fontSize: 14,
              fontWeight: 700,
              background: read && briefing ? '#17171a' : '#EFEDF2',
              color: read && briefing ? '#ffffff' : '#a9a5af',
              cursor: read && briefing ? 'pointer' : 'not-allowed',
            }}
          >
            {roomLabel.split(' · ')[0]} 입장
          </button>
        </div>
      </div>
    </div>
  );
}
