# Repository 작업 규칙

이 저장소는 Node.js ESM 기반의 Hardware Software URL Finder입니다. 공개 프로젝트의 첫 버전은 `v0.1.0`이며, 제품명으로 공식 하드웨어 소프트웨어 URL을 찾아 `fill / blank / review`로 판정합니다.

## 수정 전 확인할 것

- 정확 모델과 리비전(`V2`, `D4/D5`, `WiFi`, `Pro/Max` 등)을 임의로 합치지 않습니다.
- Search/Judge는 URL 후보와 근거를 제공할 뿐, 최종 `fill` 여부는 Core Audit가 판단합니다.
- Provider 장애·접속 차단·모델 불명확은 `review`입니다. `blank`로 바꾸지 않습니다.
- 공개 Registry의 `needs-refresh` 항목을 근거 없이 `active`로 바꾸지 않습니다.
- 회사별 상품번호·비공개 검수 데이터·API 키·내부 URL은 공개 저장소에 추가하지 않습니다.

## 문서 작성

README는 처음 방문한 사람이 이해하는 순서로 씁니다. CLI·API 예시는 실제 구현과 대조하고, 검증하지 않은 기능은 검증한 것처럼 설명하지 않습니다. GitHub Mermaid, 표, `<details>`는 도움이 될 때만 사용합니다.

## 검증

```bash
npm test
npm run validate
```

패키징·배포 파일이 변경될 때만 다음을 추가로 실행합니다.

```bash
npm run release:build
python scripts/check-artifacts.py
```

기존 `v0.1.0` 태그나 배포 파일을 임의로 덮어쓰지 않습니다. GitHub에 push·Release 수정이 필요하면 사용자 요청의 범위와 원격 상태를 먼저 확인합니다.
