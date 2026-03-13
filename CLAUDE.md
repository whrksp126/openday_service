# CLAUDE.md — 모바일 청첩장 웹 서비스

## 프로젝트 개요

모바일 웹 기반 결혼식 청첩장 생성/공유 서비스.
사용자가 신랑/신부 정보, 예식장, 이미지 등을 입력하면 공유 가능한 모바일 청첩장 페이지가 생성된다.

- 저장소: https://github.com/whrksp126/web_wedding
- 운영 브랜치: `main`, 개발 브랜치: `develop`

---

## 기술 스택

### Backend
- Python 3.x + Flask 2.2.3
- SQLAlchemy 2.0.9 (ORM) + MySQL (mysqlclient 2.1.1)
- bcrypt 4.0.1 (비밀번호 암호화)
- Jinja2 3.1.2 (서버사이드 템플릿)
- Gunicorn (운영 서버)

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Cropper.js (이미지 크롭)
- Phosphor Icons (아이콘)

### 외부 API
- 네이버 지오코딩 API — 주소 → 위도/경도 변환
- 네이버 지도, 카카오 맵, T-map — 지도/네비게이션
- 카카오 API — 카카오톡 공유

---

## 프로젝트 구조

```
/
├── app/
│   ├── __init__.py          # Flask 앱 생성 + 모든 라우팅 (447줄)
│   ├── config.py            # DB 접속 정보, API 키 (git 제외 권장)
│   ├── models.py            # SQLAlchemy ORM 모델 (235줄)
│   ├── views/
│   │   ├── index.py         # 네이버 지오코딩 함수
│   │   └── template_dummy*.py  # 샘플 더미 데이터
│   ├── templates/           # Jinja2 HTML 템플릿
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── login.html / register.html
│   │   ├── create.html      # 청첩장 생성 페이지
│   │   ├── invitation.html  # 청첩장 조회 페이지
│   │   └── pop_up.html      # 팝업 모달 (develop 브랜치)
│   ├── static/
│   │   ├── css/             # reset, common, create, invitation, animation 등
│   │   └── js/              # common, login, register, create, invitation, animation
│   └── images/              # 업로드된 사용자 이미지 저장 경로
├── gunicorn.config.tcp.py   # TCP 모드 설정 (0.0.0.0:5000)
├── gunicorn.config.socket.py  # Unix Socket 모드 설정 (/tmp/app.sock)
└── requirements.txt
```

---

## 실행 방법

```bash
# 패키지 설치
pip install -r requirements.txt

# 개발 서버 (TCP)
gunicorn -c gunicorn.config.tcp.py app:create_app

# 운영 서버 (Nginx 역프록시 + Unix Socket)
gunicorn -c gunicorn.config.socket.py app:create_app
```

로그 위치: `./gunicorn_log/errorlog.txt`, `./gunicorn_log/accesslog.txt`

---

## 데이터베이스 스키마 (주요 테이블)

| 테이블 | 설명 |
|--------|------|
| `User` | 회원 정보 (id, user_id, user_pw, email, guestbook_pw) |
| `Template` | 청첩장 템플릿 종류 |
| `UserHasTemplate` | 사용자-템플릿 매핑 (usertemplate_id) |
| `Information` | 신랑/신부/부모 이름·전화번호 + relation_id |
| `Weddinghall` | 예식장 이름, 주소, 날짜, 시간, 좌표(lat/lng) |
| `Account` | 계좌번호 (은행, 번호, 예금주) |
| `Guestbook` | 방명록 (작성자, 비밀번호, 내용, 시간) |
| `Transportation` | 대중교통/자가용 안내 (HTML 형식) |
| `Picture` | 이미지 경로 + 타입 (메인/서브/갤러리) |
| `Textlist` | 모시는 글 등 텍스트 콘텐츠 |

`relation_id`: 1=신랑, 2=신부, 3=신랑父, 4=신부父, 5=신랑母, 6=신부母

---

## 라우팅

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 메인 페이지 |
| GET/POST | `/login` | 로그인 |
| GET/POST | `/register` | 회원가입 |
| GET | `/logout` | 로그아웃 |
| GET/POST | `/create` | 청첩장 생성/편집 (세션 필요) |
| GET | `/invitation` | 청첩장 조회 (샘플 or 개인) |
| POST | `/set_guestbook` | 방명록 작성 |
| POST | `/delete_guestbook` | 방명록 삭제 (develop) |
| POST | `/search_geocoding` | 주소 → 좌표 변환 |

---

## 코드 컨벤션

### Python
- 변수/함수: `snake_case`
- 클래스: `PascalCase`
- 주석: 한글
- 들여쓰기: 4 spaces

### JavaScript
- 변수/함수: `camelCase`
- DOM: `document.querySelector()` 사용
- 데이터 전달: `data-*` 속성 활용

### CSS
- 클래스명: `lowercase-hyphen`
- 부분적 BEM 패턴 사용

---

## 주요 기능 구현 위치

- **이미지 크롭/업로드**: `static/js/create.js`, Cropper.js 활용
- **지오코딩**: `app/views/index.py` → `geocoding()` 함수
- **방명록 슬라이드**: `static/js/invitation.js`
- **계좌번호 복사**: `static/js/invitation.js`
- **카카오 공유**: `templates/invitation.html` 내 스크립트
- **세션 체크**: `app/__init__.py`의 `/create` 라우트

---

## 주의사항 및 알려진 이슈

### 보안
- `app/config.py`에 DB 계정, API 키 하드코딩 → 환경 변수(.env)로 분리 필요
- `SECRET_KEY = "hithere"` (너무 단순) → 강화 필요
- develop 브랜치의 `.gitignore`에는 `config.py` 제외되어 있으나 main에는 미적용

### 기능
- 현재 1인 1템플릿만 지원 (다중 템플릿은 develop에서 `usertemplate_id` 도입으로 개선 중)
- 청첩장 수정 기능 미구현
- 방명록 페이지네이션 미구현 (최근 3~5개만 표시)
- 이미지 저장 로직 일부 하드코딩

### DB
- main 브랜치: `heroworks.iptime.org:20233`, DB=`new_wedding`
- develop 브랜치: `58.126.10.31:33061`, DB=`wedding`

---

## 브랜치별 차이점

| 기능 | main | develop |
|------|------|---------|
| 방명록 삭제 | - | O |
| 팝업 모달 | - | O |
| usertemplate_id 스키마 | - | O |
| 카카오 공유 개선 | - | O |
| config.py gitignore | - | O |

---

## 미구현 / 향후 계획

- 청첩장 수정 기능
- 템플릿 다중 선택
- 회원 탈퇴
- 방명록 페이지네이션
- 모바일 앱 (방명록 알림 푸시)
- 소셜 로그인 (카카오, 네이버)
