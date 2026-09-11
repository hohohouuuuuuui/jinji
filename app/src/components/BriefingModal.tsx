import { BRIEFING } from '../data';

interface BriefingModalProps {
  open: boolean;
  read: boolean;
  onClose: () => void;
  onToggleRead: () => void;
  onEnter: () => void;
}

export function BriefingModal({ open, read, onClose, onToggleRead, onEnter }: BriefingModalProps) {
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
              {BRIEFING.room}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.7, color: '#fff', marginTop: 6 }}>{BRIEFING.title}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {BRIEFING.tags.map((tag) => (
                <span key={tag.label} style={{ fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999, background: tag.bg, color: tag.color }}>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', background: '#26262b', border: 'none', width: 34, height: 34, borderRadius: '50%', fontSize: 14, color: '#c9c6cd' }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 20px' }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750' }}>
            용어 {BRIEFING.terms.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {BRIEFING.terms.map((term) => (
              <span key={term} style={{ fontSize: 12, fontWeight: 700, padding: '9px 15px', borderRadius: 999, background: '#F3F1F5', color: '#17171a' }}>
                {term}
              </span>
            ))}
          </div>

          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750', marginTop: 26 }}>
            쟁점 {BRIEFING.issues.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {BRIEFING.issues.map((issue) => (
              <div key={issue} style={{ background: '#F3F1F5', borderRadius: 20, padding: '15px 17px', fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: '#17171a' }}>
                {issue}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: '#4a4750', marginTop: 26 }}>
            반대 {BRIEFING.objections.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {BRIEFING.objections.map((obj) => (
              <div key={obj.text} style={{ background: obj.bg, borderRadius: 20, padding: '15px 17px', fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: obj.color }}>
                {obj.text}
              </div>
            ))}
          </div>

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
            disabled={!read}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 999,
              padding: 17,
              fontSize: 14,
              fontWeight: 700,
              background: read ? '#17171a' : '#EFEDF2',
              color: read ? '#ffffff' : '#a9a5af',
              cursor: read ? 'pointer' : 'not-allowed',
            }}
          >
            1번 방 입장
          </button>
        </div>
      </div>
    </div>
  );
}
