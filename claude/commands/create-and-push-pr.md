---
description: Create a new commit and PR using Graphite CLI
skills: graphite
---

# Create Commit and PR

Create a new commit from staged/unstaged changes and submit as a draft pull request.

## Process

### 1. Assess Current State

Run these commands in parallel:
```bash
shadowenv exec -- git status
shadowenv exec -- git diff --stat
shadowenv exec -- gt log short
```

### 2. Determine Action Based on State

**If there are uncommitted changes:**
- Review the changes to understand what was modified
- Proceed to create commit

**If working directory is clean:**
- Inform user there's nothing to commit
- Stop here

**If on an existing branch with unpushed commits:**
- Ask if user wants to submit existing commits or expects new changes

### 3. Create the Commit

Assume the current branch is correct (main for new PRs, or a feature branch if stacking):

```bash
shadowenv exec -- gt create -a -m "Commit message here"
```

Write a commit message that:
- Focuses on the "why" not the "what"
- Uses active voice
- Highlights security implications if relevant
- Prefixes with `[ci full]` if changes have wide impact

### 4. Submit the PR as Draft

```bash
shadowenv exec -- gt submit --no-edit --draft
```

If you encounter "out of date trunk" errors:
```bash
shadowenv exec -- gt get
shadowenv exec -- gt submit --no-edit --draft
```

### 5. Update PR Description

Get the PR URL from submit output, then update with a proper description:
```bash
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f title="PR Title" -f body="$(cat <<'EOF'
PR description here
EOF
)"
```

### 6. Report Completion

Provide:
- The PR URL
- Brief summary of what was committed
- Note that the PR is in draft mode (user will mark ready for review when appropriate)
- Any warnings or notes (e.g., if CI is expected to fail for known reasons)
