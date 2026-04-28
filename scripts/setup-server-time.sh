#!/usr/bin/env bash
# 홈서버 시간 동기화 영구 설정 (Ubuntu)
#
# 배경:
#   ghmate 홈서버는 ISP/공유기가 NTP(UDP 123)를 차단하기 때문에
#   chrony 가 외부 NTP 서버와 동기화하지 못한다. 그 결과 시계가
#   수 시간씩 어긋나면 OAuth(JWT exp 검증) 등이 전부 깨진다.
#
# 해결:
#   HTTPS 의 Date 헤더를 이용하는 htpdate 를 데몬으로 띄운다.
#   TCP 443 은 어떤 ISP 도 막지 않으므로 안정적으로 동작한다.
#
# 사용법 (서버에서 sudo 로 한 번만 실행):
#   sudo bash setup-server-time.sh
#
# 멱등성: 여러 번 실행해도 안전.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "[!] root 권한이 필요합니다. sudo bash $0 로 실행하세요." >&2
  exit 1
fi

echo "== 1. 현재 시각 확인 =="
date -u

echo
echo "== 2. HTTPS Date 헤더로 즉시 강제 동기화 =="
# 여러 도메인을 시도해서 첫 성공한 것 사용
for host in www.google.com www.cloudflare.com www.microsoft.com; do
  http_date=$(curl -sIL --max-time 5 "https://$host" 2>/dev/null | awk 'tolower($1)=="date:"{ $1=""; sub(/^ /,""); print; exit }' | tr -d '\r')
  if [[ -n "$http_date" ]]; then
    echo "  source: $host  -> $http_date"
    date -s "$http_date" >/dev/null
    break
  fi
done

echo
echo "== 3. RTC(하드웨어 시계)에 기록 =="
hwclock --systohc || true

echo
echo "== 4. htpdate 설치 =="
DEBIAN_FRONTEND=noninteractive apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y htpdate

echo
echo "== 5. htpdate 데몬 옵션 설정 =="
# Ubuntu 패키지의 데몬 옵션 파일
default_file=/etc/default/htpdate
if [[ -f "$default_file" ]]; then
  # 백업
  cp -n "$default_file" "${default_file}.orig" || true
  cat > "$default_file" <<'EOF'
# Managed by openday/scripts/setup-server-time.sh
# HTTPS Date 헤더로 시간 동기화 — UDP 123 NTP 차단 환경 대응
HTP_SERVERS="www.google.com www.cloudflare.com www.microsoft.com www.akamai.com"
# -D : 데몬 모드 (systemd unit 이 forking 으로 기대)
# -s : 시작 시 1회 즉시 동기화
# -P 443 : HTTPS 포트 사용
# -t : 큰 오차도 허용 (chrony 와 달리 임의 step 가능)
HTP_OPTIONS="-D -s -P 443 -t"
EOF
fi

# systemd 가 이미 데몬을 띄운 상태에서는 EnvironmentFile 변경이 반영되도록 재시작 필요
systemctl daemon-reload
systemctl restart htpdate || true

echo
echo "== 6. chrony 비활성화(중복 방지) + htpdate 활성화 =="
# chrony 가 살아있으면 둘이 시계 가지고 다툴 수 있다. 정지.
systemctl disable --now chrony 2>/dev/null || true
systemctl disable --now chronyd 2>/dev/null || true
systemctl disable --now systemd-timesyncd 2>/dev/null || true

systemctl enable --now htpdate

echo
echo "== 7. 결과 확인 =="
sleep 2
date -u
echo
systemctl status htpdate --no-pager 2>&1 | head -15
echo
echo "== 8. 서버 시각 vs 외부 HTTPS 시각 비교 =="
echo "  server   : $(date -u)"
echo "  google   : $(curl -sI --max-time 5 https://www.google.com | awk 'tolower($1)=="date:"{ $1=""; sub(/^ /,""); print }' | tr -d '\r')"

echo
echo "[OK] 시간 동기화 영구 설정 완료."
echo "    이후 docker 컨테이너 재시작이 필요한 서비스가 있다면 재시작하세요."
