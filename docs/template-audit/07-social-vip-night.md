# 07. VIP 나이트 초대장

| 항목 | 값 |
|---|---|
| id | `social-vip-night-template-001` |
| 카테고리 | 소셜/모임 · 정기모임 |
| 콘셉 | 깊은 네이비 + 골드의 다크 럭셔리. VIP 모임 / 네트워킹 디너 / 프라이빗 파티 |
| 테마 | bg `#142339` · accent `#d4af37` · spacing `#1d2e47` · bgEffect `none` |
| 페이지 높이 | 3228px (4구간) |
| 캡처 | `_shots/social-vip-night-template-001__00~03.png` |

**모듈 구성 (8개)**
`main(dark-invitation) → greeting → datetime → venue → dday → gallery → tab → guestbook`

---

## 이 템플릿의 핵심 진단

> 커버 한 장은 훌륭하다. **커버 아래부터 템플릿이 무너진다.**
> 다크 럭셔리를 약속해놓고, 스크롤을 내리면 흰 지도 · 흰 카드 · 흰 버튼 · 빈 갤러리가 이어진다.
> 받는 사람이 "이 초대장 뭔가 덜 만들었네" 라고 느끼는 지점이 명확하다.

---

## P0 — 치명

### V-1. 갤러리가 커버 이미지 1장 재탕 → 화면에 빈 박스로 보임

**현상.** `갤러리 / Gallery` 섹션에 **거의 새까만 직사각형**과 정체불명의 흰 세로줄 두 개만 보인다. 이미지가 깨진 것으로 오해할 수밖에 없다.

**원인.** `prisma/seed.ts:1021`

```ts
const vipNightGallery = [templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'main_img.png')]
```

갤러리 이미지가 **커버와 같은 파일 1장**이다. 그 커버 이미지는 어두운 네이비 추상 텍스처라서, `#142339` 배경 위에 놓이면 배경과 구분되지 않는다. 흰 세로줄은 grid 레이아웃의 셀 경계다.

이 문제는 **세미나 · 런칭 · 테니스 · 송년회에서도 동일**하게 반복된다 (5개 템플릿이 전부 `[main_img.png]` 1장). VIP 나이트만 배경색이 어두워서 "빈 박스"로 드러났을 뿐이다.

**수정안.** 갤러리를 **실제 정보가 있는 사진 4장**으로 교체한다. 이 템플릿의 갤러리는 "예쁜 사진"이 아니라 **"내가 갈 곳이 어떤 곳인지"** 를 알려주는 자리여야 한다.

| # | 무엇을 보여줄 것인가 | 왜 |
|---|---|---|
| 1 | 행사장 라운지 실내 전경 (야경 통창) | 받는 사람이 공간의 격을 가늠한다 |
| 2 | 세팅된 디너 테이블 / 바 카운터 | 드레스 코드와 격식 수준이 자동으로 전달된다 |
| 3 | 작년 같은 행사의 네트워킹 스냅 (실루엣/뒷모습) | "어떤 사람들이 오는 자리"인지가 가장 궁금한 정보 |
| 4 | 23F 창밖 서울 야경 | 커버의 "VIP NIGHT" 무드를 회수 |

레이아웃도 `grid` 1장은 의미가 없으므로 **2×2 grid** 로 둔다.

---

### V-2. 다크 테마를 흰색 요소들이 뚫는다

**현상.**

| 위치 | 상태 |
|---|---|
| 네이버지도 / 티맵 / 카카오맵 버튼 | **순백 카드 3개**가 네이비 위에 떠 있음 |
| 지도 | 네이버 기본 라이트 스킨, 컬러 POI 아이콘까지 그대로 |
| 방명록 샘플 카드 | **순백 카드** |
| "청첩장 주소 복사하기" 버튼 | `border-gray-200` / `text-gray-600` — 다크에서 거의 안 보임 |
| 섹션 구분선 | `border-gray-200` — 밝은 줄로 튐 |

**원인.** → [00-common.md C-4, C-5](00-common.md)

**수정안 (이 템플릿 관점).**

1. surface 토큰 도입 후, VIP 나이트에서는 카드가 `rgba(255,255,255,0.06)` + `rgba(255,255,255,0.14)` 보더로 렌더되게 한다.
2. 지도는 `themeConfig.mapStyle: 'dark'` 로 지정 → CSS 필터 다크화. 마커는 accent 골드(`#d4af37`) 핀으로 교체.
3. 지도 앱 버튼 3개는 **반투명 표면 + 골드 hairline 보더**. 브랜드 아이콘은 컬러 유지(식별 필요).
4. 하단 공유 버튼:
   - 카카오는 브랜드 규정상 노란색 유지가 원칙이지만, 이 템플릿에서는 **`#FAE100` 풀블리드가 화면 톤을 완전히 깬다.** → 카카오 로고 + 다크 배경 + 골드 테두리의 아웃라인 변형을 권장 (카카오 브랜드 가이드에서도 허용되는 변형 범위).
   - 주소 복사 버튼은 골드 아웃라인 + 골드 텍스트.

---

### V-3. 인사말 서명 "신랑 · 신부"

