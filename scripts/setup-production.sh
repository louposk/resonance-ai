#!/bin/bash

echo "🚀 Setting up Resonance AI for Production"
echo "========================================="

echo ""
echo "📋 Step 1: Get your API keys from these services:"
echo "1. OpenAI API: https://platform.openai.com/api-keys"
echo "2. Spotify API: https://developer.spotify.com/dashboard"
echo "3. YouTube API: https://console.developers.google.com/"
echo "4. Neon Database: https://neon.tech/"
echo "5. Upstash Redis: https://upstash.com/"

echo ""
echo "🔑 Step 2: Set environment variables in Vercel:"
echo "Run these commands with your actual API keys:"
echo ""

cat << 'EOF'
npx vercel env add OPENAI_API_KEY production
npx vercel env add SPOTIFY_CLIENT_ID production
npx vercel env add SPOTIFY_CLIENT_SECRET production
npx vercel env add YOUTUBE_API_KEY production
npx vercel env add DB_HOST production
npx vercel env add DB_NAME production
npx vercel env add DB_USER production
npx vercel env add DB_PASSWORD production
npx vercel env add REDIS_HOST production
npx vercel env add REDIS_PORT production
npx vercel env add REDIS_PASSWORD production
npx vercel env add REDIS_URL production
npx vercel env add JWT_SECRET production
EOF

echo ""
echo "🚀 Step 3: Deploy the full application:"
echo "npx vercel --prod"

echo ""
echo "✨ Your Resonance AI will then have full functionality:"
echo "- 🎵 Real song analysis with OpenAI GPT-4"
echo "- 🎼 Spotify and YouTube integration"
echo "- 💾 Database caching for faster responses"
echo "- 🔒 JWT authentication for API access"
echo "- ⚡ Redis caching for optimal performance"