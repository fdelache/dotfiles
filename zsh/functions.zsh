# Custom functions

cheat() {
  devx claude -p "$*" --model haiku --allowedTools WebSearch --append-system-prompt "You are a concise cheat sheet. Provide ONLY the shortest possible answer - just the command, key combination, or flag needed. No explanations, no context, no formatting. Just the raw answer."
}

# wtp — worktree pool manager for shop/world
# functions.zsh is sourced early (via omacase rc) before the tec agent init in
# ~/.zshrc adds the toolchain bin to PATH, so _wtp isn't found yet. Ensure it's
# on PATH before initializing.
_wtp_bin="$HOME/.local/state/tec/toolchain/user_profile/bin"
[[ -x "$_wtp_bin/_wtp" ]] && PATH="$_wtp_bin:$PATH"
command -v _wtp >/dev/null 2>&1 && eval "$(_wtp init --zsh)"
unset _wtp_bin
