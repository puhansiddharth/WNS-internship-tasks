# Vanilla JavaScript + Flask Integration Demo

This folder contains an independent, framework-free demonstration of how web browsers communicate directly with a Flask REST API using vanilla JavaScript and the modern `fetch()` API.

---

## Purpose

To demonstrate:
1. **Direct HTTP Communication:** How the browser issues `GET` and `POST` requests without frameworks like Angular or React.
2. **`fetch()` API Usage:** Making asynchronous network calls using `async` / `await` and promise resolution.
3. **HTTP Headers:** Setting headers like `Content-Type: application/json` and `Accept: application/json`.
4. **State Management in Vanilla JS:** Toggling button loading states, spinners, and enabling/disabling elements during in-flight network requests.
5. **CORS in Action:** Demonstrating how browser security enforces cross-origin policies and how `Flask-CORS` resolves them.

---

## File Structure

```text
javascript-demo/
├── index.html    # Clean HTML interface with semantic cards
├── style.css     # Responsive CSS styles with loading spinners and status boxes
├── script.js     # Vanilla JavaScript handling fetch(), validation, and DOM updates
└── README.md     # Documentation and testing instructions
```

---

## How to Run and Test

### Option 1: Direct File Opening
1. Ensure the Flask backend is running on `http://127.0.0.1:5000`:
   ```bash
   cd ../backend
   python app.py
   ```
2. Double-click `index.html` in your file explorer to open it in any modern browser (Chrome, Edge, Firefox).
3. The page automatically tests `GET /health` upon loading.
4. Click **Call /hello** to test `GET /hello`.
5. Enter a name (e.g., `Siddharth`) and click **Send Greeting** to test `POST /greet`.
6. Leave the name field blank and submit to observe how HTTP 400 validation errors are handled and presented.

### Option 2: Using Python's Built-in HTTP Server
For an authentic local web origin (`http://localhost:8000`):

```bash
cd javascript-demo
python -m http.server 8000
```
Then visit:
```text
http://localhost:8000
```
