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

# Install zsh-autosuggestions plugin
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Install zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Install pure prompt
git clone https://github.com/sindresorhus/pure.git "$HOME/.zsh/pure"

# Install vim plugins
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim

# Install molokai vim theme
mkdir -p ~/.vim/colors
curl -fsSL https://raw.githubusercontent.com/tomasr/molokai/master/colors/molokai.vim --output ~/.vim/colors/molokai.vim

# https://github.com/VundleVim/Vundle.vim/issues/511#issuecomment-134251209
echo | echo | vim +PluginInstall +qall &>/dev/null

###############################
# Set personal configuration
###############################
[[ ! -f ~/.gitconfig_local ]] && mv ~/.gitconfig ~/.gitconfig_local
ln -s $(pwd)/gitconfig ~/.gitconfig

ln -s $(pwd)/bash_aliases ~/.bash_aliases

[[ -e ~/.zshrc ]] && mv ~/.zshrc ~/.zshrc.backup
ln -s $(pwd)/zshrc ~/.zshrc
ln -s $(pwd)/tmux.conf ~/.tmux.conf
ln -s $(pwd)/vimrc ~/.vimrc

