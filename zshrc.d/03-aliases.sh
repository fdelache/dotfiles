# Common aliases
alias l='ls -lah'
alias la='ls -lAh'
alias ll='ls -lh'
alias ls='ls -G'
alias lsa='ls -lah'

function git_main_branch() {
  def=$(git remote show origin | sed -n '/HEAD branch/s/.*: //p')
  echo "$def"
}

# Common git aliases
alias gcm='git checkout $(git_main_branch)'
alias gl='git pull'