# Agent Tool Notes

- `image_gen_oai` may reuse the selected custom provider's key and base URL.
- Keep the supported image model in `util/resolveImageProvider.js` aligned with the frontend
  readiness check and `librechat.yaml`; otherwise the UI requests a redundant standalone key.
- Run the image-provider resolver, tool loader, and OpenAI image tool tests after changing this
  contract.
- Image success must follow durable storage. Reuse persisted attachments in both callback paths;
  `expiredAt` is a retention deadline, so future dates remain deliverable in temporary chats.
