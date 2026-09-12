import type { ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="jz-frame-outer">
      <div className="jz-frame-device">
        <div className="jz-frame-screen">{children}</div>
      </div>
    </div>
  );
}
