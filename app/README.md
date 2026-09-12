# 진지 — Jinji

React + Vite implementation of `project/Jinji Prototype v3.dc.html`: 4 tabs (시간표 / 토론방 / 리허설 / 참가기록), a briefing modal, and a "생각이 바뀜" declaration modal.

**"진지한 대화" (1:1) 트랙과 "리허설룸"(AI 1:1 스파링)은 실제로 동작합니다.**

- **진지한 대화**: 닉네임으로 입장 → 같은 주제에 실시간 매칭 → AI가 생성한 사전 브리핑 → 실시간 채팅(턴 교대, 인정 버튼, 손들기, 생각이 바뀜 선언, AI 조롱/인신공격 모더레이션) → 나가면 참가기록에 실제로 기록
- **리허설룸**: 매칭 대기 없이, 원하는 주제를 직접 입력해 AI와 1:1로 바로 대화·토론 연습. 입력한 주제가 "결혼", "연애"처럼 찬반이 갈리지 않는 단어형이면 AI가 구체화를 요청하는 안내를 보여줍니다. **AI도 사람과 동일한 모더레이션을 받고**, 3회 위반하면 세션이 자동 종료됩니다. 몇 번이든 다시 시작 가능. (연습이라 참가기록에는 남지 않습니다 — "진지한 대화"만 기록됩니다.) 첫 방문(참가기록 0회)이면 온보딩 모달이 뜨며 리허설룸으로 바로 넘어갈 수 있습니다.
- **모더레이션 2차/3차 · 이의제기**: 위반 1회는 비공개 경고 토스트만 뜨지만, **2회째는 30초 채팅 금지(뮤팅)**, **3회째는 세션이 즉시 종료**됩니다(리허설룸에서는 AI 자신의 위반에도 동일하게 적용). 모더레이션이 오탐이라고 생각되면 본인의 위반 메시지에 **"이의제기"** 버튼으로 1세션당 1회 되돌릴 수 있습니다.
- **진지벌레 레벨/이미지는 닉네임별로 실제 저장**됩니다 (`profiles` 테이블) — 시간표와 참가기록 탭에 항상 같은 레벨·캐릭터가 뜨고, "진지한 대화"에서 "생각이 바뀜"을 선언하면 올라갑니다. **단, 자기 선언만으로는 오르지 않고 상대가 "동의해서 성장시키기" 버튼을 눌러 승인해야** 반영됩니다(어뷰징 방지). 0회면 애벌레, 1회 이상이면 나비(성충 → 초성충 → 전설의 진지충)로 진화합니다.
- **스틸맨 시도**: 대화 중 언제든 "🫱 스틸맨" 버튼으로 상대 주장을 왜곡 없이 요약해 제출하면 AI가 즉석 판정하고, 인정되면 참가기록의 "스틸맨" 배지 카운트가 올라갑니다.
- **참가기록의 4개 배지(끝까지 들음 · 생각이 바뀜 · 스틸맨 · 브리핑 완독)는 전부 실제 누적 데이터**입니다 — 더보기 없이, 실제로 그 행동을 할 때마다 하나씩 올라갑니다.
- 시간표 상단 필터 칩(1/2/3번 방)으로 목록을 좁혀볼 수 있고, 상태바/시간표 날짜는 실제 한국 시간과 동기화됩니다.
- 시간표의 2:2 토론·1:1 격돌·진지한 결혼 항목은 아직 목업입니다.

## 아키텍처

- **프론트엔드**: Vite + React (정적 빌드, Vercel에 그대로 배포)
- **실시간 매칭 · 채팅 · 상태 동기화 · 참가기록**: Supabase (Postgres + Realtime), 인증 없이 닉네임만 사용
- **AI 기능** (`api/briefing.ts`, `api/moderate.ts`, `api/opponent.ts`, `api/validate-topic.ts`, `api/stillman.ts`, Vercel Serverless Functions): Google Gemini (`gemini-3.6-flash`)로 사전 브리핑 생성, 발언 4축(비속어/존대이탈/인신공격/조롱) 모더레이션, 리허설룸의 AI 상대 응답(+ AI 자신의 발언도 같은 모더레이션 적용), 리허설 주제가 찬반이 갈리는 토론 주제인지 검증, 스틸맨 요약 판정. API 키는 서버 함수 안에서만 쓰이고 브라우저에 노출되지 않습니다.

> ⚠️ **무료 티어 Gemini 키는 분당 5회 요청 한도**가 있습니다. 세션 하나에서 브리핑·모더레이션·상대 응답·주제 검증이 각각 API를 호출하므로, 해커톤 시연/심사 중 429 오류가 날 수 있습니다. 결제를 연결한 유료 티어 키로 바꾸는 걸 권장합니다.

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
   - **이미 `schema.sql`을 실행한 적이 있다면** `supabase/migration_2.sql` ~ `migration_5.sql`을 순서대로 추가 실행해주세요 (참가기록 테이블, AI 스파링 3진 아웃 카운터, 사용자별 진지벌레 레벨, **모더레이션 2차/3차·이의제기·생각이 바뀜 상대 승인·스틸맨/브리핑완독/끝까지들음 실데이터화** — 재실행해도 안전함). 특히 `migration_5.sql`은 이번 업데이트(모더레이션 뮤팅/종료, 이의제기, 스틸맨, 배지 실데이터)에 꼭 필요합니다.
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사
   → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Vercel에 등록할 때 이 두 값은 **Sensitive가 아니라 Plain Text**로 등록해야 합니다 (`VITE_` 접두사는 빌드 시 클라이언트에 그대로 노출되는 값이라 Vercel이 Sensitive 지정을 거부합니다)

