# Uncomment this line to profile your zsh init script
# Uncomment the last line as well
# zmodload zsh/zprof

# If you come from bash you might have to change your $PATH.
export PATH=$HOME/bin:/usr/local/bin:/opt/homebrew/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME=""

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in ~/.oh-my-zsh/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  git
  tmux
  zsh-autosuggestions
)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# ssh
# export SSH_KEY_PATH="~/.ssh/rsa_id"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh

# Init pure promt
fpath+=$HOME/.zsh/pure
autoload -U promptinit; promptinit
prompt pure

# load dev, but only if present and the shell is interactive
if [[ -f /opt/dev/dev.sh ]] && [[ $- == *i* ]]; then
  source /opt/dev/dev.sh
fi

# Add chruby to PATH
export PATH="/opt/dev/sh/chruby:$PATH"
[[ -s "$HOME/.gvm/scripts/gvm" ]] && source "$HOME/.gvm/scripts/gvm"

# Read the basic bash_aliases
[[ -f $HOME/.bash_aliases ]] && source $HOME/.bash_aliases

# Read the private environment variables
[[ -f $HOME/.bash_env ]] && source $HOME/.bash_env

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

git_fuzzy_select_branch_commits() {
	local selected preview_bindings
	setopt localoptions noglobsubst noposixbuiltins pipefail no_aliases 2> /dev/null
	preview_bindings="--bind page-up:preview-page-up,page-down:preview-page-down"
	selected=( $(git list-branch-commits |
		FZF_DEFAULT_OPTS="--height ${FZF_TMUX_HEIGHT:-60%} $preview_bindings $FZF_DEFAULT_OPTS -n2..,.. \
		--tiebreak=index $FZF_CTRL_R_OPTS +m" fzf --preview="git show {}" ) )
	LBUFFER="${LBUFFER}${selected}"
	local ret=$?
	zle reset-prompt
	return $ret
}

zle     -N   git_fuzzy_select_branch_commits
bindkey '^G' git_fuzzy_select_branch_commits
if [ -e /Users/franckdelache/.nix-profile/etc/profile.d/nix.sh ]; then . /Users/franckdelache/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/franckdelache/Downloads/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/franckdelache/Downloads/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/franckdelache/Downloads/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/franckdelache/Downloads/google-cloud-sdk/completion.zsh.inc'; fi

[[ -f /opt/dev/sh/chruby/chruby.sh ]] && { type chruby >/dev/null 2>&1 || chruby () { source /opt/dev/sh/chruby/chruby.sh; chruby "$@"; } }

[[ -x /opt/homebrew/bin/brew ]] && eval $(/opt/homebrew/bin/brew shellenv)

# Export the right tty for GPG (helps with spin signing)
export GPG_TTY=$(tty)

# Uncomment to print out profiling results
# You need to also uncomment the first line
# zprof
