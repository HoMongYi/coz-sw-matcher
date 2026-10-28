# 릴리스와 패키지

[Coz SW Matcher 릴리스](https://github.com/HoMongYi/coz-sw-matcher/releases/latest)에서 소스·Skill·Plugin·npm 형식 패키지를 받을 수 있다.

| 파일 | 용도 |
|---|---|
| coz-sw-matcher-v0.1.0-source.zip | 소스와 로컬 테스트·문서 |
| coz-sw-matcher-agent-skill-v0.1.0.zip | Agent Skill과 실행 wrapper |
| coz-sw-matcher-codex-plugin-v0.1.0.zip | Skill·MCP 설정·runtime 번들 |
| coz-sw-matcher-0.1.0.tgz | npm 형식의 로컬 설치 패키지 |
| SHA256SUMS.txt | 배포 파일 SHA-256 |
| release-manifest.json | 파일 크기·해시·패키지 검증 정보 |

Skill/Plugin에도 Node.js와 의존성 설치가 필요하다. Agent-host의 실제 설치 UI는 별도 확인 대상이다.

```powershell
npm run release:build
python scripts/check-artifacts.py
```

로컬 산출물은 dist/v0.1.0에 생성한다. 이 명령은 npm registry 게시나 GitHub 릴리스 생성을 수행하지 않는다. 공개 allowlist·symlink·비밀 패턴·라이선스·해시를 검사한다. GitHub Actions는 사용하지 않는다.
