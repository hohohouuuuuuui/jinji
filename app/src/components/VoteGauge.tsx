import type { VoteCounts } from '../lib/useVotes';

interface VoteGaugeProps {
  counts: VoteCounts;
  aLabel: string;
  bLabel: string;
}

// 격돌방 상단의 얇은 투표율 게이지 — A/B 득표 비율을 실시간으로 보여준다.
export function VoteGauge({ counts, aLabel, bLabel }: VoteGaugeProps) {
  const total = counts.A + counts.B;
  const aPct = total === 0 ? 50 : Math.round((counts.A / total) * 100);

  return (
    <div style={{ padding: '8px 16px 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#4a4750' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {aLabel} {total > 0 ? `${aPct}%` : ''}
        </span>
        <span style={{ flex: 'none' }}>{total}표</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {total > 0 ? `${100 - aPct}%` : ''} {bLabel}
        </span>
      </div>
      <div style={{ display: 'flex', height: 5, borderRadius: 999, overflow: 'hidden', marginTop: 4, background: '#EFEDF2' }}>
        <div style={{ width: `${aPct}%`, background: '#F586AE', transition: 'width .3s ease' }} />
        <div style={{ width: `${100 - aPct}%`, background: '#8ED4F0', transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}
