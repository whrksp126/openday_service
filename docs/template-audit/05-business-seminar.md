# 05. 비즈 세미나 초대장

| 항목 | 값 |
|---|---|
| id | `business-seminar-template-001` |
| 카테고리 | 비즈니스 · 세미나 |
| 콘셉 | 모노톤 + 그리드 페이퍼. `2026 Annual Business Forum` |
| 테마 | 화이트 배경 + grid bgEffect + `#1f1f1f` accent |
| 페이지 높이 | 3208px (4구간) |
| 캡처 | `_shots/business-seminar-template-001__00~03.png` |

**모듈 구성 (8개)**
`main → greeting → datetime → venue → dday → gallery → tab(오시는 길) → guestbook`

---

## 이 템플릿의 핵심 진단

> **비즈니스 세미나 초대장이 갖춰야 할 정보가 거의 없다.**
> 연사가 누구인지, 무엇을 다루는지, 몇 시간짜리인지, 어떻게 등록하는지, 참가비가 있는지 — 하나도 없다.
> 지금 이 템플릿은 **웨딩 청첩장의 뼈대에 회사 이름만 바꿔 끼운 것**에 가깝다.

---

## P0 — 치명

### S-1. 메인 타이틀이 문자 그대로 `INVITATION`

**현상.** 커버 최상단에 작게 `INVITATION`, 바로 아래 대문짝만하게 **`INVITATION`**. 같은 단어가 두 번, 그것도 가장 큰 글자로.

행사명(`2026 Annual Business Forum`)은 그 아래 작은 글씨로 밀려 있다.

**원인.** seed 의 `main` 모듈 `textSlots` 에서 큰 타이틀 슬롯에 `INVITATION` 이 들어가 있다.

**수정안.** 가장 큰 글자는 **행사명**이어야 한다.

```ts
textSlots: {
  inviteLabel: 'INVITATION',                    // 작은 라벨 — 유지
  brandTitle: '2026 ANNUAL\nBUSINESS FORUM',    // 큰 타이틀 — 행사명으로
  subText: '변화의 다음 장을 함께 씁니다',        // 태그라인
  bottomText: '2026. 05. 21. (토) PM 1:30 · 서울 그랜드 호텔',
}
```

### S-2. 연사 · 프로그램 · 참가 신청이 전무하다

**현상.** 모듈 8개가 `main / greeting / datetime / venue / dday / gallery / tab / guestbook` 이다. 이 중 **세미나에 특화된 것은 0개**다.

**받는 사람 입장에서 없는 것.**

| 없는 정보 | 왜 결정적인가 |
|---|---|
| **연사(Speaker)** | 세미나 참석 결정의 1순위. "누가 말하는가"가 곧 가치 |
| **프로그램 / 세션 타임테이블** | 반차를 쓸지, 몇 시에 갈지 판단 근거 |
| **참가 신청 (RSVP)** | 등록 없이 어떻게 가는지 알 수 없음 |
| **참가비 / 무료 여부** | 유료면 반드시 사전 고지 |
| **대상 (Who should attend)** | 내가 갈 자리인지 판단 |
| **주최 / 후원** | 신뢰도. 지금 서명이 "신랑 · 신부"다 |
| **문의처** | 등록 문제 발생 시 |

**보내는 사람 입장에서 없는 것.** 참석 인원을 셀 방법(RSVP), 사전 질문 수집, 명함/소속 수집.

**수정안 — 모듈 구성 재설계**

| order | 모듈 | 비고 |
|---|---|---|
| 1 | main | S-1 |
| 2 | greeting | 초대의 말 + 주최 서명 |
| 3 | **`timeline` (프로그램)** | 세션 타임테이블. 기존 모듈 재활용 |
| 4 | **`profile` 또는 신규 speaker 모듈** | 연사 3~4명 (사진·이름·소속·세션명) |
| 5 | datetime | |
| 6 | venue | |
| 7 | **tab (오시는 길·주차)** | venue 직후 |
| 8 | **`rsvp` (참가 신청)** | **필수 추가** |
| 9 | dday | |
| 10 | gallery | 지난 회차 현장 |
| 11 | **`contact` (등록 문의)** | 필수 추가 |
| 12 | guestbook | |

