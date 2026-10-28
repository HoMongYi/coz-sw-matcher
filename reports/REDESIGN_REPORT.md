# Coz SW Matcher 재설계 검증 결과

공개 코드의 변경과 관측 결과만 기록한다. 검수 CSV 원본·상품번호·실제 검수 행·담당자 이력은 포함하지 않는다.

| 단계 | 상태 | 결과 |
|---|---|---|
| 0 감사·백업 | Passed | Git bundle·전체 파일 해시 대조, 기존 미커밋·스테이징 보존, 알려진 비밀 패턴 이력 검사 |
| 1 이름 변경 | Passed | HoMongYi/coz-sw-matcher와 실제 Git 루트 coz-sw-matcher. 공개 여부·기존 태그/Release 보존. Actions 비활성화 |
| 2 파서 | Passed | 원문·중첩 괄호·유통사·후속모델·결합상품·식별 토큰 보존, 명세 golden 6개 통과 |
| 3 Registry | Passed | 로컬 CSV dry-run/백업/수치 검사/멱등 import, 공개 정책과 로컬 검수 매핑 분리 |
| 4 후보·승인 | Passed | 0~5개 후보, 중복 검색 방지, 독립 페이지 검증, 형식 검증 전용 승인 계약 |
| 5 Luna | Passed / Not run | ID 재정렬·실패/취소/위조 응답·대조 평가 구현. 사용자 요청으로 유료 실모델 비교 보류 |
| 6 인터페이스·검증 | Passed | Node 22 npm test 179/179, 문법, 공개 데이터, CLI·HTTP·MCP 실제 stdio·Skill wrapper 검증 |

179개 테스트에는 기존 안전 회귀와 신규 계약 검증이 포함된다. golden 6개 통과는 전체 상품 모델 인식률을 뜻하지 않는다. Source/Skill/Plugin/npm 패키지는 dist/v0.2.0에 로컬 생성하며 기존 v0.1.0 자산을 덮어쓰지 않는다.

독립적인 ATK·NVIDIA 공개 페이지 접속에서 현재 HTML만으로 정확 모델 지원을 입증하지 못했다. 두 건 모두 needs_review다. 이를 적합성 검증 통과로 표시하지 않는다.

실제 CSV 평가는 Git 제외 reports/local/evaluation.json에만 기록한다. 동일 URL·모델 패밀리·생태계 연결 그룹으로 분리한다. 오프라인 holdout의 낮은 회수율을 온라인 정확도로 바꿔 설명하지 않는다. 담당자 승인/오모델/검수 시간 레이블이 없으면 지표는 null이다. 미확정 항목에 정답을 만들지 않는다.

유료 검색/실모델 정확도, 사내 승인 저장·인증·DB 연동, Agent-host 설치 UI는 Not run 또는 Needs verification이다. 실제 연동은 [전산팀 계약](../docs/integration.md)을 따른다.

주요 변경: src/parser, src/matching, src/matcher.mjs, src/audit, src/ranking, src/local-data, src/evaluation, src/approvals, src/interfaces, bin/coz-sw-matcher.mjs, skills/coz-sw-matcher, schemas/match-*, data/public, tests/coz-*, README/docs와 로컬 패키징 도구.

모든 신규 결과와 후보는 approved=false다. 과거 자동 fill 엔진은 legacy 회귀 검증용이다. 0.2.0 npm 게시와 GitHub Release 발행은 수행하지 않는다.
