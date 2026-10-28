# 개발과 검증

Node.js 22 이상에서 저장소 루트의 명령을 실행한다.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run lint
npm run validate
```

패키지를 바꿨다면 `npm run release:build`와 `python scripts/check-artifacts.py`도 실행한다.
GitHub Actions는 사용하거나 추가하지 않는다.

공개 상품명 예시와 합성 fixture로 검증한다.
검수 CSV, 상품번호, 선택 이력, 자격증명은 공개 테스트나 PR에 포함하지 않는다.

새 연동 코드는 `createMatcher` 계약을 사용한다.
`legacy-engine`은 기존 안전 규칙의 회귀 검증용이다.
자동 승인, 허용되지 않은 외부 시스템 변경, 근거 없는 모델 통합은 허용하지 않는다.
문서나 예시를 바꿀 때도 실제 출력과 대조한다.
