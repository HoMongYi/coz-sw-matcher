# Coz SW Matcher v0.1.0

컴퓨존 상품명에서 정확한 모델과 소프트웨어 제공사를 구분하고 공식 URL 후보를 최대 5개 제시하는 첫 공개 버전입니다.

상품명에 섞인 광고·유통사·후속모델·결합상품을 분리합니다. 공식 도메인·정확 모델·SW 유형·다운로드 근거를 검사하며, 담당자가 최종 주소를 선택합니다. 모든 엔진 결과는 승인 대기 상태입니다.

CLI·HTTP·MCP·Agent Skill, 로컬 CSV Registry import와 평가, 선택적 Luna 후보 재정렬을 제공합니다.

Node.js 22 이상이 필요합니다. 소스를 받은 뒤 npm ci --ignore-scripts --no-audit --no-fund로 의존성을 설치하세요. [README](https://github.com/HoMongYi/coz-sw-matcher#readme)와 [시작하기](https://github.com/HoMongYi/coz-sw-matcher/blob/main/docs/quick-start.md)에 실행 예제가 있습니다.

로컬 테스트 179개와 문법·공개 데이터·패키지 검사를 통과했습니다. 실모델 비교는 보류 상태이며 운영 정확도를 보장하지 않습니다. 검수 CSV·회사별 Registry·상세 평가·자격증명은 배포 파일에 포함하지 않습니다. GitHub Actions와 npm registry 게시도 사용하지 않습니다.

소스 ZIP, Skill ZIP, Plugin ZIP, npm tarball과 SHA256SUMS를 첨부합니다. 라이선스는 MIT입니다.
