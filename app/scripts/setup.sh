#!/bin/bash

# TimeSherpa Development Setup Script
# This script helps new contributors set up their development environment

echo "🚀 Welcome to TimeSherpa Setup!"
echo "================================"

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for .env file
echo ""
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your API keys:"
    echo "   - GEMINI_API_KEY"
    echo "   - SESSION_SECRET"
else
    echo "✅ .env file already exists"
fi

# Check for client_secret.json
echo ""
if [ ! -f client_secret.json ]; then
    echo "⚠️  client_secret.json not found!"
    echo "   Please follow these steps:"
    echo "   1. Go to https://console.cloud.google.com/"
    echo "   2. Create OAuth 2.0 credentials"
    echo "   3. Download and save as client_secret.json in the app directory"
else
    echo "✅ client_secret.json found"
fi

# Run tests
echo ""
echo "🧪 Running tests..."
npm test -- --passWithNoTests

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Ensure .env file has all required API keys"
echo "   2. Ensure client_secret.json is properly configured"
echo "   3. Run 'npm run dev' to start the development servers"
echo "   4. Visit http://localhost:3000"
echo ""
echo "Happy coding! 🎉" 