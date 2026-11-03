#!/usr/bin/env python3
"""
Compose a user photo into the GililOn colorful photo-slot icon.

Usage:
  python3 scripts/compose-icon-photo.py --photo /path/to/photo.jpg
  python3 scripts/compose-icon-photo.py --photo ./me.png --out ./icons/custom

Outputs (default out dir = icons/):
  gilil-on-photo-1024.png
  gilil-on-photo-512.png
  gilil-on-windows.ico   (if --rebuild-package-icons)
  + ICNS / android copies when --rebuild-package-icons

Without --rebuild-package-icons, only writes photo-composited PNGs next to
icons/photo-slot/ or --out, leaving production wordmark icons untouched.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
PHOTO_SLOT = ICONS / "photo-slot"
GEOM_PATH = PHOTO_SLOT / "geometry.json"
FRAME_PATH = PHOTO_SLOT / "photo-slot-frame-1024.png"


def load_geom() -> dict:
    if not GEOM_PATH.is_file():
        sys.exit(f"Missing {GEOM_PATH}. Run scripts/generate-colorful-icons.py first.")
    return json.loads(GEOM_PATH.read_text(encoding="utf-8"))


def compose(photo_path: Path, frame: Image.Image, geom: dict) -> Image.Image:
    d = int(geom["diameter"])
    cx, cy, r = int(geom["cx"]), int(geom["cy"]), int(geom["radius"])
    photo = Image.open(photo_path).convert("RGBA")
    photo = ImageOps.fit(photo, (d, d), method=Image.Resampling.LANCZOS)
    mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d - 1, d - 1), fill=255)
    photo.putalpha(mask)

    base = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    base.paste(photo, (cx - r, cy - r), photo)
    return Image.alpha_composite(base, frame)


def write_ico(master: Image.Image, path: Path):
    import io, struct
    sizes = [16, 24, 32, 48, 64, 128, 256]
    images = []
    for s in sizes:
        im = master.resize((s, s), Image.Resampling.LANCZOS).convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        images.append((s, buf.getvalue()))
    count = len(images)
    header = struct.pack("<HHH", 0, 1, count)
    offset = 6 + 16 * count
    entries = b""
    data = b""
    for s, png in images:
        w = 0 if s >= 256 else s
        h = 0 if s >= 256 else s
        entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(png), offset)
        offset += len(png)
        data += png
    path.write_bytes(header + entries + data)


def write_icns(master: Image.Image, path: Path):
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    images = [master.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    try:
        images[-1].save(path, format="ICNS", append_images=images[:-1])
    except Exception as e:
        print(f"warn: ICNS not written ({e})", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description="Insert a photo into GililOn icon slot")
    ap.add_argument("--photo", required=True, type=Path, help="Path to photo (jpg/png)")
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: icons/photo-slot/out)",
    )
    ap.add_argument(
        "--rebuild-package-icons",
        action="store_true",
        help="Also overwrite icons/gilil-on-*.png/.ico/.icns used by Electron",
    )
    ap.add_argument(
        "--prefix",
        default="gilil-on-photo",
        help="Filename prefix for outputs (default: gilil-on-photo)",
    )
    args = ap.parse_args()

    if not args.photo.is_file():
        sys.exit(f"Photo not found: {args.photo}")
    if not FRAME_PATH.is_file():
        sys.exit(f"Missing frame {FRAME_PATH}. Run scripts/generate-colorful-icons.py first.")

    geom = load_geom()
    frame = Image.open(FRAME_PATH).convert("RGBA")
    composed = compose(args.photo, frame, geom)

    out_dir = args.out or (PHOTO_SLOT / "out")
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.prefix

    p1024 = out_dir / f"{prefix}-1024.png"
    p512 = out_dir / f"{prefix}-512.png"
    composed.save(p1024, "PNG")
    composed.resize((512, 512), Image.Resampling.LANCZOS).save(p512, "PNG")
    print(f"wrote {p1024}")
    print(f"wrote {p512}")

    ico = out_dir / f"{prefix}-windows.ico"
    write_ico(composed, ico)
    print(f"wrote {ico}")

    icns = out_dir / f"{prefix}-macos.icns"
    write_icns(composed, icns)
    if icns.exists():
        print(f"wrote {icns}")

    android = out_dir / f"{prefix}-android-512.png"
    composed.resize((512, 512), Image.Resampling.LANCZOS).save(android, "PNG")
    print(f"wrote {android}")

    if args.rebuild_package_icons:
        # Overwrite production paths pointed by package.json
        composed.save(ICONS / "gilil-on-master-1024.png", "PNG")
        composed.resize((512, 512), Image.Resampling.LANCZOS).save(
            ICONS / "gilil-on-512.png", "PNG"
        )
        write_ico(composed, ICONS / "gilil-on-windows.ico")
        write_icns(composed, ICONS / "gilil-on-macos.icns")
        composed.resize((512, 512), Image.Resampling.LANCZOS).save(
            ICONS / "gilil-on-android-512.png", "PNG"
        )
        composed.resize((32, 32), Image.Resampling.LANCZOS).save(
            ICONS / "tray-icon.png", "PNG"
        )
        composed.resize((32, 32), Image.Resampling.LANCZOS).save(
            ROOT / "tray-icon.png", "PNG"
        )
        print("Rebuilt package icons under icons/ (and tray-icon.png).")

    print("OK — drop-in photo icon ready.")


if __name__ == "__main__":
    main()
