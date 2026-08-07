import os
import sys

# Resolve project path to avoid import errors
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import torch
import numpy as np
from ml.session_model.model import SessionIntentGRU
from ml.embeddings.text_embedder import ProductTextEmbedder

def run_demo():
    print("\n" + "=" * 70)
    print("      NOWCART SESSION INTENT STALE-INTENT SHIFT DEMONSTRATION")
    print("=" * 70)

    # Initialize model
    model = SessionIntentGRU()
    checkpoint_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "checkpoints"))
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, "session_gru.pt")
    
    # Save initialized weights to checkpoint for service use
    torch.save(model.state_dict(), checkpoint_path)
    print(f"Saved session GRU model checkpoint to: {checkpoint_path}")

    # Generate semantic embeddings using text embedder from Phase 1
    embedder = ProductTextEmbedder()
    
    fridge_text = "Premium Double-Door Smart Refrigerator Stainless Steel"
    curtain_texts = [
        "Linen Floral Print Window Curtains",
        "Boho Chic Room Darkening Curtains",
        "Sheer White Curtains for Living Room",
        "Luxury Velvet Curtains (Pack of 2)",
        "Thermal Insulated Grommet Curtain Panels"
    ]

    # Convert text to 384-d, pad with 0s to make it 256-d, or simply project/truncate
    # Since model expects 256-d, let's take first 256 dimensions of all-MiniLM-L6-v2 embeddings
    fridge_raw = embedder.embed_texts([fridge_text])[0][:256]
    curtains_raw = [embedder.embed_texts([t])[0][:256] for t in curtain_texts]

    # Normalize vectors
    fridge_vec = fridge_raw / np.linalg.norm(fridge_raw)
    curtains_vecs = [v / np.linalg.norm(v) for v in curtains_raw]

    # Event types mapping: view (0), click (1), cart (2), purchase (3)
    # Simulate Step 1: User just purchased refrigerator
    print("\nStep 1: User purchases a refrigerator.")
    prod_embeddings_step1 = torch.tensor([fridge_vec]).unsqueeze(0) # (1, 1, 256)
    event_types_step1 = torch.tensor([[3]]) # (1, 1) - Purchase
    
    model.eval()
    with torch.no_grad():
        intent_step1 = model(prod_embeddings_step1, event_types_step1).squeeze(0).numpy()

    sim_step1_to_fridge = np.dot(intent_step1, fridge_vec)
    sim_step1_to_curtains = np.mean([np.dot(intent_step1, cv) for cv in curtains_vecs])
    print(f"  Session Intent similarity to Fridge   : {sim_step1_to_fridge:.4f}")
    print(f"  Session Intent similarity to Curtains : {sim_step1_to_curtains:.4f}")

    # Simulate Step 2: User starts browsing curtains (5 consecutive events)
    print("\nStep 2: User browses 5 curtain products in current session.")
    
    # Session sequence: Fridge Purchase -> Curtains View -> Curtains Click -> Curtains View -> Curtains Cart -> Curtains View
    sequence_products = [fridge_vec] + curtains_vecs
    sequence_events = [3, 0, 1, 0, 2, 0] # purchase, view, click, view, cart, view

    prod_embeddings_step2 = torch.tensor(np.array(sequence_products)).unsqueeze(0).float() # (1, 6, 256)
    event_types_step2 = torch.tensor([sequence_events]) # (1, 6)

    with torch.no_grad():
        intent_step2 = model(prod_embeddings_step2, event_types_step2).squeeze(0).numpy()

    sim_step2_to_fridge = np.dot(intent_step2, fridge_vec)
    sim_step2_to_curtains = np.mean([np.dot(intent_step2, cv) for cv in curtains_vecs])
    print(f"  Session Intent similarity to Fridge   : {sim_step2_to_fridge:.4f}")
    print(f"  Session Intent similarity to Curtains : {sim_step2_to_curtains:.4f}")

    print("\nConclusion:")
    if sim_step2_to_curtains > sim_step2_to_fridge:
        print("  [SUCCESS] Session intent vector successfully shifted towards curtains and away from fridge!")
        print("  Stale-intent problem solved. The system will now recommend curtains instead of refrigerators.")
    else:
        print("  [WARNING] Session intent did not shift sufficiently. Check model pooling or hyper-parameters.")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_demo()
