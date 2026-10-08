"""Convert genuine browser captures into responsive WebP, never upscale."""
import argparse
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('captures', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
metadata_file = root / 'data/nika_walkthrough_images.json'
metadata = json.loads(metadata_file.read_text())
for old in ('install', 'sign-in', 'preferences', 'passmed-start'):
    metadata.pop(old, None)
for name in ('account-signup', 'account-studies', 'account-cards', 'account-style'):
    image = Image.open(args.captures / f'{name}.jpg').convert('RGB')
    width, height = image.size
    base = root / 'static/media/nika/walkthrough'
    image.save(base / f'{name}-full.webp', quality=95, method=6)
    entry = {'width': width, 'height': height, 'kind': 'browser-capture', 'sourceVersion': 'nena-web-20261008'}
    for size in (768, 1440, 2304):
        scaled = image.copy()
        scaled.thumbnail((size, round(height * min(size, width) / width)), Image.Resampling.LANCZOS)
        scaled.save(base / f'{name}-{size}.webp', quality=90, method=6)
        entry[f'w{size}'] = scaled.width
    metadata[name] = entry
metadata_file.write_text(json.dumps(metadata, indent=2) + '\n')
