# JavaScript·HTTP·MCP API

## JavaScript

저장소 안에서 실행하는 예시다.
패키지로 설치했다면 import 경로를 `coz-sw-matcher`로 바꾼다.

```js
import {createMatcher} from './src/index.mjs';
const matcher = createMatcher();
const result = await matcher.match({product_name: '[GIGABYTE] H610M K D4'});
console.log(result.status, result.approved);
```

`createMatcher({overlay, search, ranker, fetcher, providerTimeoutMs, maxDurationMs, minIntervalMs})`로 의존성과 제한을 설정한다.
기본은 네트워크 없는 로컬 처리다.
`match(input, {online:true})`일 때만 페이지 검증과 설정된 Provider를 사용한다.
입력·출력은 [연동 계약](integration.md)을 따른다.

같은 matcher가 요청을 처리 중이면 후속 요청에 `MATCHER_BUSY` 보류 결과를 반환한다.

## HTTP

```powershell
node bin/coz-sw-matcher.mjs serve --port 8787
```

| 경로 | 기능 |
|---|---|
| `GET /health` | 이름·버전·모드 |
| `GET /v1/approval-contract` | 선택 결과 검증 계약 |
| `POST /v1/match` | 상품명 분석과 후보 반환 |

승인 결과를 저장하는 엔드포인트는 없다.
기본 바인딩은 루프백이며 Origin 요청을 거절한다.
`COZ_SW_HTTP_TOKEN`을 설정하면 Bearer 인증을 사용하고, 외부 주소에 바인딩할 때는 토큰이 필수다.
본문은 64 KiB, 동시 요청은 2개로 제한한다.

`--online`은 외부 전송할 데이터와 Provider 사용 범위를 확인한 환경에서 켠다.
전체 네트워크 제한은 [보안 문서](../SECURITY.md)에 있다.

## MCP

```powershell
node bin/coz-sw-matcher.mjs mcp
```

기본 도구는 `match_official_software_candidates`, `parse_compuzone_product`, `get_approval_contract`다.
`--online`에서는 `research_official_software_candidates`를 별도로 노출한다.
실제 stdio 전송과 공식 SDK 연결은 로컬 테스트로 검사한다.
