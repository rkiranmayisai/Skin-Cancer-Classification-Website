"""
Skin Cancer Classification - Demo Sample Image Generator
Generates synthetic dermoscopic lesion images using PIL for testing.
"""

import os
import random
import math
from PIL import Image, ImageDraw, ImageFilter


def _hex(color):
    return tuple(int(color[i:i+2], 16) for i in (1, 3, 5))


def _draw_irregular_blob(draw, cx, cy, rx, ry, points=24, irregularity=0.3, color=(80, 40, 20)):
    """Draw an irregular ellipse-like blob using random angular offsets."""
    angles = sorted([random.uniform(0, 2 * math.pi) for _ in range(points)])
    pts = []
    for a in angles:
        r_x = rx * (1 + random.uniform(-irregularity, irregularity))
        r_y = ry * (1 + random.uniform(-irregularity, irregularity))
        pts.append((cx + r_x * math.cos(a), cy + r_y * math.sin(a)))
    draw.polygon(pts, fill=color)


def generate_melanoma(path):
    """Dark irregular multi-colored lesion — high ABCD scores."""
    img = Image.new("RGB", (300, 300), (220, 190, 170))
    draw = ImageDraw.Draw(img)

    # Skin background texture
    for _ in range(200):
        x, y = random.randint(0, 299), random.randint(0, 299)
        draw.ellipse([x, y, x+2, y+2], fill=(210+random.randint(-10,10), 180+random.randint(-10,10), 160+random.randint(-10,10)))

    cx, cy = 150, 150
    # Outer dark irregular blob
    _draw_irregular_blob(draw, cx, cy, 90, 75, points=32, irregularity=0.45, color=(30, 15, 10))
    # Mid dark-brown patch
    _draw_irregular_blob(draw, cx-10, cy+5, 65, 55, points=24, irregularity=0.35, color=(55, 25, 15))
    # Red/pink area (bleeding)
    _draw_irregular_blob(draw, cx+20, cy-15, 30, 25, points=16, irregularity=0.40, color=(120, 40, 40))
    # Blue-grey regression area
    _draw_irregular_blob(draw, cx-25, cy+10, 25, 20, points=16, irregularity=0.30, color=(60, 65, 80))
    # Tan satellite spot
    _draw_irregular_blob(draw, cx+55, cy+50, 12, 10, points=12, irregularity=0.25, color=(80, 45, 20))

    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    img.save(path, "JPEG", quality=92)
    print(f"  Generated: {os.path.basename(path)}")


def generate_bcc(path):
    """Pearly nodular BCC lesion with rolled border and telangiectasia."""
    img = Image.new("RGB", (300, 300), (225, 195, 175))
    draw = ImageDraw.Draw(img)

    for _ in range(150):
        x, y = random.randint(0, 299), random.randint(0, 299)
        draw.ellipse([x, y, x+2, y+2], fill=(215+random.randint(-8,8), 185+random.randint(-8,8), 165+random.randint(-8,8)))

    cx, cy = 150, 150
    # Pearly outer ring (rolled border)
    _draw_irregular_blob(draw, cx, cy, 80, 70, points=28, irregularity=0.20, color=(200, 180, 165))
    # Inner nodular area
    _draw_irregular_blob(draw, cx, cy, 60, 52, points=24, irregularity=0.15, color=(210, 190, 178))
    # Ulcerated center
    _draw_irregular_blob(draw, cx, cy, 25, 22, points=16, irregularity=0.25, color=(165, 100, 90))
    # Telangiectatic vessels (thin red lines)
    for _ in range(8):
        angle = random.uniform(0, 2 * math.pi)
        r = random.randint(30, 70)
        x0, y0 = int(cx + r * 0.3 * math.cos(angle)), int(cy + r * 0.3 * math.sin(angle))
        x1, y1 = int(cx + r * math.cos(angle)), int(cy + r * math.sin(angle))
        draw.line([x0, y0, x1, y1], fill=(180, 60, 60), width=1)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
    img.save(path, "JPEG", quality=92)
    print(f"  Generated: {os.path.basename(path)}")


def generate_benign_mole(path):
    """Symmetric, uniform brown melanocytic nevus — low ABCD scores."""
    img = Image.new("RGB", (300, 300), (222, 193, 172))
    draw = ImageDraw.Draw(img)

    for _ in range(150):
        x, y = random.randint(0, 299), random.randint(0, 299)
        draw.ellipse([x, y, x+2, y+2], fill=(212+random.randint(-5,5), 183+random.randint(-5,5), 162+random.randint(-5,5)))

    cx, cy = 150, 150
    # Symmetric, smooth dark-brown mole
    _draw_irregular_blob(draw, cx, cy, 55, 52, points=36, irregularity=0.05, color=(85, 55, 30))
    # Slightly lighter interior
    _draw_irregular_blob(draw, cx, cy, 40, 38, points=36, irregularity=0.04, color=(95, 62, 35))

    img = img.filter(ImageFilter.GaussianBlur(radius=1.0))
    img.save(path, "JPEG", quality=92)
    print(f"  Generated: {os.path.basename(path)}")


def generate_seb_keratosis(path):
    """Warty, stuck-on seborrheic keratosis with rough surface."""
    img = Image.new("RGB", (300, 300), (218, 188, 168))
    draw = ImageDraw.Draw(img)

    for _ in range(120):
        x, y = random.randint(0, 299), random.randint(0, 299)
        draw.ellipse([x, y, x+3, y+3], fill=(208+random.randint(-6,6), 178+random.randint(-6,6), 158+random.randint(-6,6)))

    cx, cy = 150, 150
    # Main waxy plaque — tan/brown
    _draw_irregular_blob(draw, cx, cy, 85, 70, points=30, irregularity=0.20, color=(120, 85, 45))
    # Surface texture — darker spots
    for _ in range(40):
        sx = cx + random.randint(-75, 75)
        sy = cy + random.randint(-60, 60)
        _draw_irregular_blob(draw, sx, sy, random.randint(3, 10), random.randint(3, 10),
                             points=8, irregularity=0.35, color=(85, 55, 25))

    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    img.save(path, "JPEG", quality=92)
    print(f"  Generated: {os.path.basename(path)}")


def generate_all_samples(samples_dir: str):
    """Generate all four dermoscopic demo images."""
    os.makedirs(samples_dir, exist_ok=True)
    print("\nGenerating synthetic dermoscopic sample images...")

    samples = [
        ("melanoma_lesion.jpg",  generate_melanoma),
        ("bcc_lesion.jpg",       generate_bcc),
        ("benign_mole.jpg",      generate_benign_mole),
        ("seb_keratosis.jpg",    generate_seb_keratosis),
    ]

    for fname, fn in samples:
        path = os.path.join(samples_dir, fname)
        if not os.path.exists(path):
            fn(path)
        else:
            print(f"  Skipping {fname} (already exists)")

    print(f"Sample generation complete. Files in: {samples_dir}\n")


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    generate_all_samples(os.path.join(project_root, "samples"))
