import torch
import torch.nn as nn
import torch.nn.functional as F

class UserTower(nn.Module):
    """
    User Tower: projects user profile features (age, gender, index group preference) 
    and long-term preferences into a unified 256-d user embedding.
    """
    def __init__(self, gender_vocab_size=3, index_vocab_size=5, preference_dim=256, output_dim=256):
        super().__init__()
        self.gender_embed = nn.Embedding(gender_vocab_size, 16)
        self.index_embed = nn.Embedding(index_vocab_size, 32)
        
        # User input features: age (1) + gender_emb (16) + index_emb (32) + long_term_preference (preference_dim)
        input_dim = 1 + 16 + 32 + preference_dim
        
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.LayerNorm(256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, output_dim)
        )

    def forward(self, age, gender_idx, index_group_idx, long_term_pref):
        gender_features = self.gender_embed(gender_idx)
        index_features = self.index_embed(index_group_idx)
        
        # Concatenate features
        x = torch.cat([age.unsqueeze(1), gender_features, index_features, long_term_pref], dim=1)
        user_emb = self.mlp(x)
        # L2 normalize user embedding
        return F.normalize(user_emb, p=2, dim=1)


class ItemTower(nn.Module):
    """
    Item Tower: projects the pre-computed multimodal product embedding from Phase 1
    into the shared user-item retrieval space.
    """
    def __init__(self, input_dim=256, output_dim=256):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.LayerNorm(256),
            nn.ReLU(),
            nn.Linear(256, output_dim)
        )

    def forward(self, item_embedding):
        item_emb = self.mlp(item_embedding)
        # L2 normalize item embedding
        return F.normalize(item_emb, p=2, dim=1)


class TwoTowerMultiTaskModel(nn.Module):
    """
    Two-Tower Multi-Task model predicting Click, Cart, and Purchase probabilities
    based on the dot product of user and item vectors.
    """
    def __init__(self, user_tower: UserTower, item_tower: ItemTower):
        super().__init__()
        self.user_tower = user_tower
        self.item_tower = item_tower
        
        # Multi-task heads acting on the cosine similarity (dot product of normalized embeddings)
        # Tasks: click (0), cart (1), purchase (2)
        self.click_head = nn.Linear(1, 1)
        self.cart_head = nn.Linear(1, 1)
        self.purchase_head = nn.Linear(1, 1)

    def forward(self, age, gender_idx, index_group_idx, long_term_pref, item_embedding):
        user_emb = self.user_tower(age, gender_idx, index_group_idx, long_term_pref)
        item_emb = self.item_tower(item_embedding)
        
        # Compute cosine similarity / dot product: shape (batch_size, 1)
        sim = torch.sum(user_emb * item_emb, dim=1, keepdim=True)
        
        # Predict task probabilities
        click_logits = self.click_head(sim)
        cart_logits = self.cart_head(sim)
        purchase_logits = self.purchase_head(sim)
        
        return {
            "user_embedding": user_emb,
            "item_embedding": item_emb,
            "click_prob": torch.sigmoid(click_logits),
            "cart_prob": torch.sigmoid(cart_logits),
            "purchase_prob": torch.sigmoid(purchase_logits),
        }
