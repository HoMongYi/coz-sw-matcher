# Coz SW Matcher v0.2.0

상품명의 모델 식별자를 보존하고, 공식 페이지가 실제로 해당 모델과 SW를 지원하는지 확인하는 과정을 보완했습니다.
후보는 필요한 만큼만 0~5개를 반환하며 최종 URL은 사람이 선택합니다.
모든 엔진 결과와 후보는 `approved=false`입니다.

## 주요 변경

- 색상·행사 문구가 섞인 괄호에서도 `WIFI`, `D5`, `V2`, `II`, `Rev`, `SE+` 같은 식별자를 남깁니다.
- 미지원·제외 안내와 다른 모델·다른 SW용 파일을 구분합니다.
  접속 성공, 모델 지원, 실행·다운로드 대상의 확인 결과를 따로 기록합니다.
- 공통 앱은 공식 지원 문서와 배포 허브를 연결합니다.
  웹 설정 도구는 설치 파일 대신 실제 연결·설정 제어를 확인합니다.
- 일반 GPU 요청의 제공사와 한국어 후보 우선순위를 보완했습니다.
  Luna의 재정렬도 검증된 지원·언어 정책 안에서 적용합니다.
- Canon 지역 모델은 공통 설명서와 드라이버 패키지 근거를 나눠 관리합니다.
- 세트상품의 구성품별 후보를 보존하고 SW 없음과 미확인을 구분합니다.
- CLI·HTTP·MCP와 패키지의 버전 표기를 통일했습니다.

## 호환성

기존 요청은 그대로 사용할 수 있습니다.
선택 입력 `environment`와 응답의 `verification`, `support_evidence`, `locale`, `software_scope`,
`component_results`, `metrics.evidence_fetches`가 추가됐습니다.

후보의 `software_kind`는 확인된 실제 SW 종류를 나타냅니다.
예를 들어 일반 `driver` 요청에 NVIDIA App을 제시하면 후보 종류는 `utility`입니다.
`page_type`을 별도 enum으로 제한하는 클라이언트는 `web-app`, `software-hub`를 반영해야 합니다.
새 Registry 관계를 읽으려면 엔진과 스키마를 함께 갱신하세요.

CSV overlay v4는 원본 열을 `source_row`, 편집 상태를 `editing_status`에 보존합니다.
v3도 읽을 수 있습니다.
`counts.mapped`를 사용하고, 기존 `counts.approved`는 매핑 수를 뜻하는 호환용 이름으로 취급하세요.
CSV의 유지·변경 상태는 실접속 검증이나 승인 완료를 뜻하지 않습니다.

## 검증과 확인 범위

배포 전 로컬 테스트 240개(실패·스킵 0), lint·공개 데이터·문서 링크 검사를 통과했습니다.
소스·Skill·Plugin·npm 형식 패키지는 파일 목록, 해시, MIT 라이선스와 비공개 파일 제외 여부를 검사합니다.
GitHub Actions는 사용하지 않습니다.

2026-10-29의 공개 페이지 실접속에서는 NVIDIA App, 펀키스 F87 Pro, Corsair iCUE,
Samsung SL-C4030ND, Canon GX6092→GX6070 허브, HARPE MINI CORE→Gear Link의 근거를 확인했습니다.
ATK의 정적 도구 검증, COX의 정확 모델 자료, MSI의 403 응답은 보류로 남겼습니다.
이 결과는 해당 사례의 확인 기록이며 전체 상품에 대한 추천 정확도 측정값은 아닙니다.

유료 검색·Luna 실모델 비교, 최신 CSV 실데이터 재평가, 실제 설치·장치·펌웨어 시험은 실행하지 않았습니다.
Canon 바이너리 해시 비교와 PS3/FAX 기능 호환도 추가 확인 대상입니다.
검수 CSV·로컬 Registry·상세 평가·자격증명은 배포 파일에 포함하지 않습니다.

Node.js 22 이상이 필요합니다.
소스 설치 방법은 [시작하기](../docs/quick-start.md), API 변경은 [연동 계약](../docs/integration.md),
제조사별 근거와 제한은 [지원 근거](../docs/support-evidence.md)를 참고하세요.
첨부한 `.tgz`는 npm 형식의 설치 파일이며 npm registry에 게시한 패키지는 아닙니다.
라이선스는 MIT입니다.
