# 배포 파일과 버전 안내

HSUF는 **v0.1.0을 첫 공개 버전**으로 제공합니다. 소스를 내려받아 사용할 수도 있고, Agent Skill·Codex Plugin·npm 패키지 형태의 파일을 받아 사용할 수도 있습니다.

[GitHub v0.1.0 릴리즈 열기](https://github.com/HoMongYi/hardware-software-url-finder/releases/tag/v0.1.0)

## 무엇을 받아야 할까요?

| 하고 싶은 일 | 파일 또는 방법 |
|---|---|
| 소스를 열어보고 직접 실행 | GitHub 저장소를 `git clone` 또는 Source ZIP 다운로드 |
| Codex·Claude Code에 스킬로 연결 | `hsuf-agent-skill-v0.1.0.zip` |
| Codex Plugin 형식 사용 | `hsuf-codex-plugin-v0.1.0.zip` |
| npm 패키지 파일로 로컬 설치 | `hardware-software-url-finder-0.1.0.tgz` |
| 배포 파일 무결성 확인 | `SHA256SUMS.txt`·`release-manifest.json` |

**npm 레지스트리에는 아직 게시하지 않았습니다.** `npm install hardware-software-url-finder`를 레지스트리 설치 명령으로 안내하지 않습니다.

## Release ZIP과 GitHub 소스가 다른가요?

GitHub는 태그를 기준으로 Source code ZIP/TAR 파일을 자동 생성합니다. 프로젝트가 별도로 만드는 Source ZIP은 자체 패키징·검증 과정을 거치므로 두 ZIP의 SHA-256은 같지 않을 수 있습니다.

또한 GitHub의 `main` 브랜치에 README나 문서 수정이 반영되어도 과거 `v0.1.0` 태그와 당시 배포 파일은 자동으로 바뀌지 않습니다. **README의 현재 설명과 릴리즈 파일의 역사적 시점을 구분**해서 보면 됩니다.

## 유지관리자가 새 버전을 준비할 때

변경 내용을 확인한 뒤 테스트와 패키징을 진행합니다.

```bash
npm test
npm run validate
npm run release:build
python scripts/check-artifacts.py
```

검증이 통과한 파일만 새 릴리즈에 첨부합니다. 기존 태그를 강제로 덮어쓰거나 배포 이력을 지우지 않습니다. 문서 수정만으로 반드시 새 버전을 발행할 필요는 없습니다.

[← 전체 문서](README.md) · [처음 실행하기](quick-start.md) · [기여 방법](../CONTRIBUTING.md)
