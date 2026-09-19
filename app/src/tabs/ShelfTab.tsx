import { useEffect, useState } from 'react';
import { GrowthCharacter } from '../components/GrowthCharacter';
import { supabase } from '../lib/supabase';
import type { GrowthInfo } from '../lib/growth';
import type { LogRow } from '../lib/db-types';

interface ShelfTabProps {
  growth: GrowthInfo;
  changedCount: number;
  listenedCount: number;
  briefedCount: number;
  stillmanCount: number;
  nickname: string;
  onOpenGrowthPreview: () => void;
}

function pct(count: number, cap = 20) {
  return Math.min(100, Math.round((count / cap) * 100));
}

function formatLogDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
  })
    .format(d)
    .replace('/', '.');
}

export function ShelfTab({ growth, changedCount, listenedCount, briefedCount, stillmanCount, nickname, onOpenGrowthPreview }: ShelfTabProps) {
  const [logs, setLogs] = useState<LogRow[] | null>(null);

  const stats = [
    { emoji: '👂', label: '끝까지 들음', value: listenedCount, pct: pct(listenedCount), color: '#F586AE' },
    { emoji: '🔁', label: '생각이 바뀜', value: changedCount, pct: pct(changedCount, 10), color: '#8ED4F0' },
    { emoji: '🫱', label: '스틸맨', value: stillmanCount, pct: pct(stillmanCount, 10), color: '#F6CF5C' },
    { emoji: '👀', label: '브리핑 완독', value: briefedCount, pct: pct(briefedCount), color: '#8FD8A4' },
  ];

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('logs')
      .select('*')
      .eq('nickname', nickname)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setLogs((data as LogRow[]) ?? []);
      });

    const channel = supabase
      .channel(`logs:${nickname}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs', filter: `nickname=eq.${nickname}` },
        (payload) => setLogs((prev) => [payload.new as LogRow, ...(prev ?? [])]),
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [nickname]);

  return (
    <div style={{ padding: '2px 20px 24px', animation: 'jz-fade .25s ease' }}>
      <div style={{ background: '#E6F5FC', borderRadius: 26, padding: 18, textAlign: 'center', position: 'relative' }}>
        <button
          onClick={onOpenGrowthPreview}
          aria-label="레벨별 캐릭터 미리보기"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            cursor: 'pointer',
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: 'none',
            background: '#fff',
            color: '#1f5a75',
            fontSize: 12,
            fontWeight: 900,
            boxShadow: '0 1px 4px rgba(23,23,26,0.12)',
          }}
        >
          ?
        </button>
        <GrowthCharacter stage={growth.stage} />
        <div style={{ fontFamily: "'DotGothic16',monospace", fontSize: 20, color: '#17171a', marginTop: 4 }}>
          {growth.tierLabel} LV.{growth.level}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1f5a75', marginTop: 5 }}>{growth.subLabel}</div>
        {growth.badges.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {growth.badges.map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '6px 13px',
                  borderRadius: 999,
                  background: badge.includes('🔥') ? '#FBE9AE' : '#fff',
                  color: badge.includes('🔥') ? '#63510f' : '#8d3f70',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, padding: '2px 2px 0' }}>
        {stats.map((stat, i) => {
          const isLast = i === stats.length - 1;
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
                {stat.value}
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
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#4a4750' }}>{logs?.length ?? 0}회</span>
      </div>

      {logs === null && (
        <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e' }}>불러오는 중…</div>
      )}
      {logs && logs.length === 0 && (
        <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 12.5, color: '#78747e', lineHeight: 1.6 }}>
          아직 참가 기록이 없어요
          <br />
          시간표에서 대화를 시작해보세요
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {logs?.map((entry, i) => (
          <div
            key={entry.id}
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
              <span style={{ width: 26, height: 26, borderRadius: 8, background: '#17171a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 15, color: '#fff' }}>{logs.length - i}</span>
              </span>
              <span style={{ fontFamily: "'DotGothic16',monospace", fontSize: 13, color: '#17171a' }}>{formatLogDate(entry.created_at)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '11px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #17171a' }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.3, color: '#4a4750' }}>
                  No.{String(entry.id).padStart(4, '0')}
                </span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, fontWeight: 700, letterSpacing: 1.3, color: '#17171a' }}>
                  참가 완료
                </span>
              </div>
              <div style={{ height: 2 }} />
              <div style={{ borderTop: '1px solid #17171a', paddingTop: 9 }}>
                <div style={{ fontSize: 14.5, fontWeight: 900, letterSpacing: -0.4, color: '#17171a' }}>{entry.topic_title}</div>
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
    </div>
  );
}
