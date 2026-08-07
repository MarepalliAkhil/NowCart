import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock

# Resolve project path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
sys.path.append(PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.api_gateway.main import app as gateway_app
from backend.services.guardrail_service.main import app as guardrail_app, AUDIT_LOG_FILE


class TestGuardrailIntegration(unittest.TestCase):
    """
    Integration tests validating guardrail preprocessing, postprocessing, PII redaction,
    consent-aware logic, and data minimization checks.
    """

    def setUp(self):
        self.gateway_client = TestClient(gateway_app)
        self.guardrail_client = TestClient(guardrail_app)
        
        # Reset audit log file
        if os.path.exists(AUDIT_LOG_FILE):
            os.remove(AUDIT_LOG_FILE)

    def tearDown(self):
        if os.path.exists(AUDIT_LOG_FILE):
            os.remove(AUDIT_LOG_FILE)

    def _setup_mock_transport(self, mock_httpx):
        """Helper to mock httpx to route calls to local test clients."""
        mock_client = MagicMock()
        
        def mock_post(url, json=None, **kwargs):
            if "/preprocess" in url:
                # Route to actual local guardrail endpoint
                return self.guardrail_client.post("/preprocess", json=json)
            elif "/postprocess" in url:
                # Route to actual local guardrail endpoint
                return self.guardrail_client.post("/postprocess", json=json)
            elif "/search" in url:
                # Mock search service response
                m_res = MagicMock()
                m_res.status_code = 200
                m_res.json.return_value = {
                    "results": [
                        {"product_id": "0108775015", "rerank_score": 0.85, "category": "Ladieswear", "reason": "Matches interest"}
                    ]
                }
                return m_res
            elif "/retrieve" in url:
                m_res = MagicMock()
                m_res.status_code = 200
                m_res.json.return_value = {"results": []}
                return m_res
            elif "/rerank" in url:
                m_res = MagicMock()
                m_res.status_code = 200
                m_res.json.return_value = {"results": []}
                return m_res
            return MagicMock(status_code=200, json=lambda: {})
            
        mock_client.post.side_effect = mock_post
        mock_httpx.return_value.__enter__.return_value = mock_client

    @patch("httpx.Client")
    def test_pii_in_query_is_redacted(self, mock_httpx):
        """
        Verifies PII (email/phone) in a search query is scrubbed before being logged or processed.
        """
        self._setup_mock_transport(mock_httpx)

        payload = {
            "query": "floral dress for test.user@example.com",
            "consent": True,
            "user_id": "USER_123"
        }
        
        res = self.gateway_client.post("/api/search", json=payload)
        self.assertEqual(res.status_code, 200)
        
        # Verify query returned to client is cleansed
        data = res.json()
        self.assertIn("[REDACTED_EMAIL]", data["query"])
        self.assertNotIn("test.user@example.com", data["query"])

        # Verify audit log exists and contains REDACTED logs, and does NOT contain raw email
        self.assertTrue(os.path.exists(AUDIT_LOG_FILE))
        
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            log_content = f.read()
            self.assertIn("[REDACTED_EMAIL]", log_content)
            self.assertNotIn("test.user@example.com", log_content)

    @patch("httpx.Client")
    def test_no_consent_user_gets_non_personalized_results(self, mock_httpx):
        """
        Verifies that a user with consent=False has personalization features cleared
        and falls back to non-personalized search/recommendation flows.
        """
        self._setup_mock_transport(mock_httpx)

        payload = {
            "query": "black dress",
            "consent": False,
            "user_features": {"recent_categories": ["Menswear"]}
        }
        
        res = self.gateway_client.post("/api/search", json=payload)
        self.assertEqual(res.status_code, 200)

        # Confirm the mock search call was made with blanked category preferences
        mock_client = mock_httpx.return_value.__enter__.return_value
        last_search_call_args = mock_client.post.call_args_list[1][1]
        self.assertEqual(last_search_call_args["json"]["recent_categories"], [])

    @patch("httpx.Client")
    def test_data_minimization_violation_block(self, mock_httpx):
        """
        Verifies that requests violating data minimization (passing raw email/phone keys) are blocked.
        """
        self._setup_mock_transport(mock_httpx)

        payload = {
            "query": "black dress",
            "consent": True,
            "user_features": {"email": "raw_user_email@example.com"} # VIOLATION!
        }
        
        res = self.gateway_client.post("/api/search", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Data minimization violation", res.json()["detail"])

    @patch("httpx.Client")
    def test_explainability_reason_present(self, mock_httpx):
        """
        Verifies that every recommended product in the final response carries a rule-based explainability reason.
        """
        # Customize search mock to return an item missing explanation
        mock_client = MagicMock()
        
        def mock_post(url, json=None, **kwargs):
            if "/preprocess" in url:
                return self.guardrail_client.post("/preprocess", json=json)
            elif "/postprocess" in url:
                return self.guardrail_client.post("/postprocess", json=json)
            elif "/search" in url:
                m_res = MagicMock()
                m_res.status_code = 200
                m_res.json.return_value = {
                    "results": [
                        {"product_id": "0111565001", "rerank_score": 0.9, "category": "Divided", "reason": None} # None reason
                    ]
                }
                return m_res
            return MagicMock(status_code=200, json=lambda: {})

        mock_client.post.side_effect = mock_post
        mock_httpx.return_value.__enter__.return_value = mock_client

        payload = {
            "query": "blue jacket",
            "consent": True
        }
        
        res = self.gateway_client.post("/api/search", json=payload)
        self.assertEqual(res.status_code, 200)
        
        data = res.json()
        for item in data["results"]:
            self.assertIsNotNone(item.get("reason"))
            self.assertNotEqual(item.get("reason"), "")


if __name__ == "__main__":
    unittest.main()
