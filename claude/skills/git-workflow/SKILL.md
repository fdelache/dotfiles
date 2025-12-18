---
name: git-workflow
description: Use when committing code, creating pull requests with Graphite CLI (gt), reviewing GitHub issues or PRs, or working with git operations. Covers commit message best practices, Graphite stack management, and gh view-md usage.
---

# Git, GitHub & Graphite Workflow

## Commit Message Best Practices

1. **Focus on the "why", not the "what"**: Explain the motivation and benefits of the change rather than describing what was changed
2. **Highlight security implications**: If the change prevents vulnerabilities or security issues, state this clearly
3. **Describe behavior changes**: Explain how the API/behavior changes from the developer's perspective
4. **Use active voice**: "Make X do Y" rather than "X was changed to Y"

## Pull Request Creation

- **ALWAYS use Graphite CLI (`gt`) when creating PRs** - Never use standard git commands for PR creation
  - Use `gt create -a` to add all modified files and create a new commit in one command
  - Use `gt move --onto main` to rebase onto the target branch before submitting
  - Use `gt submit` to push and create the PR
  - This ensures proper stack management and integration with Shopify's development workflow

## Reading GitHub Issues and PRs

- **ALWAYS use `gh view-md <github-issue-or-pr-url>`** when given a GitHub URL
- This GitHub CLI extension returns a well-formatted markdown summary with all necessary information
- Never try to parse GitHub URLs manually or fetch them with other tools
- Works for both issues and pull requests

## Updating Existing PRs

- Use `gt modify` to update an existing Graphite stack PR
- Do not use `git push` - always use `gt submit`
- When `gt submit` fails with `Aborting submit due to out of date trunk branch` error, run `gt get` to get the latest main branch

## PR Description Guidelines

Write a concise PR description that:
- Explains why the change is needed
- Answers likely reviewer questions
- Does NOT summarize the diff
- Includes only essential context (rationale, safety/tests/rollback) when relevant
- Keeps it short or split the PR if too long
