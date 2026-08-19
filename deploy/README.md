# LibreChat deployment

Pushes to `main` use two self-hosted GitHub Actions runners:

1. `librechat-build` on the development host checks out the commit, builds the production
   image, and writes an immutable zstd-compressed image tar named with the commit SHA.
2. `librechat-prod` on the production host streams that tar over the existing LAN SSH
   connection, loads it into Docker, tags it as `librechat-local:latest`, and recreates only
   the `api` service. The temporary tar is deleted after deployment.
3. The deployment job checks `http://127.0.0.1:3080/`. On failure it restores the previous
   image and recreates the service again.

Runtime configuration and data stay on the production host. `.env` contains secrets and is not
committed; MongoDB, Meilisearch, PostgreSQL, uploads, images, logs, and LibreChat data use the
existing bind mounts and Docker volumes.

For interactive development on the development host, run the backend and Vite watcher from the
source checkout. Those processes are development-only; production always runs the image built by
GitHub Actions.
