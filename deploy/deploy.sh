#!/usr/bin/env bash
set -eu

: "${IMAGE:?IMAGE is required}"
: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
: "${CONFIG:?CONFIG is required}"

cleanup() {
  rm -f "${CONFIG}"
}

rollback() {
  status=$?
  trap - ERR
  docker tag "${previous_image}" librechat-local:latest
  cd "${DEPLOY_DIR}"
  docker compose up -d --no-deps api
  exit "${status}"
}

trap cleanup EXIT
previous_image="$(docker inspect LibreChat --format '{{.Image}}')"
trap rollback ERR

docker tag "${IMAGE}" librechat-local:latest
install -m 0644 "${CONFIG}" "${DEPLOY_DIR}/librechat.yaml"
cd "${DEPLOY_DIR}"
docker compose up -d --no-deps api

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3080/ >/dev/null; then
    trap - ERR
    docker compose ps api
    exit 0
  fi
  sleep 2
done

docker compose logs --tail=100 api
false
