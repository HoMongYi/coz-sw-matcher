# Coz SW Matcher 작업 규칙

Node.js 22 이상 ESM 프로젝트. 컴퓨존 상품명으로 공식 SW URL 후보 0~5개와 담당자 검수 근거를 반환한다.

- 공개 진입점은 src/index.mjs의 createMatcher, bin/coz-sw-matcher.mjs, src/interfaces이다.
- src/legacy-engine.mjs 및 과거 HTTP/MCP/CLI는 안전 회귀 검증용이다.
  신규 연동에 노출하거나 범용 기능을 증설하지 않는다.
- 모든 신규 결과와 후보는 approved=false다.
  선택 결과의 인증·저장은 연결하는 프로그램에서 맡고 이 프로젝트는 계약만 검증한다.
- D4/D5, WiFi, V2, Rev, OC, HE, SE+, PRO/MAX, 용량을 임의로 합치지 않는다.
  결합상품은 구성품별 근거를 보존한다. SW 대상이 하나이고 나머지 구성품의 SW 없음이
  해당 요청 범위에서 확인된 경우만 대상을 선택한다. 복수 대상이나 미확인은 보류한다.
- 공식 도메인만으로 적합성을 확정하지 않는다.
  정확 모델·SW 유형·다운로드 근거가 필요하다.
- 외부 후보가 제공되면 빈 배열이어도 검색하지 않는다.
  Provider 장애/차단/불명확은 needs_review다.
- 검수 CSV와 승인 이력은 data/private, 평가 원본은 reports/local에만 둔다.
  상품번호/비공개 데이터/키를 공개 자료에 추가하지 않는다.
- CSV checked_at과 실접속 verified_at을 분리한다.
  과거 검수에서 오늘 날짜를 만들지 않는다.
- GitHub Actions는 사용/추가/재활성화하지 않는다.
  검증은 로컬에서 실행한다.
- 기존 미커밋/스테이징 파일을 보존한다.
  Git 이력·릴리스 변경은 사용자의 명시적 지시와 검증된 백업을 전제로 한다.
- 실제 변경 후 HANDOFF.md는 마지막에 한 번 현재 상태로 갱신한다.

검증: npm test, npm run lint, npm run validate.
패키지 변경 시 npm run release:build, python scripts/check-artifacts.py.
문서: README.md → docs/integration.md, docs/api.md, docs/registry.md.
