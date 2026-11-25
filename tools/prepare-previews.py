"""Gera miniaturas WebP para o cardápio. Uso opcional, com Python e Pillow."""

from pathlib import Path

from PIL import Image


assets = Path(__file__).resolve().parents[1] / "assets"
destination = assets / "previews"
destination.mkdir(exist_ok=True)

for folder in ("food", "campaign"):
    for source in sorted((assets / folder).glob("*.webp")):
        if source.name == "embers.webp":
            continue
        preview = destination / source.name
        if preview.exists() and preview.stat().st_mtime >= source.stat().st_mtime:
            continue
        with Image.open(source) as photo:
            limit = 600 if source.stem.startswith("combo-") else 416
            photo.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            photo.save(preview, format="WEBP", quality=83, method=6)
