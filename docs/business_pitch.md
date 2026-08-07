# NowCart Executive Business Pitch & ROI Framework

## 🎯 1. Executive Summary & Problem Statement

Modern e-commerce platforms lose billions annually due to **static recommendation engines** and **search abandonment**. Traditional systems suffer from three core deficiencies:

1. **Session Intent Blindness**: Recommendations rely on past transaction logs from weeks ago, failing to capture what a user is actively browsing right now in their current session.
2. **Cold-Start Failure**: New users or non-consenting shoppers receive generic, irrelevant item grids.
3. **Filter Bubbles & Category Bias**: Without diversity controls, algorithms collapse into showing 90%+ of the same category, destroying discovery and cross-selling opportunities.

**NowCart** solves this with a real-time, privacy-first discovery engine that updates user intent vectors live on every click, enforces deterministic category diversity caps, and generates graph-backed RAG outfit bundles.

---

## 💡 2. The NowCart Solution

NowCart combines cutting-edge machine learning and microservice architecture into a single scalable system:

* **Real-Time Session Intent (PyTorch GRU)**: Evaluates chronological clickstream events (`view`, `click`, `cart`, `purchase`) to update session vectors in sub-10ms.
* **Vector Candidate Retrieval (Faiss 256-d ANN)**: Fast cosine similarity search across multi-modal product embeddings combining text and visual attributes.
* **Multi-Task Reranking & 35% Diversity Guardrail (LightGBM)**: Scores candidates on predicted click/cart probability while deterministically capping any single category at **35%**.
* **Query Complexity-Based Search**: Routes simple queries ($\le 3$ words) to cheap rule-based parsers and complex queries to semantic models, saving up to 80% in token costs.
* **Graph-Backed RAG Outfit Bundles ("Complete the Look")**: Retrieves real complementary catalog items via co-purchase edges and generates styling descriptions.
* **DPDP Privacy Layer**: Automated PII scrubbing (email/phone redaction), consent flag overrides to popularity feeds, and compliance audit logging.

---

## 📈 3. Target Business Value & Impact Metrics

| Key Performance Indicator (KPI) | Baseline Metric | NowCart Projected Impact | Primary Technical Driver |
| :--- | :--- | :--- | :--- |
| **Click-Through Rate (CTR)** | `2.4%` | **`3.0%` (+25% Lift)** | PyTorch Session Intent GRU + Faiss ANN |
| **Add-to-Cart Conversion Rate** | `3.8%` | **`4.37%` (+15% Lift)** | LightGBM Reranker & 35% Category Diversity |
| **Average Order Value (AOV)** | `$62.50` | **`$70.00` (+12% Lift)** | RAG Outfit Bundle Generation ("Complete the Look") |
| **Search Abandonment Rate** | `34.0%` | **`23.8%` (-30% Reduction)** | Natural language complexity routing & filter extraction |

---

## 💰 4. Cost-Per-Inference Breakdown

NowCart is engineered for extreme cost efficiency. Total operational cost per **1,000 recommendation requests** served:

| Pipeline Stage | Technology Stack | Cost / 1,000 Inferences |
| :--- | :--- | :--- |
| **Vector Retrieval** | Faiss 256-d ANN Candidate Search | `$0.00012 USD` |
| **Session Intent Tracking** | PyTorch GRU CPU/GPU Inference | `$0.00003 USD` |
| **Multi-Task Reranking** | LightGBM Scoring & Diversity Filter | `$0.00025 USD` |
| **Guardrail & PII Scrubbing** | Regex PII Redaction & Audit Logging | `$0.00002 USD` |
| **RAG Outfit Bundling** | Small Quantized LLM Styling Explanation | `$0.00064 USD` |
| **Total Pipeline Cost (With RAG)** | **Full Outfit Styling Experience** | **`~$0.00106 USD`** |
| **Total Pipeline Cost (Standard Feed)** | **Standard Recommendation Feed** | **`~$0.00042 USD`** |

*Economies of Scale: At 1,000,000 recommendation requests, total infrastructure inference costs remain under **~$420 USD** for standard feeds.*

---

## 🗺️ 5. Strategic Roadmap & Future Expansion

1. **Phase 1: Distributed Vector Sharding (Q1)**
   - Scale Faiss index to a distributed **Qdrant** or **Milvus** vector database cluster sharded across regional availability zones.
2. **Phase 2: Redis Session Caching (Q2)**
   - Transition in-memory session arrays to **Redis Enterprise Cluster** for sub-millisecond event sequence persistence.
3. **Phase 3: Visual Search & VLM Integration (Q3)**
   - Introduce Vision-Language Models (CLIP / SigLIP) enabling "snap-and-search" visual similarity discovery directly from user-uploaded images.
