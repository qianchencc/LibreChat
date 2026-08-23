#!/usr/bin/env bash
set -eu

: "${IMAGE:?IMAGE is required}"
: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
: "${CONFIG:?CONFIG is required}"
: "${SKILLS_ARCHIVE:?SKILLS_ARCHIVE is required}"

skills_dir="${DEPLOY_DIR}/skill"
skills_stage="$(mktemp -d "${DEPLOY_DIR}/.skill-stage.XXXXXX")"
skills_backup=""
skills_replaced=false

cleanup() {
  rm -f "${CONFIG}" "${SKILLS_ARCHIVE}"
  if [ -n "${skills_stage}" ]; then
    rm -rf "${skills_stage}"
  fi
  if [ -n "${skills_backup}" ]; then
    rm -rf "${skills_backup}"
  fi
}

rollback() {
  status=$?
  trap - ERR
  if [ -n "${skills_backup}" ]; then
    rm -rf "${skills_dir}"
    mv "${skills_backup}" "${skills_dir}"
    skills_backup=""
  elif [ "${skills_replaced}" = true ]; then
    rm -rf "${skills_dir}"
  fi
  docker tag "${previous_image}" librechat-local:latest
  cd "${DEPLOY_DIR}"
  docker compose up -d --no-deps api
  exit "${status}"
}

trap cleanup EXIT
previous_image="$(docker inspect LibreChat --format '{{.Image}}')"
trap rollback ERR

tar -xzf "${SKILLS_ARCHIVE}" -C "${skills_stage}"
if find "${skills_stage}" -type l -print -quit | grep -q .; then
  echo 'Deployment skills must not contain symbolic links' >&2
  false
fi

docker tag "${IMAGE}" librechat-local:latest
install -m 0644 "${CONFIG}" "${DEPLOY_DIR}/librechat.yaml"
if [ -e "${skills_dir}" ]; then
  skills_backup="$(mktemp -d "${DEPLOY_DIR}/.skill-backup.XXXXXX")"
  rmdir "${skills_backup}"
  mv "${skills_dir}" "${skills_backup}"
fi
mv "${skills_stage}" "${skills_dir}"
skills_stage=""
skills_replaced=true
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
