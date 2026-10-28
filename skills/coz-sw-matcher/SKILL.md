---
name: coz-sw-matcher
description: Use when interpreting Compuzone product names or reviewing official driver, firmware, control-app and software URL candidates, including promotion noise, distributors, successor notes and bundles.
---

# Coz SW Matcher

컴퓨존 상품명과 공식 SW URL 후보를 검수한다.
연결할 데이터베이스나 API를 추측하거나 허용 없이 변경하지 않는다.

1. 원본 product_name을 유지하고 데이터 등급·로컬 처리 허용 범위를 확인한다.
   CSV/승인 DB는 공개 Git·프롬프트·외부 서비스에 넣지 않는다.
2. 로컬 parse 또는 match를 실행한다.
   D4/D5, WiFi, V2, Rev, OC, HE, SE+, PRO/MAX와 용량을 보존한다.
   결합상품은 구성품을 분리하고 target_component가 정해지지 않으면 보류한다.
3. 외부 검색 결과가 이미 있으면 candidates 0~5개를 그대로 전달한다.
   빈 배열이어도 중복 검색하지 않는다.
   기본은 네트워크 없는 로컬 실행이다.
4. 제조사·유통사·software_provider를 구분한다.
   GPU driver는 칩셋 제공사일 수 있으나 firmware는 정확 모델/리비전 근거가 필요하다.
5. 후보 URL의 공식 도메인만으로 판단하지 않는다.
   정확 모델·SW 유형·다운로드 경로와 독립적인 페이지 근거를 확인한다.
   상품 소개·판매·다른 모델은 반려한다.
   접속 차단/Provider 오류는 소프트웨어 없음이 아니라 needs_review다.
6. 명시적으로 허용한 호스트의 --online에서만 네트워크 검증한다. --luna는 설정된 실제 COZ_SW_MODEL을 사용하고 후보 ID만 재정렬한다.
7. 후보는 0~5개만 반환한다.
   수를 채우지 않는다.
   설명, reason_codes, page_type, audit_status, evidence_url, verified_at을 함께 보고한다.
   CSV 과거 검수 날짜와 현재 실접속 날짜를 구분한다.
8. 담당자가 1개를 선택한다.
   엔진 결과는 항상 approved=false다.
   선택 결과의 저장·인증은 연결하는 프로그램의 책임이다.
   형식 검증 결과를 승인 완료로 설명하지 않는다.

```powershell
node "$env:COZ_SW_HOME/bin/coz-sw-matcher.mjs" match --input request.json
```

입력: product_name, 선택적 product_no/requested_software_kind/candidates/target_component.
출력: parsed, candidates, rejected_candidates, status, approved=false, approval_contract, metrics.

[계약](references/contracts.md)은 연동할 때, [검수 정책](references/policy.md)은 예외를 판단할 때 읽는다.
