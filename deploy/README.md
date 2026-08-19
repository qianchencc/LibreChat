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

## Code Interpreter

Code Interpreter runs as a separate stack on the development host because it has the stronger CPU
and KVM support. The official `LibreChat-AI/code-interpreter` Compose file is combined with
`deploy/code-interpreter.compose.yml`; only its authenticated API is published on TCP 3112. The
sandbox runner uses libkrun/KVM with hardened mode and manifest-gated egress. Redis, MinIO, the
runner, file server, tool-call server, and egress gateway remain private to the Compose network.

Runtime secrets are stored in the Code Interpreter checkout's ignored `.env`. LibreChat stores the
matching Ed25519 signing key and `LIBRECHAT_CODE_BASEURL` in its production `.env`; no Code API
private key is present on the sandbox host.

Build and start it from the Code Interpreter checkout with the production override copied there:

```sh
docker buildx bake --builder librechat-builder --load --allow network.host \
  --set '*.network=host' \
  --set '*.args.HTTP_PROXY=http://127.0.0.1:17890' \
  --set '*.args.HTTPS_PROXY=http://127.0.0.1:17890' \
  -f docker-compose.yaml -f docker-compose.prod.yml
docker compose -f docker-compose.yaml -f docker-compose.prod.yml up -d --no-build
```
