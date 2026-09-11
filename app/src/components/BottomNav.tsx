import type { Tab } from '../types';
import { HomeIcon, SessionIcon, SparIcon, ShelfIcon } from '../icons/NavIcons';

const ACTIVE = '#17171a';
const IDLE = '#78747e';

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function NavItem({ label, active, onClick, icon }: NavItemProps) {
  const color = active ? ACTIVE : IDLE;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '4px 0',
        color,
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: active ? ACTIVE : 'transparent',
        }}
      />
    </button>
  );
}

interface BottomNavProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <div
      style={{
        flex: 'none',
        height: 76,
        background: '#fff',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '8px 6px 0',
        borderTop: '1px solid #EFEDF2',
      }}
    >
      <NavItem label="시간표" active={tab === 'home'} onClick={() => onChange('home')} icon={<HomeIcon />} />
      <NavItem label="토론방" active={tab === 'session'} onClick={() => onChange('session')} icon={<SessionIcon />} />
      <NavItem label="리허설" active={tab === 'spar'} onClick={() => onChange('spar')} icon={<SparIcon />} />
      <NavItem label="참가기록" active={tab === 'shelf'} onClick={() => onChange('shelf')} icon={<ShelfIcon />} />
    </div>
  );
}
