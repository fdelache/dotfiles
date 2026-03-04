---
name: agent-ci
description: Use when debugging CI failures, checking pipeline/workflow status across Buildkite and GitHub Actions, inspecting build steps or logs, or resolving CI issues. Covers all agent-ci CLI usage.
---

# agent-ci CLI

A unified, repo-aware CI companion CLI for agentic workflows. It supports both **Buildkite** and **GitHub Actions** from a single interface. It automatically detects pipelines/workflows from `ci-checks.yml` and uses your current git branch/commit for context.

## Installation

**Install globally (recommended):**

```bash
npm install -g @shopify-internal/agent-ci
```

**Important:** Always use the globally installed `agent-ci` command directly. Do NOT use `npx @shopify-internal/agent-ci` as it introduces unnecessary overhead, slower startup times, and potential version conflicts.

### Authentication

**Buildkite** — the CLI checks these sources in order:
1. `BUILDKITE_TOKEN` or `BUILDKITE_API_TOKEN` environment variable
2. macOS Keychain (`security find-generic-password -s buildkite.access_token -w`)
3. Shopify dev tool (`dev tools run buildkite api-token --json`)

**GitHub Actions** — requires the `gh` CLI authenticated:
```bash
brew install gh && gh auth login
```

Use `--skip-auth-check` to skip Keychain/dev-tool lookup for Buildkite and only use env vars.

## How the CLI Resolves Pipelines

The CLI looks for `ci-checks.yml` at the workspace root (walking upward from cwd). This file declares `required_checks` and `optional_checks` grouped by provider (`buildkite` and/or `github_actions`). Each entry has a `name` (pipeline slug or workflow filename) and optional `stages` (pre-merge, merge-queue, post-merge, release).

By default, only `pre-merge` stage pipelines are shown. Use `--stage` to switch. Use `--include-optional` to include optional pipelines. Use `--pipeline <slug>` to override auto-detection entirely.

The CLI also auto-detects the current git commit and branch, using them to filter builds. Override with `--commit <sha>`, `--branch <name>`, or disable commit filtering with `--no-commit`.

## Commands

### Check pipeline/workflow status

```bash
# Show all pre-merge pipelines across all providers for current commit
agent-ci pipelines

# Show only Buildkite pipelines
agent-ci pipelines --provider buildkite

# Show only GitHub Actions workflows
agent-ci pipelines --provider github_actions

# Show only failed pipelines
agent-ci pipelines --filter failed

# Check a specific pipeline
agent-ci pipelines --pipeline my-pipeline-slug

# Check merge-queue stage, include optional checks
agent-ci pipelines --stage merge-queue --include-optional

# Exit with code 1 if any pipeline failed (useful in scripts)
agent-ci pipelines --exit-status
```

### List steps/jobs in a build

```bash
# Show all steps for the resolved pipeline
agent-ci steps --pipeline my-pipeline-slug

# Show only failed steps
agent-ci steps --pipeline my-pipeline-slug --filter failed

# Filter by step name substring
agent-ci steps --pipeline my-pipeline-slug --name "typecheck"

# Inspect a specific run number
agent-ci steps --pipeline my-pipeline-slug --run 1234

# Filter by provider
agent-ci steps --pipeline my-pipeline-slug --provider buildkite
```

### Inspect a specific step and its logs

```bash
# Show step summary (case-insensitive substring match on step name)
agent-ci step "Run tests" --pipeline my-pipeline-slug

# Show step summary + full log output
agent-ci step "Run tests" --pipeline my-pipeline-slug --logs

# Search logs for a pattern (--grep uses regex by default, like grep)
agent-ci step "Run tests" --pipeline my-pipeline-slug --grep "error|FAIL|✖" --ignore-case --context 5

# Scope grep to a specific log section to avoid noise from setup/infra lines
agent-ci step "Run tests" --pipeline my-pipeline-slug --grep "error|FAIL" --section "Run tests" --ignore-case

# Use literal substring matching instead of regex
agent-ci step "Run tests" --pipeline my-pipeline-slug --grep "TypeError" --literal

# List available log sections (Buildkite --- / +++ / ~~~ markers)
agent-ci step "Run tests" --pipeline my-pipeline-slug --list-sections

# Show only a specific log section
agent-ci step "Run tests" --pipeline my-pipeline-slug --logs --section "Running tests"
```

### Inspect resolved configuration

```bash
# Show which pipelines/workflows the CLI would query
agent-ci config

# Show merge-queue stage config
agent-ci config --stage merge-queue --include-optional

# Show only GitHub Actions config
agent-ci config --provider github_actions
```

