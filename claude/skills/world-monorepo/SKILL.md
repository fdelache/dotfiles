---
name: world-monorepo
description: Use when navigating Shopify's World monorepo, working across multiple zones, managing sparse checkouts, or discovering code locations. Covers zone structure, manifest lookups, checkout management, and cross-zone code changes.
---

# World Monorepo Navigation

## Core Concepts

### Terminology
- **World Path**: Path starting with `//` (e.g., `//areas/tools/tec`, `//areas/tools/tec/README.md`)
- **Zone Path**: World Path at the root of a zone (has `zone.nix` and manifest entry), e.g., `//areas/tools/tec`
- **Zone ID**: Stable identifier (`W-` + 6 hex chars), defined in `//.meta/manifest.json`
- **Worktree**: A separate working copy of the repo with its own checkout
- **Checkout root**: `$HOME/world/trees/<treeName>/src`

### Worktrees

World supports multiple worktrees. The git directory lives at `~/world/git`, with worktrees at `~/world/trees/<name>/src`.

Common worktrees:
- `root` - Default worktree (`~/world/trees/root/src`)
- `hotfixes` - For hotfix work (`~/world/trees/hotfixes/src`)
- Custom worktrees for parallel work

World paths (`//`) resolve relative to the current worktree:
- In `~/world/trees/root/src/areas/foo` → `//.meta` = `~/world/trees/root/src/.meta`
- In `~/world/trees/hotfixes/src/areas/foo` → `//.meta` = `~/world/trees/hotfixes/src/.meta`

Each worktree has its own sparse checkout configuration.

### Zone Structure
Zones are NOT nested. Almost everything lives in a zone. Major roots:
- `//areas` - Application code
- `//libraries` - Shared code
- `//protocols` - Schemas
- `//config` - Shared configs
- `//.meta` - Tectonix build system

## Finding Zones

### Discover Current Zone
```bash
tec resolve .
```
Returns the `//zone/path` for the current directory.

### List All Zones
```bash
tec zone list
```

### Zone Manifest
The source of truth for all zones is `//.meta/manifest.json`. Use this to:
- Find zones by name or ID
- Discover all zones in a specific area
- Look up zone IDs for external references

## Sparse Checkout Management

World uses sparse checkout. Files outside checked-out zones are NOT available on disk. Each worktree maintains its own sparse checkout configuration.

### List Checked-Out Zones
```bash
tec checkout list
```

### Add a Zone to Checkout
```bash
tec checkout add //path/to/zone
```

### Remove a Zone from Checkout
```bash
tec checkout remove //path/to/zone
```

### Access Files Not in Checkout
Use `git show` to read files without adding to sparse checkout:
```bash
git show HEAD:path/to/zone/file
```

## Cross-Zone Code Changes

When modifying code across multiple zones:

1. **Identify all affected zones**: Search for usages across zones using `git show` or add zones to checkout
2. **Add zones to checkout**: `tec checkout add //zone/path` for each zone you need to modify
3. **Verify zone dependencies**: Check `zone.nix` for declared dependencies between zones
4. **Make coordinated changes**: Update all zones atomically to avoid broken intermediate states
5. **Test across zones**: Run tests in each affected zone

## Zone Development Environment

Each zone can define commands in `dev.yml`. Common commands:
- `dev up` - Build nix environment (activated via Shadowenv)
- `dev server` - Start development server
- `dev console` - Interactive console
- `dev test` - Run tests
- `dev style` - Run linting

To run dev commands: `/opt/dev/bin/dev <command>`

## Navigation Patterns

### Finding Code by Domain
1. Check `//areas` for application code organized by team/domain
2. Check `//libraries` for shared utilities
3. Check `//protocols` for API schemas

### Finding Dependencies
1. Look at `zone.nix` for declared zone dependencies
2. Search for imports across zones using the manifest

### Path Resolution
From a checkout (e.g., `$HOME/world/trees/root/src/areas/tools/dev`):
- `//.meta` refers to `$HOME/world/trees/root/src/.meta`
- Paths are relative to the checkout root, not the filesystem root
