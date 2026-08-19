# LibreChat deployment

Pushes to `main` use the `librechat-build` GitHub Actions runner on the development host:

1. The runner checks out the commit and builds `librechat-ci:<commit-sha>` with the dedicated
   `librechat-builder` BuildKit instance.
2. It streams the zstd-compressed Docker image directly over the LAN SSH connection to
   `admin@10.5.12.112:40022`; the image is never uploaded to GitHub or another registry.
3. It copies `librechat.yaml`, tags the loaded image as `librechat-local:latest`, and recreates
   only the production `api` service.
4. The deployment job checks `http://127.0.0.1:3080/`. On failure it restores the previous
   image and recreates the service again.

Runtime configuration and data stay on the production host. `.env` contains secrets and is not
committed; MongoDB, Meilisearch, PostgreSQL, uploads, images, logs, and LibreChat data use the
existing bind mounts and Docker volumes.

For interactive development on the development host, run the backend and Vite watcher from the
source checkout. Those processes are development-only; production always runs the image built by
GitHub Actions.
