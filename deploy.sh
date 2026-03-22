#!/bin/bash

# 🚀 Resonance AI Music - Production Deployment Script
# Run this script to deploy your application to https://resonanceaimusic.com

echo "🎵 Starting Resonance AI Music Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for TypeScript errors."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🌐 Ready to deploy to production!"
echo ""
echo "Next steps:"
echo "1. Login to Vercel: vercel login"
echo "2. Deploy to production: vercel --prod"
echo "3. Configure custom domain: vercel domains add resonanceaimusic.com"
echo ""

echo "📱 Chrome Extension Setup:"
echo "1. Open Chrome → chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' → select chrome-extension folder"
echo "4. Configure API key from https://resonanceaimusic.com"
echo ""

echo "🎯 Deployment Commands:"
echo "vercel login"
echo "vercel --prod"
echo "vercel domains add resonanceaimusic.com"
echo ""

echo "🎉 Your Resonance AI Music platform is ready for production!"
echo "Visit: https://resonanceaimusic.com"
echo ""