> 이 스키마는 해커톤 데모 범위로 RLS를 완전 개방(anon 키로 전체 read/write 허용)해뒀습니다. 실제 서비스로 확장할 때는 반드시 사용자별 권한을 좁혀야 합니다.

### 2) Gemini API 키 (AI 브리핑 · 모더레이션 · 스파링 상대)

1. https://aistudio.google.com/apikey 에서 키 발급
   → `GEMINI_API_KEY`
2. 대화창이나 커밋 등 어디에도 키 원문을 남기지 마세요. 이미 노출됐다면 재발급하세요.

## Vercel 배포

1. https://vercel.com → **Add New → Project** → 이 GitHub 리포지토리 선택
2. **Root Directory**를 `app`으로 지정 (리포지토리 루트가 아니라 이 서브폴더가 실제 프로젝트)
3. Framework Preset은 Vite 자동 인식 (Build: `npm run build`, Output: `dist`) — 그대로 두면 됩니다
4. **Environment Variables**에 아래 3개 등록 (Production/Preview 둘 다 체크 권장)
   - `VITE_SUPABASE_URL` (Plain Text)
   - `VITE_SUPABASE_ANON_KEY` (Plain Text)
   - `GEMINI_API_KEY`
5. Deploy

`app/api/*.ts` 아래 모든 파일은 Root Directory가 `app`으로 설정되어 있으면 Vercel이 자동으로 Serverless Functions로 인식합니다.

## 데모 시나리오

**2인 (진지한 대화)** — 브라우저 탭(또는 기기) 2개에서 각자 다른 닉네임으로 입장 → 둘 다 시간표 1번 행 "입장 신청하기" 클릭(같은 주제라서 자동 매칭) → AI 브리핑 → 턴 교대 발언 → "그건 맞네" 인정 · "생각이 바뀜" 선언 · 조롱성 표현 보내보기(보낸 사람에게만 비공개 경고 토스트) → "나가기 · 참가기록 남기기"로 종료 → 참가기록 탭에서 방금 기록 확인

**1인 (리허설룸)** — 리허설 탭에서 "결혼"처럼 단어만 입력해보면 구체화 요청 안내가 뜸 → "결혼은 필수인가"처럼 질문형으로 다시 입력 → "AI와 시작하기"로 매칭 대기 없이 바로 시작 → 자유롭게 대화·토론, AI가 실시간으로 반박 생성 → (드물게) AI가 규칙을 어기면 채팅에 "⚠️ AI 발언 경고 N/3"이 뜨고 3회째에 세션 자동 종료 → "나가기"로 종료해도 참가기록에는 남지 않음

## 구조

- `src/App.tsx` — 앱 상태(탭, 닉네임, 진지한 대화 룸, 리허설 룸, 타이머, 토스트, 모달) 조립
- `src/lib/useRoom.ts` — 매칭 · 채팅 · 턴 · 인정권 · 손들기 · 생각이 바뀜 · AI 스파링(+AI 자기-모더레이션) · 참가기록 저장을 Supabase에 연결하는 훅 (진지한 대화와 리허설룸 모두 이 훅의 별도 인스턴스를 씀)
- `src/lib/useProfile.ts` — 닉네임별 진지벌레 성장(생각이 바뀜 누적 횟수)을 Supabase `profiles` 테이블에서 읽고 올리는 훅
- `src/lib/growth.ts` — 누적 횟수 → 티어 이름 · 애벌레/나비 단계 · 진행 도트 개수로 변환
- `src/lib/supabase.ts`, `src/lib/db-types.ts` — Supabase 클라이언트 · 테이블 타입
- `src/lib/kst.ts` — 실제 한국 시간/날짜 포맷 유틸
- `src/lib/moderation.ts` — 모더레이션 축(4가지) → 한국어 라벨/토스트 문구 매핑
- `api/_gemini.ts`, `api/briefing.ts`, `api/moderate.ts`, `api/opponent.ts`, `api/validate-topic.ts`, `api/stillman.ts` — Gemini 호출 Vercel 함수
- `supabase/schema.sql` — 처음 설치용 전체 스키마, `supabase/migration_2.sql` ~ `migration_5.sql` — 이미 설치한 DB에 추가분만 반영
- `src/tabs/` — 네 개 탭 화면 (`SessionTab`은 진지한 대화·리허설룸 공용), `src/components/` — 폰 프레임 · 상태바 · 하단 내비 · 모달(온보딩 · 스틸맨 포함)
- `src/icons/` — 내비 아이콘, 픽셀아트 애벌레/나비 캐릭터
- `src/data.ts` — 아직 목업인 부분(시간표 2:2 토론·1:1 격돌·진지한 결혼 등)
- `docs/기획안.md` — 원본 제품 기획안 (전체 12개 섹션, 이 문서를 기준으로 기능 갭 분석 진행)
