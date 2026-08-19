# LibreChat deployment

Pushes to `main` use two self-hosted GitHub Actions runners:

1. `librechat-build` on the development host checks out the commit, builds the production
   image, and pushes `ghcr.io/qianchencc/librechat:<commit-sha>` to GHCR.
2. `librechat-prod` on the production host pulls that immutable image, tags it as
   `librechat-local:latest`, and recreates only the `api` service.
3. The deployment job checks `http://127.0.0.1:3080/`. On failure it restores the previous
   image and recreates the service again.

Runtime configuration and data stay on the production host. `.env` contains secrets and is not
committed; MongoDB, Meilisearch, PostgreSQL, uploads, images, logs, and LibreChat data use the
existing bind mounts and Docker volumes.

For interactive development on the development host, run the backend and Vite watcher from the
source checkout. Those processes are development-only; production always runs the image built by
GitHub Actions.
