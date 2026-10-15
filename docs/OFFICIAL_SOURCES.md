# 공식 문서와 확인 근거

HSUF는 제조사 공식 지원 페이지를 우선하고, Agent·API 연결 방법도 각 플랫폼의 공식 문서를 기준으로 작성합니다. 아래 링크는 **v0.1.0 설계·구현 때 참고한 자료**입니다. 외부 서비스의 설치 방법이나 API는 바뀔 수 있으므로 사용 시점의 문서를 다시 확인하는 편이 좋습니다.

## Agent Skill·플러그인

- [Agent Skills 공개 규격](https://agentskills.io/specification) — `SKILL.md`와 참조 파일 구성
- [Codex Skills](https://developers.openai.com/codex/skills) — Codex에서 스킬 찾기·설치하기
- [OpenAI Plugin 제작 문서](https://developers.openai.com/plugins/build/plugins) — Skill·MCP를 함께 배포할 때 참고
- [Claude Code Skills](https://code.claude.com/docs/en/skills) — Claude Code에서 스킬 사용하기
- [Claude API Skills Guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide) — API 환경에서 Custom Skill 사용하기

Skill은 **작업 절차를 알려주는 파일 묶음**입니다. 실제로 로컬 CLI를 실행할 수 있는지, 인터넷에서 공식 페이지를 조회할 수 있는지는 Agent가 실행되는 환경에 따라 달라집니다. → [Agent 연결 방법](AGENTS.md)

## 검색·LLM·MCP

- [SerpAPI Search API](https://serpapi.com/search-api) — Google 검색 결과에서 URL·제목·요약 추출
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — Judge가 후보 ID 또는 review를 정해진 JSON 형태로 반환할 때 사용
- [MCP Specification](https://modelcontextprotocol.io/specification/2026-07-28) — Agent와 도구 사이의 통신 규격
- [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/v2/) — MCP Server/Client 구현 참고

HSUF의 공개 예제는 SerpAPI로 후보를 찾고 OpenAI Judge로 비교할 수 있지만, **유료 계정 실호출까지 v0.1.0에서 검증했다는 뜻은 아닙니다.** Mock/계약 테스트와 실제 외부 API 계정 테스트는 구분해 기록합니다.

## 제품·제조사 URL의 근거

공개 Registry는 `data/public/vendors/*.json`에서 관리합니다. 각 URL을 자동 확정하려면 정확한 모델·지원 범위·출처·검증일이 필요합니다. 등록된 도메인이나 통합 소프트웨어 이름만으로 전 제품을 지원한다고 보지 않습니다.

제조사 공식 페이지 확인 기록과 일부 콘텐츠 해시는 [공개 출처 확인 기록](../reports/public-source-refresh.json)에 남아 있습니다. 검사에 실패했거나 모델 근거가 부족한 페이지는 검증 완료 정보로 간주하지 않습니다.

[← 문서 길잡이](README.md) · [Registry 이해하기](REGISTRY.md)
