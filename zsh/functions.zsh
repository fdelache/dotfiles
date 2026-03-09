# Custom functions

cheat() {
  devx claude -p "$*" --model haiku --allowedTools WebSearch --append-system-prompt "You are a concise cheat sheet. Provide ONLY the shortest possible answer - just the command, key combination, or flag needed. No explanations, no context, no formatting. Just the raw answer."
}

# Pi workspace — tmux-backed multi-task Pi session manager.
# Creates or reattaches to a tmux session running Pi.
# Tasks are managed via /tasks and /newtask inside Pi.
piw() {
  local session="pi-workspace"
  if tmux has-session -t "$session" 2>/dev/null; then
    tmux attach-session -t "$session"
  else
    tmux new-session -s "$session" -n "main" "pi"
  fi
}