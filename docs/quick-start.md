# 시작하기

Node.js 22 이상과 npm이 필요하다.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node bin/coz-sw-matcher.mjs parse "[GIGABYTE] H610M K D4 제이씨현 벌크"
node bin/coz-sw-matcher.mjs match --input examples/match-request.json
npm test
npm run lint
npm run validate
```

기본 오프라인 결과는 검증 근거가 없으면 needs_review다. 네트워크 페이지 검증에는 --online을 명시한다. 기존 후보는 request.json의 candidates로 전달한다. 외부 후보가 있으면 새 검색을 하지 않는다.

CSV와 로컬 overlay는 [Registry](registry.md), 연동은 [입출력 계약](integration.md)을 참조한다.
