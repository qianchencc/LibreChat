# Auth floating-label handoff

## Scope

Remove the visible label background block from empty auth inputs without changing the floated
label treatment.

## Implementation

- Empty, unfocused labels use a transparent background and no horizontal padding.
- Focused labels and labels for populated fields restore the semantic surface background and
  padding needed to cross the input border.
- Applied consistently to login, registration, password-reset request, and password-reset forms.

## Acceptance

- Auth Jest suites: 2 passed, 6 tests.
- Prettier and `git diff --check`: passed.
- Chromium visual QA passed in light and dark themes for empty, focused, and populated states.
