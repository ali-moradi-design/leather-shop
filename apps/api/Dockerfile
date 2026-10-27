# Welt & Grain API. Build from the repository root:
#   docker build -f apps/api/Dockerfile -t weltandgrain-api .
FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN npm install -g pnpm@12.15.0
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @wg/api
COPY apps/api apps/api
RUN pnpm --filter @wg/api build \
 && pnpm --filter @wg/api deploy --prod --legacy /out \
 && cp -r apps/api/dist /out/dist

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
RUN mkdir -p uploads/products && chown -R node:node uploads
# never run as root
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
