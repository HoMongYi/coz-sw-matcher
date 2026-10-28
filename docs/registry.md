# CSV·Registry와 평가

공개 vendor/생태계/유통사 정책은 data/public, 로컬 검수 매핑과 검수 CSV는 data/private에 둔다.
공개 데이터의 needs-refresh를 근거 없이 active로 바꾸지 않는다.

## 로컬 import

```powershell
npm run csv:import -- "C:/path/reviewed.csv" --classification PUBLIC_SOURCE_ONLY
npm run csv:import -- "C:/path/reviewed.csv" --classification PUBLIC_SOURCE_ONLY --apply
npm run evaluate
```

첫 명령은 dry-run이다.
분류 확인 후 --apply로 해시 검증한 원본 백업과 overlay를 생성한다.
입력 CSV는 덮어쓰지 않는다.
같은 원본의 재실행은 변경하지 않는다.
기존 overlay가 달라지면 data/private/backups에 보존하며 importer가 rollback 위치를 반환한다.

열은 `product_no`, `product_name`, `sw_download`, `status`, `reason`, `evidence_url`, `locale`, `verification_method`, `candidate_url`, `hsuf_decision`, `hsuf_reason`, `checked_at`이다.
`hsuf_decision`과 `hsuf_reason`은 기존 CSV와 호환하기 위해 유지한 열 이름이다.
헤더·행 수·중복 상품번호·상태·필수 URL을 검증한다.

유지/변경만 source=manual_verified_csv 매핑으로 변환한다.
확인 필요/제외는 별도 배열에 보존한다.
checked_at은 dataset_checked_at에 보존하며 verified_at은 null이다.
후보는 approved=false다.

## 측정 해석

평가 입력과 상세 결과는 reports/local에만 저장한다.
동일 URL·모델 패밀리·명시적 생태계 연결 그룹을 통째로 나누고 URL별 대표값을 사용해 중복 득점을 줄인다.
train/test 분리와 공개 Registry의 기존 지식은 구별해야 한다.

Top-5 URL 포함률, Top-1 URL 일치율, 보류율·처리 시간·비용을 기록한다.
담당자 1순위 승인율/잘못된 모델률/평균 검수 시간은 해당 레이블·이력이 없으면 null이다.
확인 필요 항목에 가짜 정답을 만들지 않는다.

CSV의 최종 URL은 당시 전체 후보 5개나 반려 이력이 아니다.
오프라인 조회 회수율을 온라인 정확도로 설명하지 않는다.
Luna 실모델과 독립적인 후보 snapshot이 없으면 Not run이다.
evaluateCases는 동일 snapshot의 rule/Luna 대조를 지원한다.
