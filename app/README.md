# 진지 — Jinji

React + Vite implementation of `project/Jinji Prototype v3.dc.html`: 4 tabs (시간표 / 토론방 / 리허설 / 참가기록), a briefing modal, and a "생각이 바뀜" declaration modal.

**"진지한 대화" (1:1) 트랙과 "AI 논객과 즉석 격돌" 트랙은 실제로 동작합니다** — 닉네임으로 입장 → 같은 주제에 실시간 매칭(또는 AI 상대와 즉시 시작) → AI가 생성한 사전 브리핑 → 실시간 채팅 (턴 교대, 인정 버튼, 손들기, 생각이 바뀜 선언, AI 조롱/인신공격 모더레이션) → 나가면 참가기록에 실제로 기록. 시간표 상단 필터 칩(1/2/3번 방)으로 목록을 좁혀볼 수 있고, 상태바/시간표 날짜는 실제 한국 시간과 동기화됩니다. 리허설은 완료 후 "다시 연습하기"로 몇 번이든 재시작 가능. 시간표의 2:2 토론·1:1 격돌·진지한 결혼 항목은 아직 목업입니다.

## 아키텍처

- **프론트엔드**: Vite + React (정적 빌드, Vercel에 그대로 배포)
- **실시간 매칭 · 채팅 · 상태 동기화 · 참가기록**: Supabase (Postgres + Realtime), 인증 없이 닉네임만 사용
- **AI 기능** (`api/briefing.ts`, `api/moderate.ts`, `api/opponent.ts`, Vercel Serverless Functions): Google Gemini (`gemini-3.6-flash`)로 사전 브리핑 생성, 발언 4축(비속어/존대이탈/인신공격/조롱) 모더레이션, "AI 논객과 즉석 격돌" 방의 AI 상대 응답. API 키는 서버 함수 안에서만 쓰이고 브라우저에 노출되지 않습니다.

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
   - **이미 `schema.sql`을 한 번 실행한 적이 있다면** `supabase/migration_2.sql`도 추가로 실행해주세요 (AI 격돌방 · 참가기록 테이블 추가분, 재실행해도 안전함)
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사
   → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Vercel에 등록할 때 이 두 값은 **Sensitive가 아니라 Plain Text**로 등록해야 합니다 (`VITE_` 접두사는 빌드 시 클라이언트에 그대로 노출되는 값이라 Vercel이 Sensitive 지정을 거부합니다)

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

## 데모 시나리오

**2인** — 브라우저 탭(또는 기기) 2개에서 각자 다른 닉네임으로 입장 → 둘 다 시간표 1번 행 "입장 신청하기" 클릭(같은 주제라서 자동 매칭) → AI 브리핑 → 턴 교대 발언 → "그건 맞네" 인정 · "생각이 바뀜" 선언 · 조롱성 표현 보내보기(보낸 사람에게만 비공개 경고 토스트) → "나가기 · 참가기록 남기기"로 종료 → 참가기록 탭에서 방금 기록 확인

**1인** — 시간표에서 "AI 논객과 즉석 격돌" 선택 → 매칭 대기 없이 즉시 시작 → AI가 실시간으로 반박 생성

## 구조

- `src/App.tsx` — 앱 상태(탭, 닉네임, 룸 연결, 타이머, 토스트, 모달) 조립
- `src/lib/useRoom.ts` — 매칭 · 채팅 · 턴 · 인정권 · 손들기 · 생각이 바뀜 · AI 격돌방 · 참가기록 저장을 Supabase에 연결하는 훅
- `src/lib/supabase.ts`, `src/lib/db-types.ts` — Supabase 클라이언트 · 테이블 타입
- `src/lib/kst.ts` — 실제 한국 시간/날짜 포맷 유틸
- `api/_gemini.ts`, `api/briefing.ts`, `api/moderate.ts`, `api/opponent.ts` — Gemini 호출 Vercel 함수
- `supabase/schema.sql` — 처음 설치용 전체 스키마, `supabase/migration_2.sql` — 이미 설치한 DB에 추가분만 반영
- `src/tabs/` — 네 개 탭 화면, `src/components/` — 폰 프레임 · 상태바 · 하단 내비 · 모달
- `src/icons/` — 내비 아이콘, 픽셀아트 애벌레/나비 캐릭터
- `src/data.ts` — 아직 목업인 부분(시간표 2:2 토론·1:1 격돌·진지한 결혼, 리허설 문항 등)
