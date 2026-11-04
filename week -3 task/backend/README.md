# Flask Backend API

This is the backend service for the **Angular Flask Integration Demo**, built with Python, Flask, and Flask-CORS.

---

## Features

- **RESTful Endpoints:**
  - `GET /health` – System health check and uptime.
  - `GET /hello` – Static greeting response.
  - `POST /greet` – Dynamic personalized greeting with JSON payload validation.
- **CORS Support:** Pre-configured with `Flask-CORS` to allow requests from Angular (`http://localhost:4200`) and the standalone JavaScript demo.
- **Robust Validation:** Checks Content-Type, verifies JSON integrity, trims whitespace, and rejects empty strings with HTTP 400.
- **Consistent Error Handlers:** JSON formatted responses for 400, 404, 405, and 500 errors.

---

## Directory Structure

```text
backend/
├── app.py              # Main Flask application and API route definitions
├── requirements.txt    # Python package dependencies
└── README.md           # Backend documentation & setup guide
```

---

## Setup and Installation

### 1. Prerequisites
- Python 3.9 or higher (tested on Python 3.11)
- `pip` package manager

### 2. Create and Activate Virtual Environment (Recommended)

**On Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Server
```bash
python app.py
```
The server will start on:
```text
http://127.0.0.1:5000
```

---

## API Endpoints Reference

### 1. `GET /health`
Returns the operational health and uptime of the backend.

- **Request:**
  ```http
  GET /health HTTP/1.1
  Host: 127.0.0.1:5000
  ```
- **Response (200 OK):**
  ```json
  {
    "service": "Flask Backend",
    "status": "healthy",
    "timestamp": "2026-11-04T11:21:45.123456Z",
    "uptime_seconds": 12.34
  }
  ```

---

### 2. `GET /hello`
Returns a standard greeting.

- **Request:**
  ```http
  GET /hello HTTP/1.1
  Host: 127.0.0.1:5000
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Hello from Flask"
  }
  ```

---

### 3. `POST /greet`
Accepts a name in the request body and returns a personalized greeting.

- **Request:**
  ```http
  POST /greet HTTP/1.1
  Host: 127.0.0.1:5000
  Content-Type: application/json

  {
    "name": "Siddharth"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Hello Siddharth",
    "timestamp": "2026-11-04T11:22:10.456789Z"
  }
  ```
- **Validation Error Response (400 Bad Request):**
  ```json
  {
    "error": "Name cannot be empty or contain only whitespace."
  }
  ```

---

## Testing with cURL

```bash
# 1. Health check
curl http://127.0.0.1:5000/health

# 2. Hello endpoint
curl http://127.0.0.1:5000/hello

# 3. Greet endpoint (Valid)
curl -X POST http://127.0.0.1:5000/greet -H "Content-Type: application/json" -d "{\"name\": \"Siddharth\"}"

# 4. Greet endpoint (Empty name - should return 400)
curl -X POST http://127.0.0.1:5000/greet -H "Content-Type: application/json" -d "{\"name\": \"\"}"
```
