#!/bin/bash

# OpenDay V3 배포 스크립트
# 사용법: ./deploy.sh [dev|stg|prod]

ENV=$1

SSH_KEY="$HOME/.ssh/ghmate_server"
SSH_USER="ghmate"
SSH_HOST="ghmate.iptime.org"
SSH_PORT="222"
REMOTE_DIR="/srv/projects/openday"

if [[ -z "$ENV" ]]; then
    echo "사용법: ./deploy.sh [dev|stg|prod]"
    exit 1
fi

case $ENV in
    dev)
        COMPOSE_FILE="docker-compose.dev.yml"
        PROJECT_NAME="openday_dev"
        DOMAIN="dev-openday.ghmate.com"
        ENV_FILE=".env.dev"
        ;;
    stg)
        COMPOSE_FILE="docker-compose.stg.yml"
        PROJECT_NAME="openday_stg"
        DOMAIN="stg-openday.ghmate.com"
        ENV_FILE=".env.stg"
        ;;
    prod)
        COMPOSE_FILE="docker-compose.yml"
        PROJECT_NAME="openday_prod"
        DOMAIN="openday.ghmate.com"
        ENV_FILE=".env"
        ;;
    *)
        echo "잘못된 환경: $ENV (dev, stg, prod 중 하나를 입력하세요)"
        exit 1
        ;;
esac

echo ">>> [$ENV] 배포를 시작합니다..."

# --env-file 을 명시해야 docker compose 의 \${VAR} 치환이 해당 .env 파일에서 동작한다.
# (compose 의 build.args 에서 NEXT_PUBLIC_* 같은 빌드 타임 인라인 변수에 필수)
ssh -i "$SSH_KEY" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "
    set -e
    cd ${REMOTE_DIR}
    echo '>>> git pull...'
    git pull
    echo '>>> docker build & up...'
    docker compose -p ${PROJECT_NAME} --env-file ${ENV_FILE} -f ${COMPOSE_FILE} up --build -d nextjs
    echo '>>> nginx reload...'
    docker exec nginx_proxy nginx -s reload
"

if [ $? -eq 0 ]; then
    echo ">>> [$ENV] 배포 완료! → https://${DOMAIN}"
else
    echo ">>> [에러] 배포 실패. SSH 접속 및 서버 상태를 확인하세요."
    exit 1
fi
