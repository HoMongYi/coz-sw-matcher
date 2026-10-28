# 소개 영상과 편집 원본

README의 GIF는 45초 무음 소개 영상에서 뽑은 짧은 미리보기다.
상품명 분석부터 URL 후보 검증, 사람의 최종 선택까지를 다룬다.
HyperFrames는 영상 제작에만 사용하며 Coz SW Matcher의 실행 의존성이 아니다.

## 장면과 근거

상품명 분석은 공개 예시를 실제 파서로 실행한 결과다.
표시한 URL은 실제 GIGABYTE 공식 페이지다.
공개 검색에서 수집한 5개를 실제 Coz SW Matcher Skill wrapper에 전달해 온라인으로 실행했다.
원문 응답은 `needs_review`, `approved=false`, `candidates=[]`다.
사이트의 브라우저 확인 요구로 자동 검증을 마치지 못했으며, 이를 성공한 결과로 바꾸지 않았다.
영상의 표는 입력한 검색 후보 목록으로, 검증을 통과한 후보 목록과 구분한다.

선택 화면은 1~5번 후보 행과 단일 선택, 직접 입력란, 저장 버튼으로 구성한 합성 예시다.
후보가 모두 맞지 않으면 직접 주소를 넣고 저장해 적용하는 경로를 보여준다.
직접 입력·인증·저장은 연결 프로그램의 기능이며 실제 저장은 수행하지 않는다.
엔진 결과는 `approved=false`이며 사람이 최종 URL과 호환성을 확인한다.

## 파일과 재생

원본 프로젝트 폴더 이름은 `coz-sw-matcher-explainer`다.
영상 폴더를 Coz SW Matcher 저장소와 나란히 보관하면 실행 근거를 다시 생성할 수 있다.

```text
coz-sw-matcher-explainer/
├── index.html
├── compositions/          # 여섯 장면
├── assets/                # 폰트·GSAP·실행 결과
├── scripts/               # 근거 캡처·폰트·미리보기 생성
├── package.json
├── package-lock.json
├── README.md
└── output/
    ├── coz-sw-matcher-demo.mp4
    └── poster.webp
```

MP4와 편집 원본은 [소개 영상 Release](https://github.com/HoMongYi/coz-sw-matcher/releases/tag/explainer-2026-10-29)에서 받을 수 있다.

- [45초 MP4 다운로드](https://github.com/HoMongYi/coz-sw-matcher/releases/download/explainer-2026-10-29/coz-sw-matcher-demo.mp4)
- [편집 가능한 HyperFrames 원본 ZIP](https://github.com/HoMongYi/coz-sw-matcher/releases/download/explainer-2026-10-29/coz-sw-matcher-explainer-source.zip)
- [포스터](https://github.com/HoMongYi/coz-sw-matcher/releases/download/explainer-2026-10-29/poster.webp) · [SHA-256 목록](https://github.com/HoMongYi/coz-sw-matcher/releases/download/explainer-2026-10-29/explainer-SHA256SUMS.txt)

원본 폴더에서 `npm ci --ignore-scripts`, `npm run dev`로 편집 미리보기를 열고 `npm run render`로 MP4를 만들 수 있다.
Node.js 22 이상, Chromium과 FFmpeg가 필요하다.

영상 파일은 GitHub Release Asset에 보관하고 README에는 가벼운 이미지와 다운로드 링크를 사용한다.
소개 영상 Release는 소프트웨어 v0.1.0의 배포 파일과 구분한다.
큰 MP4와 영상 제작 의존성은 매칭 엔진의 Git 소스나 실행 의존성에 포함하지 않는다.
