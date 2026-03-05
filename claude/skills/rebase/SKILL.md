---
name: rebase
description: Rebase the current branch on latest main. Use when the user asks to "rebase", "rebase on main", "update branch", "rebase PR", or "pull latest main into branch".
---

# Rebase Current Branch on Latest Main

## Steps

1. **Detect Graphite**: check if the repo uses Graphite by running `gt log short 2>/dev/null`.

2. **If Graphite repo** (command succeeds):
   ```bash
   gt sync    # pulls trunk, restacks all branches
   gt submit  # pushes updated stack to remote
   ```

3. **If not a Graphite repo** (command fails):
   ```bash
   git fetch origin main
   git rebase origin/main
   git push --force-with-lease
   ```

4. If the rebase has conflicts, stop and help the user resolve them before continuing.
