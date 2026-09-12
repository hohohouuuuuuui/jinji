# 진지 — Jinji

React + Vite implementation of `project/Jinji Prototype v3.dc.html`: 4 tabs (시간표 / 토론방 / 리허설 / 참가기록), a briefing modal, and a "생각이 바뀜" declaration modal.

**"진지한 대화" (1:1) 트랙은 실제로 동작합니다** — 닉네임으로 입장 → 같은 주제에 실시간 매칭 → AI가 생성한 사전 브리핑 → 실시간 채팅 (턴 교대, 인정 버튼, 손들기, 생각이 바뀜 선언, AI 조롱/인신공격 모더레이션). 나머지 시간표 항목(2:2 토론, 1:1 격돌, 진지한 결혼)과 리허설/참가기록 탭은 아직 목업입니다.

## 아키텍처

- **프론트엔드**: Vite + React (정적 빌드, Vercel에 그대로 배포)
- **실시간 매칭 · 채팅 · 상태 동기화**: Supabase (Postgres + Realtime), 인증 없이 닉네임만 사용
- **AI 기능** (`api/briefing.ts`, `api/moderate.ts`, Vercel Serverless Functions): Google Gemini (`gemini-3.6-flash`)로 사전 브리핑 생성 + 발언 4축(비속어/존대이탈/인신공격/조롱) 모더레이션. API 키는 서버 함수 안에서만 쓰이고 브라우저에 노출되지 않습니다.

## 로컬 실행

```
npm install
cp .env.example .env.local   # 값 채우기 (아래 "환경 변수 준비" 참고)
npm run dev
```

`api/*.ts`는 Vercel Serverless Functions라서 `npm run dev`(Vite)만으로는 실행되지 않습니다. 로컬에서 AI 기능까지 테스트하려면 `npx vercel dev`를 쓰세요(최초 1회 `vercel login` 필요).

## 환경 변수 준비

### 1) Supabase (매칭 · 채팅 저장소)

1. https://supabase.com → 새 프로젝트 생성 (무료 티어)
2. 프로젝트의 **SQL Editor**에서 `supabase/schema.sql` 내용을 그대로 실행 (테이블 생성 + Realtime 활성화까지 포함)
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사
   → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

> 이 스키마는 해커톤 데모 범위로 RLS를 완전 개방(anon 키로 전체 read/write 허용)해뒀습니다. 실제 서비스로 확장할 때는 반드시 사용자별 권한을 좁혀야 합니다.

### 2) Gemini API 키 (AI 브리핑 · 모더레이션)

1. https://aistudio.google.com/apikey 에서 키 발급
   → `GEMINI_API_KEY`
2. 대화창이나 커밋 등 어디에도 키 원문을 남기지 마세요. 이미 노출됐다면 재발급하세요.

## Vercel 배포

1. https://vercel.com → **Add New → Project** → 이 GitHub 리포지토리 선택
2. **Root Directory**를 `app`으로 지정 (리포지토리 루트가 아니라 이 서브폴더가 실제 프로젝트)
3. Framework Preset은 Vite 자동 인식 (Build: `npm run build`, Output: `dist`) — 그대로 두면 됩니다
4. **Environment Variables**에 아래 3개 등록 (Production/Preview 둘 다 체크 권장)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Deploy

`api/briefing.ts`, `api/moderate.ts`는 Root Directory가 `app`으로 설정되어 있으면 Vercel이 자동으로 Serverless Functions로 인식합니다 (`app/api/*.ts`).

## 데모 시나리오 (2인)

1. 브라우저 탭(또는 기기) 2개에서 각자 다른 닉네임으로 입장
2. 둘 다 시간표 1번 행 "입장 신청하기" 클릭 → 같은 주제라서 자동 매칭
3. 매칭되면 AI가 생성한 사전 브리핑이 동시에 뜸 → "끝까지 읽었습니다" → 입장
4. 턴을 교대하며 발언 → 상대 메시지에 "그건 맞네" 인정 버튼 → "생각이 바뀜" 선언 → 조롱성 표현을 보내보면 AI가 감지해 보낸 사람에게만 비공개 경고 토스트 표시

## 구조

- `src/App.tsx` — 앱 상태(탭, 닉네임, 룸 연결, 타이머, 토스트, 모달) 조립
- `src/lib/useRoom.ts` — 매칭 · 채팅 · 턴 · 인정권 · 손들기 · 생각이 바뀜을 Supabase에 연결하는 훅
- `src/lib/supabase.ts`, `src/lib/db-types.ts` — Supabase 클라이언트 · 테이블 타입
- `api/_gemini.ts`, `api/briefing.ts`, `api/moderate.ts` — Gemini 호출 Vercel 함수
- `supabase/schema.sql` — 테이블 · RLS · Realtime 설정 SQL
- `src/tabs/` — 네 개 탭 화면, `src/components/` — 폰 프레임 · 상태바 · 하단 내비 · 모달
- `src/icons/` — 내비 아이콘, 픽셀아트 애벌레/나비 캐릭터
- `src/data.ts` — 아직 목업인 부분(시간표 카드 2~4, 참가기록, 리허설 문항 등)
