#!/bin/bash

echo "🔑 Adding Environment Variables to Vercel"
echo "========================================"

# JWT Secret (already generated)
echo "Setting JWT Secret..."
echo "024a26f3c15baf97bf676cb069531fc19cdecb3bcda6b7cbef8daffd338d128793f58b8c96b778d5b459f234c48c0be8f90360794645f4495bdd5bd1afd786a3" | npx vercel env add JWT_SECRET production

echo ""
echo "Now add your API keys:"
echo "📝 Run these commands with your actual keys:"

cat << 'EOF'

# OpenAI API Key (from https://platform.openai.com/api-keys)
npx vercel env add OPENAI_API_KEY production
# Enter your key: sk-proj-...

# Spotify Credentials (from https://developer.spotify.com/dashboard)
npx vercel env add SPOTIFY_CLIENT_ID production
# Enter your client ID

npx vercel env add SPOTIFY_CLIENT_SECRET production
# Enter your client secret

# YouTube API Key (from https://console.developers.google.com/)
npx vercel env add YOUTUBE_API_KEY production
# Enter your key: AIzaSy...

# Database Connection (from https://neon.tech/)
npx vercel env add DB_HOST production
# Enter: ep-xxx.us-east-2.aws.neon.tech

npx vercel env add DB_NAME production
# Enter: neondb

npx vercel env add DB_USER production
# Enter: neondb_owner

npx vercel env add DB_PASSWORD production
# Enter your database password

# Redis Connection (from https://upstash.com/)
npx vercel env add REDIS_HOST production
# Enter: us1-xxx.upstash.io

npx vercel env add REDIS_PORT production
# Enter: 6379

npx vercel env add REDIS_PASSWORD production
# Enter your redis password

npx vercel env add REDIS_URL production
# Enter: rediss://default:password@host:6379

EOF

echo ""
echo "🚀 After adding all variables, deploy with:"
echo "npx vercel --prod"