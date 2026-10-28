# Coz SW Matcher

컴퓨존 상품명에서 정확한 모델과 소프트웨어 제공자를 구분하고, 공식 소프트웨어 URL 후보를 **최대 5개** 제시합니다. 담당자가 그중 1개를 선택·승인합니다.

상품 소개 페이지를 다운로드 주소로 오인하거나, 모델명에 붙은 행사·유통사·후속모델을 현재 모델로 혼동하는 문제를 줄이는 도구입니다. JavaScript / Node.js 22 이상, MIT.

## 컴퓨존 상품명 해석

| 입력의 특징 | 해석 |
|---|---|
| H610M K D4 제이씨현 벌크 / 플래티넘 특가 | 모델 H610M K D4, 유통사·판매조건·광고 분리 |
| SL-M2640 / SL-M2630 후속모델 | 현재 SL-M2640, 과거 모델은 관계 메모 |
| ASUS DUAL RTX 3050 O6G OC | 일반 GPU driver 제공사는 NVIDIA, firmware는 ASUS |
| MSI MPG 코어리퀴드 P22 360 / 단독 특가 | 원형 모델 유지, 행사·색상 분리 |
| MSI H810M-B + INTEL Ultra5 225F | 두 구성품 추출, 대상 선택 전 보류 |
| ATK VXE R1 SE+ / 펀키스 / 퍼플 / 후아노 | SE+ 보존, 유통사·색상·스위치 별도 보관 |

원문은 raw_product_name에 보존합니다. 알려지지 않은 중요한 토큰과 리비전은 추측으로 지우지 않습니다.

## 후보와 담당자 승인

입력 → 상품명 파싱 → Registry / 기존 후보 또는 선택적 검색 → 공식성·모델·페이지 목적 검사 → 선택적 Luna 재정렬 → 0~5개 후보 → 담당자 승인.

- 기존 검색 후보를 candidates로 받으면 SerpAPI를 다시 호출하지 않습니다. 빈 배열도 그대로 존중합니다.
- 후보가 0~4개면 그 개수만 반환합니다. 상품 소개·판매·다른 모델은 반려 사유와 함께 분리합니다.
- 모든 결과는 approved=false입니다. 독립적인 페이지 검증이 끝나면 needs_human_approval, 미확인 사항이 있으면 needs_review입니다.
- CSV의 과거 승인 매핑은 재확인할 후보입니다. 실접속을 하지 않았다면 verified_at은 null입니다.
- Luna는 받은 후보 ID만 재정렬하며 URL을 만들거나 승인할 수 없습니다.

## 설치와 CLI

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node bin/coz-sw-matcher.mjs parse "[GIGABYTE] H610M K D4 제이씨현 벌크"
node bin/coz-sw-matcher.mjs match --input examples/match-request.json
```

기본은 오프라인입니다. 마지막 예시는 페이지를 아직 검증하지 않았으므로 보류될 수 있습니다. 기존 CSV의 로컬 Registry가 있다면:

```powershell
node bin/coz-sw-matcher.mjs match "[ATK] VXE R1 SE+ 마우스" --overlay data/private/reviewed-registry.json
```

네트워크 검증은 --online으로 명시합니다. SERPAPI_API_KEY가 있으면 외부 후보가 없는 요청에서 검색을 사용할 수 있습니다. --luna는 OPENAI_API_KEY와 실제 환경에서 확인한 COZ_SW_MODEL이 필요합니다. 모델 식별자 기본값은 없습니다. [.env.example](.env.example)은 변수명만 제공합니다.

```powershell
node bin/coz-sw-matcher.mjs match --input examples/match-request.json --online
node bin/coz-sw-matcher.mjs serve --port 8787
node bin/coz-sw-matcher.mjs mcp
npm test
npm run lint
npm run validate
```

## 전산팀 연동

[입출력·승인 계약](docs/integration.md)과 [HTTP/MCP API](docs/api.md), [실행 가능한 연동 샘플](examples/compuzone-integration.mjs)을 제공합니다. 회사 DB·서버·인증 구조를 가정하지 않습니다. 실제 승인 저장과 권한 확인은 사내 시스템에서 구현합니다.

검수 CSV 원본·파생 Registry·평가는 Git과 공개 패키지에서 제외합니다. [CSV import / 평가](docs/registry.md), [보안 경계](SECURITY.md), [재설계 검증 범위](reports/REDESIGN_REPORT.md)를 확인하세요.

0.2.0은 재설계 작업 버전입니다. 기존 공개 v0.1.0 이력과 릴리스는 보존합니다. 과거 자동 fill 엔진은 legacy 회귀 검증에만 사용하며 새 공개 API에서 내보내지 않습니다. GitHub Actions는 사용하지 않습니다.
