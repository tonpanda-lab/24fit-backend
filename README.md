# 24Fit Backend

NutriSimple backend auth API built with Node.js, Express, and MongoDB.

## Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (access + refresh tokens)
- **OAuth**: Google Sign-In

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your secrets:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry in days (default: 7) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Running the Server

```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/register` | Email/password registration |
| POST | `/v1/auth/login` | Email/password login |
| POST | `/v1/auth/google` | Google Sign-In |
| POST | `/v1/auth/refresh` | Refresh access token |
| POST | `/v1/auth/logout` | Revoke refresh token |

### Data Sync (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/sync/profile` | Push user profile |
| POST | `/v1/sync/meals` | Push meal entry |
| GET | `/v1/sync/data` | Fetch all user data |

## Project Structure

```
src/
├── index.js              # Server entry point
├── middleware/
│   └── auth.js           # JWT Bearer token middleware
├── models/
│   ├── User.js           # User model
│   ├── RefreshToken.js   # Refresh token model
│   └── UserData.js       # User data sync model
├── routes/
│   ├── auth.js           # Auth routes
│   └── sync.js           # Sync routes
└── utils/
    ├── jwt.js            # JWT utilities
    └── password.js       # Password hashing utilities
```

## License

ISC
