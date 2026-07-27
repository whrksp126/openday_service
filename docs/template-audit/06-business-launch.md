# 06. 신제품 런칭 초대장

| 항목 | 값 |
|---|---|
| id | `business-launch-template-001` |
| 카테고리 | 비즈니스 · 런칭쇼 |
| 콘셉 | 크림 + 골드 세리프. `PRESTIGE COLLECTION LAUNCH` |
| 테마 | 크림 배경 + 골드 accent + 세리프 타이포 |
| 페이지 높이 | 3298px (4구간) |
| 캡처 | `_shots/business-launch-template-001__00~03.png` |

**모듈 구성 (8개)**
`main → greeting → datetime → venue → dday → gallery → tab(오시는 길) → guestbook`

---

## 이 템플릿의 핵심 진단

> 타이포그래피는 11개 중 가장 세련됐다. `06.15` 대형 세리프 숫자와 크림/골드 조합은 럭셔리 브랜드 런칭에 잘 맞는다.
> 문제는 **제품 사진과 문구**다. 6월 행사에 설산 배경 향수컷이 들어가 있고, 문구는 청첩장 어투다.

---

## P1 — 주요

### L-1. 6월 행사인데 제품컷 배경이 눈 덮인 설산

**현상.** 커버와 갤러리 모두 **눈 위에 놓인 향수병 + 배경에 눈 덮인 산맥**. 행사일은 `2026. 06. 15.` 이다.

**왜 문제인가.** 런칭 초대장에서 제품 이미지는 **그 시즌 컬렉션의 무드를 규정**한다. 한여름 런칭에 겨울 비주얼을 쓰면 "재고 이미지를 돌려썼다"로 읽힌다. 브랜드 런칭 템플릿에서 이건 치명적인 인상이다.

**수정안.** 계절 중립 또는 초여름 무드의 제품컷으로 교체. (이미지 계획 참조)

또는 반대로 **행사 날짜를 겨울로 옮기고** 컬렉션명을 `WINTER COLLECTION` 으로 통일하는 방법도 있다. 다만 템플릿 사용자가 아무 때나 쓴다는 점을 고려하면 **계절 중립 이미지가 정답**이다.

### L-2. 문구가 청첩장 어투

**현상.**

> "오랜 시간 정성으로 빚어 온 새로운 컬렉션을 선보이는 자리에
> **가장 가까운 분들을 모십니다.**
> **빛나는 순간을 함께 나누어 주시기를 청합니다.**"

`가장 가까운 분들`, `빛나는 순간`, `~주시기를 청합니다` 는 전부 청첩장 관용구다. 브랜드가 프레스·바이어·VIP 고객에게 보내는 초대장의 어휘가 아니다.

**수정안.**

```
PRESTIGE 의 새로운 컬렉션을 처음 선보입니다.

3년의 개발과 열두 번의 시제품을 거쳐
완성된 열 가지 향을
가장 먼저 만나실 분들을 초대합니다.

당일 현장에서 전 라인 시향과
런칭 에디션 선구매가 가능합니다.
```

핵심 — **무엇을 볼 수 있고 무엇을 할 수 있는지**를 명시. 런칭쇼 초대장은 "오면 이걸 얻는다"가 설득 장치다.

### L-3. 인사말 서명이 "신랑 · 신부"

→ [00-common.md C-1](00-common.md)

```ts
greetingAuthor: 'PRESTIGE',
```

### L-4. D+40 — 이미 지난 행사

`eventDate: 2026-06-15`, 오늘 2026-07-25. → [00-common.md C-7](00-common.md)

### L-5. 갤러리가 커버와 완전히 같은 사진

**현상.** `갤러리 / Gallery` 에 커버의 향수 사진이 **더 크게 한 번 더** 나온다. `launchGallery = [main_img.png]`.

**왜 문제인가.** 스크롤을 내렸는데 방금 본 사진이 또 나오면 "볼 게 없다"는 신호다. 런칭쇼 초대장의 갤러리는 **제품 디테일 · 패키지 · 캠페인 컷**을 보여주는 자리다.

**수정안.** 4장으로 교체 — 제품 정면 / 디테일 클로즈업 / 패키지 · 박스 / 캠페인 무드컷.

### L-6. 커버의 제품 사진이 너무 작다

**현상.** `06.15` 대형 숫자 아래, `PRESTIGE COLLECTION LAUNCH` 아래에 **작은 정사각 썸네일**로 제품이 들어간다. 화면 폭의 40% 정도다.

**왜 문제인가.** 제품 런칭 초대장에서 **제품이 주인공**이어야 하는데 지금은 날짜가 주인공이다.

**수정안.** 두 가지 중 선택.

- **(A)** 제품 이미지를 **풀블리드 히어로**로 올리고 텍스트를 오버레이 (VIP 나이트 방식)
- **(B)** 제품 이미지를 최소 화면 폭 80%로 키우고 여백을 재조정

브랜드 런칭 톤에서는 **(A)** 가 강하다.

### L-7. RSVP · 문의처 없음

**현상.** 참가 신청도, 문의처도 없다.

**왜 문제인가.** 런칭쇼는 **초대 인원이 통제되는 행사**다(좌석, 웰컴 기프트, 시향 키트 수량). RSVP 가 없으면 초대장으로서 기능하지 않는다. 프레스 초대라면 매체명·기자명 수집도 필요하다.

