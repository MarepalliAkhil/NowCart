# Multi-Task Two-Tower Recommendation Model

This module implements the **Two-Tower Neural Network** in PyTorch for user and item representation learning.

---

## 📐 Model Architecture

- **User Tower**: Projects user profile features (age, gender, index group preference) and long-term preferences into a unified 256-d user vector.
- **Item Tower**: Projects pre-computed multimodal product embeddings (from Phase 1) into the shared user-item space.
- **Multi-Task Heads**: Predicts click, cart-addition, and purchase probabilities based on the cosine similarity between the user and item towers.

---

## 🚀 Training

To train the Two-Tower model and generate user/item checkpoints:

```bash
python ml/two_tower_model/train.py
```

Training metrics (per-task Loss and AUC scores) are logged during execution, and saved checkpoints are exported to:
- `ml/two_tower_model/checkpoints/user_tower.pt`
- `ml/two_tower_model/checkpoints/item_tower.pt`
