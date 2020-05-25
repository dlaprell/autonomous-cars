FROM node:14.2-buster-slim

COPY server/node /app

RUN (cd /app && yarn install --production --frozen-lockfile && yarn cache clean --all)

VOLUME [ "/app/data" ]

ENV PORT=8080
EXPOSE 8080

USER node

WORKDIR /app
CMD node .