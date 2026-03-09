#!/bin/zsh
#
# Symlink definitions for dotfiles
#

DOTFILES_PATH="${DOTFILES_PATH:-$HOME/src/github.com/fdelache/dotfiles}"

# Colors (may be inherited from parent script)
GREEN="${GREEN:-\033[0;32m}"
YELLOW="${YELLOW:-\033[0;33m}"
DIM="${DIM:-\033[2m}"
NC="${NC:-\033[0m}"


# Define symlinks: "source:target"
SYMLINKS=(
  "zsh/zshrc.local:$HOME/.zshrc.local"
  "claude/CLAUDE.md:$HOME/.claude/CLAUDE.md"
  "claude/agents:$HOME/.claude/agents"
  "claude/commands:$HOME/.claude/commands"
  "claude/statusline.sh:$HOME/.claude/statusline.sh"
  "claude/hooks:$HOME/.claude/hooks"
  "bin/ralph:$HOME/.local/bin/ralph"
)

for entry in "${SYMLINKS[@]}"; do
  source="${entry%%:*}"
  target="${entry#*:}"
  source_path="$DOTFILES_PATH/$source"
  target_name="${target/#$HOME/~}"

  # Check if source exists
  if [[ ! -e "$source_path" ]]; then
    echo "${DIM}  ○ $target_name (source missing)${NC}"
    continue
  fi

  # Create parent directory if needed
  target_dir=$(dirname "$target")
  [[ ! -d "$target_dir" ]] && mkdir -p "$target_dir"

  # Check current state
  if [[ -L "$target" ]]; then
    current=$(readlink "$target")
    if [[ "$current" == "$source_path" ]]; then
      echo "${GREEN}  ✓${NC} $target_name"
      continue
    fi
    # Wrong target, remove it
    rm "$target"
  elif [[ -e "$target" ]]; then
    # Backup existing file/directory
    backup="${target}.backup.$(date +%Y%m%d%H%M%S)"
    mv "$target" "$backup"
    echo "${YELLOW}  ↗${NC} $target_name ${DIM}(backed up)${NC}"
  fi

  # Create symlink
  ln -s "$source_path" "$target"
  echo "${GREEN}  ✓${NC} $target_name ${DIM}(linked)${NC}"
done

# Alias ~/.pi/agent -> ~/.pi/agent-shopify (single unified profile)
if [[ -d "$HOME/.pi/agent" && ! -L "$HOME/.pi/agent" ]]; then
  backup="$HOME/.pi/agent.backup.$(date +%Y%m%d%H%M%S)"
  mv "$HOME/.pi/agent" "$backup"
  echo "${YELLOW}  ↗${NC} ~/.pi/agent ${DIM}(backed up old directory)${NC}"
fi
if [[ -L "$HOME/.pi/agent" ]]; then
  current=$(readlink "$HOME/.pi/agent")
  if [[ "$current" == "$HOME/.pi/agent-shopify" ]]; then
    echo "${GREEN}  ✓${NC} ~/.pi/agent ${DIM}(→ agent-shopify)${NC}"
  else
    rm "$HOME/.pi/agent"
    ln -s "$HOME/.pi/agent-shopify" "$HOME/.pi/agent"
    echo "${GREEN}  ✓${NC} ~/.pi/agent ${DIM}(→ agent-shopify, updated)${NC}"
  fi
else
  ln -s "$HOME/.pi/agent-shopify" "$HOME/.pi/agent"
  echo "${GREEN}  ✓${NC} ~/.pi/agent ${DIM}(→ agent-shopify, linked)${NC}"
fi

# Install subagent definitions from pi-config
AGENTS_SRC="$HOME/.pi/agent-shopify/git/github.com/fdelache/pi-config/agents"
AGENTS_DST="$HOME/.pi/agent/agents"
if [[ -d "$AGENTS_SRC" ]]; then
  mkdir -p "$AGENTS_DST"
  for f in "$AGENTS_SRC"/*.md; do
    [[ -f "$f" ]] || continue
    name=$(basename "$f")
    cp -f "$f" "$AGENTS_DST/$name"
    echo "${GREEN}  ✓${NC} agent: $name"
  done
fi

# Install pi packages
if command -v pi &>/dev/null; then
  for pkg in git:github.com/fdelache/pi-config "https://github.com/shopify-playground/shop-pi-fy"; do
    pkg_name=$(basename "$pkg")
    if pi list 2>/dev/null | grep -q "$pkg_name"; then
      pi update "$pkg" 2>/dev/null \
        && echo "${GREEN}  ✓${NC} $pkg_name ${DIM}(updated)${NC}" \
        || echo "${DIM}  ○ $pkg_name (update failed)${NC}"
    else
      pi install "$pkg" 2>/dev/null \
        && echo "${GREEN}  ✓${NC} $pkg_name ${DIM}(installed)${NC}" \
        || echo "${DIM}  ○ $pkg_name (install failed)${NC}"
    fi
  done
else
  echo "${DIM}  ○ pi packages (pi not installed — skipping)${NC}"
fi

# Install devx skills from registry
if command -v skills &>/dev/null; then
  for skill in agent-ci agent-observe agent-slack agent-vault graphite weekly-impact world-structure; do
    if [[ -d "$HOME/.claude/skills/$skill" ]]; then
      echo "${GREEN}  ✓${NC} skill: $skill"
    else
      skills get "$skill" 2>/dev/null \
        && echo "${GREEN}  ✓${NC} skill: $skill ${DIM}(installed)${NC}" \
        || echo "${DIM}  ○ skill: $skill (install failed)${NC}"
    fi
  done
else
  echo "${DIM}  ○ devx skills (not installed — skipping)${NC}"
fi

# Merge hooks config into settings.json
HOOKS_FILE="$DOTFILES_PATH/claude/settings-hooks.json"
SETTINGS_FILE="$HOME/.claude/settings.json"

if [[ -f "$HOOKS_FILE" && -f "$SETTINGS_FILE" ]]; then
  jq -s '.[0] * .[1]' "$SETTINGS_FILE" "$HOOKS_FILE" > "${SETTINGS_FILE}.tmp" \
    && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE" \
    && echo "${GREEN}  ✓${NC} ~/.claude/settings.json ${DIM}(hooks merged)${NC}"
fi
