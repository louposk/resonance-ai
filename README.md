# 🎵 Music Info API

AI-powered music analysis API that provides song meanings, writing processes, and trivia by searching across Spotify and YouTube platforms.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Deep insights into song meanings and cultural significance
- 🎵 **Multi-Platform Search**: Search across Spotify and YouTube
- ⚡ **Smart Caching**: Redis-based caching to avoid duplicate AI processing
- 🔐 **Secure Authentication**: JWT tokens and API key management
- 📊 **Rich Data**: Comprehensive song information and analysis
- 🚀 **RESTful API**: Clean, well-documented REST endpoints
- 🎨 **Beautiful UI**: Professional minimal interface with dark theme

## 🏗️ Architecture

Built with Test-Driven Development (TDD) approach:

- **Backend**: Node.js + TypeScript + Express.js
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for high-performance caching
- **AI**: OpenAI GPT-4 for song analysis
- **APIs**: Spotify Web API, YouTube Data API
- **Testing**: Jest with comprehensive test coverage
- **Security**: Helmet, CORS, rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- API Keys: OpenAI, Spotify, YouTube

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd music-info-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

4. **Start services**
```bash
# Start PostgreSQL and Redis (if not running)
# macOS with Homebrew:
brew services start postgresql
brew services start redis

# Linux with systemd:
sudo systemctl start postgresql
sudo systemctl start redis
```

5. **Run the application**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

6. **Access the application**
- Web Interface: http://localhost:3000
- API Documentation: http://localhost:3000/api
- Health Check: http://localhost:3000/health

## 🔧 Development

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Database Setup

The application automatically creates the required database tables on startup. For manual setup:

```sql
CREATE DATABASE music_info_db;
-- Tables are created automatically by the application
```

## 🔑 API Usage

### Authentication

1. **Register a user**
```bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "secure-password"}'
```

2. **Get your API key**
```bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "secure-password"}'
```

### Search Songs
```bash
curl -X GET "http://localhost:3000/api/songs/search?q=billie+jean+michael+jackson" \\
  -H "x-api-key: YOUR_API_KEY"
```

### Get AI Analysis
```bash
curl -X GET "http://localhost:3000/api/songs/SONG_ID/analysis" \\
  -H "x-api-key: YOUR_API_KEY"
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/api-key` - Generate new API key

### Songs
- `GET /api/songs/search` - Search for songs
- `GET /api/songs/:id` - Get song by ID
- `GET /api/songs/:id/analysis` - Get AI analysis
- `POST /api/songs` - Create new song
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song

## 📈 Rate Limits

- **General**: 100 requests per 15 minutes
- **Search**: 20 requests per minute
- **Analysis**: 10 requests per 5 minutes (AI-intensive)
- **Authentication**: 5 attempts per 15 minutes

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting per endpoint
- JWT token authentication
- API key management
- Input validation with Joi
- SQL injection prevention
- XSS protection

## 🌟 Example Response

```json
{
  "success": true,
  "data": {
    "song": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Billie Jean",
      "artist": "Michael Jackson",
      "album": "Thriller",
      "releaseYear": 1982
    },
    "analysis": {
      "meaning": "Billie Jean is about a man accused by a woman of being the father of her child...",
      "writingProcess": "Michael Jackson wrote this song based on his experiences...",
      "trivia": "This was the first video by a Black artist to receive heavy rotation on MTV...",
      "themes": ["false accusations", "fame", "media scrutiny"]
    }
  }
}
```

## 🧪 Testing

Comprehensive test suite with:
- Unit tests for all models and services
- Integration tests for API endpoints
- Mocked external services (Spotify, YouTube, OpenAI)
- Test coverage reporting

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Implement your feature
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the API documentation at `/api`
- Review the test files for usage examples

---

Built with ❤️ using TypeScript, Express.js, PostgreSQL, Redis, and AI magic. ✨