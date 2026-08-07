import os
import sys

# Resolve project path to avoid import errors
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from sklearn.metrics import roc_auc_score
from ml.two_tower_model.model import UserTower, ItemTower, TwoTowerMultiTaskModel

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class SimulatedClickstreamDataset(Dataset):
    """
    Generates simulated clickstream data for user profile features,
    item embeddings, and corresponding click, cart, and purchase labels.
    """
    def __init__(self, size=1000):
        # User profile features
        self.age = torch.rand(size) * 0.8 + 0.1 # scaled age between 0.1 and 0.9
        self.gender = torch.randint(0, 3, (size,))
        self.index_group = torch.randint(0, 5, (size,))
        self.long_term_pref = torch.randn(size, 256)
        
        # Item pre-computed embeddings (256-d)
        self.item_embedding = torch.randn(size, 256)
        
        # Simulated multi-task labels based on a helper dot product similarity
        # Adding some random noise to simulate real-world distributions
        sims = torch.sum(self.long_term_pref * self.item_embedding, dim=1)
        sims = torch.sigmoid(sims)
        
        self.click_label = (sims + torch.randn(size) * 0.1 > 0.45).float().clamp(0, 1)
        self.cart_label = (sims + torch.randn(size) * 0.15 > 0.55).float().clamp(0, 1) * self.click_label
        self.purchase_label = (sims + torch.randn(size) * 0.2 > 0.70).float().clamp(0, 1) * self.cart_label

    def __len__(self):
        return len(self.age)

    def __getitem__(self, idx):
        return {
            "age": self.age[idx],
            "gender": self.gender[idx],
            "index_group": self.index_group[idx],
            "long_term_pref": self.long_term_pref[idx],
            "item_embedding": self.item_embedding[idx],
            "click": self.click_label[idx],
            "cart": self.cart_label[idx],
            "purchase": self.purchase_label[idx],
        }


def train_model(epochs=5, batch_size=64):
    print("Initializing Two-Tower training data...")
    dataset = SimulatedClickstreamDataset(size=2000)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    # Initialize User & Item towers
    user_tower = UserTower()
    item_tower = ItemTower()
    model = TwoTowerMultiTaskModel(user_tower, item_tower)
    
    optimizer = optim.Adam(model.parameters(), lr=0.005)
    
    # Task weights for Multi-Task Loss: purchase weighted highest
    w_click = 1.0
    w_cart = 2.0
    w_purchase = 5.0
    
    bce = nn.BCELoss()
    
    checkpoint_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "checkpoints"))
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    print("Starting Two-Tower Model training loop...")
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        
        for batch in train_loader:
            optimizer.zero_grad()
            
            # Forward pass
            out = model(
                batch["age"],
                batch["gender"],
                batch["index_group"],
                batch["long_term_pref"],
                batch["item_embedding"]
            )
            
            # Weighted multi-task loss
            loss_click = bce(out["click_prob"].squeeze(), batch["click"])
            loss_cart = bce(out["cart_prob"].squeeze(), batch["cart"])
            loss_purchase = bce(out["purchase_prob"].squeeze(), batch["purchase"])
            
            loss = (w_click * loss_click) + (w_cart * loss_cart) + (w_purchase * loss_purchase)
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * len(batch["age"])
            
        train_loss /= len(train_dataset)
        
        # Validation evaluation
        model.eval()
        val_targets = {"click": [], "cart": [], "purchase": []}
        val_preds = {"click": [], "cart": [], "purchase": []}
        
        with torch.no_grad():
            for batch in val_loader:
                out = model(
                    batch["age"],
                    batch["gender"],
                    batch["index_group"],
                    batch["long_term_pref"],
                    batch["item_embedding"]
                )
                for task in ["click", "cart", "purchase"]:
                    val_targets[task].extend(batch[task].numpy())
                    val_preds[task].extend(out[f"{task}_prob"].squeeze().numpy())
                    
        # Compute per-task AUC
        auc_scores = {}
        for task in ["click", "cart", "purchase"]:
            try:
                auc_scores[task] = roc_auc_score(val_targets[task], val_preds[task])
            except Exception:
                auc_scores[task] = 0.5 # default fallback
                
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {train_loss:.4f} | "
              f"Click AUC: {auc_scores['click']:.4f} | "
              f"Cart AUC: {auc_scores['cart']:.4f} | "
              f"Purchase AUC: {auc_scores['purchase']:.4f}")
        
    # Save the User Tower and Item Tower checkpoints separately
    user_checkpoint_path = os.path.join(checkpoint_dir, "user_tower.pt")
    item_checkpoint_path = os.path.join(checkpoint_dir, "item_tower.pt")
    
    torch.save(model.user_tower.state_dict(), user_checkpoint_path)
    torch.save(model.item_tower.state_dict(), item_checkpoint_path)
    
    print(f"Saved trained user tower to: {user_checkpoint_path}")
    print(f"Saved trained item tower to: {item_checkpoint_path}")

if __name__ == "__main__":
    train_model(epochs=5)
