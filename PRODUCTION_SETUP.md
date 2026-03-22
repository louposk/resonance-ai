# Production Setup Guide for Resonance AI

## Required API Keys and Services

### 1. OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Create a new API key
- Add to Vercel environment variables as `OPENAI_API_KEY`

### 2. Spotify API
- Go to: https://developer.spotify.com/dashboard
- Create a new app
- Get Client ID and Client Secret
- Add to Vercel environment variables:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`

### 3. YouTube Data API
- Go to: https://console.developers.google.com/
- Enable YouTube Data API v3
- Create credentials (API Key)
- Add to Vercel environment variables as `YOUTUBE_API_KEY`

### 4. Database - Neon PostgreSQL
- Go to: https://neon.tech/
- Create a free PostgreSQL database
- Get connection details and add to Vercel environment variables:
  - `DB_HOST`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

### 5. Redis - Upstash
- Go to: https://upstash.com/
- Create a free Redis database
- Get connection details and add to Vercel environment variables:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_PASSWORD`
  - `REDIS_URL`

## Setting Environment Variables in Vercel

Run these commands to set environment variables:

```bash
npx vercel env add OPENAI_API_KEY
npx vercel env add SPOTIFY_CLIENT_ID
npx vercel env add SPOTIFY_CLIENT_SECRET
npx vercel env add YOUTUBE_API_KEY
npx vercel env add DB_HOST
npx vercel env add DB_NAME
npx vercel env add DB_USER
npx vercel env add DB_PASSWORD
npx vercel env add REDIS_HOST
npx vercel env add REDIS_PORT
npx vercel env add REDIS_PASSWORD
npx vercel env add REDIS_URL
npx vercel env add JWT_SECRET
```

## Database Setup

The application will automatically create tables on first run, but you can also run:

```bash
npm run db:migrate
```

## Deploy

Once all environment variables are set:

```bash
npx vercel --prod
```