# Provider

SerpApiSearchProvider는 기존 bounded transport를 사용한다. SERPAPI_API_KEY가 필요하다. 외부 candidates가 없고 online=true인 경우에만 검색 1회가 가능하다. 검색 결과는 최대 20개까지 검사하고 실제 페이지 fetch는 최대 5회다.

LunaRanker는 OpenAI Responses API의 후보 ID 재정렬 계약이다. OPENAI_API_KEY와 운영 환경에서 확인한 COZ_SW_MODEL을 설정한다. GPT-6 Luna라는 표시명으로 API ID를 추정하지 않는다. store=false, 출력 schema, 입력/출력 크기와 시간 제한을 적용한다.

rank({product,candidates})는 ordered_ids, needs_review, reasons, 선택적 usage를 반환한다. 모든 후보 ID를 한 번씩 포함해야 한다. 새 URL·승인 필드·알 수 없는 ID는 거절한다. 장애 시 룰 순위를 보존하고 needs_review로 표시한다.

비용 단가를 확인해 inputPricePerMillion/outputPricePerMillion으로 제공한 경우만 USD를 계산한다. 가격/사용량이 없으면 null이며 0으로 표시하지 않는다. 내부 모델/검색 endpoint나 회사 인증은 구현하지 않는다.
