alias git-remove-untracked='git fetch --prune 1>/dev/null && git branch -vv | grep -v "\* " | egrep ": (disparue|gone)\]" | awk "{print \$1}" | xargs git branch -D' 

# Extra Git aliases
alias glm='git fetch origin +master:master'

# fzf config
export FZF_DEFAULT_COMMAND="rg --files --hidden --ignore-file $HOME/.config/ripgrep/ignore"
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"

# Rubymine configuration
alias mine="__shadowenv_data= mine"

# Common aliases
alias l='ls -lah'
alias la='ls -lAh'
alias ll='ls -lh'
alias ls='ls -G'
alias lsa='ls -lah'

# Common git aliases
alias gcm='git checkout $(git_main_branch)'
alias gl='git pull'

alias gg='gitgud'

# Kill docker function
function kill_docker() {
	ps ax | grep -i docker | egrep -iv 'grep|com.docker.vmnetd' | awk '{print $1}' | xargs kill
}
