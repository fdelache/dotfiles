#!/bin/zsh
#
# Symlink definitions for dotfiles
#

DOTFILES_PATH="${DOTFILES_PATH:-$HOME/src/github.com/fdelache/dotfiles}"

# Define symlinks: "source:target"
SYMLINKS=(
  "zsh/zshrc.local:$HOME/.zshrc.local"
  "claude/CLAUDE.md:$HOME/.claude/CLAUDE.md"
  "claude/agents:$HOME/.claude/agents"
  "claude/commands:$HOME/.claude/commands"
  "claude/skills:$HOME/.claude/skills"
  "claude/statusline.sh:$HOME/.claude/statusline.sh"
  "claude/hooks:$HOME/.claude/hooks"
  "bin/ralph:$HOME/.local/bin/ralph"
)

# Colors (may be inherited from parent script)
GREEN="${GREEN:-\033[0;32m}"
YELLOW="${YELLOW:-\033[0;33m}"
DIM="${DIM:-\033[2m}"
NC="${NC:-\033[0m}"

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

# Merge hooks config into settings.json
HOOKS_FILE="$DOTFILES_PATH/claude/settings-hooks.json"
SETTINGS_FILE="$HOME/.claude/settings.json"

if [[ -f "$HOOKS_FILE" && -f "$SETTINGS_FILE" ]]; then
  jq -s '.[0] * .[1]' "$SETTINGS_FILE" "$HOOKS_FILE" > "${SETTINGS_FILE}.tmp" \
    && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE" \
    && echo "${GREEN}  ✓${NC} ~/.claude/settings.json ${DIM}(hooks merged)${NC}"
fi
