# Coz SW Matcher

컴퓨존 상품명을 해석해 **공식 소프트웨어 URL 후보를 최대 5개** 제시합니다. 서비스 담당자가 후보와 근거를 확인하고 최종 주소 1개를 선택하는 검수 도구입니다.

드라이버·펌웨어·설정 프로그램·웹드라이버를 다루며, 제조사와 실제 소프트웨어 제공사를 구분합니다. 정확한 모델이나 지원 근거가 없으면 확인 필요로 남깁니다.

**첫 공개 버전 v0.1.0 · Node.js 22 이상 · MIT**

[릴리스 다운로드](https://github.com/HoMongYi/coz-sw-matcher/releases/latest) · [시작하기](docs/quick-start.md) · [전산팀 연동](docs/integration.md)

## 이런 상품명을 처리합니다

| 상품명에 섞인 정보 | 처리 결과 |
|---|---|
| H610M K D4 / 제이씨현 / 벌크 / 플래티넘 특가 | 모델 H610M K D4를 보존하고 유통사·판매조건·광고를 분리 |
| SL-M2640 / SL-M2630 후속모델 | 현재 모델은 SL-M2640, SL-M2630은 관계 메모 |
| ASUS DUAL RTX 3050 O6G OC | 일반 GPU 드라이버 제공사는 NVIDIA, 보드 펌웨어는 ASUS |
| MSI MPG 코어리퀴드 P22 360 / 단독 특가 / 블랙 | 모델·행사·색상을 각각 기록 |
| MSI H810M-B + INTEL Ultra5 225F | 구성품 2개를 추출하고 검수 대상을 선택할 때까지 보류 |
| ATK VXE R1 SE+ / 펀키스 / 퍼플 / 후아노 | SE+를 보존하고 유통사·색상·스위치를 분리 |

원본 상품명은 그대로 보관합니다. D4/D5, WiFi, V2, Rev, OC, HE, SE+, PRO/MAX와 용량을 임의로 합치지 않습니다.

## 검수 흐름

1. 상품명에서 제조사·유통사·정확 모델·옵션을 추출합니다.
2. 로컬 Registry를 조회하거나 이미 수집한 검색 후보를 받습니다.
3. 공식 도메인, 정확 모델, 요청한 SW 유형, 실제 다운로드 근거를 검사합니다.
4. 유효한 후보 0~5개와 설명·반려 사유·검증일을 반환합니다.
5. 담당자가 최종 주소 1개를 선택합니다.

이미 후보를 받았다면 SerpAPI를 다시 호출하지 않습니다. 후보 수를 채우려고 부적합한 주소를 추가하지 않으며, 공식 사이트의 상품 소개 페이지도 다운로드 근거가 없으면 반려합니다.

결과의 approved는 항상 false입니다. needs_human_approval은 담당자 선택 대기, needs_review는 추가 확인이 필요하다는 뜻입니다. 접속 차단이나 검색 실패를 소프트웨어 없음으로 판정하지 않습니다.

## 설치하고 실행하기

소스 ZIP을 풀거나 저장소를 내려받은 뒤 실행합니다.

```powershell
git clone https://github.com/HoMongYi/coz-sw-matcher.git
cd coz-sw-matcher
npm ci --ignore-scripts --no-audit --no-fund
node bin/coz-sw-matcher.mjs parse "[GIGABYTE] H610M K D4 제이씨현 벌크"
node bin/coz-sw-matcher.mjs match --input examples/match-request.json
```

기본 실행은 오프라인입니다. 독립적인 페이지 근거가 없으면 needs_review가 반환됩니다. 로컬 검수 Registry가 있다면 --overlay data/private/reviewed-registry.json을 추가할 수 있습니다.

네트워크 페이지 검증은 --online으로 켭니다. SERPAPI_API_KEY가 설정되어 있고 외부 후보가 없는 요청에서는 검색을 사용할 수 있습니다.

```powershell
node bin/coz-sw-matcher.mjs match --input examples/match-request.json --online
node bin/coz-sw-matcher.mjs serve --port 8787
node bin/coz-sw-matcher.mjs mcp
```

Luna 재정렬은 선택 기능입니다. OPENAI_API_KEY와 운영 환경에서 확인한 COZ_SW_MODEL을 설정하고 --online --luna로 실행합니다. Luna는 받은 후보 ID만 재정렬하며 새 URL을 만들거나 승인하지 않습니다. 변수명은 [.env.example](.env.example), 입력·출력은 [API 문서](docs/api.md)를 참조하세요.

## 전산팀 연동

[연동 계약](docs/integration.md), [HTTP/MCP API](docs/api.md), [실행 가능한 샘플](examples/compuzone-integration.mjs)을 제공합니다. 승인 화면·인증·DB 저장은 사내 시스템에서 구현합니다.

검수 CSV·승인 이력·회사별 Registry는 로컬 data/private에, 상세 평가는 reports/local에 보관하며 Git과 배포 패키지에서 제외합니다. [CSV import와 평가](docs/registry.md), [보안 경계](SECURITY.md)를 확인하세요.

## 검증 범위

```powershell
npm test
npm run lint
npm run validate
```

로컬 회귀 테스트는 상품명 식별 토큰, 잘못된 모델·페이지 반려, Provider 장애·취소, 후보 수 제한, CLI·HTTP·MCP·Skill wrapper와 패키지 구성을 검사합니다. 검증 범위와 실모델 비교의 보류 사항은 [검증 문서](reports/VERIFICATION.md)에 기록합니다.

GitHub Actions는 사용하지 않습니다.
