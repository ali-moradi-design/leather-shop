# Welt & Grain storefront. Build from the repository root. Prerendering reads the
# catalog, so the API must be reachable while building:
#   docker build -f apps/web/Dockerfile --network host \
#     --build-arg API_URL=http://127.0.0.1:4000 --build-arg SITE_URL=https://shop.example.com \
#     -t weltandgrain-web .
# The `local` target (used by the root compose.yaml) builds when the container starts,
# once the API is up, instead.
FROM node:24-bookworm-slim AS deps
WORKDIR /repo
RUN npm install -g pnpm@12.15.0
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @wg/web
COPY apps/web apps/web

FROM deps AS local
ENV NEXT_TELEMETRY_DISABLED=1 PATH=/repo/apps/web/node_modules/.bin:$PATH
RUN chown -R node:node apps/web
USER node
WORKDIR /repo/apps/web
EXPOSE 3000
# build once per container (needs the API), then serve
CMD ["sh", "-c", "[ -f .next/BUILD_ID ] || next build && exec next start -H 0.0.0.0 -p 3000"]

FROM deps AS build
ARG API_URL=http://127.0.0.1:4000
ARG SITE_URL=http://localhost:3000
ENV API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$SITE_URL NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @wg/web build

FROM node:24-bookworm-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
