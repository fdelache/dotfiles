---
name: graphite
description: Use when creating PRs, pushing branches, or using Graphite CLI (gt) commands. Covers gt submit, gt create, stacked PRs, and PR description formatting.
---

# Graphite CLI Reference

## Environment Setup

Always prefix shell commands with `shadowenv exec --` to ensure environment variables are set.

## Commit Message Best Practices

1. **Focus on the "why", not the "what"**: Explain motivation and benefits, not what changed
2. **Highlight security implications**: Clearly state if change prevents vulnerabilities
3. **Describe behavior changes**: How does the API/behavior change from the developer's perspective
4. **Use active voice**: "Make X do Y" rather than "X was changed to Y"
5. **Use `[ci full]` prefix**: When changes might have wider impacts beyond the immediate code

## Graphite CLI Commands

### Viewing Stack Status
- `gt log` - Show current stack structure with PRs and commits
- `gt log short` - Compact view of the stack

### Creating Commits and Branches
- `git add <files> && gt create -m "message"` - Stage specific files, then create branch
- `gt create -a -m "message"` - Stage ALL changes (including untracked) and create new branch
- `gt create -u -m "message"` - Stage only tracked file updates and create new branch

### Modifying Commits
- `gt modify` - Amend current commit (keeps message)
- `gt modify -a` - Stage all changes and amend
- `gt modify -c -m "message"` - Create new commit instead of amending

### Syncing and Rebasing
- `gt get` - Sync current stack from remote (use when encountering stale trunk or merged PR issues)
- `gt move --onto main` - Rebase current branch onto main/trunk
- `gt track --parent main` - Re-parent branch to track main directly (when stacked on now-merged PRs)
- `gt restack` - Rebase branch onto its parent
- `gt restack --only` - Restack only current branch

### Submitting PRs
- `gt submit --no-edit` - Push and create/update PR (uses commit message as PR title/description)
- `gt submit --no-edit -s` - Submit entire stack (current branch + descendants)
- `gt submit --no-edit --draft` - Create PR in draft mode
- `gt submit --no-edit --publish` - Publish draft PRs
- `gt submit --no-edit --reviewers "user1,user2"` - Set reviewers

### Common Error Fixes

| Error | Solution |
|-------|----------|
| "PRs have already been merged or closed" | Run `gt get` first |
| "Aborting submit due to out of date trunk" | Run `gt get` to update trunk |
| Branch stacked on merged PR | `gt track --parent main` then `gt restack --only` |

## PR Description Guidelines

Write a concise PR description that:
- Explains why the change is needed
- Answers likely reviewer questions
- Does NOT summarize the diff (reviewers can read code)
- Includes only essential context (rationale, safety, testing, rollback) when relevant

## PR Workflow: Submit Then Configure

1. **Submit PR** (creates in draft mode when using `--no-edit`):
   ```bash
   gt submit --no-edit
   ```

2. **Update PR description** using GitHub API:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f title="Title" -f body="$(cat <<'EOF'
   ## Summary
   - Change 1
   - Change 2

   ## Test plan
   - [ ] Test item
   EOF
   )"
   ```

3. **Mark ready for review**:
   ```bash
   gh pr ready {number} -R {owner}/{repo}
   ```

## Reading GitHub Issues and PRs

**ALWAYS use `gh view-md <github-issue-or-pr-url>`** when given a GitHub URL. Returns a well-formatted markdown summary with all necessary information.

## Safety Checks

Before pushing:
- Verify all intended files are staged
- Check for any pre-commit warnings or failing checks
- If force pushing is required, confirm with the user first
- If there are uncommitted changes from multiple features, ask how to organize commits
