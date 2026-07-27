# 템플릿 고도화 감사 (Template Audit)

**감사 일자** 2026-07-25
**대상** prod `https://openday.ghmate.com/templates/[id]` 에 실제 게시 중인 템플릿 **11종 전체**
**방법** Playwright (iPhone 430×932, DPR 2, ko-KR / Asia/Seoul) 로 각 템플릿 미리보기 페이지를 끝까지 스크롤하며 전 구간 캡처 + `document.body.innerText` 덤프 + 콘솔/네트워크 에러 수집. 캡처 원본은 `_shots/` (gitignore 처리됨).

> 콘솔 에러 / 4xx 응답은 **11개 템플릿 전부 0건**. 즉 지금 문제는 "깨진 것"이 아니라 **"주제에 맞지 않는 것"** 이다.

---

## 문서 구성

| 문서 | 내용 |
|---|---|
| [00-common.md](00-common.md) | **횡단 이슈** — 템플릿 데이터가 아니라 `PreviewPane.tsx` 등 렌더링 코드에서 비롯된 문제. 11개 전부에 동시 영향 |
| [01-wedding-classic.md](01-wedding-classic.md) | 클래식 웨딩 청첩장 |
| [02-baby-first-birthday.md](02-baby-first-birthday.md) | 돌잔치 초대장 |
| [03-birthday-celebration.md](03-birthday-celebration.md) | 생일 초대장 |
| [04-education-graduation.md](04-education-graduation.md) | 졸업식 초대장 |
| [05-business-seminar.md](05-business-seminar.md) | 비즈 세미나 초대장 |
| [06-business-launch.md](06-business-launch.md) | 신제품 런칭 초대장 |
| [07-social-vip-night.md](07-social-vip-night.md) | VIP 나이트 초대장 |
| [08-sports-tennis.md](08-sports-tennis.md) | 오픈 테니스 컵 초대장 |
| [09-culture-exhibition.md](09-culture-exhibition.md) | 전시회 초대장 |
| [10-seasonal-yearend.md](10-seasonal-yearend.md) | 송년회 초대장 |
| [11-memorial-obituary.md](11-memorial-obituary.md) | 부고 · 추모 안내 |

각 템플릿 문서는 동일한 포맷을 따른다.

```
1. 기본 정보 / 현재 모듈 구성
2. 치명 (P0)   — 지금 당장 신뢰를 깨는 것
3. 주요 (P1)   — 주제 부적합 · 정보 누락
4. 개선 (P2)   — 완성도
5. 이미지 애셋 교체 계획 + 생성 프롬프트
6. 작업 체크리스트
```

---

## 한눈에 보는 심각도 요약

### 전 템플릿 공통 (→ [00-common.md](00-common.md))

| # | 문제 | 영향 | 원인 위치 |
|---|---|---|---|
| C-1 | 인사말 서명이 **"신랑 · 신부"** 로 출력 | 돌잔치·세미나·런칭·테니스·VIP·송년회 6개 | `PreviewPane.tsx:237-238,248` |
| C-2 | 공유 버튼이 **"청첩장 주소 복사하기"** | 11개 전부 (부고 포함) | `PreviewPane.tsx:1952` |
| C-3 | 방명록 샘플이 **"에디터에서는 실제 데이터 대신…"** 이라는 내부용 문구 노출 | 11개 전부 | 샘플 방명록 상수 |
| C-4 | 다크 테마에서 카드·버튼이 **흰색으로 뚫림** (`bg-white` 하드코딩 17곳) | VIP 나이트 등 다크 템플릿 | `PreviewPane.tsx` 다수 |
| C-5 | 지도가 **네이버 기본 라이트 스킨 고정** | 다크 템플릿 | `NaverMap.tsx` (테마 prop 없음) |
| C-6 | 섹션 라벨이 웨딩 기본값 고정 — **"행사 일시 / 행사 장소"** 가 부고에도 출력 | 다수 | seed 미지정 시 기본값 |
| C-7 | **D-day 가 D+65 처럼 지난 날짜** 로 표시 (고정 날짜 시딩) | 현재 4개, 시간이 지나면 전부 | `seed.ts` 고정 `eventDate` |
| C-8 | 제목이 2~3중으로 중복 출력 (`계좌 정보 / Account / 마음 전하실 곳`) | 5개 | seed `koreanTitle` + `titleBig` 동시 설정 |
| C-9 | **장소 상세주소가 화면에 안 나옴** (seed 에는 있는데 미렌더) | 11개 전부 | venue 섹션 |
| C-10 | 연락처 전화번호가 비어 통화/문자 아이콘이 **회색 죽은 버튼** | 졸업식·전시회·부고 | seed 빈 `phone` |

### 템플릿별 최고 심각도

