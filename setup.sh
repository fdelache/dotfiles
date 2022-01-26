#!/bin/bash

if [[ -z ${SPIN}  ]]; then
	echo 'Must be run within a Spin environment' >&2
	exit 1
fi

###############################
# Install software
###############################
# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install vim plugins
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim

# https://github.com/VundleVim/Vundle.vim/issues/511#issuecomment-134251209
echo | echo | vim +PluginInstall +qall &>/dev/null

# Install fzf
sudo apt-get install -y fzf

###############################
# Set personal configuration
###############################
[[ ! -f ~/.gitconfig_local ]] && mv ~/.gitconfig ~/.gitconfig_local
cp gitconfig ~/.gitconfig

cp bash_aliases ~/.bash_aliases

cp zshrc ~/.zshrc
cp tmux.conf ~/.tmux.conf
cp vimrc ~/.vimrc
