# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm config set registry https://registry.npmjs.org/
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 변수는 빌드 시점에 클라이언트 번들에 인라인되므로
# build args 로 받아 ENV 로 옮겨야 한다. (env_file 은 런타임에만 적용)
ARG NEXT_PUBLIC_KAKAO_JS_KEY
ENV NEXT_PUBLIC_KAKAO_JS_KEY=$NEXT_PUBLIC_KAKAO_JS_KEY
ARG NEXT_PUBLIC_KAKAO_TEMPLATE_ID
ENV NEXT_PUBLIC_KAKAO_TEMPLATE_ID=$NEXT_PUBLIC_KAKAO_TEMPLATE_ID
ARG NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=$NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner (standalone)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + schema/migrations for runtime migrate deploy
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# prisma/seed.ts 가 참조하는 src/lib(asset-paths 등) — standalone 엔 src 가 없어 seed 시 필요
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# 업로드 디렉토리: docker named volume 이 처음 마운트될 때 이 디렉토리의 소유권/권한이 복사된다
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 5000
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
