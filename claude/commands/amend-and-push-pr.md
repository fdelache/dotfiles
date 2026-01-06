---
description: Amend the current PR with new changes
skills: graphite
---

# Amend Existing PR

Add new changes to the current branch's commit and update the PR.

## Process

### 1. Assess Current State

Run these commands in parallel:
```bash
shadowenv exec -- git status
shadowenv exec -- git diff --stat
shadowenv exec -- gt log short
```

### 2. Validate State

**If working directory is clean:**
- Inform user there's nothing to amend
- Stop here

**If not on a feature branch (e.g., on main):**
- Inform user they need to be on a feature branch to amend
- Suggest using `/create-and-push-pr` instead to create a new branch

### 3. Amend the Commit

Stage all changes and amend:
```bash
shadowenv exec -- gt modify -a
```

### 4. Handle Restack if Needed

If there are downstream branches in the stack:
```bash
shadowenv exec -- gt restack
```

If you encounter "out of date trunk" or "PRs have already been merged" errors:
```bash
shadowenv exec -- gt get
shadowenv exec -- gt restack
```

### 5. Push the Updated Commit

```bash
shadowenv exec -- gt submit --no-edit
```

This force-pushes the amended commit and updates the PR.

### 6. Update PR Description if Needed

If the changes warrant updating the PR description, ensure the description reflects the **entire PR** as a cohesive whole (original changes + amendments merged together), not just the new changes. The description should read as if all the code was written in one pass.

```bash
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="$(cat <<'EOF'
Updated PR description reflecting the complete change
EOF
)"
```

### 7. Report Completion

Provide:
- Confirmation the PR was updated
- The PR URL
- Brief summary of what changed
- Note if this was a force-push (reviewers may need to re-review)
