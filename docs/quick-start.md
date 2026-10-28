# 시작하기

Node.js 22 이상과 npm이 필요하다.
저장소 루트에서 다음 명령을 실행한다.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node bin/coz-sw-matcher.mjs parse "[GIGABYTE] H610M K D4 제이씨현 벌크"
node bin/coz-sw-matcher.mjs match --input examples/match-request.json
```

`parse`는 제조사 `GIGABYTE`, 모델 `H610M K D4`, 유통사 `제이씨현`, 판매 조건 `벌크`를 구분한다.
`match` 예시는 NVIDIA App 주소를 입력받아 다음 값을 반환한다. 일부 필드만 발췌했다.

```json
{
  "requested_software_kind": "driver",
  "software_provider": "NVIDIA",
  "status": "needs_review",
  "approved": false,
  "candidates": [],
  "reason_codes": ["NO_AUDITABLE_CANDIDATE"]
}
```

`rejected_candidates[0].reason_codes`는 `["INDEPENDENT_PAGE_REQUIRED"]`다.
기본 실행은 오프라인이므로 독립적인 페이지 근거가 없으면 보류한다.
실패한 검색이나 소프트웨어 없음으로 해석하지 않는다.

## 온라인 검증

```powershell
node bin/coz-sw-matcher.mjs match --input examples/match-request.json --online
```

이 명령은 이미 입력한 후보의 페이지를 확인하며 새로 검색하지 않는다.
외부 후보는 요청 JSON의 `candidates`에 담는다.
빈 배열이어도 필드가 있으면 검색하지 않는다.

후보를 생략한 온라인 요청에서 검색하려면 `SERPAPI_API_KEY`를 설정한다.
Luna를 함께 쓰려면 `OPENAI_API_KEY`와 확인된 `COZ_SW_MODEL`을 설정하고 `--online --luna`를 사용한다.
변수명은 [.env.example](../.env.example), 자세한 조건은 [Provider](providers.md)를 참고한다.
키 값은 명령이나 파일 예시에 적지 않는다.

로컬 검수 Registry는 `--overlay data/private/reviewed-registry.json`으로 지정할 수 있다.
CSV 가져오기와 평가 방법은 [Registry 문서](registry.md)에 있다.

## 로컬 검사

```powershell
npm test
npm run lint
npm run validate
```

다른 프로그램과 연결하려면 [입출력 계약](integration.md)을 확인한다.
