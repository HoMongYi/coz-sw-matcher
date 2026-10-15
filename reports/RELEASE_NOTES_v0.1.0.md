# Hardware Software URL Finder v0.1.0

**처음 공개하는 버전입니다.** PC 부품과 주변기기의 제품명으로 공식 드라이버·설정 프로그램·지원 페이지를 찾고, 그 URL이 실제로 해당 모델에 맞는지 확인할 수 있습니다.

검색 결과의 첫 번째 링크를 그대로 쓰지 않습니다. 먼저 확인된 Registry를 살펴보고, 모르는 제품은 필요할 때 검색한 뒤 공식 사이트·모델·지원 근거를 다시 검사합니다. 확인되지 않은 항목은 임의로 채우지 않고 `review`로 남깁니다.

## 무엇이 들어 있나요?

- **제품 하나 또는 CSV 파일 조회:** `fill`(공식 URL), `blank`(소프트웨어 불필요), `review`(확인 필요)로 구분합니다.
- **Registry 우선 사용:** 이미 확인한 제품은 불필요하게 검색하거나 LLM을 다시 호출하지 않습니다.
- **SerpAPI + OpenAI Judge 예제:** 검색 후보를 필터링·점수화하고, 여러 후보가 있을 때만 AI가 비교합니다. 최종 판정은 HSUF Core가 담당합니다.
- **연결 방법:** CLI, HTTP API, MCP, Codex·Claude Code용 Agent Skill, Codex Plugin을 제공합니다.
- **다른 서비스에서 활용:** Gemini·DeepSeek·Qwen 등은 Generic HTTP/Command Provider 계약에 맞춘 별도 Gateway로 연결할 수 있습니다.
- **공개 데이터와 조직별 데이터 분리:** 특정 쇼핑몰의 상품 DB나 ERP가 없어도 설치·사용할 수 있습니다.

## 먼저 사용해 보기

Node.js 22 이상이 필요합니다. 소스를 내려받아 압축을 풀거나 저장소를 clone한 뒤 실행하세요.

```bash
npm ci --ignore-scripts --no-audit --no-fund
node bin/hsuf.mjs resolve "[Canon] PIXMA E3470" --offline
```

다양한 사용법은 [README](https://github.com/HoMongYi/hardware-software-url-finder#readme)와 [처음 실행하기](https://github.com/HoMongYi/hardware-software-url-finder/blob/main/docs/QUICK_START.md)에서 볼 수 있습니다.

## 현재 확인된 범위

등록된 Vendor 정의는 51개, 도메인 후보는 85개입니다. 이 가운데 공식 출처를 확인해 자동 `fill`할 수 있는 Exact Model은 2개이며, Software Ecosystem 24개는 `needs-refresh`로 두었습니다. **이 숫자를 곧바로 지원 모델 수로 이해하면 안 됩니다.**

유료 SerpAPI/OpenAI 실제 계정 호출과 Agent 호스트 설치 UI, Claude API Skill 업로드는 릴리즈 시점에 검증하지 않았습니다. 기본 CLI·Registry·HTTP·MCP 동작과 Provider Mock/Contract 테스트는 검증했습니다. npm 레지스트리에는 게시하지 않았습니다.

## 파일 선택

| 파일 | 용도 |
|---|---|
| `hardware-software-url-finder-v0.1.0-source.zip` | 공개 소스 묶음 |
| `hsuf-agent-skill-v0.1.0.zip` | Agent Skill |
| `hsuf-codex-plugin-v0.1.0.zip` | Codex Plugin |
| `hardware-software-url-finder-0.1.0.tgz` | npm 형식의 로컬 설치 패키지 |
| `SHA256SUMS.txt` · `release-manifest.json` | 파일 크기·해시 대조 |

GitHub가 자동 생성한 Source ZIP/TAR는 별도로 빌드한 Source ZIP과 바이트·해시가 다를 수 있습니다. 파일을 직접 검증할 때는 `SHA256SUMS.txt`에 적힌 **동일한 이름의 배포 파일**을 기준으로 확인하세요.

코드는 **MIT License**로 공개합니다. 특정 회사의 공식 서비스가 아니며, 회사 내부 상품 DB나 고객 정보는 포함하지 않습니다.
