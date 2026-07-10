# Custom functions

cheat() {
  devx claude -p "$*" --model haiku --allowedTools WebSearch --append-system-prompt "You are a concise cheat sheet. Provide ONLY the shortest possible answer - just the command, key combination, or flag needed. No explanations, no context, no formatting. Just the raw answer."
}

# wtp — worktree pool manager for shop/world
command -v _wtp >/dev/null 2>&1 && eval "$(_wtp init --zsh)"

# git-remove-untracked — delete local branches whose PR was merged.
# World/Meteorite-aware: asks gitstream (via `gs`) whether each branch's PR is
# merged — the source of truth now that PRs move off GitHub. Before deleting a
# branch, it frees any wtp pool slot holding it.
#   --force / -f : also free+delete branches held by *dirty* pool slots
#                  (destroys uncommitted work). Default is skip-and-warn.
git-remove-untracked() {
  local force=0
  [[ "$1" == "--force" || "$1" == "-f" ]] && force=1

  if ! command -v gs >/dev/null 2>&1; then
    echo "git-remove-untracked: 'gs' CLI not found (needed for gitstream merge state)." >&2
    return 1
  fi

  # Branches we never auto-delete: trunk + wtp pool scaffolding (pool-N).
  local protected='^(main|master|pool-[0-9]+)$'
  local current
  current=$(git symbolic-ref --quiet --short HEAD 2>/dev/null)

  # 1. Ask gitstream if each local branch has a merged PR (per-branch --head).
  # Be defensive: Gitstream may have stale temporary refs or transient API/fetch
  # failures. Those should skip the affected branch, not abort the cleanup.
  local b pr_json pr_status first_error
  local -a merged
  for b in ${(f)"$(git for-each-ref --format='%(refname:short)' refs/heads/)"}; do
    [[ "$b" == "$current" ]] && continue
    [[ "$b" =~ $protected ]] && continue

    pr_json=$(gs pr list --head "$b" --state all --json --limit 20 2>&1)
    pr_status=$?
    if (( pr_status != 0 )); then
      first_error=$(printf '%s\n' "$pr_json" | grep -m1 -E 'fatal:|error:' 2>/dev/null)
      [[ -z "$first_error" ]] && first_error=${pr_json%%$'\n'*}
      [[ -z "$first_error" ]] && first_error="exit $pr_status"
      echo "⚠️  skipping '$b' — gitstream PR lookup failed: $first_error" >&2
      continue
    fi

    if echo "$pr_json" | jq -e 'any(.[]; .xGitstreamStateExtended == "merged")' >/dev/null 2>&1; then
      merged+=("$b")
    fi
  done

  if (( ${#merged} == 0 )); then
    echo "No merged branches to remove."
    return 0
  fi

  # 2. Map branch -> pool slot (and dirtiness) from wtp status, if available.
  local -A slot_of dirty_of
  if command -v _wtp >/dev/null 2>&1; then
    local line pool rest br
    while IFS= read -r line; do
      pool=${line%%:*}
      rest=${line#*: }
      br=${rest%% *}
      [[ "$br" == "free" ]] && continue
      slot_of[$br]=$pool
      [[ "$rest" == *"[dirty]"* ]] && dirty_of[$br]=1
    done < <(_wtp status 2>/dev/null)
  fi

  # 3. Free held slots (skip dirty unless --force), then delete.
  local -a to_delete
  for b in $merged; do
    if [[ -n "${slot_of[$b]}" ]]; then
      if [[ -n "${dirty_of[$b]}" && $force -eq 0 ]]; then
        echo "⚠️  skipping '$b' — held by ${slot_of[$b]} which is dirty (uncommitted work). Use --force to free and delete."
        continue
      fi
      echo "freeing ${slot_of[$b]} (branch '$b')..."
      if [[ -n "${dirty_of[$b]}" ]]; then
        _wtp free "${slot_of[$b]}" --force >/dev/null
      else
        _wtp free "${slot_of[$b]}" >/dev/null
      fi
    fi
    to_delete+=("$b")
  done

  if (( ${#to_delete} )); then
    git branch -D $to_delete
  else
    echo "Nothing deleted."
  fi
}
