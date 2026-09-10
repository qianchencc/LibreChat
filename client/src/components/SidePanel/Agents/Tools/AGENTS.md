# Agent Tool UI Notes

- Image Tool setup state is derived from the selected custom provider, its advertised models, and
  whether its user-provided key is saved.
- Keep `items/imageProvider.ts` aligned with the backend resolver and `librechat.yaml`; a mismatch
  incorrectly exposes the standalone Image Tool credential form.