**현상.** VIP 나이트 인사말 끝에 `신랑 · 신부`.

**원인.** → [00-common.md C-1](00-common.md)

**수정안.** 코드 fallback 제거 + seed 에 서명 명시.

```ts
greetingAuthor: '호스트 드림',
```

---

## P1 — 주요

### V-4. 오시는 길 안내와 실제 주소가 다른 역을 가리킨다

**현상.**

| 출처 | 값 |
|---|---|
| `venue.address` | 서울특별시 강남구 **테헤란로 511** |
| `venue.lat/lng` | 37.5083 / 127.0635 → **삼성역** |
| 지도 화면 | 삼성역 · 글라스타워 · 섬유센터 |
| tab "오시는 길" | **"2호선 강남역 11번 출구 도보 5분"** |

테헤란로 511 은 삼성역 인근이다. **지도는 삼성역을 가리키는데 안내문은 강남역**이라고 한다. 받는 사람이 실제로 길을 잃는다.

**수정안.** 삼성역 기준으로 통일.

```ts
{ label: '오시는 길', content: '<p style="text-align: center">2호선 삼성역 4번 출구 도보 3분</p><p style="text-align: center">9호선 봉은사역 7번 출구 도보 8분</p>' }
```

---

### V-5. 커버와 인사말에 `INVITATION` 이 두 번

**현상.** 커버에 `INVITATION` (작은 라벨) + `VIP NIGHT`. 스크롤을 내리면 인사말 섹션에 `인사말` / **`Invitation`** / (희미한) `VIP NIGHT`.

같은 화면 흐름에서 `INVITATION` 2회, `VIP NIGHT` 2회가 반복된다.

**수정안.**

```ts
{ id: 'vip-greeting-1', type: 'greeting', order: 2, config: {
    koreanTitle: '초대의 말',
    englishTitle: 'Welcome',      // 'Invitation' 중복 제거
    titleBigVisible: false,       // 'VIP NIGHT' 중복 제거
}}
```

---

### V-6. 격식 있는 자리인데 참석 회신(RSVP)이 없다

**현상.** 모듈 8개 중 RSVP 가 없다.

**왜 문제인가.** VIP 나이트 · 프라이빗 디너는 **좌석/식사 수량이 정해진 행사**다. 초대장을 보내는 사람이 가장 필요한 것이 인원 파악이고, 받는 사람도 "가겠다"는 의사를 전할 수단이 필요하다. 방명록만으로는 대체되지 않는다.

**수정안.** `rsvp` 모듈을 tab 앞에 추가.

```ts
{ id: 'vip-rsvp-1', type: 'rsvp', order: 7, config: {
    koreanTitle: '참석 회신', englishTitle: 'RSVP',
    koreanLabelVisible: true, labelVisible: true,
}},
```

동반 1인 여부 · 식사 제한(알러지/비건) 항목까지 받을 수 있으면 이 카테고리에서는 특히 유용하다.

---

### V-7. 호스트가 누구인지 알 수 없다

**현상.** 초대장 어디에도 **주최자 / 문의처**가 없다. "특별한 인연으로 맺어진 분들을 모시고" 라고만 되어 있다.

**왜 문제인가.** 받는 사람 입장에서 **누가 부르는 자리인지**가 참석 결정의 1순위 정보다. 격식 있는 초대일수록 그렇다.

**수정안.** `contact` 모듈 추가.

```ts
{ id: 'vip-contact-1', type: 'contact', order: 9, config: {
    koreanTitle: '문의', englishTitle: 'Contact',
    groups: [{ label: '행사 문의', englishLabel: 'HOST',
      contacts: [{ name: '이벤트 운영팀', phone: '010-0000-0000' }] }],
}},
```

---

### V-8. 장소 상세주소 미노출

`강남 시그니처 라운지 23F` 만 보이고 `서울특별시 강남구 테헤란로 511` 은 화면에 없다. → [00-common.md C-9](00-common.md)

---

## P2 — 개선

### V-9. 캘린더 주말 빨강/파랑이 다크 럭셔리와 안 맞는다

일요일 빨강 · 토요일 파랑이 네이비/골드 팔레트를 깬다. → [00-common.md C-13](00-common.md)
VIP 나이트는 `weekendColors: null` + 행사일만 골드 원형 하이라이트가 적절하다 (현재 골드 원형은 이미 잘 되어 있다).

### V-10. tab "안내" 의 정보 밀도가 낮다

현재 드레스 코드 1줄, 오시는 길 1줄, 주차 1줄. 다크 럭셔리 톤에서 정보가 이렇게 얇으면 "성의 없음"으로 읽힌다.

**수정안 — 탭별 내용 보강**

| 탭 | 보강안 |
|---|---|
| 드레스 코드 | `Cocktail Attire` + 남성/여성 예시 한 줄씩 + "청바지·운동화는 삼가 주세요" |
| 프로그램 | **신설.** `19:00 리셉션 / 19:30 디너 / 20:30 네트워킹 / 22:00 마무리` |
| 오시는 길 | 삼성역·봉은사역 (V-4) |
| 주차 | `발레파킹 · 빌딩 지하 1~3층` + **주차 등록 방법** |

