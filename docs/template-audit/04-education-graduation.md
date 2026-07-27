# 04. 졸업식 초대장

| 항목 | 값 |
|---|---|
| id | `education-graduation-template-001` |
| 카테고리 | 교육/기관 · 졸업식 |
| 콘셉 | 네이비 + 그리드 페이퍼. 대학 학위수여식 |
| 테마 | 화이트 배경 + 그리드 bgEffect + 네이비 accent |
| 페이지 높이 | 3535px (5구간) |
| 캡처 | `_shots/education-graduation-template-001__00~04.png` |

**모듈 구성 (10개)**
`main → greeting → datetime → venue → dday → tab(식순·안내) → gallery → rsvp → contact → guestbook`

---

## 이 템플릿의 핵심 진단

> 톤은 잘 잡혀 있다. 네이비 + 그리드 페이퍼는 학사 행사에 정확히 맞는다.
> 다만 **누가 졸업하는지가 없다.** 그리고 커버 이미지에 `2024` 가 각인돼 있는데 행사는 2027년이다.

---

## P1 — 주요

### G-1. 졸업생 이름 · 학교 · 학과가 없다

**현상.**

- 커버: `GRADUATION` / `2027` / `학위수여식` / 날짜 / `한빛대학교 대강당`
- 인사말: `졸업식에 초대합니다` — "뜻깊은 배움의 여정을 마치고…"

**어디에도 졸업생이 누구인지 없다.** 대학 이름은 있지만 학과·이름이 없다.

**왜 문제인가.** 졸업식 초대장은 **개인이 가족·친지에게 보내는 것**이다(기관이 보내는 것이라면 RSVP 와 방명록의 성격이 달라진다). 받는 사람은 "누구 졸업식이지?"를 먼저 알아야 한다.

**수정안.**

```ts
textSlots: {
  topText: 'GRADUATION',
  brandTitle: '2027 학위수여식',
  subText: '한빛대학교 경영학과 김서준',      // 신설
  bottomText: '2027. 02. 05. (금) AM 10:00',
}
```

인사말에도 `졸업생 김서준 드림` 또는 `김서준 · 가족 일동` 서명을 넣는다.

> 만약 **기관 발송용**(학교가 학부모 전체에게 보내는) 포지션이라면, 반대로 **학과/단과대 명과 주최 기관명**을 명시해야 한다. 어느 쪽인지 결정이 먼저다.

### G-2. 커버 이미지에 `2024` 각인 — 행사는 2027년

**현상.** 커버 학사모 술(tassel)에 달린 연도 참에 **`2024`** 가 선명하게 보인다. 바로 아래 텍스트는 `2027`.

**수정안.** 연도 숫자가 없는 학사모 이미지로 재생성. (이미지 계획 참조)

### G-3. 커버에 장식용 `✦` 스파클이 떠 있다

**현상.** 커버 사진 우하단에 회색 다이아몬드형 스파클 장식.

**왜 문제인가.** 학위수여식이라는 격식 있는 행사에 어울리지 않고, 사진 위에 떠 있어 이물감이 있다. 같은 장식이 **전시회 · 부고 커버에도** 쓰인다 — 특히 부고에서는 심각하다(→ 11번 문서).

**수정안.** `main` variant 의 장식 요소를 카테고리별로 제어. 교육/문화/부고는 장식 없음이 기본.

### G-4. 문의처 전화번호가 비어 죽은 버튼

`학사 지원팀` 카드의 통화/문자 아이콘이 회색 비활성. → [00-common.md C-10](00-common.md)

### G-5. 식순 정보가 한 줄로 압축돼 있다

**현상.** `식순` 탭 내용: `개식 · 국민의례 · 학위수여 · 축사 · 학위기 수여 · 폐식`

**왜 문제인가.** 시각 정보가 없다. 참석자가 실제로 알고 싶은 건 **"몇 시에 가야 우리 애 순서를 볼 수 있나"** 다. 학위수여식은 보통 1~2시간이라 늦게 오면 놓친다.

**수정안.** 시각을 붙인 목록으로.

```
09:30  개식 · 입장
10:00  국민의례 · 학사보고
10:15  학위수여 (학사 → 석사 → 박사)
10:50  총장 축사 · 재학생 송사
11:10  학위기 수여 · 기념 촬영
11:30  폐식
```

`timeline` 모듈로 옮기면 시각적으로도 훨씬 낫다.

### G-6. 졸업식 필수 정보가 빠져 있다

받는 사람(가족·친지) 입장에서 반드시 필요한데 없는 것:

