#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Colors
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'
RESET='\033[0m'

# Get current directory basename
dir_name=$(basename "$PWD")
status="${CYAN}${dir_name}${RESET}"

# Git information (only if in a git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

    # Get file change counts using porcelain format
    git_status=$(git --no-optional-locks status --porcelain 2>/dev/null)
    staged=$(echo "$git_status" | grep -c '^[MADRC]')
    unstaged=$(echo "$git_status" | grep -c '^.[MD]')
    untracked=$(echo "$git_status" | grep -c '^??')

    stats=""
    [ "$staged" -gt 0 ] && stats="+${staged}"
    [ "$unstaged" -gt 0 ] && stats="${stats:+$stats }~${unstaged}"
    [ "$untracked" -gt 0 ] && stats="${stats:+$stats }?${untracked}"

    status="${status} ${CYAN}(${branch}${stats:+ $stats})${RESET}"
fi

# Context usage with color coding
if [ -n "$input" ]; then
    current=$(echo "$input" | jq -r '.context_window.current_usage | .input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens' 2>/dev/null)
    size=$(echo "$input" | jq -r '.context_window.context_window_size' 2>/dev/null)

    if [ -n "$current" ] && [ -n "$size" ] && [ "$size" -gt 0 ] 2>/dev/null; then
        pct=$((current * 100 / size))

        if [ "$pct" -lt 50 ]; then
            color="${GREEN}"
        elif [ "$pct" -lt 75 ]; then
            color="${YELLOW}"
        else
            color="${RED}"
        fi

        status="${status} ${color}ctx:${pct}%${RESET}"
    fi
fi

# Mood from external analyzer
if [ -n "$input" ]; then
    session_id=$(echo "$input" | jq -r '.session_id // empty' 2>/dev/null)
    mood_file="/tmp/claude-mood/${session_id}.json"
    if [ -n "$session_id" ] && [ -f "$mood_file" ]; then
        mood_ts=$(jq -r '.ts // 0' "$mood_file" 2>/dev/null)
        now=$(date +%s)
        age=$(( now - mood_ts ))
        if [ "$age" -lt 300 ]; then
            mood_word=$(jq -r '.mood // empty' "$mood_file" 2>/dev/null)
            mood_color=$(jq -r '.color // empty' "$mood_file" 2>/dev/null)
            if [ -n "$mood_word" ] && [ -n "$mood_color" ]; then
                status="${status} \033[38;5;${mood_color}m${mood_word}${RESET}"
            fi

            # Alignment meter
            alignment=$(jq -r '.alignment // empty' "$mood_file" 2>/dev/null)
            if [ -n "$alignment" ]; then
                if [ "$alignment" -ge 80 ] 2>/dev/null; then
                    ac="${GREEN}"
                elif [ "$alignment" -ge 50 ]; then
                    ac="${YELLOW}"
                else
                    ac="${RED}"
                fi
                align_str="⚡${alignment}%"
                reason=$(jq -r '.reason // empty' "$mood_file" 2>/dev/null)
                [ -n "$reason" ] && align_str="${align_str} ${reason}"
                status="${status} ${ac}${align_str}${RESET}"
            fi
        fi
    fi
fi

printf "%b" "$status"
