import { useState } from 'react';

interface NicknameGateProps {
  onSubmit: (nickname: string) => void;
}

export function NicknameGate({ onSubmit }: NicknameGateProps) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 28px',
        animation: 'jz-fade .25s ease',
      }}
    >
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.6, color: '#4a4750' }}>
        진지 · 진지한 대화
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 26, fontWeight: 900, letterSpacing: -1, color: '#17171a' }}>
        닉네임을 알려주세요
      </h1>
      <p style={{ margin: '0 0 22px', fontSize: 13, color: '#4a4750', lineHeight: 1.6 }}>
        회원가입 없이 닉네임만으로 바로 입장해요.
      </p>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="예: 성장 애벌레"
        style={{
          background: '#F3F1F5',
          border: 'none',
          borderRadius: 999,
          padding: '16px 20px',
          fontSize: 15,
          color: '#17171a',
          outline: 'none',
        }}
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        style={{
          marginTop: 12,
          border: 'none',
          borderRadius: 999,
          padding: 16,
          fontSize: 14,
          fontWeight: 700,
          background: value.trim() ? '#17171a' : '#EFEDF2',
          color: value.trim() ? '#fff' : '#a9a5af',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        시작하기
      </button>
    </div>
  );
}
