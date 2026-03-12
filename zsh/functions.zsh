# Custom functions

cheat() {
  devx claude -p "$*" --model haiku --allowedTools WebSearch --append-system-prompt "You are a concise cheat sheet. Provide ONLY the shortest possible answer - just the command, key combination, or flag needed. No explanations, no context, no formatting. Just the raw answer."
}

# wtp — worktree pool manager for shop/world
export PATH="$HOME/src/github.com/shopify-playground/wtp/bin:$PATH"
[[ -f "$HOME/src/github.com/shopify-playground/wtp/shell/wtp.zsh" ]] && source "$HOME/src/github.com/shopify-playground/wtp/shell/wtp.zsh"
