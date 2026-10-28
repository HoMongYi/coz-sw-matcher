# 입력과 선택 결과 계약

`product_name`은 필수다.
`product_no`는 로컬 상관관계용이며 외부 Provider에 보내지 않는다.
`requested_software_kind`는 `driver`, `firmware`, `control-app`, `web-driver`, `toolbox`, `utility`, `support` 중 하나다.

`candidates`가 있으면 길이는 0~5개이며 각 항목은 `url`, `title`, `snippet`을 담는다.
후보가 주장하는 메타데이터는 독립적인 페이지 근거로 인정하지 않는다.
`target_component`는 결합상품 구성품의 0부터 시작하는 인덱스다.

결과의 `candidates`, `rejected_candidates`, `parsed`, `reason_codes`를 함께 검수한다.
`needs_review`는 확인 필요, `needs_human_approval`은 검증된 후보에 대한 사람의 선택 대기다.
`approved`는 항상 `false`다.

선택 결과 필드는 `request_id`, `candidate_id`, `decision=approve`, `approved_by`, `approved_at`, `reason`이다.
`validateApproval`은 저장·인증 없이 형식과 후보 상태를 검사한다.
연결하는 프로그램은 신뢰할 수 있는 원본 요청·후보와 인증된 사용자를 대조해야 한다.
