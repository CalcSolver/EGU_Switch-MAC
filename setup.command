#!/bin/bash
cd "$(dirname "$0")"

echo "🔍 Checking System Requirements..."

# 1. Install Homebrew if missing
if ! command -v brew &> /dev/null; then
    echo "🍺 Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew is installed."
fi

# 2. Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "🟢 Node.js not found. Installing latest Node.js..."
    brew install node
else
    echo "✅ Node.js is installed ($(node -v))."
fi

# 3. Clean and install Node modules
echo "📦 Installing project dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "--------------------------------------"
echo "✅ macOS Environment Setup Complete!"
echo "--------------------------------------"
