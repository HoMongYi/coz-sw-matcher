# 입력·출력과 선택 결과 연동

상품명과 소프트웨어 종류, 이미 수집한 URL 후보를 입력하면 분석 결과와 검수 근거를 반환한다.
CLI, JavaScript, HTTP, MCP는 같은 요청 형식을 사용한다.

## 요청

```json
{
  "product_name": "[ASUS] DUAL 지포스 RTX 3050 O6G OC D6 6GB 인텍앤컴퍼니",
  "requested_software_kind": "driver",
  "candidates": [
    {
      "url": "https://www.nvidia.com/ko-kr/software/nvidia-app/",
      "title": "NVIDIA App",
      "snippet": "GeForce driver and software"
    }
  ]
}
```

`product_name`은 필수다.
`product_no`는 선택적인 로컬 상관관계 문자열이며 외부 Provider에 보내지 않는다.
`candidates`는 0~5개다. 이 필드가 있으면 빈 배열이어도 새로 검색하지 않는다.
생략했을 때만 온라인 모드에서 설정된 검색 Provider를 사용할 수 있다.

`requested_software_kind`는 `driver`, `firmware`, `control-app`, `web-driver`, `toolbox`, `utility`, `support` 중 하나다.
결합상품의 `target_component`는 0부터 시작하는 구성품 인덱스다.

## 응답

응답에는 `request_id`, `parsed`, `candidates`, `rejected_candidates`, `status`, `reason_codes`, `approval_contract`, `metrics`가 있다.
후보에는 URL과 순위, 제공사·종류, 페이지 목적, 검증 상태와 근거를 담는다.
정확한 필드는 [응답 스키마](../schemas/match-result.schema.json)를 참고한다.

`verified_at`은 현재 페이지를 검증한 시각이다.
과거 자료의 확인일은 `dataset_checked_at`에 따로 남긴다.
후보와 전체 결과의 `approved`는 항상 `false`다.

`needs_human_approval`은 독립 검증을 마친 후보가 있어 사람의 선택을 기다리는 상태다.
`needs_review`는 모델, 페이지 용도, 접속 상태 등의 추가 확인이 필요하다는 뜻이다.
후보가 없어도 소프트웨어가 없다고 단정하지 않는다.

## 사람이 선택한 결과 검증

선택 결과는 다음 형식으로 만들 수 있다.
자리표시자는 실제 결과와 확인된 사용자 정보로 바꾼다.

```json
{
  "request_id": "REQUEST_ID_FROM_RESULT",
  "candidate_id": "c1",
  "decision": "approve",
  "approved_by": "AUTHENTICATED_REVIEWER_ID",
  "approved_at": "ISO_8601_TIMESTAMP",
  "reason": "선택한 주소를 확인한 사유"
}
```

`validateApproval(selection, result)`는 필드, 요청·후보 ID와 검증 상태를 검사한다.
반환값의 `persisted=false`, `authentication_verified=false`가 나타내듯 인증하거나 저장하지 않는다.
[실행 가능한 예제](../examples/compuzone-integration.mjs)도 읽기와 검증만 수행한다.

선택 결과를 저장하는 프로그램은 인증한 사용자와 원본 요청·후보를 대조해야 한다.
클라이언트가 보낸 `result`나 `approved_by`만으로 신뢰해서는 안 된다.
요청당 하나의 선택을 저장하고 후보와 선택 기록을 구분하는 책임도 연결하는 프로그램에 있다.


## 후보가 모두 맞지 않을 때

연결하는 프로그램에 직접 입력란을 둘 수 있다.
사용자는 후보가 모두 부적합하다고 판단하면 주소를 직접 넣고 저장해 적용한다.
이 입력·저장 화면은 연결 프로그램에서 구현하는 기능이다.

매처의 `validateApproval`은 기존 결과의 후보 ID 하나를 선택한 경우를 검증한다.
직접 입력한 URL을 저장하거나 임의의 새 URL을 승인하는 API는 제공하지 않는다.
새 주소를 매처로 확인하려면 `candidates`에 넣어 다시 검증한 뒤 그 결과를 사용한다.
