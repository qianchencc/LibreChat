# Artifact Preview References

- Keep Sandpack unmounted until the first authenticated resolution of any `attachment://` references completes. The static preview does not reliably reload source that was mounted with an unresolved custom URL scheme.
- Resolve references only in the Sandpack working copy. Persisted Artifact content remains the stable `attachment://<file_id>` source.
