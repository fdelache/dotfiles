#!/bin/bash

if [[ -z ${SPIN}  ]]; then
	echo 'Must be run within a Spin environment' >&2
	exit 1
fi

[[ ! -f ~/.gitconfig_local ]] && mv ~/.gitconfig ~/.gitconfig_local
cp gitconfig ~/.gitconfig

cp bash_aliases ~/.bash_aliases

echo "# Read the basic bash_aliases" >> ~/.zshrc
echo "[[ -f $HOME/.bash_aliases  ]] && source $HOME/.bash_aliases" >> ~/.zshrc