| 템플릿 | P0 | 한 줄 요약 |
|---|---|---|
| 부고 · 추모 | **3** | **고인 성함·별세일시가 없음.** "행사 일시/행사 장소", "청첩장 주소 복사", 카카오 노란 버튼까지 — 조문 상황에 대한 배려가 없다 |
| VIP 나이트 | **3** | 갤러리가 커버 이미지 1장 재탕이라 **다크 배경에 빈 박스**로 보임. 흰 지도·흰 카드가 테마를 뚫음. 오시는 길 안내(강남역)와 실제 주소(삼성동)가 불일치 |
| 비즈 세미나 | **2** | 메인 타이틀이 문자 그대로 `INVITATION`. **연사·프로그램·참가신청이 전무** — 세미나 초대장의 핵심 정보가 없다 |
| 돌잔치 | **2** | 서명 "신랑 · 신부". D+90. **사진마다 다른 아기** |
| 클래식 웨딩 | **2** | **사진마다 다른 커플** (커버/한복/갤러리 최소 4쌍). 오시는 길이 지도에서 5개 섹션 떨어짐 |
| 오픈 테니스 컵 | **2** | 대회인데 **참가 신청·참가비·부문·문의처가 없음**. D+13 |
| 신제품 런칭 | **2** | 6월 행사에 **설산 배경 제품컷**. 문구가 청첩장 어투("가장 가까운 분들을 모십니다") |
| 졸업식 | **1** | **졸업생 이름·학과가 없음**. 커버 학사모 술에 `2024` 각인 (행사는 2027) |
| 전시회 | **1** | **전시 기간(시작~종료)이 없고 오프닝 날짜만** 있음. 커버 타이틀 저대비 |
| 송년회 | **1** | 갤러리가 **밀랍 봉인 그래픽 재탕**. 웨딩 청첩장과 구분되지 않는 크림/골드 |
| 생일 | **1** | **주인공 이름·나이가 없음**. 오시는 길·주차·문의 모듈 자체가 없음 |

---

## 권장 작업 순서

작업을 4개 배치로 나누는 것을 권한다. 배치가 뒤로 갈수록 비용이 커지고 앞 배치에 의존한다.

### 배치 1 — 공통 코드 수정 (1회 작업으로 11개 동시 개선)
`00-common.md` 의 C-1 ~ C-6, C-8 ~ C-10.
`PreviewPane.tsx` / `NaverMap.tsx` 만 건드리며 seed 재시딩이 필요 없다. **투자 대비 효과가 가장 크다.**

### 배치 2 — 시드 콘텐츠 교정 (텍스트만)
문구·라벨·모듈 순서·누락 모듈 추가. `prisma/seed.ts` + `prisma:seed` 재실행.
날짜 상대화(C-7)도 여기서 처리.

### 배치 3 — 이미지 애셋 재생성
각 템플릿 문서 5장의 프롬프트로 이미지를 생성 → `objectstore.ghmate.com/openday/templates/<id>/...` 업로드 → seed URL 교체.
**동일 인물 일관성**(웨딩 커플 1쌍 / 돌잔치 아기 1명)이 이 배치의 핵심 난이도다.

### 배치 4 — 신규 모듈·변형
세미나 연사 카드, 테니스 대진/참가신청, 전시 작품 캡션 등 지금 모듈 시스템에 없는 것. 스키마 확장이 필요할 수 있다.

---

## 감사 커버리지

| 템플릿 | 페이지 높이 | 캡처 구간 | 콘솔 에러 | 4xx |
|---|---|---|---|---|
| wedding-classic | 8557px | 10 | 0 | 0 |
| baby-first-birthday | 6785px | 8 | 0 | 0 |
| birthday-celebration | 3688px | 5 | 0 | 0 |
| education-graduation | 3535px | 5 | 0 | 0 |
| culture-exhibition | 3637px | 5 | 0 | 0 |
| business-seminar | 3208px | 4 | 0 | 0 |
| business-launch | 3298px | 4 | 0 | 0 |
| social-vip-night | 3228px | 4 | 0 | 0 |
| sports-tennis | 3068px | 4 | 0 | 0 |
| seasonal-yearend | 3228px | 4 | 0 | 0 |
| memorial-obituary | 3222px | 4 | 0 | 0 |

캡처 원본: `_shots/<template-id>__NN.png`, 텍스트 덤프: `_shots/<template-id>.txt`
재현 스크립트: 이 문서 하단 참고.

<details>
<summary>캡처 재현 방법</summary>

```bash
# 스크래치 디렉토리에서
npm i playwright@1.55.0 && npx playwright install chromium
node capture.mjs wedding-classic-template-001 baby-first-birthday-template-001 ...
```

`capture.mjs` 는 430×932 모바일 컨텍스트로 `/templates/[id]` 를 열고, 전체를 스크롤해 reveal 애니메이션을 소진시킨 뒤 860px 간격으로 뷰포트 스크린샷을 찍는다.
</details>
