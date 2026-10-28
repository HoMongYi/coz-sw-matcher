# 개발과 검증

Node.js 22 이상에서 npm ci --ignore-scripts --no-audit --no-fund 후 npm test, npm run lint, npm run validate를 실행한다. 패키지 변경은 npm run release:build와 python scripts/check-artifacts.py로 검사한다.

GitHub Actions는 사용하거나 추가하지 않는다. 실제 검수 CSV·상품번호·승인 이력은 공개 테스트나 PR에 포함하지 않는다. 명세의 공개 상품명 예시와 합성 fixture만 사용한다.

새 코드는 createMatcher 계약을 사용한다. legacy-engine은 기존 안전 회귀 검증용이다. 자동 승인, 사내 시스템 mutation, 근거 없는 모델 통합은 허용하지 않는다.
