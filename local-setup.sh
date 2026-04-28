#!/bin/bash
# openday 로컬 개발환경 자동 세팅 스크립트
set -e

CMUX=/Applications/cmux.app/Contents/Resources/bin/cmux
SERVICE_DIR="/Users/whrksp126/other/project/openday/openday_service"

# ─────────────────────────────────────────
# 0. Claude 터미널 정보 저장 (포커스 복귀용)
# ─────────────────────────────────────────
CALLER_INFO=$($CMUX identify 2>/dev/null)
CLAUDE_SURFACE=$(echo "$CALLER_INFO" | grep -A10 '"caller"' | grep '"surface_ref"' | head -1 | grep -o 'surface:[0-9]*')
CLAUDE_PANE=$(echo "$CALLER_INFO" | grep -A10 '"caller"' | grep '"pane_ref"' | head -1 | grep -o 'pane:[0-9]*')
WS=$(echo "$CALLER_INFO" | grep -A10 '"caller"' | grep '"workspace_ref"' | head -1 | grep -o 'workspace:[0-9]*')

if [ -z "$CLAUDE_SURFACE" ] || [ -z "$WS" ]; then
  echo "[ERROR] Claude 터미널 정보를 가져올 수 없습니다."
  exit 1
fi
echo "[0/5] Claude 터미널: $CLAUDE_SURFACE (pane: $CLAUDE_PANE, ws: $WS)"

# ─────────────────────────────────────────
# 1. 내부 IP 확인
# ─────────────────────────────────────────
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "[ERROR] IP를 가져올 수 없습니다. Wi-Fi 연결을 확인하세요."
  exit 1
fi
echo "[1/5] 내부 IP: $IP"

# ─────────────────────────────────────────
# 2. .env.local 파일 IP 업데이트
# ─────────────────────────────────────────
update_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

update_env "$SERVICE_DIR/.env.local" "NEXTAUTH_URL"        "http://$IP:5410"
update_env "$SERVICE_DIR/.env.local" "NEXT_PUBLIC_APP_URL" "http://$IP:5410"

echo "[2/5] .env.local 업데이트 완료 (NEXTAUTH_URL, NEXT_PUBLIC_APP_URL → http://$IP:5410)"

# ─────────────────────────────────────────
# 3. Docker Compose 재시작
# ─────────────────────────────────────────
echo "[3/5] Docker 컨테이너 재시작 중..."
cd "$SERVICE_DIR"
docker compose -f docker-compose.local.yml down
docker compose -f docker-compose.local.yml up --build -d
echo "[3/5] Docker 컨테이너 시작 완료"

# ─────────────────────────────────────────
# 4. 기존 레이아웃 정리 (Claude pane 제외)
# ─────────────────────────────────────────
echo "[4/5] 기존 레이아웃 정리 중..."
PANE_REFS=$($CMUX list-panes --workspace $WS 2>/dev/null | grep -o 'pane:[0-9]*' || true)
for pane in $PANE_REFS; do
  if [ "$pane" != "$CLAUDE_PANE" ]; then
    SURF_REFS=$($CMUX list-pane-surfaces --workspace $WS --pane $pane 2>/dev/null | grep -o 'surface:[0-9]*' || true)
    for surface in $SURF_REFS; do
      $CMUX close-surface --surface $surface --workspace $WS 2>/dev/null || true
    done
  fi
done
sleep 0.5

# ─────────────────────────────────────────
# 5. 분할 레이아웃 생성
# ─────────────────────────────────────────
# +──────────────── Claude Code ─────────────────+
# +──── nextjs ────+──── mysql ────+──── nginx ──+

r=$($CMUX new-split down --workspace $WS --surface $CLAUDE_SURFACE 2>&1)
row2_surface=$(echo $r | grep -o 'surface:[0-9]*')

$CMUX rename-tab --surface $row2_surface --workspace $WS "nextjs" 2>/dev/null || true
$CMUX send --surface $row2_surface --workspace $WS "docker logs -f openday_nextjs_local"
$CMUX send-key --surface $row2_surface --workspace $WS "Enter"

r=$($CMUX new-split right --workspace $WS --surface $row2_surface 2>&1)
mysql_surface=$(echo $r | grep -o 'surface:[0-9]*')
$CMUX rename-tab --surface $mysql_surface --workspace $WS "mysql" 2>/dev/null || true
$CMUX send --surface $mysql_surface --workspace $WS "docker logs -f openday_mysql_local"
$CMUX send-key --surface $mysql_surface --workspace $WS "Enter"

r=$($CMUX new-split right --workspace $WS --surface $mysql_surface 2>&1)
nginx_surface=$(echo $r | grep -o 'surface:[0-9]*')
$CMUX rename-tab --surface $nginx_surface --workspace $WS "nginx" 2>/dev/null || true
$CMUX send --surface $nginx_surface --workspace $WS "docker logs -f openday_nginx_local"
$CMUX send-key --surface $nginx_surface --workspace $WS "Enter"

echo "[5/5] 레이아웃 생성 완료"

# ─────────────────────────────────────────
# 6. Claude 터미널로 포커스 복귀
# ─────────────────────────────────────────
$CMUX focus-pane --pane $CLAUDE_PANE --workspace $WS 2>/dev/null || true

echo ""
echo "OpenDay 로컬 개발환경 세팅 완료! (IP: $IP)"
echo "접속: http://$IP:5410"
