import torch
import torch.nn as nn
import torch.nn.functional as F

class SessionIntentGRU(nn.Module):
    """
    Lightweight GRU session model that takes a sequence of recent events
    (product embeddings + event type) and outputs a 256-d session intent vector.
    """
    def __init__(self, product_dim=256, event_vocab_size=4, event_embed_dim=16, hidden_dim=256):
        super().__init__()
        self.product_dim = product_dim
        self.event_embed = nn.Embedding(event_vocab_size, event_embed_dim)
        
        # Input features: product_dim (256) + event_embed_dim (16) = 272-d
        self.gru = nn.GRU(
            input_size=product_dim + event_embed_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True
        )
        
        self.output_projection = nn.Sequential(
            nn.Linear(hidden_dim, product_dim),
            nn.LayerNorm(product_dim)
        )

    def forward(self, product_embeddings, event_type_idxs):
        """
        Args:
            product_embeddings: shape (batch_size, sequence_length, 256)
            event_type_idxs: shape (batch_size, sequence_length)
        Returns:
            session_intent_vector: shape (batch_size, 256)
        """
        batch_size, seq_len, _ = product_embeddings.size()
        
        # Embed event types
        event_features = self.event_embed(event_type_idxs) # (batch_size, seq_len, 16)
        
        # Concatenate product embedding and event type embedding
        x = torch.cat([product_embeddings, event_features], dim=2) # (batch_size, seq_len, 272)
        
        # Pass through GRU
        gru_out, hn = self.gru(x) # hn shape: (1, batch_size, 256)
        last_hidden = hn.squeeze(0) # (batch_size, 256)
        
        # Apply exponential decay skip connection (higher weights to more recent items)
        decay_weights = torch.tensor([0.5 ** (seq_len - 1 - i) for i in range(seq_len)], device=product_embeddings.device)
        decay_weights = decay_weights / decay_weights.sum() # Normalize weights
        decay_weights = decay_weights.view(1, seq_len, 1)
        
        weighted_products = torch.sum(product_embeddings * decay_weights, dim=1) # (batch_size, 256)
        
        # Blend GRU output with weighted products
        blended = 0.3 * last_hidden + 0.7 * weighted_products
        
        # Project and L2 normalize
        intent_vec = self.output_projection(blended)
        return F.normalize(intent_vec, p=2, dim=1)
