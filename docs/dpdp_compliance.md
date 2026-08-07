# NowCart DPDP Compliance Framework

This document outlines how the **NowCart** real-time recommendation and discovery engine satisfies key data privacy obligations under DPDP-style (Digital Personal Data Protection) regulations.

---

## 🔒 1. Consent-Aware Personalization (Section 6)
- **Principle**: Personal data can only be processed for specific, lawful purposes with unambiguous user consent.
- **Implementation**:
  - The API Gateway accepts a boolean `consent` flag alongside every search or recommendation request.
  - If `consent = false`, the `guardrail_service` preprocess step intercepts the request, blocks personalization context, and forces a fallback to non-personalized, popularity-based recommendations.
  - No active session-intent tracking history or user profiles are accessed or stored for non-consenting users.

---

## 🔍 2. Data Minimization & Security (Section 4)
- **Principle**: Only collect and process the minimum necessary personal data required to fulfill the service function.
- **Implementation**:
  - **Key Blocking**: The `guardrail_service` runs data minimization checks on incoming requests. It blocks any payload containing raw PII fields/keys (e.g. `"email"`, `"phone"`, `"phone_number"`, `"ssn"`, `"address"`, `"name"`) and immediately returns a `400 Bad Request` block.
  - **Implicit Vectorization**: Personalization relies on abstracted, numerical item embeddings and category flags rather than storing user identifiers or attributes.

---

## 🛡️ 3. PII Redaction & Purpose Limitation (Section 5)
- **Principle**: Prevent personal data leaks into audit logging pipelines, preserving privacy and limiting purpose-creep.
- **Implementation**:
  - Search queries are parsed in real time. Any free-text queries containing emails, phone numbers, or credit card numbers are scrubbed and replaced with `[REDACTED_EMAIL]` or `[REDACTED_PHONE]` before entering internal retrieval indexes or search logs.
  - Unredacted query payloads never reach the audit log or database.

---

## 📝 4. Deterministic Explainability & Auditing (Section 11)
- **Principle**: Users have a right to know the logic behind automated decisions (e.g., personalized recommended listings).
- **Implementation**:
  - Every recommendation output returned by the `api_gateway` undergoes compliance verification in `guardrail_service` to ensure it carries a short, rule-based, machine-readable explanation `reason`.
  - Non-explainable outputs are intercepted and decorated with default explainability reasons before being sent to the user.
  - System checks (checks passed, consent status, redaction warnings) are appended to a tamper-evident, local compliance audit log (`data/processed/guardrail_audit.log`) for internal auditing.
