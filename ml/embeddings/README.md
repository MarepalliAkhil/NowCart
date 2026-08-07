# NowCart Multimodal Product Embedding Pipeline

This module implements the **multimodal product embedding pipeline** for **NowCart**, utilizing H&M product catalog metadata (title, category, color, description, image paths) and optional Amazon Reviews graph structure for complementary bundle discovery.

---

## 📐 Architecture Overview

```text
Product Data (Text + Attributes + Image Path)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
Text Embedder               Image Embedder
(all-MiniLM-L6-v2)          (CLIP ViT-B/32)
   384-d                      512-d
         │                       │
         └───────────┬───────────┘
                     ▼
          L2 Normalize + Concat (896-d)
                     │
                     ▼
        Orthogonal Projection Matrix W
                     │
                     ▼
       Unified L2 Product Vector (256-d)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
Parquet Export               Faiss Index
(product_embeddings.parquet) (product_faiss.index)
```

---

## 🧩 Pipeline Components

| Module | Description |
| :--- | :--- |
| **`dataset_loader.py`** | Loads H&M articles dataset. Generates a realistic sample dataset if raw files are missing. |
| **`text_embedder.py`** | Embeds title + description + category + color attributes into a 384-d dense text vector using `sentence-transformers`. |
| **`image_embedder.py`** | Embeds product images into a 512-d visual feature vector using HuggingFace OpenAI `CLIP`. |
| **`fusion_projector.py`** | Concatenates & projects (896-d -> 256-d) text and image modalities into a unified unit L2 product embedding vector. |
| **`pipeline.py`** | End-to-end driver that coordinates data loading, embedding, projection, and export. |
| **`visualize.py`** | Nearest-neighbor visualizer to inspect top-5 visually & semantically similar recommendations for any product ID. |

---

## 🛠️ Usage & Execution

### 1. Run Full Embedding Pipeline

Execute the pipeline to process products, generate embeddings, and export index artifacts:

```bash
python -m ml.embeddings.pipeline
```

### 2. Sanity-Check & Visualize Nearest Neighbors

Run the visualizer to inspect top-5 recommended similar products for a given product ID:

```bash
python -m ml.embeddings.visualize
```

---

## ❄️ Cold-Start Handling

This pipeline is designed for **incremental cold-start inference** when new products are added to the catalog:

```python
from ml.embeddings.text_embedder import ProductTextEmbedder
from ml.embeddings.image_embedder import ProductImageEmbedder
from ml.embeddings.fusion_projector import EmbeddingFusionProjector

# Load saved projection matrix weights
projector = EmbeddingFusionProjector(weights_path="data/processed/fusion_projection.npz")
text_embedder = ProductTextEmbedder()
image_embedder = ProductImageEmbedder()

# Embed new cold-start product
new_product_text = ["New Oversized Cotton Hoodie - Menswear Black"]
new_product_img = ["data/raw/images/new_hoodie.jpg"]

txt_vec = text_embedder.embed_texts(new_product_text)
img_vec = image_embedder.embed_images(new_product_img)

# Produce final 256-d vector ready for Faiss indexing
cold_start_embedding = projector.fuse_and_project(txt_vec, img_vec)
```

---

## 📁 Output Artifacts (`data/processed/`)

- `product_embeddings.parquet`: Clean DataFrame containing metadata + 256-d embedding array column.
- `product_embeddings.npy`: Raw `(N, 256)` float32 NumPy array.
- `product_index_meta.json`: Product ID to matrix row index mappings.
- `product_faiss.index`: Saved Faiss index for fast approximate nearest neighbor (ANN) retrieval.
- `fusion_projection.npz`: Saved linear projection weights for offline/online inference.
