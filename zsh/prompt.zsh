# World-aware prompt
# Overrides Omacase's default prompt with Shopify World support

# Enable prompt substitution
setopt PROMPT_SUBST

# Capture command start time (override Omacase's preexec)
preexec() {
  cmd_start_time=$SECONDS
}

# Build prompt components (override Omacase's precmd)
precmd() {
  local exit_code=$?

  # Set window title to current directory
  print -Pn "\e]0;%~\a"

  # Calculate command execution time
  if [[ -n $cmd_start_time ]]; then
    local duration=$((SECONDS - cmd_start_time))
    local duration_display=""

    if (( duration < 60 )); then
      duration_display="${duration}s"
    elif (( duration < 3600 )); then
      local mins=$((duration / 60))
      local secs=$((duration % 60))
      duration_display="${mins}m${secs}s"
    else
      local hours=$((duration / 3600))
      local mins=$(((duration % 3600) / 60))
      duration_display="${hours}h${mins}m"
    fi

    # Color based on exit code
    if (( exit_code == 0 )); then
      LAST_CMD_TIME="%F{green}[${duration_display}]%f"
    else
      LAST_CMD_TIME="%F{red}[${duration_display}]%f"
    fi

    unset cmd_start_time
  else
    LAST_CMD_TIME=""
  fi

  # Build path display with World support
  # -z flag outputs zsh-compatible escape sequences for proper RPROMPT positioning
  if command -v worldpath &>/dev/null; then
    PROMPT_PATH=$(worldpath -z 2>/dev/null)
  fi
  [[ -z "$PROMPT_PATH" ]] && PROMPT_PATH="%~"
}

# Set prompts
PROMPT='${PROMPT_PATH} %F{cyan}➜%f '
RPROMPT='${LAST_CMD_TIME}'
