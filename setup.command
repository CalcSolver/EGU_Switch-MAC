#!/bin/bash
cd "$(dirname "$0")"

echo "🔍 Checking System Requirements..."

# 1. Install Homebrew if missing
if ! command -v brew &> /dev/null; then
    echo "🍺 Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Load brew into current shell session immediately
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

# 3. Install mkcert for Local Trusted SSL Certificates
if ! command -v mkcert &> /dev/null; then
    echo "🔐 Installing mkcert for secure SSL streaming..."
    brew install mkcert
else
    echo "✅ mkcert is installed."
fi

# 4. Generate local CA and create the certificates
echo "🔑 Generating trusted SSL Certificate..."
mkcert -install
# Generates "cert.pem" and "key.pem" for your localhost and local network IP
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1 localhost.local

# 5. Clean and install Node modules
echo "📦 Installing project dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "--------------------------------------"
echo "✅ macOS Environment Setup Complete!"
echo "--------------------------------------"