**연사 모듈이 없다면** — `profile` 모듈(웨딩의 "저희를 소개합니다")이 사진+이름+한 줄 구조라 그대로 쓸 수 있다. 다만 2명 고정 레이아웃이면 3~4명용 변형이 필요하다. 스키마 확장은 배치 4 로.

### S-3. 인사말 서명이 "신랑 · 신부"

기업 포럼 초대장 인사말 끝에 `신랑 · 신부`. → [00-common.md C-1](00-common.md)

```ts
greetingAuthor: '2026 Annual Business Forum 사무국',
```

### S-4. D+65 — 두 달 전에 끝난 행사

`eventDate: 2026-05-21`, 오늘 2026-07-25. → [00-common.md C-7](00-common.md)

---

## P1 — 주요

### S-5. 갤러리가 커버 이미지 재탕 + 1장

**현상.** `갤러리 / Gallery` 에 발표 중인 여성 연사 사진 **1장**. 세로로 길게 잘려 상반신이 화면을 꽉 채운다.

`seminarGallery = [main_img.png]` — 커버 이미지와 동일 파일이다.

**왜 문제인가.** 세미나 초대장의 갤러리는 **"작년에 어떤 자리였나"** 를 보여주는 자리다. 사진 1장은 정보가 아니라 장식이고, 그마저 커버와 같으면 중복이다.

**수정안.** 지난 회차 현장 사진 4장으로 교체. (이미지 계획 참조)

### S-6. 인사말이 청첩장 어투

> "바쁘신 일정에도 참석하시어 **자리를 빛내 주시면** 감사하겠습니다."

`자리를 빛내 주시다` 는 경조사 관용구다. B2B 포럼 초대에서는 격이 안 맞는다.

**수정안.**

```
한 해 동안의 통찰과 다가올 변화를 함께 나누는 자리,
2026 Annual Business Forum에 초대합니다.

금융·제조·테크 각 분야의 리더가 모여
2027년의 방향을 이야기합니다.

사전 등록하신 분께 세션 자료집을 드립니다.
많은 참여 부탁드립니다.
```

핵심 변화 — **참석했을 때 얻는 것**(자료집, 네트워킹, 인사이트)을 명시. 비즈니스 초대장은 감성이 아니라 **가치 제안**으로 설득한다.

### S-7. 커버의 회색 블롭이 어색하다

**현상.** 커버 상단에 정체불명의 **회색 유기적 도형**이 `INVITATION` 글자와 겹쳐 있다. 사진도 아니고 패턴도 아니라 렌더링 오류처럼 보인다.

**수정안.** 모노톤 그리드 테마와 맞는 **기하학적 요소**(가는 선, 그리드, 사각 프레임)로 교체하거나 제거. 이 템플릿의 그리드 페이퍼 배경이 이미 충분한 성격을 갖고 있으므로 **제거가 가장 깔끔하다.**

### S-8. 라벨을 비즈니스 어휘로

| 현재 | 제안 |
|---|---|
| `인사말` / `Invitation` | `초대의 말` / `Greeting` |
| `행사 일시` / `Event Day` | `행사 일정` / `Schedule` |
| `행사 장소` / `Location` | `행사 장소` / `Venue` |
| `방명록` / `Guestbook` | `사전 질문` / `Q&A` ← 세미나에서 훨씬 유용 |

특히 마지막이 중요하다. 세미나에서 방명록(축하 메시지)은 쓸 데가 없지만, **사전 질문 수집**은 실제로 유용하다. `guestbook` 모듈을 그대로 쓰면서 라벨만 바꿔도 성격이 달라진다.

### S-9. 문의처 · 상세주소 누락

→ [00-common.md C-9, C-10](00-common.md)
`서울 그랜드 호텔 Grand Ballroom 3F` 만 표시되고 `서울특별시 중구 세종대로 80` 은 안 보인다.

---

## P2 — 개선

### S-10. 캘린더 주말 빨강/파랑

완전 모노톤(`#1f1f1f`) 테마인데 달력만 빨강·파랑이다. 이 템플릿에서 가장 눈에 띄는 불일치. → [00-common.md C-13](00-common.md)

