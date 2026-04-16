#!/bin/bash

cat << "EOF"
 ____                  _                 ______  _  __
/ ___|  ___ __ _ _ __ (_) ___           | __ ) \| |/ /
\___ \ / __/ _` | '_ \| |/ _ \   _____  |  _ \\ \ ' / 
 ___) | (_| (_| | | | | | (_) | |_____| | |_) / / . \ 
|____/ \___\__,_|_| |_|_|\___/          |____/_/|_|\_\

EOF

echo "Built by Sciano-BK"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js could not be found. Please install it."
    exit
fi

read -p "Clear Expo cache before starting? (y/n): " clean

echo ""
echo "Installing dependencies..."
npm install

if [[ "$clean" == "y" || "$clean" == "Y" ]]; then
    echo "Clearing cache and starting Expo..."
    npx expo start -c
else
    echo "Starting Expo..."
    npx expo start
fi