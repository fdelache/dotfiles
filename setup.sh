#!/bin/bash

if [[ -z ${SPIN} ]]; then
  echo 'Must be run within a Spin environment' >&2
  exit 1
fi

# Install kitty terminfo, so we can use kitty properly in spin
sudo apt-get install kitty-terminfo

# Configure zsh shell extensions
mkdir -p ~/.zshrc.d/
for file in "$(pwd)"/zshrc.d/*.sh; do
  if [[ -e $file ]]; then
    ln -sfn "$file" ~/.zshrc.d/
  fi
done

# Configure git
ln -s "$(pwd)/gitconfig" ~/.gitconfig
ln -s "$(pwd)/gitignore" ~/.gitignore
