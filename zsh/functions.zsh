# Custom functions

cheat() {
  claude -p "$*" --model haiku --allowedTools WebSearch --append-system-prompt "You are a concise cheat sheet. Provide ONLY the shortest possible answer - just the command, key combination, or flag needed. No explanations, no context, no formatting. Just the raw answer."
}
