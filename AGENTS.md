# Repository Agent Instructions

Scope: this repository (`dotfiles`) only.

## Repository purpose

This is a personal dotfiles repo layered on top of Omacase.
It is primarily a configuration/distribution repo that:

- defines shell customizations (`zsh/`)
- defines Claude configuration/content (`claude/`)
- defines Pi configuration/content (`pi/`)
- installs/symlinks everything into the home directory (`bin/dotfiles`, `install/symlinks.sh`)

Treat this as a **source-of-truth config repo**. Most changes are text/config updates, not application/runtime code changes.

## Key layout

- `bin/dotfiles`: entrypoint used to install/verify setup
- `install/symlinks.sh`: canonical mapping of repo files/dirs to `~/...`
- `zsh/`: shell prompt, aliases, functions, and local zsh entrypoint
- `claude/`: Claude agents, slash commands, hooks, statusline
- `pi/`: Pi profiles/settings/extensions that get linked to `~/.pi`
- `pi/.gitignore`: ignores transient local Pi runtime state (sessions/auth/cache)

## Working conventions for this repo

- Prefer minimal, surgical edits.
- Keep paths and symlink assumptions stable (changes here affect machine bootstrap).
- When changing install behavior, ensure `bin/dotfiles` and `install/symlinks.sh` stay consistent.
- Avoid introducing machine-specific absolute paths unless explicitly intended.
- Do not treat transient runtime state as source config.

## Git / PR workflow

- Do **not** use Graphite CLI (`gt`) in this repository.
- Do **not** run Graphite commands that initialize or manage repo state (`gt init`, `gt track`, `gt submit`, etc.).
- Use standard GitHub workflow tools instead:
  - `git` for local operations
  - `gh` for pull requests

## Why

This repo may contain content that documents Graphite usage for other repositories, but this repository itself must remain Graphite-free.

## Cleanup policy

If Graphite metadata is created accidentally, remove repo-local artifacts from `.git/`:

- `.git/.gt/`
- `.git/.graphite_cache_persist`
- `.git/.graphite_pr_info`
- `.git/.graphite_repo_config`
- `.git/.gtlocalprinfo`
