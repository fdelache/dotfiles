alias git-remove-untracked='git fetch --prune 1>/dev/null && git branch -vv | grep -v "\* " | egrep ": (disparue|gone)\]" | awk "{print \$1}" | xargs git branch -D' 

alias be='bundle exec'

# Move ourself into our sandbox for Shopify/shopify
alias sbx='cd ~/sandbox/github.com/Shopify/shopify'

# Configure BetterTouchBar
export BTT_GIT_WORKING_DIR=~/src/github.com/Shopify/shopify
export BTT_EVENTKIT_CALENDAR_NAMES='franck.delache@shopify.com'

# Extra Git aliases
alias glm='git fetch origin +master:master'

# fzf config
export FZF_DEFAULT_COMMAND="rg --files --hidden --ignore-file $HOME/.config/ripgrep/ignore"
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"

# Rubymine configuration
alias mine="__shadowenv_data= mine"