**수정안.**

```ts
{ id: 'launch-rsvp-1', type: 'rsvp', order: 8, config: {
    koreanTitle: '참석 회신', englishTitle: 'RSVP',
}},
{ id: 'launch-contact-1', type: 'contact', order: 10, config: {
    koreanTitle: '문의', englishTitle: 'Contact',
    groups: [{ label: '브랜드 커뮤니케이션', contacts: [{ name: 'PRESTIGE PR', phone: '010-0000-0000' }] }],
}},
```

### L-8. 지도가 웨딩홀 밀집 지역을 가리킨다

**현상.** 지도에 **`VIP웨딩홀`**, **`더채플앳청담`** 이 크게 표시된다. 향수 런칭 초대장에서 화면에 "웨딩홀"이 두 개 보인다.

**수정안.** `venue.lat/lng` 를 청담 플래그십 상권(도산대로/압구정로데오 쪽)으로 조정해 주변 POI 가 리테일/패션 브랜드로 잡히게 한다. 또는 다크/모노 지도 스타일로 POI 이름의 시각적 비중을 낮춘다(→ [00-common.md C-5](00-common.md)).

---

## P2 — 개선

### L-9. 라벨을 브랜드 어휘로

| 현재 | 제안 |
|---|---|
| `인사말` / `Invitation` | `초대의 말` / `Welcome` |
| `행사 일시` / `Event Day` | `일시` / `Date` |
| `행사 장소` / `Location` | `장소` / `Venue` |
| `갤러리` / `Gallery` | `컬렉션 미리보기` / `Preview` |
| `안내` / `Information` | `안내` / `Details` |
| `방명록` / `Guestbook` | `메시지` / `Message` |

### L-10. 드레스코드 · 프로그램 정보 없음

현재 tab 은 `지하철 / 버스 / 발레파킹` 3개로 **전부 교통 정보**다. 런칭쇼에서 궁금한 건 그것만이 아니다.

| 탭 | 내용 |
|---|---|
| 프로그램 | `19:30 리셉션 / 20:00 프레젠테이션 / 20:30 시향 & 네트워킹` |
| 드레스 코드 | `Smart Casual` |
| 웰컴 기프트 | 참석자 전원 미니어처 세트 증정 |
| 오시는 길 | 현재 내용 |
| 발레파킹 | 현재 내용 |

### L-11. 캘린더 주말색 / 상세주소 / 줄간격

→ [00-common.md C-13, C-9, C-12](00-common.md)
`청담 플래그십 라운지` 만 표시되고 주소가 안 보인다.

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 (설산 향수컷) | **교체** — 계절 불일치 |
| gallery | 1 (= 커버) | **교체** — 4장으로 |

### 공통 사양

1:1(제품컷) / 4:5(무드컷), 1600px 이상.
**공통 룩**: 크림 · 샴페인 골드 · 웜 베이지. 계절 중립 스튜디오 세팅(대리석, 실크, 유리, 부드러운 그림자). 눈·크리스마스·단풍 등 **계절 단서 금지**. 저채도, 소프트 하이키.

#### 커버 히어로 (풀블리드, 9:16)

```
Luxury perfume bottle with a gold cap standing on a polished cream marble
surface, soft draped ivory silk in the background, warm champagne studio
lighting from the side casting a long soft shadow, minimal seasonless setting,
no snow, no seasonal props, large empty space at the top for overlaid text,
high-end product advertising photography, muted cream and gold color grade,
vertical 9:16 composition
```

#### gallery 01~04

| # | 내용 |
|---|---|
| 01 | 제품 정면 — 크림 배경, 미니멀 |
| 02 | 캡·각인 디테일 클로즈업 |
| 03 | 패키지 박스 + 리본 |
| 04 | 원료 무드컷 (플로럴/우드, 향의 노트 암시) |

```
(02)
Extreme close-up of the polished gold cap and engraved glass shoulder of a
luxury perfume bottle, water-clear glass refracting warm light, cream and
champagne tones, shallow depth of field, soft studio lighting, high-end product
detail photography, seasonless minimal setting, square 1:1 composition
```

```
(04)
Flat lay of perfume ingredients on a cream linen surface, white jasmine petals,
a piece of sandalwood, dried citrus peel and a few vanilla pods, arranged
minimally with generous negative space, soft diffused daylight, muted cream and
warm beige color grade, editorial still life photography, vertical 4:5
composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `BUSINESS_LAUNCH_TEMPLATE`)**

- [ ] L-2 인사말 재작성 (브랜드 어투 · 가치 제안형)
- [ ] L-3 `greetingAuthor: 'PRESTIGE'`
- [ ] L-4 `eventDate` 상대 날짜화 (오늘 +40일 권장)
- [ ] L-5 `launchGallery` 를 4장으로 교체
- [ ] L-7 `rsvp` · `contact` 모듈 추가
- [ ] L-8 `venue.lat/lng` 조정
- [ ] L-9 섹션 라벨 브랜드 어휘로
- [ ] L-10 tab 에 프로그램 · 드레스 코드 · 웰컴 기프트 추가

**코드**

- [ ] L-6 커버 제품 이미지 풀블리드 히어로 변형
- [ ] [00-common.md](00-common.md) 배치 1

**이미지**

- [ ] 커버 히어로 1장 (계절 중립)
- [ ] `gallery/01~04.jpg` 4장
