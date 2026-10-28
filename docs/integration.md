# 전산팀 연동 계약

서비스팀은 상품명·선택 기준·오류 사례를 제공한다. 엔진은 후보와 근거를 반환한다. 전산팀은 실제 DB·인증·서버·검수 화면과 승인 저장을 소유한다. 회사 내부 엔드포인트나 테이블을 가정하지 않는다.

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

product_no는 선택적 로컬 상관관계 문자열이며 외부 Provider에 전달하지 않는다. candidates는 0~5개, 생략했을 때만 설정된 내부 검색이 가능하다. 결합상품의 target_component는 0부터 시작한다. 종류는 driver/firmware/control-app/web-driver/toolbox/utility/support다.

응답에는 request_id, parsed, candidates, rejected_candidates, status, reason_codes, approval_contract, metrics가 있다. 각 후보는 id/url/rank/software_provider/software_kind/page_type/audit_status/evidence/evidence_url/verified_at/dataset_checked_at/approved=false를 포함한다.

needs_human_approval은 독립 검증이 끝난 후보에 대한 담당자 선택 대기다. needs_review는 모델/유형/페이지/접속/최신성 등 추가 확인이 필요함을 의미한다. 후보가 없더라도 소프트웨어 없음으로 단정하지 않는다.

## 담당자 승인

담당자가 후보 1개를 선택하고 다음 필드를 사내 시스템에 제출한다.

```json
{
  "request_id": "REQUEST_ID_FROM_RESULT",
  "candidate_id": "c1",
  "decision": "approve",
  "approved_by": "AUTHENTICATED_REVIEWER_ID",
  "approved_at": "ISO_8601_TIMESTAMP",
  "reason": "담당자가 확인한 선택 사유"
}
```

validateApproval(selection, result)는 형식·요청/후보 일치·검증 상태를 검사한다. persisted=false, authentication_verified=false를 반환하며 저장/인증을 수행하지 않는다. result와 approved_by를 클라이언트 주장만으로 신뢰하면 안 된다. 전산팀이 인증한 사용자와 서버에 보관한 원본 요청·후보를 대조하고 원자적으로 1개만 저장한다.

후보 레코드와 승인 레코드는 분리한다. 승인 이력의 개인정보는 사내 저장처에만 둔다. [샘플](../examples/compuzone-integration.mjs)은 읽기/검증 전용이다.
