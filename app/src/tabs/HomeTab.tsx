import { useState } from 'react';
import { CaterpillarPixel } from '../icons/CaterpillarPixel';
import { ButterflyPixel } from '../icons/ButterflyPixel';
import { FILTER_CHIPS, SCHEDULE } from '../data';
import { formatKSTDateLabel } from '../lib/kst';
import { getGrowth } from '../lib/growth';
import { useTopicSeatCounts } from '../lib/useTopicSeatCounts';

function parseCapacity(bottom: string): number {
  const digits = bottom.match(/\d+/);
  return digits ? Number(digits[0]) : Infinity;
}

interface HomeTabProps {
  countdownLabel: string;
  changedCount: number;
  onEnterRoom: (topicId: string, topicTitle: string) => void;
  onCancelApply: (topicId: string) => void;
  matchingTopicId: string | null;
  matchError: string | null;
}

export function HomeTab({
  countdownLabel,
  changedCount,
  onEnterRoom,
  onCancelApply,
  matchingTopicId,
  matchError,
}: HomeTabProps) {
  const [filter, setFilter] = useState<number | 'all'>('all');
  const visibleRows = filter === 'all' ? SCHEDULE : SCHEDULE.filter((row) => row.room.id === filter);
  const growth = getGrowth(changedCount);
  const openCount = SCHEDULE.filter((row) => !row.room.locked).length;
  const topicIds = SCHEDULE.filter((row) => row.topicId).map((row) => row.topicId!);
  const seatCounts = useTopicSeatCounts(topicIds);
  return (
    <div style={{ animation: 'jz-fade .25s ease' }}>
      <div
        style={{
          margin: '0 16px',
          background: '#17171a',
          borderRadius: 22,
          padding: '16px 18px 15px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#F586AE',
              animation: 'jz-blink 3s infinite',
            }}
          />
          <span
            style={{
              fontFamily: "'Space Mono',monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 1.6,
              color: '#F7B3D4',
            }}
          >
            OPEN NOW · 진지 토론방
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 11 }}>
          <div>
            <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 15, color: '#8f8b93' }}>
              {formatKSTDateLabel(new Date())}
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: -0.9, color: '#fff', marginTop: 2 }}>
              오늘 {openCount}개 진행 예정
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '7px 13px',
              borderRadius: 999,
              background: '#26262b',
              color: '#F7B3D4',
            }}
          >
            참가 예정 1
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 20px 0' }}>
        {growth.stage === 'larva' ? <CaterpillarPixel /> : <ButterflyPixel width={100} height={84} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 15, color: '#17171a' }}>
              {growth.tierLabel} LV.{changedCount}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 999,
                background: '#FBDFEC',
                color: '#8d3f70',
              }}
            >
              🔁 {changedCount}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {Array.from({ length: growth.dotsTotal }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 5,
                  flex: 1,
                  borderRadius: 999,
                  background: i < growth.dotsFilled ? '#F586AE' : '#EFEDF2',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '16px 20px 12px' }}>
        {FILTER_CHIPS.map((chip, i) => {
          const value: number | 'all' = i === 0 ? 'all' : i;
          const active = filter === value;
          return (
            <button
              key={chip}
              onClick={() => setFilter(value)}
              style={{
                flex: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 999,
                background: active ? '#17171a' : '#F3F1F5',
                color: active ? '#fff' : '#4a4750',
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 7px',
          borderBottom: '1.5px solid #17171a',
        }}
      >
        <span style={{ width: 38, fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.1, color: '#4a4750' }}>방</span>
        <span style={{ width: 58, fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.1, color: '#4a4750' }}>시간</span>
        <span style={{ flex: 1, fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.1, color: '#4a4750' }}>주제</span>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.1, color: '#4a4750' }}>자리</span>
      </div>

      <div style={{ padding: '0 20px' }}>
        {visibleRows.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>
            해당 방에 예정된 항목이 없어요
          </div>
        )}
        {visibleRows.map((row, idx) => {
          const isLast = idx === visibleRows.length - 1;
          const locked = row.room.locked;
          const isApplying = matchingTopicId === row.topicId;
          const seatCount = row.topicId ? seatCounts[row.topicId] ?? 0 : 0;
          const capacity = parseCapacity(row.seats.bottom);
          const isFull = !isApplying && seatCount >= capacity;
          return (
            <div
              key={`${row.room.id}-${row.time}-${row.title}`}
              style={{
                display: 'flex',
                gap: 10,
                paddingTop: 16,
                paddingBottom: isLast ? 18 : 15,
                paddingLeft: row.featured ? 20 : 0,
                paddingRight: row.featured ? 20 : 0,
                borderBottom: isLast ? 'none' : '1px solid #EFEDF2',
                background: row.featured ? '#FEF7FA' : 'transparent',
                margin: row.featured ? '0 -20px' : 0,
              }}
            >
              <div style={{ width: 38, flex: 'none' }}>
                {locked ? (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      border: '1.5px dashed #b8b4bd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                    }}
                  >
                    <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 19, color: '#78747e' }}>
                      {row.room.id}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: row.room.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 19, color: '#fff' }}>
                      {row.room.id}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ flex: 'none', minWidth: 44 }}>
                {row.day ? (
                  <>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#4a4750' }}>
                      {row.day}
                    </div>
                    <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 19, lineHeight: 1.1, color: '#17171a', whiteSpace: 'nowrap' }}>
                      {row.time}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 19, lineHeight: 1.1, color: '#17171a', whiteSpace: 'nowrap' }}>
                      {row.time}
                    </div>
                    {(row.status || row.featured) && (
                      <div
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: 9,
                          fontWeight: 700,
                          color: row.featured ? '#b0568f' : '#4a4750',
                          marginTop: 3,
                        }}
                      >
                        {row.featured ? countdownLabel : row.status}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div
                  style={{
                    fontSize: row.featured ? 15.5 : 15,
                    fontWeight: 900,
                    letterSpacing: -0.5,
                    lineHeight: 1.35,
                    color: locked ? '#5a5760' : '#17171a',
                  }}
                >
                  {row.title}
                </div>
                {row.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                    {row.tags.map((tag) => (
                      <span
                        key={tag.label}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: tag.bg,
                          color: tag.color,
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
                {row.lockedNote && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3c45', marginTop: 7 }}>{row.lockedNote}</div>
                )}
                {row.cta && row.topicId && (
                  <button
                    onClick={() => (isApplying ? onCancelApply(row.topicId!) : onEnterRoom(row.topicId!, row.title))}
                    disabled={isFull}
                    style={{
                      width: '100%',
                      marginTop: 11,
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      background: isFull ? 'rgba(23,23,26,0.05)' : isApplying ? 'rgba(245,134,174,0.18)' : 'rgba(245,134,174,0.07)',
                      border: isFull ? '1px solid rgba(23,23,26,0.08)' : isApplying ? '1px solid rgba(245,134,174,0.45)' : '1px solid rgba(245,134,174,0.22)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: isFull ? '#a9a5af' : '#b0568f',
                      fontSize: 13.5,
                      fontWeight: 700,
                      padding: 13,
                      borderRadius: 999,
                      boxShadow: '0 2px 10px rgba(23,23,26,0.04)',
                    }}
                  >
                    {isFull ? '마감' : isApplying ? '입장 신청 완료' : row.cta}
                  </button>
                )}
                {row.topicId && matchError && (
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#c0392b' }}>
                    매칭에 실패했어요: {matchError}
                  </div>
                )}
              </div>
              {!locked && (
                <div style={{ flex: 'none', textAlign: 'right' }}>
                  <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 17, color: isFull ? '#b0568f' : '#17171a' }}>
                    {row.topicId ? (isFull ? '마감' : String(seatCount)) : row.seats.top}
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: '#4a4750' }}>{row.seats.bottom}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
