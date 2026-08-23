# Artifact Preview References

- Keep Sandpack unmounted until private `attachment://` references resolve to signed URLs. Shared Artifacts resolve through the share snapshot route without `AuthProvider`. The static preview does not reliably reload source mounted with an unresolved custom URL scheme.
- Resolve references only in the Sandpack working copy. Persisted Artifact content remains the stable `attachment://<file_id>` source.
