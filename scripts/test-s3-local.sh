#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_dir/deploy/s3-acceptance.compose.yml"
compose_project="librechat-s3-acceptance"

compose() {
  docker compose --project-name "$compose_project" --file "$compose_file" "$@"
}

cleanup() {
  compose down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
compose up --detach minio

for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:19010/minio/health/live >/dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent http://127.0.0.1:19010/minio/health/live >/dev/null

export AWS_ACCESS_KEY_ID=librechat-test
export AWS_SECRET_ACCESS_KEY=librechat-test-secret
export AWS_REGION=us-east-1
export AWS_ENDPOINT_URL=http://127.0.0.1:19010
export AWS_FORCE_PATH_STYLE=true
export AWS_BUCKET_NAME=librechat-test
export AWS_TEST_BUCKET_NAME=librechat-test

node -e 'const { S3Client, CreateBucketCommand } = require("@aws-sdk/client-s3"); const client = new S3Client({ region: process.env.AWS_REGION, endpoint: process.env.AWS_ENDPOINT_URL, forcePathStyle: true }); client.send(new CreateBucketCommand({ Bucket: process.env.AWS_TEST_BUCKET_NAME })).catch((error) => { console.error(error); process.exit(1); });'

cd "$repo_dir/packages/api"
npm run test:s3-integration
