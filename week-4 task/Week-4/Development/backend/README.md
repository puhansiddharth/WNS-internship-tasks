# AI Assistant Web Application - Backend (Flask & MongoDB)

A modular, production-ready Flask REST API backend providing user authentication (JWT with server-side revocation), MongoDB persistence, and provider-configurable AI chat completion supporting both **Groq** (primary) and **OpenAI** (fallback) through the official OpenAI Python SDK.

---

## 1. Architecture Overview

The backend is built following clean architectural patterns and the Flask Application Factory pattern:

```
backend/
├── app.py                  # Application factory, CORS, blueprints, error handlers & health check
├── config.py               # Centralized environment configuration
├── requirements.txt        # Production & testing dependencies
├── .env.example            # Sample environment variables
├── .gitignore              # Ignored files (secrets, bytecode, test artifacts)
│
├── ai/                     # AI Integration Module
│   ├── __init__.py
│   ├── provider.py         # Provider factory (Groq & OpenAI via OpenAI SDK)
│   ├── service.py          # Chat completion execution & error mapping
│   └── routes.py           # /api/ai/chat & /api/ai/provider endpoints
│
├── auth/                   # Authentication & Authorization Module
│   ├── __init__.py
│   ├── routes.py           # /api/auth/register, /login, /logout, /me
│   └── services.py         # scrypt password hashing, JWT creation & @token_required
│
├── database/               # MongoDB Data Layer
│   ├── __init__.py
│   ├── connection.py       # PyMongo connection management & index initialization
│   └── models.py           # User and RevokedToken data access models
│
└── tests/                  # Pytest Automated Test Suite
    ├── __init__.py
    ├── conftest.py         # Shared fixtures, isolated mongomock & auth helpers
    ├── test_database.py    # Tests for models, indexes & password verification
    ├── test_auth.py        # Tests for registration, login, logout, and token revocation
    └── test_ai.py          # Tests for AI provider switching, validation & mock chat
```

---

## 2. Technology Stack

- **Runtime & Web Framework:** Python 3.11+, Flask 3.1
- **Cross-Origin Resource Sharing:** Flask-CORS (configured for Angular frontend at `http://localhost:4200`)
- **Database:** MongoDB via PyMongo (with `mongomock` for zero-dependency local testing)
- **Authentication:** PyJWT (HS256) with unique JTI claims & MongoDB-backed token revocation
- **Password Security:** Werkzeug salted `scrypt` hashing
- **AI Engine:** Official `openai` Python SDK configured with Groq API endpoint (`https://api.groq.com/openai/v1`) and OpenAI endpoint (`https://api.openai.com/v1`)
- **Testing:** `pytest` with mocked AI calls ensuring zero credit consumption during test runs

---

## 3. Environment Configuration

Create a `.env` file in `Week-4/Development/backend/` by copying `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables Reference

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `FLASK_ENV` | Environment mode (`development` or `production`) | `development` |
| `PORT` | Local server port | `5000` |
| `SECRET_KEY` | Flask secret key for sessions | `dev-secret-key-change-in-production` |
| `JWT_SECRET_KEY` | Secret key used to sign JWT tokens | `jwt-secret-key-change-in-production` |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | Token validity duration | `60` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | Database name | `week4_ai_assistant` |
| `AI_PROVIDER` | Active AI provider (`groq` or `openai`) | `groq` |
| `GROQ_API_KEY` | Your Groq API key from console.groq.com | `gsk_...` |
| `GROQ_MODEL` | Groq LLM model identifier | `llama-3.3-70b-versatile` |
| `GROQ_BASE_URL` | Groq OpenAI-compatible base URL | `https://api.groq.com/openai/v1` |
| `OPENAI_API_KEY` | OpenAI API key (for fallback/alternative) | `sk-...` |
| `OPENAI_MODEL` | OpenAI model identifier | `gpt-4o-mini` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for Angular app | `http://localhost:4200` |

---

