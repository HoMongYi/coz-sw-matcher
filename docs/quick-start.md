# 5분 시작하기 — 제품명으로 공식 링크 확인

HSUF를 처음 사용한다면 이 문서만 따라 해도 됩니다. AI 계정이나 SerpAPI 키 없이, **이미 Registry에 등록된 제품의 공식 URL을 찾는 방법**부터 해보겠습니다.

## 준비물

Node.js **22 이상**, 터미널(Windows PowerShell·macOS Terminal·Linux Shell), 인터넷 연결(처음 의존성을 설치할 때만 필요할 수 있음)이면 됩니다.

### 1. 프로젝트 설치

```bash
git clone https://github.com/HoMongYi/hardware-software-url-finder.git
cd hardware-software-url-finder
npm ci --ignore-scripts --no-audit --no-fund
```

Git 사용이 익숙하지 않다면 [GitHub v0.1.0 Release](https://github.com/HoMongYi/hardware-software-url-finder/releases/tag/v0.1.0)에서 Source ZIP을 내려받아 압축을 풀어도 됩니다. 이 경우 `git clone`과 `cd` 단계 대신 압축 푼 폴더에서 `npm ci`를 실행합니다.

정상적으로 준비됐는지 확인합니다.

```bash
node bin/hsuf.mjs --help
```

> `hsuf`는 이 패키지의 실행 파일 이름입니다. 문서에서는 전역 명령으로 설치하지 않아도 작동하도록 `node bin/hsuf.mjs`를 사용합니다.

### 2. 제품 하나 확인

```bash
node bin/hsuf.mjs resolve "[ASUS] PRIME A520M-K ARGB" --offline
```

이 모델은 공개 Registry에 공식 지원 페이지가 등록된 테스트 사례입니다. JSON 결과에서 가장 중요한 항목만 읽으면 됩니다.

| 항목 | 의미 |
|---|---|
| `decision` | `fill` · `blank` · `review` 중 하나 |
| `normalized.vendor` | 구분된 제조사 ID |
| `normalized.model` | 정리된 모델명 |
| `primary.url` | `fill`인 경우 제공되는 URL |
| `reason_codes` | 이 결과가 나온 이유 |
| `verified_at` | 공식 출처를 검증한 날짜. 오늘 날짜로 자동 변경되지 않음 |

ASUS 메인보드 예제는 다음 공식 지원 페이지와 연결됩니다.

`https://www.asus.com/motherboards-components/motherboards/prime/prime-a520m-k-argb/helpdesk_download?model2Name=PRIME-A520M-K-ARGB`

> [!NOTE]
> `--offline`은 외부 웹사이트를 **지금 다시 접속하지 않고** 저장된 Registry와 규칙으로 판정한다는 뜻입니다. 위 링크가 오늘도 열리는지 직접 검사하는 옵션이 아닙니다.

### 3. 다른 제품도 넣어 보기

```bash
node bin/hsuf.mjs resolve "[Example] Unknown Keyboard V2" --offline
```

`review`가 나와도 프로그램 오류가 아닙니다. 공개 Registry에서 정확한 모델의 공식 근거가 아직 확인되지 않은 경우입니다.

## CSV 파일 처리하기

한 줄씩 입력하는 대신 CSV를 한 번에 처리할 수 있습니다.

프로젝트의 `examples/generic-catalog.csv`에는 다음처럼 `input_id`, `product_name`, `category`가 들어 있습니다.

```csv
input_id,product_name,category
SYNTHETIC-001,[ASUS] PRIME A520M-K ARGB,motherboard
SYNTHETIC-002,Synthetic keycap set,accessory
SYNTHETIC-003,[Example] Unknown Keyboard V2,keyboard
```

`product_name`만 필수입니다. `input_id`는 사용자 본인의 SKU나 제품 코드, `category`는 제품 종류를 적는 선택 항목입니다.

```bash
# 화면에서 JSON 결과 보기
node bin/hsuf.mjs resolve examples/generic-catalog.csv --offline

# CSV 파일로 저장
node bin/hsuf.mjs resolve examples/generic-catalog.csv --offline --output result.csv
```

`result.csv`에는 판정 상태와 사유가 함께 들어갑니다. 기존 시스템에서 **URL 열 한 개만** 필요하다면 아래처럼 출력할 수 있습니다.

```bash
node bin/hsuf.mjs resolve examples/generic-catalog.csv --offline --legacy --output legacy.csv
```

이 출력은 `input_id,product_name,url` 세 열이며, `blank`와 `review`의 URL은 모두 빈칸입니다. 두 상태를 구분하려면 기본 CSV의 `decision` 컬럼도 보관하세요.

> [!TIP]
> 출력 파일이 이미 존재하면 HSUF는 자동으로 덮어쓰지 않습니다. 기존 결과를 보존하려면 `result-2.csv`처럼 다른 파일명을 사용하세요.

CSV 한 번에 **최대 1,000행 / 4 MiB**까지 처리합니다. 더 큰 파일은 나누어 실행해야 합니다.

## 이미 있는 URL을 검사하고 싶다면

```bash
node bin/hsuf.mjs audit "https://www.asus.com/motherboards-components/motherboards/prime/prime-a520m-k-argb/helpdesk_download?model2Name=PRIME-A520M-K-ARGB" --name "[ASUS] PRIME A520M-K ARGB"
```

이 명령은 URL 모양·도메인·모델 정책을 **정적으로 감사**합니다. 웹페이지를 다시 읽지 않으므로, 새로운 페이지 근거 없이 `review`가 나오더라도 이상한 동작이 아닙니다. 실제 페이지를 가져와 분석하는 것은 [온라인 조사 Pipeline](provider-recipes.md)의 역할입니다.

## Windows PowerShell에서 API 키를 쓸 때

기본 Offline 실행에는 키가 필요하지 않습니다. 나중에 온라인 조사 기능을 사용하려면 PowerShell에서는 이런 방식으로 **현재 터미널 세션에만** 환경변수를 넣을 수 있습니다.

```powershell
$env:SERPAPI_API_KEY = '<your-serpapi-key>'
$env:OPENAI_API_KEY = '<your-openai-key>'
$env:OPENAI_MODEL = '<model-id-you-can-access>'
```

실제 키를 README, `.env.example`, GitHub Issue나 코드에 적지 마세요. 키를 넣는다고 자동으로 웹 검색이 활성화되는 것도 아닙니다. [Pipeline을 명시적으로 실행](provider-recipes.md)해야 외부 호출이 발생합니다.

## 다음으로 읽을 문서

- **왜 `review`가 나오는지 궁금하다면** → [판정 흐름](workflow.md)
- **Codex·Claude Code에서 말로 요청하고 싶다면** → [AI Agent 사용법](AGENTS.md)
- **SerpAPI + OpenAI를 연결하고 싶다면** → [온라인 조사 예제](provider-recipes.md)

[← 문서 길잡이](README.md) · [← 프로젝트 README](../README.md)