### S-11. 인사말 줄간격 과다

문단 사이가 화면 1/4 씩 벌어진다. → [00-common.md C-12](00-common.md)

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 | 회색 블롭 — 제거 또는 교체 |
| gallery | 1 (= 커버) | **교체 필수** |
| 연사 사진 | 0 | **신규 필요** (S-2) |

### 공통 사양

4:5(갤러리) / 1:1(연사), 1600px 이상.
**공통 룩**: 뉴트럴 그레이·차콜·화이트, 자연광 또는 균일한 실내광, 저채도, 다큐멘터리 톤. **연출된 스톡 느낌을 피할 것** — "웃으며 악수하는 비즈니스맨" 류는 신뢰를 떨어뜨린다.

#### gallery 01~04 (지난 회차 현장)

| # | 내용 |
|---|---|
| 01 | 무대 위 발표자 원경 + 대형 스크린 (얼굴 작게) |
| 02 | 객석 뒷모습 — 노트북/노트에 기록하는 참석자들 |
| 03 | 휴식 시간 네트워킹 — 서서 대화, 얼굴 흐림 |
| 04 | 패널 토론 — 무대 위 의자 4개, 원경 |

```
(01)
Wide shot of a speaker standing on a stage in a hotel ballroom in front of a
large presentation screen, seen from the back of the room, audience heads
silhouetted in the foreground, neutral grey and charcoal interior, even
professional lighting, faces not clearly visible, documentary conference
photography, desaturated neutral color grade, vertical 4:5 composition
```

```
(02)
Over-the-shoulder view of conference attendees seated in rows taking notes in
notebooks and on laptops, seen from behind, neutral grey seating and charcoal
carpet, soft even indoor lighting, faces not visible, shallow depth of field,
documentary photography, desaturated neutral color grade, vertical 4:5
composition
```

```
(03)
Candid shot of business professionals standing and talking during a conference
coffee break, holding paper cups, motion-blurred and shot at a shallow depth of
field so faces are not identifiable, neutral grey lobby with large windows,
natural daylight, documentary photography, desaturated neutral color grade,
vertical 4:5 composition
```

#### 연사 프로필 3~4장 (1:1)

```
Professional corporate headshot of a Korean business executive in their forties
wearing a dark navy suit, plain light grey studio background, soft even
lighting, neutral confident expression, sharp and clean, desaturated neutral
color grade, square 1:1 composition
```

성별·연령대를 다양하게 조합해 4장을 만든다.

#### 커버 (블롭 제거)

```
Minimal geometric composition on a warm off-white background with a subtle
fine grid pattern, a few thin charcoal horizontal rules and one thin gold
accent line, large empty negative space in the upper two thirds reserved for
overlaid text, editorial print design aesthetic, no photographs, no organic
blobs, no text, vertical 9:16 composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `BUSINESS_SEMINAR_TEMPLATE`)**

- [ ] S-1 커버 큰 타이틀을 행사명으로
- [ ] S-2 `timeline`(프로그램) · 연사 · `rsvp` · `contact` 모듈 추가 + `order` 재배치
- [ ] S-3 `greetingAuthor: '2026 Annual Business Forum 사무국'`
- [ ] S-4 `eventDate` 상대 날짜화 (오늘 +60일 권장)
- [ ] S-5 `seminarGallery` 를 `gallery/01~04.jpg` 로 교체
- [ ] S-6 인사말 재작성 (가치 제안형)
- [ ] S-8 섹션 라벨 비즈니스 어휘로, `guestbook` → `사전 질문 / Q&A`
- [ ] S-9 `contact` 추가

**코드**

- [ ] S-7 커버 variant 의 회색 블롭 제거
- [ ] [00-common.md](00-common.md) 배치 1
- [ ] (배치 4) 연사 모듈 스키마 — `profile` 3~4명 변형 또는 신규 `speaker` 타입

**이미지**

- [ ] `gallery/01~04.jpg` 지난 회차 현장 4장
- [ ] 연사 프로필 3~4장
- [ ] 커버 재생성 (블롭 제거)