| 항목 | 왜 필요한가 |
|---|---|
| **좌석 / 입장 안내** | 가족석이 따로 있는지, 티켓이 필요한지 |
| **꽃다발 · 화환** | 반입 가능 여부, 학교 안 판매처 |
| **사진 촬영 장소** | 졸업식 후 어디서 모이는지 (실제로 가장 많이 묻는 것) |
| **주차** | 현재 탭에 있음 — 유지 |
| **식사** | 졸업식 후 가족 식사 장소 |

**수정안.** `tab` 을 `식순 / 좌석·입장 / 사진 촬영 / 주차 / 오시는 길` 로 확장.

---

## P2 — 개선

### G-7. 라벨을 학사 어휘로

| 현재 | 제안 |
|---|---|
| `행사 일시` / `Event Day` | `학위수여식 일시` / `Ceremony` |
| `행사 장소` / `Location` | `식장` / `Venue` |
| `인사말` / `Invitation` | `초대의 글` / `Greeting` |
| `축하 방명록` | 유지 — 좋다 |

→ [00-common.md C-6](00-common.md)

### G-8. 캘린더 주말 빨강/파랑

네이비 모노톤 테마에서 유일하게 튀는 색. → [00-common.md C-13](00-common.md)

### G-9. 장소 상세주소 미노출

`한빛대학교 대강당` 만 표시. 대학 캠퍼스는 넓어서 **건물명 + 주소 + "정문에서 도보 n분"** 이 특히 중요하다. → [00-common.md C-9](00-common.md)

---

## 이미지 애셋 교체 계획

### 현재 상태

| 용도 | 개수 | 상태 |
|---|---|---|
| 커버 | 1 | 구도·톤 좋음. **`2024` 각인 때문에 교체 필요** |
| gallery | 4 | 내용 확인 필요 — 학사모/캠퍼스 계열로 통일되어야 함 |

### 공통 사양

4:5 세로(갤러리) / 3:2(커버), 1600px 이상.
**공통 룩**: 네이비 · 아이보리 · 원목. 자연광, 차분한 저채도, 격식 있는 학사 분위기. 인물은 얼굴 노출 최소(뒷모습·손·소품 중심)로 두면 어떤 사용자에게나 맞는다.

#### 커버 (재생성)

```
Still life of a black academic graduation cap with a navy and gold tassel
placed next to a rolled diploma tied with a navy ribbon, on a light oak wooden
desk, a globe and stacked books softly out of focus in the background, bright
natural window light from the left, calm and formal mood, muted navy and ivory
color grade, no text, no numbers, no year charm on the tassel, editorial still
life photography, horizontal 3:2 composition
```

> 핵심 지시어: `no text, no numbers, no year charm on the tassel` — G-2 를 직접 겨냥.

#### gallery 01~04

| # | 내용 |
|---|---|
| 01 | 대강당 좌석 전경 (행사 전, 인물 없음) |
| 02 | 학위복을 입은 졸업생들의 **뒷모습** 줄 |
| 03 | 학사모를 던지는 순간 (실루엣, 하늘 배경) |
| 04 | 꽃다발과 졸업장을 든 **손** 클로즈업 |

```
(02)
Rear view of a row of university graduates in black academic gowns and caps
with navy tassels, seated in a large auditorium, faces not visible, soft warm
stage light in the far background, shallow depth of field, calm formal mood,
muted navy and ivory color grade, documentary photography, vertical 4:5
composition
```

```
(04)
Close-up of hands holding a rolled diploma with a navy ribbon and a small
bouquet of white and cream flowers, black academic gown sleeve visible, soft
outdoor natural light, blurred campus building in the background, faces not
visible, muted navy and ivory color grade, editorial detail shot, vertical 4:5
composition
```

---

## 작업 체크리스트

**결정 필요**

- [ ] G-1 개인 발송용 vs 기관 발송용 — 포지션 결정

**seed (`prisma/seed.ts` — `GRADUATION_TEMPLATE`)**

- [ ] G-1 커버 `subText` 에 학교·학과·이름, `greetingAuthor` 추가
- [ ] G-4 `contact` 전화번호 채우기
- [ ] G-5 식순에 시각 추가 (또는 `timeline` 모듈로 전환)
- [ ] G-6 `tab` 을 좌석·입장 / 사진 촬영 포함으로 확장
- [ ] G-7 섹션 라벨 학사 어휘로
- [ ] C-7 `eventDate` 상대 날짜화 (오늘 +120일 권장)

**코드**

- [ ] G-3 `main` 커버 장식(`✦`) 카테고리별 제어
- [ ] [00-common.md](00-common.md) 배치 1

**이미지**

- [ ] 커버 재생성 (연도 각인 제거)
- [ ] gallery 01~04 확인 후 필요 시 교체
