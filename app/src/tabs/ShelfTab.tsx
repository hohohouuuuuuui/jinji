import { ButterflyPixel } from '../icons/ButterflyPixel';
import { PARTICIPATION_LOG, SHELF_STATS } from '../data';

interface ShelfTabProps {
  changedCount: number;
}

export function ShelfTab({ changedCount }: ShelfTabProps) {
  return (
    <div style={{ padding: '2px 20px 24px', animation: 'jz-fade .25s ease' }}>
      <div style={{ background: '#E6F5FC', borderRadius: 26, padding: 18, textAlign: 'center' }}>
        <ButterflyPixel />
        <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 20, color: '#17171a', marginTop: 4 }}>
          각성한 논객 LV.56
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1f5a75', marginTop: 5 }}>
          생각이 바뀜 누적 8회 · 반론 각성
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 13px', borderRadius: 999, background: '#fff', color: '#8d3f70' }}>
            철학 날개
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 13px', borderRadius: 999, background: '#fff', color: '#1f5a75' }}>
            기술 날개
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 13px', borderRadius: 999, background: '#FBE9AE', color: '#63510f' }}>
            🔥 각성
          </span>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '2px 2px 0' }}>
        {SHELF_STATS.map((stat, i) => {
          const isLast = i === SHELF_STATS.length - 1;
          return (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 0',
                borderBottom: isLast ? 'none' : '1px solid #EFEDF2',
              }}
            >
              <span style={{ fontSize: 15, width: 19, flex: 'none', textAlign: 'center' }}>{stat.emoji}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#17171a', width: 76, flex: 'none' }}>{stat.label}</span>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: '#EFEDF2', overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${stat.pct}%`, height: '100%', borderRadius: 999, background: stat.color }} />
              </span>
              <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 16, color: '#17171a', width: 26, textAlign: 'right', flex: 'none' }}>
                {stat.label === '생각이 바뀜' ? changedCount : stat.value}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '28px 0 4px' }}>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, color: '#4a4750' }}>
            PARTICIPATION LOG
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 25, fontWeight: 900, letterSpacing: -1.2, color: '#17171a' }}>참가 기록</h2>
        </div>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#4a4750' }}>27회</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {PARTICIPATION_LOG.map((entry) => (
          <div
            key={entry.serial}
            style={{ position: 'relative', display: 'flex', background: '#FFFDF6', border: '1.5px solid #17171a', borderRadius: 14, overflow: 'hidden' }}
          >
            <div
              style={{
                flex: 'none',
                width: 52,
                borderRight: '1.5px dashed #17171a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '12px 0',
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 8, background: entry.room.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 15, color: '#fff' }}>{entry.room.id}</span>
              </span>
              <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 13, color: '#17171a' }}>{entry.date}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '11px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #17171a' }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.3, color: '#4a4750' }}>
                  {entry.serial}
                </span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1.3, color: '#17171a' }}>
                  참가 완료
                </span>
              </div>
              <div style={{ height: 2 }} />
              <div style={{ borderTop: '1px solid #17171a', paddingTop: 9 }}>
                <div style={{ fontSize: 14.5, fontWeight: 900, letterSpacing: -0.4, color: '#17171a' }}>{entry.title}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.55, color: '#4a4750', marginTop: 6 }}>{entry.quote}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                  {entry.badges.map((badge) => (
                    <span
                      key={badge.label}
                      style={{ fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999, background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 45, top: -7, width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '1.5px solid #17171a' }} />
            <div style={{ position: 'absolute', left: 45, bottom: -7, width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '1.5px solid #17171a' }} />
          </div>
        ))}
      </div>
      <button
        style={{ width: '100%', marginTop: 16, cursor: 'pointer', background: '#F3F1F5', border: 'none', borderRadius: 999, padding: 15, fontSize: 13, fontWeight: 700, color: '#17171a' }}
      >
        지난 24개 더 보기
      </button>
    </div>
  );
}
