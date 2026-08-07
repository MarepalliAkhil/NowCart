"""
H&M Dataset Loader & Sample Generator for NowCart Product Embedding Pipeline.

Loads H&M Personalized Fashion Recommendations dataset (articles metadata + image paths).
Generates a realistic sample dataset if raw files are not present in data/raw/.
"""

import os
import logging
from typing import Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("nowcart.dataset_loader")

# Sample H&M product metadata templates for fallback dataset generation
SAMPLE_ARTICLES_DATA = [
    {
        "article_id": "0108775015",
        "prod_name": "Strap top",
        "product_type_name": "Vest top",
        "product_group_name": "Garment Upper body",
        "graphical_appearance_name": "Solid",
        "colour_group_name": "Black",
        "perceived_colour_value_name": "Dark",
        "index_group_name": "Ladieswear",
        "section_name": "Everyday Basics",
        "garment_group_name": "Jersey Basic",
        "detail_desc": "Jersey strap top with a soft feel and narrow shoulder straps.",
    },
    {
        "article_id": "0108775044",
        "prod_name": "Strap top (pack of 2)",
        "product_type_name": "Vest top",
        "product_group_name": "Garment Upper body",
        "graphical_appearance_name": "Solid",
        "colour_group_name": "White/Black",
        "perceived_colour_value_name": "Dual",
        "index_group_name": "Ladieswear",
        "section_name": "Everyday Basics",
        "garment_group_name": "Jersey Basic",
        "detail_desc": "Two jersey strap tops in soft cotton jersey with narrow shoulder straps.",
    },
    {
        "article_id": "0110065001",
        "prod_name": "OP T-shirt (Ribbed)",
        "product_type_name": "T-shirt",
        "product_group_name": "Garment Upper body",
        "graphical_appearance_name": "Stripe",
        "colour_group_name": "Navy Blue",
        "perceived_colour_value_name": "Dark",
        "index_group_name": "Menswear",
        "section_name": "Men Everyday",
        "garment_group_name": "Jersey Fancy",
        "detail_desc": "Ribbed T-shirt in soft organic cotton jersey with short sleeves.",
    },
    {
        "article_id": "0110065002",
        "prod_name": "Slim Fit Chino Trousers",
        "product_type_name": "Trousers",
        "product_group_name": "Garment Lower body",
        "graphical_appearance_name": "Solid",
        "colour_group_name": "Beige",
        "perceived_colour_value_name": "Medium Light",
        "index_group_name": "Menswear",
        "section_name": "Men Tailored",
        "garment_group_name": "Trousers",
        "detail_desc": "Slim-fit trousers in woven cotton fabric with side pockets and button welt back pockets.",
    },
    {
        "article_id": "0111565001",
        "prod_name": "Oversized Denim Jacket",
        "product_type_name": "Jacket",
        "product_group_name": "Garment Upper body",
        "graphical_appearance_name": "Denim",
        "colour_group_name": "Light Blue",
        "perceived_colour_value_name": "Light",
        "index_group_name": "Divided",
        "section_name": "Divided Denim",
        "garment_group_name": "Shorts & Denim",
        "detail_desc": "Oversized jacket in washed cotton denim with a collar, buttons down the front and chest pockets.",
    },
    {
        "article_id": "0111565005",
        "prod_name": "Floral Summer Dress",
        "product_type_name": "Dress",
        "product_group_name": "Garment Full body",
        "graphical_appearance_name": "Floral",
        "colour_group_name": "Yellow/Pink",
        "perceived_colour_value_name": "Bright",
        "index_group_name": "Ladieswear",
        "section_name": "Womens Fashion",
        "garment_group_name": "Dresses Ladies",
        "detail_desc": "Short, flared dress in a airy woven fabric with a printed floral pattern, V-neck and short sleeves.",
    },
    {
        "article_id": "0112000001",
        "prod_name": "Leather Chelsea Boots",
        "product_type_name": "Boots",
        "product_group_name": "Footwear",
        "graphical_appearance_name": "Solid",
        "colour_group_name": "Dark Brown",
        "perceived_colour_value_name": "Dark",
        "index_group_name": "Menswear",
        "section_name": "Men Shoes",
        "garment_group_name": "Shoes",
        "detail_desc": "Chelsea boots in premium leather with elasticated side panels and pull loops.",
    },
    {
        "article_id": "0112000008",
        "prod_name": "Canvas Tote Bag",
        "product_type_name": "Bag",
        "product_group_name": "Accessories",
        "graphical_appearance_name": "Solid",
        "colour_group_name": "Natural White",
        "perceived_colour_value_name": "Light",
        "index_group_name": "Ladieswear",
        "section_name": "Womens Small Accessories",
        "garment_group_name": "Accessories",
        "detail_desc": "Tote bag in heavy cotton canvas with two handles and an open main compartment.",
    },
]


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
DEFAULT_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


