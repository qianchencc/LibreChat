# Theme Module Notes

- Keep `themes/default.ts`, `themes/dark.ts`, and the `html` / `.dark` fallbacks in
  `client/src/style.css` synchronized. The CSS values render before the provider applies a
  resolved theme.
- Treat theme colors as RGB channel triplets and consume them through semantic roles. Feature
  components must not copy these values.
- Preserve `REACT_APP_THEME_*`, stored mode, and `themeDefinition` compatibility when changing
  bundled defaults.
- Text accent values must pass contrast on the relevant canvas surfaces. A supplied brand accent
  may remain exact on a strong surface while text uses an accessible derivative.
- Keep `font-sans` and `font-theme-ui` routed through `--theme-font-family`; code and Monaco retain
  their independent monospace configuration.
- Run `npx jest src/theme --runInBand` from `packages/client` after changing this module.
