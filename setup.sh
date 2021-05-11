#!/bin/bash

if [[ -z ${SPIN}  ]]; then
	echo 'Must be run within a Spin environment' >&2
	exit 1
fi

mv ~/.gitconfig ~/.gitconfig_local
cp gitconfig ~/.gitconfig

