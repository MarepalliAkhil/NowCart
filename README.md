# NowCart — Real-Time Personalized Discovery & Recommendation Engine

**NowCart** is an end-to-end, real-time personalized recommendation and discovery microservices platform built for modern e-commerce. It features multi-modal product embeddings, PyTorch session intent GRU models, LightGBM multi-task reranking with diversity caps, DPDP-compliant guardrails, and RAG outfit bundle generation.

---

## 🚀 Key Features

*   **⚡ Low Latency Candidates Retrieval**: Multi-modal 256-d product vectors indexed with **Faiss** ANN search ($< 10\text{ms}$ latency).
*   **🧠 Real-Time Session Intent Tracking**: Sequential PyTorch **GRU neural network** updating intent vectors live on every clickstream event (`view`, `click`, `cart`, `purchase`).
*   **📊 LightGBM Reranking & 35% Diversity Cap**: Multi-task candidate scoring with a deterministic post-processing guardrail strictly enforcing that no single product category exceeds **35%** of returned feed items.
*   **🔍 Query Complexity-Based Semantic Search**: Cost-aware query router that bypasses expensive LLM calls for simple queries ($\le 3$ words), logging routing paths and token costs.
*   **👗 RAG Outfit Bundles ("Complete the Look")**: Graph-backed complementary item retrieval paired with a single-prompt LLM generating natural-language styling explanations.
*   **🛡️ DPDP Data Protection & Guardrail Layer**: Data minimization checks, PII redaction (email/phone scrubbing in queries), consent overrides, rule-based explainability reasons, and compliance audit logging.
*   **🎨 React 18 + TypeScript + Tailwind UI**: Polished e-commerce store with an interactive Session Intent Simulator, Cold-Start mode toggle, and live microservices health drawer.

---

## 📐 System Architecture & Recommendation Pipeline

NowCart consists of 8 modular microservices orchestrated via an API Gateway, powering real-time personalization, vector discovery, and privacy guardrails.

### 1. Recommendation Pipeline & Cold-Start Fallback Flow

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + TS)"]
        UI["User Activity / Feed Request"]
    end

    subgraph GW["API Gateway (:8000) & Guardrail (:8006)"]
        DPDP{"DPDP Consent &<br/>Cold-Start Check"}
    end

    subgraph ColdStart["Cold-Start Fallback Path"]
        CS["Popularity & Freshness Baseline<br/>(Top Rated & Trending Items)"]
    end

    subgraph Pipeline["Personalized Recommendation Pipeline"]
        direction TB
        Session["1. PyTorch Session GRU (:8002)<br/>Updates 256-d Intent Vector Live"]
        Retrieval["2. Two-Tower Retrieval Service (:8001)<br/>Faiss 256-d ANN Candidate Search (<10ms)"]
        Rerank["3. Multi-Task Rerank Service (:8003)<br/>LightGBM Scoring + 35% Category Cap"]
        RAG["4. RAG Bundle & Explanation Service (:8005)<br/>LLM Outfit Bundling + Natural Language Reasons"]
        
        Session --> Retrieval --> Rerank --> RAG
    end

    UI --> DPDP
    DPDP -- "No Session / Consent Off" --> CS
    DPDP -- "Active Session & Consent Active" --> Session
    
    CS --> Response["Render Final Personalized Feed"]
    RAG --> Response
```

### 2. Microservices Architecture Topology

```mermaid
graph TD
    UI[React 18 + TS Frontend] -->|REST API| GW[API Gateway :8000]
    
    GW --> GR[Guardrail Service :8006<br/>DPDP & PII Redaction]
    GW --> SS[Session Service :8002<br/>PyTorch Session GRU]
    GW --> RS[Retrieval Service :8001<br/>Faiss 256-d ANN Search]
    GW --> RK[Rerank Service :8003<br/>LightGBM + 35% Diversity Cap]
    GW --> SCH[Search Service :8004<br/>Query Complexity Router]
    GW --> BS[Bundle Service :8005<br/>Product Graph & RAG Bundles]

    classDef gateway fill:#6E2A3A,stroke:#1C1B19,stroke-width:2px,color:#fff;
    classDef service fill:#1C1B19,stroke:#E7E2DB,stroke-width:1px,color:#fff;
    classDef client fill:#B08A2E,stroke:#1C1B19,stroke-width:2px,color:#fff;

    class GW gateway;
    class GR,SS,RS,RK,SCH,BS service;
    class UI client;
```

For the complete end-to-end Mermaid sequence diagram, refer to **[docs/architecture.md](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/architecture.md)**.

---

## 🛠️ Quick Start & Running locally

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Python 3.10+ (for local development/notebooks)

### Spin up the Full Stack with One Command:

```bash
docker-compose up --build
```

This starts all 8 services and the React frontend:

| Component | Port / URL | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:5173` | React + TypeScript Store & Session Simulator |
| **API Gateway** | `http://localhost:8000` | Unified REST Single Entrypoint |
| **Retrieval Service** | `http://localhost:8001` | Faiss ANN Candidate Retrieval |
| **Session Service** | `http://localhost:8002` | Session Intent Tracking GRU |
| **Rerank Service** | `http://localhost:8003` | LightGBM Scoring & Diversity Guardrail |
| **Search Service** | `http://localhost:8004` | Semantic Search & Complexity Router |
| **Bundle Service** | `http://localhost:8005` | "Complete the Look" RAG Outfit Bundles |
| **Guardrail Service** | `http://localhost:8006` | PII Scrubbing, Consent & DPDP Audit Logs |

---

## 🧪 Running Benchmarks & Integration Tests

### Run API Gateway & Stack Latency Benchmark:
```bash
python benchmark_stack.py
```

### Run Service Unit & Integration Tests:
```bash
# Guardrail & DPDP Compliance Integration Tests
python backend/services/guardrail_service/test_guardrail.py

# Reranker Diversity Cap Unit Test
python backend/services/rerank_service/test_rerank.py
```

---

## 📚 Documentation Links

- **[System Architecture & Sequence Diagram](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/architecture.md)** — Detailed Mermaid workflow from clickstream events to frontend presentation.
- **[Cost Per Inference & Production Scale Roadmap](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/cost_per_inference.md)** — Itemized latency benchmarks, token cost breakdowns, and 10k RPS scaling plan.
- **[DPDP Compliance Framework](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/dpdp_compliance.md)** — Analysis of data minimization, consent, PII redaction, and explainability under DPDP.
- **[8-Minute Live Demo Presentation Walkthrough](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/demo_script.md)** — Step-by-step presentation script covering home feed, session simulator, search, and architecture.
- **[Executive Business Pitch & ROI Framework](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/business_pitch.md)** — Business value metrics (+25% CTR, +15% Add-to-Cart), cost breakdown, and roadmap.