class HMDatasetLoader:
    """Loader for H&M product dataset with automatic fallback sample generation."""

    def __init__(
        self,
        raw_data_dir: Optional[str] = None,
        processed_data_dir: Optional[str] = None,
    ):
        self.raw_data_dir = raw_data_dir if raw_data_dir else DEFAULT_RAW_DIR
        self.processed_data_dir = processed_data_dir if processed_data_dir else DEFAULT_PROCESSED_DIR
        os.makedirs(self.raw_data_dir, exist_ok=True)
        os.makedirs(self.processed_data_dir, exist_ok=True)

    def load_articles(self, limit: Optional[int] = None) -> pd.DataFrame:
        """
        Loads H&M articles metadata. If articles.csv does not exist,
        creates a clean sample dataset.
        """
        articles_path = os.path.join(self.raw_data_dir, "articles.csv")
        images_dir = os.path.join(self.raw_data_dir, "images")

        if os.path.exists(articles_path):
            logger.info(f"Loading H&M articles from {articles_path}")
            df = pd.read_csv(articles_path, dtype={"article_id": str})
        else:
            logger.info("Raw H&M dataset not found. Generating clean sample articles dataset.")
            df = self._generate_sample_dataset(articles_path, images_dir)

        # Build full text representation for embedding input
        df["text_representation"] = (
            df["prod_name"].fillna("") + " - " +
            df["product_type_name"].fillna("") + ". " +
            df["colour_group_name"].fillna("") + " " +
            df["index_group_name"].fillna("") + ". " +
            df["detail_desc"].fillna("")
        )

        # Ensure image_path column exists
        if "image_path" not in df.columns:
            df["image_path"] = df["article_id"].apply(
                lambda aid: self._get_image_path(images_dir, str(aid))
            )

        if limit and limit < len(df):
            df = df.iloc[:limit].copy()

        # Save processed sample parquet table
        output_parquet = os.path.join(self.processed_data_dir, "hm_articles_sample.parquet")
        df.to_parquet(output_parquet, index=False)
        logger.info(f"Loaded {len(df)} articles and saved to {output_parquet}")

        return df

    def _generate_sample_dataset(self, csv_path: str, images_dir: str) -> pd.DataFrame:
        """Generates sample H&M articles dataframe and synthetic image placeholders."""
        os.makedirs(images_dir, exist_ok=True)

        df = pd.DataFrame(SAMPLE_ARTICLES_DATA)

        # Generate sample PNG images for each article if PIL is available
        try:
            from PIL import Image, ImageDraw
            for _, row in df.iterrows():
                folder = os.path.join(images_dir, str(row["article_id"])[:3])
                os.makedirs(folder, exist_ok=True)
                img_path = os.path.join(folder, f"{row['article_id']}.jpg")
                if not os.path.exists(img_path):
                    img = Image.new("RGB", (224, 224), color=(240, 242, 245))
                    draw = ImageDraw.Draw(img)
                    draw.rectangle([40, 40, 184, 184], outline=(20, 184, 166), width=4)
                    draw.text((50, 100), row["prod_name"][:15], fill=(30, 41, 59))
                    img.save(img_path)
        except Exception as e:
            logger.warning(f"Could not render sample images: {e}")

        df.to_csv(csv_path, index=False)
        return df

    def _get_image_path(self, images_dir: str, article_id: str) -> str:
        """Returns relative or absolute path to product image file."""
        subfolder = article_id[:3]
        expected_path = os.path.join(images_dir, subfolder, f"{article_id}.jpg")
        if os.path.exists(expected_path):
            return expected_path
        # Direct folder check
        direct_path = os.path.join(images_dir, f"{article_id}.jpg")
        if os.path.exists(direct_path):
            return direct_path
        return expected_path
