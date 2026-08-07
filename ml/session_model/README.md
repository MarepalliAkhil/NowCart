# Session Intent Tracking Model

This module implements the **real-time session intent tracking GRU model** to resolve the stale-intent recommendation problem.

---

## 📐 Architecture & Decay Skip Connection

- Takes a chronological sequence of session events: product embeddings (256-d) + event type (view, click, cart, purchase).
- Employs a 1-layer GRU cell with a skip connection that applies an exponential decay weight to the browsed product embeddings.
- Outputs an L2-normalized 256-d **Session Intent Vector** representing the current active session context.
- High-performance real-time execution (`<10ms` latency).

---

## 🚀 Running the Demonstration

To simulate a user purchasing a refrigerator, followed by browsing curtains, and visualize the session vector shifting towards curtains in real time:

```bash
python ml/session_model/demo.py
```

Checkpoints are saved to:
- `ml/session_model/checkpoints/session_gru.pt`

Evaluation notebooks are stored in:
- `ml/notebooks/session_intent_eval.ipynb`
