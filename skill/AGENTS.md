# Deployed skill execution

- Validate executable workflows through the real Code API jail. A successful build outside NsJail does not prove a skill can execute inside it.
- Uploaded helpers may lack executable bits and live on `noexec` mounts. Invoke shell helpers with `bash`; run .NET CLI assemblies with `UseAppHost=false`.
- `minimax-docx` supports SDK 8. Target its `.csproj` explicitly when restoring/building; SDK 8 cannot discover the bundled `.slnx` solution.
- Keep documented commands and dependency versions aligned with the bundled CLI/projects. See `plan/code-runtime-storage-handoff.md` for the production acceptance evidence.
