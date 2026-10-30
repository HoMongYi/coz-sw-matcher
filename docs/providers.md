# 검색과 Luna 설정

## SerpAPI 검색

`SerpApiSearchProvider`는 크기·시간 제한이 있는 전송 계층을 사용한다.
`SERPAPI_API_KEY`가 필요하며, 외부 `candidates`가 없는 온라인 요청에서만 검색을 1회 실행할 수 있다.
검색 결과는 최대 20개를 검사하고 후보 페이지 요청은 최대 5회로 제한한다.
공통 앱이나 지역 모델 관계를 확인할 근거 페이지는 요청 전체에서 최대 8회 더 조회한다.
같은 페이지는 캐시를 재사용하고 전체 처리 시간·순차 요청 간격을 적용한다.

## Luna 순위 평가

`LunaRanker`는 OpenAI Responses API로 후보 ID를 재정렬한다.
`OPENAI_API_KEY`와 사용 환경에서 확인한 `COZ_SW_MODEL`을 설정한다.
GPT-6 Luna라는 표시명으로 API 모델 ID를 추정해서는 안 된다.
`store=false`, 출력 schema, 입력·출력 크기와 시간 제한을 적용한다.

`rank({product,candidates})`는 `ordered_ids`, `needs_review`, `reasons`, 선택적인 `usage`를 반환한다.
모든 후보 ID를 한 번씩 포함해야 한다.
새 URL, 승인 필드, 알 수 없는 ID가 있으면 거절한다.
Provider가 실패하면 규칙 순위를 유지하고 `needs_review`로 표시한다.

비용 단가를 확인해 `inputPricePerMillion`과 `outputPricePerMillion`을 제공한 경우에만 USD를 계산한다.
가격이나 사용량이 없으면 `null`이며 0으로 표시하지 않는다.
[실행 예시](provider-recipes.md)와 [외부 전송 범위](../SECURITY.md)를 함께 확인한다.
