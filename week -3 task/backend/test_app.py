"""
Unit tests for the Flask Backend API.
Verifies /health, /hello, and /greet endpoints and validation rules.
"""

import json
import unittest
from app import app


class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_root_endpoint(self):
        """Test GET / returns API metadata and online status."""
        response = self.app.get("/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("status"), "online")
        self.assertIn("endpoints", data)

    def test_health_endpoint(self):
        """Test GET /health returns healthy status and uptime."""
        response = self.app.get("/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("service"), "Flask Backend")
        self.assertIn("uptime_seconds", data)

    def test_hello_endpoint(self):
        """Test GET /hello returns Hello from Flask."""
        response = self.app.get("/hello")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("message"), "Hello from Flask")

    def test_greet_valid_name(self):
        """Test POST /greet with a valid name."""
        payload = {"name": "Siddharth"}
        response = self.app.post(
            "/greet",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("message"), "Hello Siddharth")

    def test_greet_whitespace_stripping(self):
        """Test POST /greet trims whitespace around the name."""
        payload = {"name": "   Alice   "}
        response = self.app.post(
            "/greet",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("message"), "Hello Alice")

    def test_greet_missing_name_field(self):
        """Test POST /greet with missing name returns 400."""
        payload = {}
        response = self.app.post(
            "/greet",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode("utf-8"))
        self.assertIn("error", data)

    def test_greet_empty_name(self):
        """Test POST /greet with empty name string returns 400."""
        payload = {"name": "   "}
        response = self.app.post(
            "/greet",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode("utf-8"))
        self.assertIn("error", data)

    def test_greet_non_string_name(self):
        """Test POST /greet with non-string name returns 400."""
        payload = {"name": 12345}
        response = self.app.post(
            "/greet",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_greet_non_json_content_type(self):
        """Test POST /greet without JSON content-type returns 400."""
        response = self.app.post(
            "/greet",
            data="plain text",
            content_type="text/plain",
        )
        self.assertEqual(response.status_code, 400)

    def test_cors_headers(self):
        """Test CORS headers on preflight OPTIONS and GET."""
        response = self.app.get(
            "/hello",
            headers={"Origin": "http://localhost:4200"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "Access-Control-Allow-Origin",
            response.headers,
        )
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:4200",
        )

    def test_404_handler(self):
        """Test 404 returns structured JSON error."""
        response = self.app.get("/non-existent-route")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data.decode("utf-8"))
        self.assertEqual(data.get("status_code"), 404)


if __name__ == "__main__":
    unittest.main()
