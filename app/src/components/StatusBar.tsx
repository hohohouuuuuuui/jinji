import { useEffect, useState } from 'react';
import { BatteryIcon, SignalIcon } from '../icons/NavIcons';
import { formatKSTClock } from '../lib/kst';

export function StatusBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        height: 50,
        flex: 'none',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 26px 5px',
        fontSize: 13,
        fontWeight: 500,
        color: '#111',
      }}
    >
      <span>{formatKSTClock(now)}</span>
      <span style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.8 }}>
        <SignalIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}
