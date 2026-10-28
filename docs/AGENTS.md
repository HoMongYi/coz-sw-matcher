# Coz SW Matcher Skill

Canonical Skill은 [skills/coz-sw-matcher/SKILL.md](../skills/coz-sw-matcher/SKILL.md)이다. 로컬 COZ_SW_HOME을 프로젝트의 실제 경로로 설정하고 wrapper를 호출할 수 있다.

```powershell
node "$env:COZ_SW_HOME/skills/coz-sw-matcher/scripts/coz-sw-matcher.mjs" match --input request.json
```

Skill 자체는 네트워크를 요구하지 않는다. 로컬 parse/match, 호스트가 제공한 후보, 선택적 온라인 검증을 구분한다. 담당자 승인 전에는 approved=false를 유지한다. MCP 연결은 [API](api.md), 상세 검수 예외는 Skill의 references를 참조한다.
