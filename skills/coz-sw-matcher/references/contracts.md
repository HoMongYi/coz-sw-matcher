# 계약

입력에는 product_name이 필요하다. product_no는 로컬 상관관계용이며 외부 Provider에 보내지 않는다. requested_software_kind는 driver, firmware, control-app, web-driver, toolbox, utility, support 중 하나다.

candidates가 있으면 배열 길이 0~5, 각 항목은 url/title/snippet이다. 후보 메타데이터는 독립적인 페이지 근거가 아니다. target_component는 결합상품 구성품의 0부터 시작하는 인덱스다.

결과의 candidates/rejected_candidates와 parsed, reason_codes를 함께 검수한다. needs_review는 확인 필요, needs_human_approval은 검증된 후보에 대한 담당자 선택 대기다. approved는 항상 false다.

승인 계약은 request_id/candidate_id/decision=approve/approved_by/approved_at/reason이다. validateApproval은 저장·인증 없이 형식만 검사한다. 기존 요청/후보 ID와 검증 상태를 전산팀이 신뢰한 서버 결과로 대조해야 한다.
