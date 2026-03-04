---
name: agent-vault
description: Use when looking up Shopify employees, teams, projects, pages, posts, reviews, proposals, issues, or any Vault intranet data. Covers searching, reading profiles, project details, and organizational information.
---

# agent-vault CLI

A Vault intranet companion CLI for AI agents. Queries Shopify's Vault via the MCP endpoint to look up people, teams, projects, documentation, and more.

## Installation

```bash
npm install -g @shopify-internal/agent-vault
```

### Authentication

```bash
agent-vault auth setup
```

Or set `VAULT_API_TOKEN` environment variable directly. Get your token at: https://vault.shopify.io/api_token

## Commands

### Search across Vault

```bash
# Search everything
agent-vault search "checkout performance"

# Filter by category
agent-vault search "checkout" --category Projects
agent-vault search "alice smith" --category People

# Domain-specific search
agent-vault search projects "checkout optimization"
agent-vault search users "alice smith"
agent-vault search pages "deploy runbook"
```

### People and Teams

Users can be referenced by email, GitHub handle, Vault user ID, or Vault URL:

```bash
# Your own profile
agent-vault user me

# Look up someone — all of these work
agent-vault user get alice.smith@shopify.com
agent-vault user get alicesmith           # GitHub handle
agent-vault user get 4889                 # Vault user ID
agent-vault user get https://vault.shopify.io/users/4889-alice-smith

# Your feed
agent-vault user feed --start-date 2026-02-01

# Team info and members (by ID or Vault URL)
agent-vault team get 15284
agent-vault team members 15284
```

### Projects

Commands default to **your** context when flags are omitted. Person flags accept email, GitHub handle, or Vault user ID:

```bash
# Your projects (where you're a contributor)
agent-vault project list

# Your team's projects
agent-vault project list --team

# Specific team's projects
agent-vault project list --team 15284

# Projects you champion
agent-vault project list --champion

# Projects someone else champions (email, GitHub handle, or ID)
agent-vault project list --champion alice.smith@shopify.com
agent-vault project list --contributor alicesmith

# Get project details (by ID, Vault URL, or #gsd:N)
agent-vault project get 12345
agent-vault project get https://vault.shopify.io/gsd/projects/12345-my-project
agent-vault project get 12345 --activity --activity-weeks 4
```

### Documentation and Content

```bash
agent-vault page get <page-id>
agent-vault post get 296969
```

### Governance

```bash
agent-vault review get 456
agent-vault proposal get zaTB3E
```

### Operations

Commands default to **your** context when flags are omitted. Person flags accept email, GitHub handle, or Vault user ID:

```bash
# Your issues
agent-vault issue list

# Your team's issues
agent-vault issue list --team

# Your team's P0 issues
agent-vault issue list --team --priority p0

# Specific team's issues
agent-vault issue list --team 2075

# Someone else's issues (email, GitHub handle, or ID)
agent-vault issue list --assignee alice.smith@shopify.com
agent-vault issue list --assignee alicesmith

# Get issue details (by ID or Vault URL)
agent-vault issue get 7931
agent-vault issue get https://vault.shopify.io/teams/2075-Workflows/issues/7931-slug
```

## JSON Output

Every command supports structured output:

```bash
# JSON output (auto-detected when called by AI agents)
agent-vault search "checkout" --output json

# JSON with field projection
agent-vault search "checkout" --json id,title,url

# Pipe through jq
agent-vault user me --json content --jq '.content'
```

## Common Workflows

### Check your issues and projects
```bash
agent-vault issue list
agent-vault project list
```

### Check your team's issues
```bash
agent-vault issue list --team
agent-vault issue list --team --priority p0
```

### Look up who works on something
```bash
agent-vault search projects "checkout optimization"
agent-vault project get <project-id>
agent-vault user get <user-id>
```

### Find documentation
```bash
agent-vault search pages "deploy runbook"
agent-vault page get <page-id>
```

### Understand team structure
```bash
agent-vault search "retail merchandising" --category Teams
agent-vault team get <team-id>
agent-vault team members <team-id>
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure or general error |