### V-11. D-day 라벨 `디데이 / D-day` 가 밋밋하다

이 템플릿 톤에서는 `Countdown` / `그날까지` 같은 표현이 낫다. 숫자(`D-63`)는 크기·골드 색상 모두 좋다.

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 파일 | 상태 |
|---|---|---|
| 커버 | `main_img.png` (94KB) | 유지 가능 — 다크 네이비 추상 텍스처, 커버로는 적절 |
| 갤러리 | `main_img.png` **재사용** | **교체 필수** |
| 썸네일 | `thumbnail.jpeg` | 정상 |

### 신규 생성 대상

`https://objectstore.ghmate.com/openday/templates/social-vip-night-template-001/gallery/01~04.jpg`

**공통 사양** — 4:5 세로, 1600×2000px 이상, JPEG q85. **전 컷 공통 룩**: 딥 네이비(#0e1b2e~#142339) 도미넌트, 골드/샴페인 하이라이트, 저채도, 시네마틱 낮은 키. 사람 얼굴은 식별되지 않게(실루엣·뒷모습·얕은 심도).

#### 01 — 라운지 실내 전경

```
Interior of an exclusive high-floor private lounge at night, deep navy blue
walls and dark walnut paneling, warm brushed-gold accent lighting, floor-to-
ceiling windows showing a blurred city skyline at night, low-key cinematic
lighting, moody and refined, no people, shot on 35mm, shallow depth of field,
muted desaturated palette dominated by deep navy and champagne gold,
editorial luxury hospitality photography, vertical 4:5 composition
```

#### 02 — 디너 테이블 / 바 세팅

```
Elegantly set private dining table in a dark navy lounge, black linen
tablecloth, gold-rimmed glassware and cutlery, low amber candlelight, small
white floral centerpiece, shallow depth of field with warm bokeh in the
background, no people, top-tier hospitality editorial photography, deep navy
and gold color grade, cinematic low-key lighting, vertical 4:5 composition
```

#### 03 — 네트워킹 스냅 (얼굴 식별 불가)

```
Backlit silhouettes of a small group of well-dressed adults holding champagne
glasses at an evening reception, faces not visible, rim lighting from warm
golden lamps, deep navy interior, soft haze in the air, motion-blurred
background, candid documentary feel, low-key cinematic color grade in navy
and gold, vertical 4:5 composition
```

#### 04 — 창밖 야경

```
View of a nighttime city skyline through a floor-to-ceiling window from a high
floor, warm amber window lights against deep navy blue sky, subtle reflection
of a dark interior on the glass, no people, quiet and refined mood, long
exposure feel, muted navy and gold color grade, vertical 4:5 composition
```

> **생성 후 확인할 것** — 4장이 나란히 놓였을 때 색온도가 튀지 않는지. 한 장이라도 밝거나 채도가 높으면 2×2 그리드에서 그 컷만 도드라진다.

### 선택 — 커버 개선안

현재 커버는 텍스트 가독성은 좋지만 **행사의 정체를 알려주지 않는다**(순수 추상 텍스처). 위 01번 라운지 컷을 어둡게 눌러 커버로 쓰면 "어디서 열리는 자리"가 첫 화면에서 전달된다. A/B 로 판단할 사안.

```
Extremely dark, low-contrast interior of a luxury high-floor lounge at night,
almost abstract, deep navy blue dominant with a single faint band of warm gold
light, heavy vignette, large areas of near-black negative space in the upper
and center region reserved for overlaid text, cinematic, no people,
vertical 9:16 composition
```

---

## 작업 체크리스트

**seed (`prisma/seed.ts` — `SOCIAL_VIP_NIGHT_TEMPLATE`)**

- [ ] V-1 `vipNightGallery` 를 `gallery/01~04.jpg` 4장으로 교체, `layout: 'grid'` 2×2 확인
- [ ] V-3 `greetingAuthor: '호스트 드림'` 추가
- [ ] V-4 tab '오시는 길' → 삼성역 기준으로 수정
- [ ] V-5 greeting `englishTitle: 'Welcome'`, `titleBigVisible: false`
- [ ] V-6 `rsvp` 모듈 추가 (order 7, 이후 order 재정렬)
- [ ] V-7 `contact` 모듈 추가 (order 9)
- [ ] V-10 tab 에 '프로그램' 탭 추가 + 각 탭 내용 보강
- [ ] V-11 dday `koreanTitle: '그날까지'`, `englishTitle: 'Countdown'`
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +50일 권장)

**코드**

- [ ] C-4 surface 토큰 (00-common)
- [ ] C-5 `NaverMap` 다크 + 골드 마커, `themeConfig.mapStyle: 'dark'`
- [ ] C-9 venue 주소 노출
- [ ] V-2 다크 템플릿용 카카오 버튼 변형

**이미지**

- [ ] `gallery/01.jpg` 라운지 전경
- [ ] `gallery/02.jpg` 디너 테이블
- [ ] `gallery/03.jpg` 네트워킹 실루엣
- [ ] `gallery/04.jpg` 창밖 야경
- [ ] (선택) 커버 재생성
