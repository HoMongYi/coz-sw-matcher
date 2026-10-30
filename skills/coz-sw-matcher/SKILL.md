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
   색상이나 판촉이 든 괄호에서도 모델 토큰은 남긴다.
   결합상품은 구성품별로 검증한다.
   SW 대상이 하나이고 나머지 구성품의 SW 없음이 해당 요청 범위에서 확인된 경우만 선택한다.
   대상이 여러 개이거나 미확인 구성품이 있으면 보류하고 target_component로 수동 선택할 수 있게 한다.
3. 외부 검색 결과가 이미 있으면 candidates 0~5개를 그대로 전달한다.
   빈 배열이어도 중복 검색하지 않는다.
   기본은 네트워크 없는 로컬 실행이다.
4. 제조사·유통사·software_provider를 구분한다.
   GPU의 일반 support/driver 요청은 칩셋 제공사를 살핀다.
   특정 모델의 공통 앱 지원을 다른 GPU까지 확대하지 않는다.
   firmware와 제조사 전용 도구는 보드 제조사의 정확 모델/리비전 근거가 필요하다.
5. 후보 URL의 공식 도메인만으로 판단하지 않는다.
   접속 성공, 모델 지원, SW 실행·다운로드 대상을 나눠 확인한다.
   미지원·제외 문구와 다른 모델용 링크를 검사하고 긍정적인 지원 관계도 남긴다.
   공통 앱은 공식 FAQ/호환성 문서와 배포 허브를 연결한다.
   웹앱에는 설치 파일이나 download 경로를 요구하지 않는다. 실제 설정 제어와 지원 모델을 확인한다.
   일반 키보드·마우스 요청에 펌웨어만 있는 페이지를 대신 넣지 않는다.
   상품 소개·판매·다른 모델은 반려한다.
   접속 차단/Provider 오류는 소프트웨어 없음이 아니라 needs_review다.
6. 명시적으로 허용한 호스트의 --online에서만 네트워크 검증한다. --luna는 설정된 실제 COZ_SW_MODEL을 사용하고 후보 ID만 재정렬한다.
7. 후보는 0~5개만 반환한다.
   수를 채우지 않는다.
   설명, reason_codes, page_type, audit_status, evidence_url, verified_at을 함께 보고한다.
   CSV 과거 검수 날짜와 현재 실접속 날짜를 구분한다.
   확인된 후보끼리는 실제 페이지 언어·한국어 선택 기능을 보고 정렬한다.
   프로그램 언어는 별도로 기록한다. URL 모양만으로 한국어 지원을 확정하지 않는다.
   Luna는 이 정책을 뒤집거나 탈락 후보·새 ID·URL을 만들 수 없다.
   Canon은 공통 설명서·지역 판매명·드라이버 지원·구성 프로필을 구분한다.
   설명서나 프로필만으로 해외 드라이버·펌웨어 호환성을 단정하지 않는다.
8. 담당자가 1개를 선택한다.
   엔진 결과는 항상 approved=false다.
   선택 결과의 저장·인증은 연결하는 프로그램의 책임이다.
   형식 검증 결과를 승인 완료로 설명하지 않는다.

```powershell
node "$env:COZ_SW_HOME/bin/coz-sw-matcher.mjs" match --input request.json
```

입력: product_name, 선택적 product_no/requested_software_kind/candidates/target_component/environment.
출력: parsed, candidates, rejected_candidates, status, approved=false, approval_contract, metrics.

[계약](references/contracts.md)은 연동할 때, [검수 정책](references/policy.md)은 예외를 판단할 때 읽는다.
