# 신규 API

```js
import {createMatcher} from 'coz-sw-matcher';
const matcher = createMatcher();
const result = await matcher.match({product_name: '[GIGABYTE] H610M K D4'});
```

createMatcher({overlay, search, ranker, fetcher, providerTimeoutMs, maxDurationMs, minIntervalMs})를 제공한다. 기본은 네트워크 없는 로컬 처리다. match(input, {online:true})에서만 페이지 검증과 설정된 Provider를 사용한다. 입력과 출력은 [연동 계약](integration.md)을 따른다. 동시에 실행 중인 matcher는 후속 요청에 MATCHER_BUSY 보류 결과를 반환한다.

## HTTP

node bin/coz-sw-matcher.mjs serve --port 8787

| 경로 | 기능 |
|---|---|
| GET /health | 이름·버전·모드 |
| GET /v1/approval-contract | 승인 계약 |
| POST /v1/match | 후보 반환 |

승인 저장 엔드포인트는 없다. 기본 루프백, Origin 거절, 선택적 COZ_SW_HTTP_TOKEN Bearer 인증, 본문 64 KiB, 동시 2개 제한. 외부 바인딩은 토큰이 필요하다. --online은 호스트 운영자가 외부 처리 경계를 승인했을 때만 사용한다.

## MCP

node bin/coz-sw-matcher.mjs mcp

기본 읽기 전용 도구: match_official_software_candidates, parse_compuzone_product, get_approval_contract.
--online에서 research_official_software_candidates를 별도 노출한다. 실제 stdio 전송과 공식 SDK 연동은 로컬 테스트로 검사한다.

과거 src/legacy-engine.mjs, bin/hsuf.mjs, src/http.mjs, src/mcp.mjs는 회귀 검증용이며 신규 연동의 공개 계약이 아니다.
