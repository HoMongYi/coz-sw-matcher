# Coz SW Matcher Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. The main agent owns edits, integration and verification.

**Goal:** 컴퓨존 상품명을 해석하고 공식 SW URL 후보 0~5개와 담당자 승인 계약을 반환한다.

**Architecture:** Node 22 ESM. 기존 DNS/SSRF/HTML 안전 검증과 공개 vendor 데이터를 재사용한다. 신규 공개 진입점은 matcher이며 과거 자동 fill 엔진은 회귀 검증용 legacy 경로로만 남긴다. CSV와 파생 Registry/평가는 Git에서 제외한 로컬 저장처를 쓴다.

**Tech Stack:** JavaScript, node:test, 기존 csv-parse/htmlparser2/MCP SDK. 새 런타임 의존성 없음.

**Spec:** 사용자가 실행하도록 지정한 `C:/Users/plumm/Downloads/Coz-SW-Matcher-Redesign-Spec.md`와 `Coz-SW-Matcher-Codex-GOAL.md`.

## Global Constraints

- Node 22 이상, 로컬 테스트. GitHub Actions 실행/추가/재활성화 금지.
- 원본 상품명/정확 모델 토큰 보존. URL 0~5개, 신규 결과 approved=false.
- 사내 DB/API/인증 구현 금지. 승인 결과의 저장/인증은 전산팀 소유.
- 검수 CSV는 분류와 로컬 처리 허용 확인 후 사용. 공개 업로드 금지.
- LLM은 기존 후보 ID만 재정렬. 모델 ID 추정 금지. 외부 호출은 명시적 설정.
- 현 작업 파일/스테이징 상태 보존. 태그/릴리스 재작성 없음.

## Review Focus

- 괄호/후속모델/SE+와 결합상품: 중요한 토큰 손실 시 보류.
- 공식 상품 소개 페이지와 잘못된 모델: 추천에서 제외하고 사유 반환.
- 외부 후보가 빈 배열일 때도 중복 검색 금지.
- Provider 오류/타임아웃/위조 ID: 룰 결과 유지 및 검수 필요.
- 동일 URL/모델 패밀리 누출: 연결 그룹 단위 분할, 없는 정답 생성 금지.

### Task 1: Audit and migration

**Files:** 백업은 저장소 밖 `.coz-sw-matcher-backups/20261028-before-redesign`.

- [x] Git bundle 검증, 전체 파일 복사/해시, 기존 상태/인덱스 보존.
- [x] GitHub rename 및 실제 Git 루트를 `coz-sw-matcher`로 이동.
- [x] 원격 main/태그 보존, 공개 이력의 알려진 민감정보 패턴 검사.
- [x] Actions 비활성화는 추가 사용자 승인 후 적용·확인.

### Task 2: Parser and target resolver

**Files:** `src/parser/compuzone-name-parser.mjs`, `src/matching/software-target-resolver.mjs`, `src/matching/model-identity.mjs`, `tests/coz-parser.test.mjs`.

**Interfaces:** `parseProductName(input) -> parsed`, `resolveSoftwareTarget(parsed, kind, registry) -> target`.

- [x] 여섯 명세 사례, 중첩 괄호, 옵션/유통사, unknown, 리비전 회귀를 먼저 작성하고 실패 확인.
- [x] 원문/브랜드/제조사/유통사/모델/variants/판매/행사/관계/구성품 반환.
- [x] GPU driver의 실제 제공사 분리. 지원 근거 없는 ecosystem 일괄 적용 금지.
- [x] `node --test tests/coz-parser.test.mjs` 통과 확인.

### Task 3: Candidate pipeline and approval contract

**Files:** `src/matcher.mjs`, `src/audit/official-page-audit.mjs`, `src/ranking/candidate-ranker.mjs`, `src/ranking/luna-provider.mjs`, `src/approvals/approval-contract.mjs`, `src/search/serpapi-provider.mjs`, `tests/coz-matcher.test.mjs`.

**Interfaces:** `createMatcher(options).match(input) -> result`, `validateApproval(selection, result) -> contract validation`.

- [x] 후보 0~5개·중복 제거·외부 후보 우선·오모델/소개/403·SSRF·시간 제한·위조 ID 실패 테스트.
- [x] 후보 메타데이터를 페이지 검증 근거로 신뢰하지 않음. 순차 fetch/총 시간/크기/호출 수 제한.
- [x] model ID/비용 설정형 Luna 제공자. ID/보류만 허용하고 URL/승인 필드 거절.
- [x] 승인 계약 검증은 쓰기 없이 수행. 후보/승인 레코드 별도.
- [x] `node --test tests/coz-matcher.test.mjs` 통과 확인.

### Task 4: Private CSV registry and leakage-safe evaluation

**Files:** `src/local-data/reviewed-csv.mjs`, `src/evaluation/evaluate.mjs`, `scripts/import-reviewed-csv.mjs`, `scripts/evaluate-reviewed-csv.mjs`, `tests/coz-data.test.mjs`.

**Interfaces:** `inspectReviewedCsv(text) -> counts/records`, import dry-run/backup/idempotent local overlay; evaluation groups by connected URL/family/ecosystem.

- [x] 합성 CSV로 엄격한 헤더/중복/크기/상태, verified_at=null, idempotency 테스트.
- [x] 실제 CSV는 분류 확인 후 로컬 원본 백업과 dry-run/수치 대조, ignored overlay import.
- [x] 분할 그룹 누출 검사, Top-5/Top-1/오모델/보류/비용/시간 기록. 미확정 정답 제외.
- [x] Luna 실호출 미설정 시 Not run. 룰 결과를 Luna 측정치로 대체하지 않음.

### Task 5: Interfaces, skill, docs, package and verification

**Files:** `src/index.mjs`, `src/interfaces/*`, `bin/coz-sw-matcher.mjs`, `skills/coz-sw-matcher/*`, README/docs/package/release scripts, `tests/coz-interfaces.test.mjs`.

- [x] HTTP/MCP/CLI가 동일 matcher 계약 반환. 내부 승인 저장 엔드포인트 없음.
- [x] public export/CLI/Skill을 새 이름으로 통일, legacy 회귀는 별도 진입점 사용.
- [x] 로컬 npm test/validate/release/check-artifacts, Node22 및 CLI/MCP/HTTP 확인.
- [x] 공개 allowlist/이력 패턴 검사, 최종 diff 검토, 단계별 보고와 HANDOFF 1회 갱신.
- [x] 빈 기존 컨테이너 폴더만 검증 후 제거. 외부 registry 경로는 승인 범위 내 갱신 또는 미해결 기록.

## Final execution rulings

- 실모델 비교는 사용자 요청으로 보류한다. 구현·로컬 검증이 현재 완료 범위다.
- 전문 검토의 SW 유형/모델/저장 경로/취소/평가 실패 집계 문제를 회귀로 재현하고 수정했다.
- 데이터 처리 코드는 src/local-data에 두며 실제 데이터는 Git 제외 저장처에만 둔다.
- 기존 빈 폴더 제거와 Workspaces registry의 활성 경로 갱신을 검증했다.
