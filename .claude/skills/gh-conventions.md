---
description: Apply GitHub branch naming and PR creation conventions for crypto-terminal. Use this before creating any branch or PR.
---

Apply the following conventions when creating branches and pull requests in this repository.

## Branch naming

Pattern: `AI-DEMO-{issueNumber}-{author}`

- `{issueNumber}` — the GitHub issue number this branch addresses
- `{author}` — the author slug (default: `phaletski`)

Examples:
- `AI-DEMO-3-phaletski`
- `AI-DEMO-12-phaletski`

Create the branch from `main`:
```bash
git checkout main && git pull
git checkout -b AI-DEMO-{issueNumber}-phaletski
```

## Commit conventions

- Squash all work into a **single commit** before pushing
- Write a concise, imperative commit message describing the change

## PR title

Pattern: `[AI-DEMO] Short description`

Examples:
- `[AI-DEMO] Add light theme support`
- `[AI-DEMO] Fix WebSocket reconnect on network drop`

## Creating the PR

```bash
gh pr create \
  --repo haletskipavel/crypto-terminal \
  --title "[AI-DEMO] {short description}" \
  --body "$(cat <<'EOF'
## Summary

Closes #{issueNumber}

{bullet points describing what was changed}
EOF
)"
```
