# NowCart 8-Minute Live Demo Walkthrough Script

This script provides a structured timeline for presenting the **NowCart** real-time recommendation, search, and RAG discovery engine live to stakeholders or judges.

---

## ⏱️ Demo Presentation Timeline

| Segment | Duration | Focus Area | Key Action / Demonstration |
| :--- | :--- | :--- | :--- |
| **1. Problem Statement** | `0:00 – 0:30` | E-Commerce Discovery Gap | Explain session intent decay & cold-start failures |
| **2. Home Feed & Session Shift** | `0:30 – 2:30` | Real-Time GRU Personalization | Live home feed, "Why Recommended" badges, Session Simulator |
| **3. Search & RAG Bundles** | `2:30 – 4:30` | Semantic Search & Outfit RAG | Natural language search, complexity router, "Complete the Look" |
| **4. Architecture Sequence** | `4:30 – 6:30` | Microservice Topology | Walkthrough sequence diagram, Faiss ANN, LightGBM diversity cap |
| **5. Guardrails & DPDP** | `6:30 – 7:30` | Privacy & Compliance | Toggle Consent OFF, PII query scrubbing, audit log file |
| **6. Business Impact & Roadmap** | `7:30 – 8:00` | Financial ROI & 10k RPS Scale | Target metrics (+25% CTR, +12% AOV), cost breakdown |

---

## 🎤 Detailed Script & Talking Points

### 1. Problem Statement (`0:00 – 0:30`)
> *"Traditional e-commerce recommendation engines are static. They rely heavily on historical transaction logs from weeks ago, completely ignoring what a shopper is interested in right now in their active browsing session. If a user usually buys casual menswear but is currently shopping for a formal wedding dress, traditional engines fail. NowCart solves this by combining multi-modal product embeddings, real-time PyTorch session GRU intent tracking, LightGBM diversity caps, and DPDP privacy guardrails."*

---

### 2. Live Demo: Home Feed & Real-Time Session Intent Shift (`0:30 – 2:30`)
* **Action 1**: Open the React UI at `http://localhost:5173`. Point out the initial home feed loaded via `GET /feed/{user_id}`.
* **Talking Points**:
  - Point out the **"Why Recommended"** rule-based badge on product cards (*"Matches your active session interest in 'Ladieswear'"*).
  - Point out the **Diversity & Guardrails Monitor** at the top, showing the category breakdown and verifying that no single category exceeds the **35% cap**.
* **Action 2**: Open the **Session Simulator** dev panel. Click the preset scenario **"Summer Evening Dresses"** (`0111565005` Floral Dress + `0108775015` Strap top).
* **Talking Points**:
  - Show clickstream events streaming to `POST /events`.
  - Watch the home feed refresh instantly in real time, shifting recommendations to evening wear and tops to reflect the active PyTorch GRU session vector.

---

### 3. Search & "Complete the Look" RAG Outfit Bundles (`2:30 – 4:30`)
* **Action 1**: Type `"floral dress for a summer wedding party"` into the search bar and press Enter.
* **Talking Points**:
  - Show the **Query Parsing & Transparency Panel** above results.
  - Highlight the complexity router path (`Route: llm_query_understanding`), extracted attributes (`wedding`, `summer`, `formal`), and token cost (`$0.00018 USD`).
* **Action 2**: Click on the *Floral Summer Evening Dress* card to open the **Complete the Look** modal.
* **Talking Points**:
  - Explain how the **Product Graph** fetches real complementary items (tote bag, Chelsea boots, strap top) without hallucinating non-existent items.
  - Read the generated RAG styling explanation: *"To style the Floral Summer Dress, we paired it with canvas tote bag and Chelsea boots..."*

---

### 4. Architecture Diagram Walkthrough (`4:30 – 6:30`)
* **Action**: Open **[`docs/architecture.md`](file:///c:/Users/akhim/Downloads/Telegram%20Desktop/NowCart/docs/architecture.md)** and display the Mermaid sequence diagram.
* **Talking Points**:
  - Walk through the 4 core request sequences: Clickstream Ingestion, Personalized Feed Generation, Semantic Search, and RAG Outfit Generation.
  - Explain candidate retrieval via **Faiss 256-d ANN search** ($< 10\text{ms}$).
  - Explain candidate reranking via **LightGBM** and the deterministic **35% category diversity cap** greedy re-insertion algorithm.
  - Mention distributed `X-Correlation-ID` tracing across all 8 microservices.

---

### 5. Guardrails & DPDP Compliance (`6:30 – 7:30`)
* **Action 1**: Click the **"Consent: ON"** button in the navbar to toggle it to **"Consent: OFF"**.
* **Talking Points**:
  - Show how the API Gateway overrides user vectors, falling back to non-personalized popularity feeds.
* **Action 2**: Highlight PII scrubbing and data minimization.
  - Mention that search queries containing emails or phone numbers are scrubbed into `[REDACTED_EMAIL]` before entering logs or indexes.
  - Open `data/processed/guardrail_audit.log` to demonstrate compliance audit lines.

---

### 6. Impact Numbers & Production Roadmap (`7:30 – 8:00`)
* **Action**: Conclude with the business impact metrics and cost framework.
* **Talking Points**:
  - **Measured Latency**: p99 = **`17.70ms`** (well within the `< 80ms` budget).
  - **Cost per 1,000 Inferences**: **`~$0.00106 USD`** total pipeline cost (or **`~$0.00042 USD`** for standard feeds).
  - **Business ROI Targets**: **+25% CTR**, **+15% Add-to-Cart**, **+12% Average Order Value (AOV)**, and **-30% Search Abandonment**.
