# 로컬 패키지 검증

```powershell
npm run release:build
python scripts/check-artifacts.py
```

새 산출물은 dist/v0.2.0 아래에 생성한다. source ZIP, Skill ZIP, Plugin ZIP, npm tarball과 SHA256SUMS를 검사한다. 공개 데이터 allowlist·symlink·비밀 패턴·라이선스를 검증한다. 기존 dist와 공개 v0.1.0 태그/Release 자산은 변경하지 않는다.

이 명령은 npm publish, GitHub Release 작성, GitHub Actions 실행을 하지 않는다. 실제 Agent-host 설치 UI와 live Provider 검증은 별도다.
