# Image Provider 2.5 Handoff

## Scope

Keep OpenAI Image Tools on the existing custom-provider credential path while moving the 尘Proxy
image model from `gpt-image-2` to `gpt-image-2.5`.

## Root cause

Provider credential reuse was already implemented, but both the frontend readiness check and the
backend provider resolver required the exact model name `gpt-image-2`. After the gateway removed
that model and advertised `gpt-image-2.5`, the frontend marked Image Tools as needing standalone
setup and the backend omitted the provider-selected image model.

## Behavior

- `librechat.yaml` advertises `gpt-image-2.5` for 尘Proxy.
- An agent using 尘Proxy with a saved provider key treats OpenAI Image Tools as ready, without a
  red setup indicator or standalone API-key form.
- Tool execution reuses the selected provider's saved key and base URL and sends
  `model: gpt-image-2.5`.
- Providers without that model, or user-key providers without a saved key, still require setup.

## Verification

- Frontend provider/catalog/configurability tests: 31 passed.
- Backend resolver/tool-loader/OpenAI image tests: 35 passed.
- Prettier and `git diff --check`: passed.
- On September 10, 2026, the test gateway `/v1/models` advertised `gpt-image-2.5` and no longer
  advertised `gpt-image-2`.
- A real `/v1/images/generations` request using `gpt-image-2.5` returned a valid PNG with image
  content matching the acceptance prompt. The gateway returned `1254 x 1254` for a requested
  `1024 x 1024`, so exact output dimensions remain gateway-defined.

## Deployment

The backend and frontend must be rebuilt together so the readiness check, runtime resolver, and
deployed `librechat.yaml` use the same model contract.
