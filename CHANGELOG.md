# Changelog

## v0.1.0 — 첫 공개

제품명으로 공식 소프트웨어·드라이버·지원 페이지를 찾아 검증하는 HSUF의 첫 공개 버전입니다.

### 주요 기능

- 정확 모델과 리비전을 구분하는 제품명 정규화 및 공식 Registry 조회
- `fill` · `blank` · `review` 판정과 확인 근거·검증일 제공
- 공식 도메인·지원 모델·페이지 내용·리다이렉트·직접 파일 URL 감사
- SerpAPI 검색, 후보 점수제, 필요할 때 OpenAI Judge를 사용하는 예제 Pipeline
- Mock · Generic HTTP · Command 방식의 외부 연결점
- CLI · CSV 일괄 처리 · 로컬 HTTP API · MCP Server
- Codex·Claude Code에서 사용할 수 있는 Agent Skill과 Codex Plugin 패키지
- 공개 Registry와 선택적인 Private Overlay 분리
- Software Lifecycle(활성·재확인·지원 종료·대체) 기록

### 알려진 범위

최초 Registry에는 Vendor 정의 51개와 도메인 후보 85개가 있습니다. 자동 확정 가능한 공개 Exact Model은 2개이고, Software Ecosystem 24개는 `needs-refresh` 상태입니다. **등록된 브랜드 수가 전체 모델의 자동 지원을 뜻하지 않습니다.**

유료 SerpAPI/OpenAI 실제 계정 호출, Agent 호스트 설치 화면, Claude API Skill 업로드는 릴리즈 시점에 별도 검증하지 않았습니다. npm 레지스트리에도 아직 게시하지 않았습니다.

자세한 사용법은 [README](README.md), 배포 파일 안내는 [Releases](docs/RELEASES.md)를 참고해 주세요.
