# dotfiles

Personal dotfiles layer on top of [Omacase](https://github.com/fdelache/omacase).

Omacase provides a base macOS development environment. This repo extends it with personal customizations:
- World-aware shell prompt (integrates with Shopify's `worldpath`)
- Custom aliases and functions
- Claude Code agents and commands

## Installation

```bash
# Clone this repo
git clone git@github.com:fdelache/dotfiles.git ~/src/github.com/fdelache/dotfiles

# Run dotfiles (auto-detects state, installs what's needed)
~/src/github.com/fdelache/dotfiles/bin/dotfiles
```

The script will:
1. Check if Omacase is installed (offer to install if not)
2. Create symlinks (or verify they're correct)

Run it anytime to verify or fix the setup.

## Structure

```
dotfiles/
├── bin/dotfiles          # CLI tool
├── zsh/
│   ├── zshrc.local       # Entry point (sourced by Omacase)
│   ├── prompt.zsh        # World-aware prompt
│   ├── aliases.zsh       # Custom aliases
│   └── functions.zsh     # Custom functions
├── claude/
│   ├── agents/           # Claude Code agent definitions
│   └── commands/         # Claude Code slash commands
└── install/
    └── symlinks.sh       # Symlink definitions
```

## Symlinks

| Source | Target |
|--------|--------|
| `zsh/zshrc.local` | `~/.zshrc.local` |
| `claude/agents/` | `~/.claude/agents` |
| `claude/commands/` | `~/.claude/commands` |

## Customization

### Adding Aliases

Edit `zsh/aliases.zsh`:

```bash
alias ll='eza -la'
alias gst='git status'
```

### Adding Functions

Edit `zsh/functions.zsh`:

```bash
mkcd() {
  mkdir -p "$1" && cd "$1"
}
```

### Adding Claude Agents

Create a markdown file in `claude/agents/`:

```markdown
# claude/agents/my-agent.md
Description of what the agent does...
```

### Adding Claude Commands

Create a markdown file in `claude/commands/`:

```markdown
# claude/commands/my-command.md
Prompt template for the command...
```

## Dependencies

- [Omacase](https://github.com/fdelache/omacase) - Base environment
- `worldpath` (optional) - For Shopify World prompt integration
