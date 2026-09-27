# 은행 신사업 기획 AI 에이전트

로컬 PC의 **Claude Code**에서 실행되는 은행 신사업 기획 에이전트입니다.
별도 서버나 코드 없이, 이 폴더에서 `claude`를 실행하면 설정(역할·규칙·서브에이전트·명령어)이 자동으로 적용됩니다.

## 무엇을 하나

| 명령 | 하는 일 | 산출물 |
|---|---|---|
| `/idea-scan <주제>` | 최신 동향을 조사해 신사업 아이디어 8~12개를 발굴하고 평가표로 순위를 매김 | `ideas.md` |
| `/bizplan <아이디어>` | 시장·규제·재무를 병렬 분석하고 레드팀 검토를 거쳐 경영진 보고용 기획서 작성 | 분석 파일 4종 + `business-plan.md` |
| 자유 질문 | 예: "BaaS 사업을 은행이 직접 하면 은행법상 부수업무에 해당해?" | 대화로 답변 |

### 에이전트 구성

```
               ┌─ market-researcher   시장 규모·경쟁·해외 사례 (웹 검색)
메인(기획 총괄) ─┼─ regulation-reviewer 은행법·금소법·전금법·신정법 등 규제 매트릭스
   │           └─ financial-modeler   수익모델, 5개년 손익, NPV/IRR (tools/fin_model.py)
   │                  ↓ (세 결과 취합)
   ├─ risk-critic   레드팀 검토: 가정 공격, 실패 사례, 킬 크라이테리아
   └─ 기획서 작성   templates/business-plan.md 형식
```

- 수치에는 출처를 붙이고, 출처 없는 수치는 `[추정]`으로 표시합니다.
- 재무 계산은 모델이 암산하지 않고 Python 계산기로 수행해 재현 가능합니다.
- 규제 판단은 "검토 의견"으로만 제시하고 준법감시·법무 확인 대상임을 명시합니다.

## 설치 및 실행

1. Claude Code 설치 (Node.js 18+ 필요)
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
2. 실행 — **반드시 이 폴더에서** 실행해야 설정이 적용됩니다.
   ```bash
   cd bank-bizplan-agent
   claude
   ```
3. 사용 예
   ```
   /idea-scan 시니어 고객 대상 자산관리
   /bizplan 소상공인 카드매출 데이터를 활용한 선정산 서비스
   ```

재무 계산기만 따로 써 볼 수도 있습니다.
```bash
python3 tools/fin_model.py tools/example_assumptions.json
```

## 폴더 구조

```
bank-bizplan-agent/
├── CLAUDE.md                 # 에이전트 역할, 원칙, 보안 규칙, 규제 체크리스트, 작업 흐름
├── .claude/
│   ├── settings.json         # 권한 설정 (웹 검색 허용, outputs/ 쓰기 허용, curl 등 차단)
│   ├── agents/               # 서브에이전트 4종
│   └── skills/               # /bizplan, /idea-scan 명령어
├── templates/
│   ├── business-plan.md      # 기획서 양식
│   └── scoring-rubric.md     # 아이디어 평가 기준 (가중치 조정 가능)
├── tools/
│   ├── fin_model.py          # NPV/IRR/회수기간/시나리오/민감도 계산기
│   └── example_assumptions.json
├── inputs/                   # 내부 자료 투입 (git 제외)
└── outputs/                  # 산출물 (git 제외)
```

## 우리 은행에 맞게 고치기

- **전략 방향·중점 영역**: `CLAUDE.md`에 "우리 은행의 중기 전략" 섹션을 추가하면 모든 분석에 반영됩니다.
- **평가 가중치**: `templates/scoring-rubric.md`의 가중치를 전략에 맞게 조정하세요.
- **기획서 양식**: 사내 보고 양식이 있으면 `templates/business-plan.md`를 그 구조로 바꾸세요.
- **내부 자료 활용**: 비식별화한 고객 통계, 기존 사업 실적 등을 `inputs/`에 넣으면 먼저 읽고 반영합니다.
- **모델 선택**: 서브에이전트 파일의 `model:` 값(`sonnet`/`opus`/`haiku`)으로 비용과 품질을 조절합니다. 규제·레드팀 검토는 판단력이 중요해 `opus`로 두었습니다.

## 은행 환경에서의 보안 고려사항

- **데이터 경로**: 로컬에서 실행해도 모델 추론은 API로 전송됩니다. 내부 정책상 필요하면 사내 클라우드 계약을 통해 Amazon Bedrock(`CLAUDE_CODE_USE_BEDROCK=1`) 또는 Google Vertex AI(`CLAUDE_CODE_USE_VERTEX=1`)로 연결할 수 있습니다. 적용 전 정보보호부서와 망분리·클라우드 이용 규정 검토가 필요합니다.
- **개인정보**: `CLAUDE.md`에 고객 개인정보·신용정보를 다루지 않도록 규칙을 두었지만, 입력 전 비식별화는 사용자 책임입니다.
- **git 제외**: `inputs/`, `outputs/`는 `.gitignore`로 커밋되지 않습니다.
- **결과물 성격**: 산출물은 기획 초안입니다. 수치·규제 판단은 담당 부서 검증 후 사용하세요.
