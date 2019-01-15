alias git-remove-untracked='git fetch --prune && git branch -vv | grep -v "\* " | egrep ": (disparue|gone)\]" | awk "{print \$1}" | xargs git branch -D' 

alias be='bundle exec'

# Move ourself into our sandbox for Shopify/shopify
alias sbx='cd ~/sandbox/github.com/Shopify/shopify'

# Configure BetterTouchBar
export BTT_GIT_WORKING_DIR=~/src/github.com/Shopify/shopify

