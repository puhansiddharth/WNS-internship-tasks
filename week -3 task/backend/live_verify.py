"""
Live end-to-end integration test runner.
Spins up the Flask application on http://127.0.0.1:5000 and tests all endpoints
via real HTTP requests over the network loopback.
"""

import json
import threading
import time
import urllib.request
import urllib.error
from app import app

def run_server():
    # Run with debug=False so it doesn't fork sub-processes
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)

def verify_all():
    print("=" * 60)
    print("STARTING LIVE FLASK ENDPOINT VERIFICATION")
    print("=" * 60)

    # 1. Start server in daemon thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1.5)  # Allow socket bind

    base_url = "http://127.0.0.1:5000"

    # Test 1: GET /health
    print("\n[1] Testing GET /health ...")
    req = urllib.request.Request(f"{base_url}/health", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"    Status: {resp.status} OK")
        print(f"    Payload: {json.dumps(data)}")
        assert data.get("status") == "healthy"
        assert data.get("service") == "Flask Backend"

    # Test 2: GET /hello
    print("\n[2] Testing GET /hello ...")
    req = urllib.request.Request(f"{base_url}/hello", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"    Status: {resp.status} OK")
        print(f"    Payload: {json.dumps(data)}")
        assert data.get("message") == "Hello from Flask"

    # Test 3: POST /greet (Valid Payload)
    print("\n[3] Testing POST /greet (Valid: Siddharth) ...")
    payload = json.dumps({"name": "Siddharth"}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/greet",
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"    Status: {resp.status} OK")
        print(f"    Payload: {json.dumps(data)}")
        assert data.get("message") == "Hello Siddharth"

    # Test 4: POST /greet (Empty Payload - Expecting 400 Bad Request)
    print("\n[4] Testing POST /greet (Invalid: Empty Name) ...")
    bad_payload = json.dumps({"name": "   "}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/greet",
        data=bad_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(req)
        assert False, "Expected HTTP 400 but succeeded!"
    except urllib.error.HTTPError as err:
        assert err.code == 400
        err_data = json.loads(err.read().decode("utf-8"))
        print(f"    Expected Status: {err.code} Bad Request")
        print(f"    Payload: {json.dumps(err_data)}")
        assert "error" in err_data

    # Test 5: CORS Header Verification
    print("\n[5] Testing CORS Headers for Origin http://localhost:4200 ...")
    cors_req = urllib.request.Request(
        f"{base_url}/hello",
        headers={"Origin": "http://localhost:4200"}
    )
    with urllib.request.urlopen(cors_req) as resp:
        allow_origin = resp.headers.get("Access-Control-Allow-Origin")
        print(f"    Access-Control-Allow-Origin: {allow_origin}")
        assert allow_origin == "http://localhost:4200"

    print("\n" + "=" * 60)
    print("ALL 5 LIVE HTTP INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    verify_all()
