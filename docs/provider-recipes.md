# 온라인 실행 예시

```powershell
node bin/coz-sw-matcher.mjs match --input examples/match-request.json --online
node bin/coz-sw-matcher.mjs match "[ASUS] TUF Gaming B850M-E WIFI" --kind driver --online --luna
```

첫 명령은 기존 후보를 검증하며 검색하지 않는다. 두 번째는 설정된 검색과 Luna를 사용할 수 있다. 키는 .env.example의 변수명을 호스트 환경에 설정한다. 실제 키를 명령·Git·보고서에 쓰지 않는다. 비용 발생과 상품정보 외부 처리를 허용한 환경에서만 실행한다.

[Provider 계약](providers.md) · [보안 경계](../SECURITY.md)
