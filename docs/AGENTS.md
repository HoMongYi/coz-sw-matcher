# Coz SW Matcher Agent Skill

원본 Skill은 [skills/coz-sw-matcher/SKILL.md](../skills/coz-sw-matcher/SKILL.md)이다.
Skill 폴더를 사용하는 에이전트의 Skill 설치 경로에 복사한다.
실행 엔진은 별도로 필요하므로 저장소에 의존성을 설치하고 `COZ_SW_HOME`을 실제 프로젝트 경로로 설정한다.
[릴리스 패키지](releases.md)의 Skill ZIP도 같은 원본을 담는다.

```powershell
$env:COZ_SW_HOME = (Get-Location).Path
node "$env:COZ_SW_HOME/skills/coz-sw-matcher/scripts/coz-sw-matcher.mjs" match --input examples/match-request.json
```

호출 방식은 에이전트마다 다르다.
Skill을 로드한 뒤 상품명 분석이나 후보 검수를 요청하고 위 wrapper로 실행할 수 있다.
Agent-host 설치 UI까지 검증한 것은 아니다.

Skill 자체는 네트워크를 요구하지 않는다.
로컬 `parse`·`match`, 호스트가 제공한 후보, 선택적인 온라인 검증을 구분한다.
사람이 선택하기 전에는 `approved=false`를 유지한다.
MCP 연결은 [API 문서](api.md), 예외 판단은 Skill의 references를 따른다.
