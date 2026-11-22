#!/usr/bin/env python3
"""Build multi-size Windows ICOs of the in-app top-left wordmark.

The mark is not icons/gilil-on-windows.ico (that file is a different square tile).
It is the header badge in server/public/shell-v2.html:

  <div class="brand"><div class="mark">
    <span class="mark-gilil">Gilil</span><span class="mark-on">On</span>

Shape and type from server/public/shell-v2.css (.brand .mark, the later rule):
  one line, no gap, font-weight 800, font-size 15px, letter-spacing 0.02em,
  padding 6px 12px, border-radius 8px, line-height 1.
Background (earlier .brand .mark rule, not overridden):
  linear-gradient(145deg, var(--accent-hot), var(--teal) 48%, var(--teal-deep)).
Gilil uses var(--mark-ink). On is #ffffff.

Colors are the active UI themes in server/public/themes.css
(dark, bitrix, cyan). The shell stores the choice in localStorage key
gilil_theme and Electron mirrors it to userData/gilil_theme.txt.

CSS font stack is "Segoe UI", "Inter", system-ui. Segoe UI is not
redistributable and is not on this build machine. Glyphs are Cantarell
Extra Bold (weight 800). The pill proportions follow the CSS ratios.
"""

from __future__ import annotations

import io
import math
import struct
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "icons" / "themes"
FONT_CANDIDATES = [
    Path("/usr/share/fonts/opentype/cantarell/Cantarell-ExtraBold.otf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]
SIZES = (16, 20, 24, 32, 40, 48, 64, 96, 128, 256)
MASTER = 1024

# themes.css tokens for the three themes the switcher actually offers.
THEMES = {
    "dark": {
        "hot": (0xD9, 0xC3, 0x9C),
        "mid": (0xA8, 0x87, 0x5A),
        "deep": (0x86, 0x68, 0x3F),
        "gilil": (0x1C, 0x18, 0x14, 255),
        "on": (255, 255, 255, 255),
    },
    "bitrix": {
        "hot": (0x1A, 0x8A, 0xD4),
        "mid": (0x00, 0x6A, 0xC4),
        "deep": (0x00, 0x4E, 0x91),
        "gilil": (255, 255, 255, 255),
        "on": (255, 255, 255, 255),
    },
    "cyan": {
        "hot": (0x67, 0xE8, 0xF9),
        "mid": (0x2F, 0xC6, 0xF6),
        "deep": (0x08, 0x91, 0xB2),
        "gilil": (0x04, 0x2F, 0x3A, 255),
        "on": (255, 255, 255, 255),
    },
}


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if path.is_file():
            return ImageFont.truetype(str(path), size=size)
    raise SystemExit("no UI font found for the wordmark icon")


def lerp(a, b, t: float):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def gradient_rgb(t: float, theme: dict):
    # accent-hot -> teal at 48% -> teal-deep
    if t <= 0.48:
        return lerp(theme["hot"], theme["mid"], t / 0.48 if t > 0 else 0)
    u = (t - 0.48) / 0.52
    return lerp(theme["mid"], theme["deep"], min(1.0, max(0.0, u)))


def text_width(font, text: str, tracking: float) -> float:
    if not text:
        return 0
    widths = [font.getlength(ch) for ch in text]
    return sum(widths) + tracking * (len(text) - 1)


def render_master(theme_id: str) -> Image.Image:
    theme = THEMES[theme_id]
    # CSS: padding 6/15 of font-size horizontally 12/15, radius 8/27 of the
    # content-box height (font-size + vertical padding).
    pad_x_ratio = 12 / 15
    pad_y_ratio = 6 / 15
    tracking_ratio = 0.02
    target_w = MASTER * 0.90

    lo, hi = 8, 400
    chosen = 80
    for _ in range(24):
        mid = (lo + hi) / 2
        font = load_font(mid)
        tracking = mid * tracking_ratio
        tw = text_width(font, "GililOn", tracking)
        pad_x = mid * pad_x_ratio
        pill_w = tw + pad_x * 2
        if pill_w < target_w:
            lo = mid
        else:
            hi = mid
        chosen = mid

    font = load_font(chosen)
    tracking = chosen * tracking_ratio
    ascent, descent = font.getmetrics()
    text_h = ascent + descent
    pad_x = chosen * pad_x_ratio
    pad_y = chosen * pad_y_ratio
    tw = text_width(font, "GililOn", tracking)
    pill_w = tw + pad_x * 2
    pill_h = text_h + pad_y * 2
    radius = pill_h * (8 / 27)

    img = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    x0 = (MASTER - pill_w) / 2
    y0 = (MASTER - pill_h) / 2
    x1 = x0 + pill_w
    y1 = y0 + pill_h

    # CSS 145deg: 0deg is up, clockwise. End of the gradient is down-right.
    ang = math.radians(145)
    dx = math.sin(ang)
    dy = math.cos(ang)  # image y grows downward; CSS y grows upward, so +cos is down
    corners = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
    projs = [((x - x0) * dx + (y - y0) * dy) for x, y in corners]
    pmin, pmax = min(projs), max(projs)
    span = pmax - pmin or 1

    grad = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    px = grad.load()
    mask = Image.new("L", (MASTER, MASTER), 0)
    ImageDraw.Draw(mask).rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=255)
    mpx = mask.load()
    for y in range(int(y0) - 1, int(y1) + 2):
        if y < 0 or y >= MASTER:
            continue
        for x in range(int(x0) - 1, int(x1) + 2):
            if x < 0 or x >= MASTER:
                continue
            if mpx[x, y] == 0:
                continue
            t = (((x - x0) * dx + (y - y0) * dy) - pmin) / span
            r, g, b = gradient_rgb(t, theme)
            px[x, y] = (r, g, b, mpx[x, y])
    img.alpha_composite(grad)

    draw = ImageDraw.Draw(img)
    cursor = x0 + pad_x
    baseline = y0 + pad_y + ascent
    for i, ch in enumerate("GililOn"):
        color = theme["gilil"] if i < 5 else theme["on"]
        draw.text((cursor, baseline), ch, font=font, fill=color, anchor="ls")
        cursor += font.getlength(ch) + tracking
    return img


def png_bytes(im: Image.Image) -> bytes:
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def write_ico(path: Path, master: Image.Image) -> None:
    blobs = []
    images = []
    for size in SIZES:
        im = master.resize((size, size), Image.Resampling.LANCZOS)
        images.append(im)
        blobs.append(png_bytes(im))
    count = len(blobs)
    out = struct.pack("<HHH", 0, 1, count)
    offset = 6 + 16 * count
    for im, blob in zip(images, blobs):
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        out += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
    out += b"".join(blobs)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)


def main() -> None:
    for theme_id in THEMES:
        master = render_master(theme_id)
        dest = OUT_DIR / f"gilil-on-{theme_id}.ico"
        write_ico(dest, master)
        print(f"wrote {dest} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    sys.exit(main())
