import type { ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 52,
          background: '#111113',
          padding: 11,
          boxShadow: '0 40px 80px -22px rgba(0,0,0,.45)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 42,
            overflow: 'hidden',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
