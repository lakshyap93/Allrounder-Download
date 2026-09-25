FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DENO_INSTALL=/usr/local \
    DENO_PATH=/usr/local/bin/deno \
    YTDLP_PATH=/usr/local/bin/yt-dlp \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    YTDLP_FORCE_IPV4=true \
    TEMP_DIR=/tmp/allrounder-media

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl ffmpeg python3 python3-pip unzip \
    && python3 -m pip install --break-system-packages --no-cache-dir yt-dlp \
    && curl -fsSL https://deno.land/install.sh | sh \
    && mkdir -p /tmp/allrounder-media \
    && chown node:node /tmp/allrounder-media \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci --include=dev

COPY --chown=node:node . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
