# Coz SW Matcher

![Coz SW Matcher — 컴퓨존 상품명에서 공식 소프트웨어 주소 찾기](docs/media/cover.webp)

![상품명 분석과 URL 후보 검수 흐름 미리보기](docs/media/demo-preview.gif)

[소개 영상과 원본 안내](docs/video.md) · [시작하기](docs/quick-start.md) · [API와 연동](docs/integration.md)

Coz SW Matcher는 컴퓨존 상품명에서 실제 모델을 구분하고, 제품에 맞는 공식 소프트웨어 URL 후보를 최대 5개 제시합니다.
후보마다 확인 근거와 보류 이유를 함께 반환하며, 최종 주소는 사람이 확인하고 선택합니다.

독립적으로 개발한 오픈소스 프로젝트입니다.
컴퓨존이 공식 제공하거나 운영하는 서비스는 아닙니다.

## 상품명에서 무엇을 구분하나요?

상품명에는 모델명뿐 아니라 유통사, 색상, 증정품, 행사 문구가 섞여 있습니다.
이를 모델의 일부로 잘못 읽거나 과거 모델을 검색하면 다른 제품의 다운로드 페이지를 추천할 수 있습니다.

```text
[GIGABYTE] H610M K D4 제이씨현 벌크 ⚡플래티넘 특가⚡
           └ 모델 ┘ └유통사┘ └판매 조건┘ └행사 문구┘
```

파서는 `H610M K D4`를 모델로 남기고 나머지 정보를 분리합니다.
`D4`, `D5`, `WiFi`, `V2`, `Rev`, `OC`, `HE`, `SE+`, `PRO/MAX`와 용량은 함부로 합치거나 지우지 않습니다.
원본 상품명도 유지합니다.

`[삼성전자] SL-M2640 흑백 레이저 프린터 ▶ SL-M2630 후속모델 ◀`에서는 현재 모델을 `SL-M2640`으로 읽습니다.
`SL-M2630`은 이전 모델이라는 관계 정보로 남깁니다.

`[ASUS] DUAL 지포스 RTX 3050 O6G OC D6 6GB 인텍앤컴퍼니`는 일반 드라이버 요청과 보드 펌웨어 요청을 구분합니다.
일반 GPU 드라이버 제공사는 NVIDIA로 판단하지만, ASUS 펌웨어에는 별도의 정확 모델 근거가 필요합니다.
NVIDIA App 같은 공식 경로도 페이지의 지원 근거를 확인한 뒤 후보로 제시합니다.

## 주소를 찾는 과정

```mermaid
flowchart LR
    A[상품명 분석] --> B[Registry·검색 후보]
    B --> C[URL 검증·순위 평가]
    C --> D[후보 0~5개<br/>사람이 최종 선택]
```

이미 수집한 후보를 전달하면 새로 검색하지 않습니다.
공식 도메인이어도 다른 모델이거나 다운로드 근거가 없는 상품 소개 페이지는 추천하지 않습니다.
후보 수를 채우려고 부적합한 주소를 넣지도 않습니다.

모든 결과는 `approved=false`입니다.
`needs_human_approval`은 검증된 후보의 선택 대기, `needs_review`는 추가 확인이 필요한 상태입니다.
접속 차단이나 검색 실패를 소프트웨어가 없다는 뜻으로 처리하지 않습니다.

## 설치하고 실행하기

Node.js 22 이상이 필요합니다.

```powershell
git clone https://github.com/HoMongYi/coz-sw-matcher.git
cd coz-sw-matcher
npm ci --ignore-scripts --no-audit --no-fund
node bin/coz-sw-matcher.mjs parse "[GIGABYTE] H610M K D4 제이씨현 벌크"
node bin/coz-sw-matcher.mjs match --input examples/match-request.json
```

첫 명령의 출력에는 다음 값이 포함됩니다.

```json
{
  "manufacturer": "GIGABYTE",
  "distributor": "제이씨현",
  "model": "H610M K D4",
  "sales_attributes": ["벌크"]
}
```

두 번째 명령은 NVIDIA App 주소를 입력받는 오프라인 예시입니다.
독립적인 페이지 근거가 없으므로 실제 결과는 `status: "needs_review"`, `approved: false`, `candidates: []`입니다.
출력 전체와 온라인 실행 방법은 [시작하기](docs/quick-start.md)에 있습니다.

## Agent Skill과 API

[Agent Skill](skills/coz-sw-matcher/SKILL.md)과 [설치·호출 안내](docs/AGENTS.md)를 제공합니다.
CLI 외에도 JavaScript, 루프백 HTTP, MCP로 사용할 수 있습니다.
입력 형식과 사람의 선택 결과 검증은 [연동 문서](docs/integration.md), 실행 방법은 [API 문서](docs/api.md)를 참고하세요.

```powershell
node bin/coz-sw-matcher.mjs serve --port 8787
node bin/coz-sw-matcher.mjs mcp
```

## 사용 전에 알아둘 점

기본 실행은 오프라인입니다.
네트워크 페이지 검증에는 `--online`이 필요하며, 검색에는 별도의 SerpAPI 키가 필요할 수 있습니다.
Luna 순위 평가는 선택 기능으로, 후보 ID만 재정렬하며 URL을 만들거나 승인하지 않습니다.
외부 검색과 모델 호출에는 비용이 발생할 수 있습니다.

확인되지 않은 주소는 검수 대상으로 남습니다.
OS·리비전·펌웨어 호환성과 최종 URL은 사람이 확인해야 합니다.
이 프로젝트는 선택 결과의 형식을 검증하며, 인증과 저장은 연결하는 프로그램에서 구현해야 합니다.

[Registry와 평가](docs/registry.md) · [보안](SECURITY.md) · [검증 범위](reports/VERIFICATION.md)

## 라이선스

[MIT](LICENSE). 현재 공개 버전은 v0.1.0입니다.