## 4. Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Your Groq API Key
1. Sign in to [Groq Console](https://console.groq.com/).
2. Generate an API Key under **API Keys**.
3. Set `GROQ_API_KEY=gsk_your_key_here` in `.env`.

### 3. Start MongoDB
Ensure MongoDB is running locally on port 27017 or provide a cloud MongoDB Atlas URI in `MONGODB_URI`.

### 4. Run the Backend Server
```bash
python app.py
```
The server will start at `http://127.0.0.1:5000`.

---

## 5. Automated Testing

Run the test suite with verbose output:

```bash
python -m pytest tests/ -v
```

All 17 unit and integration tests execute completely offline using `mongomock` and mocked AI clients, guaranteeing that **no real AI credits are consumed**.

---

## 6. API Endpoint Documentation

### Central & Health

#### `GET /api/health`
Returns system status, database connectivity, and active AI provider.

- **Response `200 OK`:**
  ```json
  {
    "active_ai_provider": "groq",
    "database": "connected",
    "environment": "development",
    "service": "AI Assistant Backend",
    "status": "healthy"
  }
  ```

---

### Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new user account, hashes password using `scrypt`, stores in MongoDB with unique email constraint, and issues a JWT token.

- **Request Body:**
  ```json
  {
    "name": "Siddharth Puhan",
    "email": "siddharth@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "message": "User registered successfully",
    "token": "<JWT_STRING>",
    "user": {
      "id": "67301...",
      "name": "Siddharth Puhan",
      "email": "siddharth@example.com",
      "created_at": "2026-11-10T00:00:00+00:00"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing field, invalid email format, or password < 6 chars.
  - `409 Conflict`: Email already registered.

#### `POST /api/auth/login`
Validates user credentials and issues a signed JWT.

- **Request Body:**
  ```json
  {
    "email": "siddharth@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Login successful",
    "token": "<JWT_STRING>",
    "user": {
      "id": "67301...",
      "name": "Siddharth Puhan",
      "email": "siddharth@example.com"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Invalid email or password.

#### `POST /api/auth/logout`
Revokes the current JWT token by adding its `jti` to the `revoked_tokens` collection with an automated TTL expiration index.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "message": "Successfully logged out",
    "status": "token_revoked"
  }
  ```

#### `GET /api/auth/me`
Retrieves sanitized user profile for the authenticated user.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": "67301...",
      "name": "Siddharth Puhan",
      "email": "siddharth@example.com",
      "created_at": "2026-11-10T00:00:00+00:00"
    }
  }
  ```

---

### AI Assistant (`/api/ai`)

#### `POST /api/ai/chat`
Processes an AI prompt and returns response generated by Groq (LLaMA 3.3 70B) or OpenAI.

- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "prompt": "Explain the difference between synchronous and asynchronous execution in 3 sentences.",
    "system_message": "You are a concise computer science tutor."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "data": {
      "model": "llama-3.3-70b-versatile",
      "provider": "groq",
      "reply": "Synchronous execution performs tasks sequentially, where each operation must complete before the next begins. Asynchronous execution allows tasks to execute concurrently without waiting for previous operations to finish. This improves responsiveness, especially in I/O-bound applications.",
      "usage": {
        "completion_tokens": 48,
        "prompt_tokens": 32,
        "total_tokens": 80
      }
    },
    "success": true,
    "user_id": "67301..."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Empty prompt or prompt length > 4000 characters.
  - `401 Unauthorized`: Missing or revoked JWT token.
  - `502 Bad Gateway`: AI provider upstream error, rate limit, or invalid API key.

#### `GET /api/ai/provider`
Returns metadata about available AI providers and active model configuration without leaking secrets.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "active_model": "llama-3.3-70b-versatile",
    "active_provider": "groq",
    "providers": {
      "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.3-70b-versatile",
        "is_configured": true,
        "name": "groq"
      },
      "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
        "is_configured": false,
        "name": "openai"
      }
    }
  }
  ```

---

## 7. Security Implementations

1. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using Werkzeug's `scrypt` algorithm.
2. **Server-Side Token Revocation:** Each issued JWT includes a unique `jti` claim. Upon logout, the `jti` is inserted into MongoDB's `revoked_tokens` collection with a TTL index, invalidating the token immediately.
3. **Protected Endpoints:** Protected routes use `@token_required` decorator to verify token validity, signature, revocation status, and user existence before executing business logic.
4. **CORS Isolation:** CORS is strictly configured to only allow the Angular development frontend (`http://localhost:4200`).
5. **No Secret Leakage:** Provider info and error responses never return API keys or sensitive internals to the client.