## JSON Output and Scripting

Every command supports structured JSON output for programmatic use.

```bash
# Output as JSON
agent-ci pipelines --output json

# JSON with field projection (only include specific fields)
agent-ci pipelines --json provider,pipeline,state

# Discover available fields for any command
agent-ci pipelines --json
agent-ci steps --json
agent-ci step "My Step" --pipeline my-pipeline --json

# Pipe through jq for advanced filtering
agent-ci pipelines --json provider,pipeline,state --jq '.[] | select(.state == "failed")'

# Other output formats
agent-ci pipelines --output yaml
agent-ci pipelines --output text
```

Available fields by command:
- **pipelines**: provider, pipeline, runId, state, branch, commit, creator, createdAt, webUrl, source, triggered
- **steps**: provider, pipeline, step, id, key, state, type, started, finished, triggered, url
- **step**: provider, pipeline, runId, id, name, state, key, type, webUrl, createdAt, startedAt, finishedAt, triggeredRun
- **config**: checks, source, configPath, workspaceRoot

## Common Agentic Workflows

### Diagnose a CI failure

```bash
# 1. See which pipelines/workflows failed (across all providers)
agent-ci pipelines --filter failed

# 2. Drill into the failed pipeline's steps (include id for disambiguation)
agent-ci steps --pipeline <slug-from-step-1> --filter failed --json step,id,key,state

# 3. List log sections to find the relevant one (skip setup/infra noise)
agent-ci step "<job-id>" --pipeline <slug> --list-sections

# 4. Search for errors within the relevant section
agent-ci step "<job-id>" --pipeline <slug> --grep "error|FAIL|✖" --section "<section-name>" --ignore-case --context 5
```

**Important:** When multiple jobs share the same step name (common with parallel CI), each failed job may have different errors. Always check step 2 output for multiple failed IDs and inspect each one. Using `--grep` without `--section` searches the full log including Docker setup, cache restore, etc. — always scope with `--section` when you know the relevant section name.

### Disambiguating duplicate step names

Many pipelines have multiple parallel jobs with the same name. When using name-based matching, `step` prefers the failed job among matches. For explicit disambiguation, use the job ID:

```bash
# 1. Get ALL failed steps with their IDs
agent-ci steps --pipeline <slug> --filter failed --json step,id,key,state

# 2. Inspect EACH failed job by ID (not name — name may match only one of several)
agent-ci step "<job-id-1>" --pipeline <slug> --grep "error|FAIL" --section "<section>" --ignore-case
agent-ci step "<job-id-2>" --pipeline <slug> --grep "error|FAIL" --section "<section>" --ignore-case
```

The `step` command accepts a job ID (always unambiguous), a step key, or a step name. When the name matches multiple steps, it prefers the failed one — but this means **other failed jobs with the same name will be silently skipped**. Use job IDs to inspect all of them.

### Compare CI across providers

```bash
# See Buildkite and GitHub Actions side by side
agent-ci pipelines

# Check only one provider
agent-ci pipelines --provider buildkite
agent-ci pipelines --provider github_actions

# Find failures across all providers
agent-ci pipelines --filter failed --json provider,pipeline,state
```

### Check CI for a different commit or branch

```bash
# Check CI for a specific commit
agent-ci pipelines --commit abc123def

# Check CI for a branch without commit filtering
agent-ci pipelines --branch feature-branch --no-commit

# Check the latest build regardless of commit
agent-ci pipelines --no-commit
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure detected or general error |
| 3 | No pipelines/builds/steps found |
| 4 | Authentication token not found / no providers available |

## Global Options

These options work on all commands:

- `--provider <name...>` — CI provider(s) to query (`buildkite`, `github_actions`). Defaults to all available.
- `--organization <slug>` — Buildkite org (default: `shopify`, or `BUILDKITE_ORGANIZATION` env var)
- `--base-url <url>` — Buildkite API base URL (default: `https://api.buildkite.com/v2`)
- `--skip-auth-check` — Only use env var tokens for Buildkite, skip Keychain/dev-tool lookup

## Run State Reference

The CLI normalizes provider-specific states into a unified set. When using `--filter`, these are the normalized states you can filter by:

**Run states**: unknown, queued, running, passed, failed, canceled, timed_out, skipped, blocked, waiting

**Step/job states**: unknown, pending, queued, waiting, blocked, running, passed, failed, canceled, timed_out, skipped, soft_failed

Using `--filter failed` is special: it matches any failure-like state (failed, timed_out, canceled), not just the literal "failed" state.
 npm install -g @shopify/skills