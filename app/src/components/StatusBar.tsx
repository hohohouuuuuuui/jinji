import { BatteryIcon, SignalIcon } from '../icons/NavIcons';

export function StatusBar() {
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
      <span>20:00</span>
      <span style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.8 }}>
        <SignalIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}
