#!/usr/bin/env python3
"""Generate colorful iPhone-like GililOn icons + photo-slot templates + previews."""
from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
PREVIEWS = ICONS / "previews"
PHOTO_SLOT = ICONS / "photo-slot"
FONT_PATH = Path(
    "/usr/share/fonts/truetype/sand-box/google/Bebas Neue/BebasNeue-Regular.ttf"
)

# Brand
CYAN = (47, 198, 246)       # #2FC6F6
CYAN_DEEP = (14, 116, 144)  # #0E7490
NAVY = (11, 26, 48)         # #0B1A30
NAVY_MID = (22, 58, 92)     # #163A5C
BRASS = (168, 135, 90)      # #A8875A
BRASS_L = (217, 195, 156)   # #D9C39C
CREAM = (248, 250, 252)     # #F8FAFC
WHITE = (255, 255, 255)

SIZE = 1024
# iPhone-like continuous corner ≈ 22.5% of tile edge
CORNER_PCT = 0.225
PAD = 24  # transparent margin so outer glow / soft shadow fits
TILE = SIZE - 2 * PAD  # 976
RX = int(TILE * CORNER_PCT)  # ≈ 219


def write_multi_ico(master: Image.Image, path: Path, sizes=(16, 24, 32, 48, 64, 128, 256)):
    """Write a proper multi-resolution ICO (PNG-compressed entries)."""
    import io, struct
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



def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size=size)


def squircle_mask(size: int, rx: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=rx, fill=255)
    return m


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def make_gradient_tile(tile: int, rx: int) -> Image.Image:
    """Colorful iOS-like tile: vertical navy→cyan deep + radial cyan bloom + top specular."""
    base = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    px = base.load()

    cx, cy = tile * 0.42, tile * 0.32
    max_r = math.hypot(tile, tile)

    for y in range(tile):
        vy = y / (tile - 1)
        # vertical: deep navy top-ish mid → richer cyan-tinted bottom
        col_v = lerp((18, 42, 72), (8, 78, 110), vy)
        for x in range(tile):
            # radial bloom (bright cyan) from upper-left center
            dx, dy = x - cx, y - cy
            r = math.hypot(dx, dy) / max_r
            bloom = max(0.0, 1.0 - r * 1.55)
            bloom = bloom ** 1.35
            c = lerp(col_v, (47, 198, 246), bloom * 0.55)
            # secondary brass warm pocket bottom-right (subtle)
            dx2, dy2 = x - tile * 0.78, y - tile * 0.82
            r2 = math.hypot(dx2, dy2) / (tile * 0.55)
            warm = max(0.0, 1.0 - r2)
            warm = warm ** 2.2
            c = lerp(c, BRASS, warm * 0.22)
            px[x, y] = (*c, 255)

    # Soft top specular band (volume)
    spec = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spec)
    for i, alpha in enumerate([90, 55, 28, 12]):
        y0 = int(tile * 0.04) + i * 10
        y1 = int(tile * 0.28) - i * 8
        sd.ellipse(
            (-tile * 0.15, y0 - tile * 0.2, tile * 1.15, y1),
            fill=(255, 255, 255, alpha),
        )
    spec = spec.filter(ImageFilter.GaussianBlur(28))
    base = Image.alpha_composite(base, spec)

    # Thin inner highlight rim (glass bevel)
    rim = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    inset = 6
    rd.rounded_rectangle(
        (inset, inset, tile - 1 - inset, tile - 1 - inset),
        radius=max(1, rx - inset),
        outline=(*WHITE, 70),
        width=3,
    )
    rd.rounded_rectangle(
        (inset + 4, inset + 4, tile - 5 - inset, tile - 5 - inset),
        radius=max(1, rx - inset - 4),
        outline=(*CYAN, 55),
        width=2,
    )
    # Brass accent arc (bottom third of rim)
    brass_rim = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    bd = ImageDraw.Draw(brass_rim)
    bd.rounded_rectangle(
        (inset + 1, inset + 1, tile - 2 - inset, tile - 2 - inset),
        radius=max(1, rx - inset - 1),
        outline=(*BRASS_L, 140),
        width=2,
    )
    # Keep only lower portion of brass rim via mask
    keep = Image.new("L", (tile, tile), 0)
    ImageDraw.Draw(keep).rectangle((0, int(tile * 0.55), tile, tile), fill=255)
    keep = keep.filter(ImageFilter.GaussianBlur(20))
    brass_rim.putalpha(
        ImageChops_multiply_alpha(brass_rim, keep)
    )
    rim = Image.alpha_composite(rim, brass_rim)
    rim = rim.filter(ImageFilter.GaussianBlur(1.2))
    base = Image.alpha_composite(base, rim)

    # Clip to squircle
    mask = squircle_mask(tile, rx)
    out = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def ImageChops_multiply_alpha(rgba: Image.Image, mask_l: Image.Image) -> Image.Image:
    a = rgba.split()[3]
    return Image.composite(a, Image.new("L", a.size, 0), mask_l)


def draw_wordmark(canvas: Image.Image, text: str = "GILILON", y_center: int | None = None, font_size: int = 200, glow: bool = True, brass_rule: bool = False):
    """Draw GILILON wordmark with contrast halo + cyan bloom onto canvas (full SIZE)."""
    if y_center is None:
        y_center = SIZE // 2 + 18
    font = load_font(font_size)

    tmp = ImageDraw.Draw(canvas)
    bbox = tmp.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (SIZE - tw) // 2 - bbox[0]
    y = y_center - th // 2 - bbox[1]

    if glow:
        # Dark halo for contrast on bright cyan tile
        dark = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(dark).text((x, y), text, font=font, fill=(0, 20, 40, 255))
        for radius, opacity in ((22, 0.55), (10, 0.7)):
            blurred = dark.filter(ImageFilter.GaussianBlur(radius))
            r, g, b, a = blurred.split()
            a = a.point(lambda v, o=opacity: int(v * o))
            canvas.alpha_composite(Image.merge("RGBA", (r, g, b, a)))
        # Cyan bloom
        glow_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(glow_layer).text((x, y), text, font=font, fill=(*CYAN, 255))
        for radius, opacity in ((36, 0.38), (16, 0.55)):
            blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius))
            r, g, b, a = blurred.split()
            a = a.point(lambda v, o=opacity: int(v * o))
            canvas.alpha_composite(Image.merge("RGBA", (r, g, b, a)))

    ImageDraw.Draw(canvas).text((x, y), text, font=font, fill=(*CREAM, 255))

    if brass_rule:
        rule = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        rd = ImageDraw.Draw(rule)
        rw = max(120, int(tw * 0.55))
        rh = max(4, font_size // 40)
        rx0 = (SIZE - rw) // 2
        ry0 = y + th + max(10, font_size // 14)
        rd.rounded_rectangle((rx0, ry0, rx0 + rw, ry0 + rh), radius=rh // 2, fill=(*BRASS_L, 210))
        # cyan hairline above brass
        rd.rounded_rectangle((rx0, ry0 - 3, rx0 + rw, ry0 - 1), radius=1, fill=(*CYAN, 180))
        canvas.alpha_composite(rule.filter(ImageFilter.GaussianBlur(0.6)))


def add_outer_glow(tile_rgba: Image.Image, canvas_size: int = SIZE, pad: int = PAD) -> Image.Image:
    """Place tile on transparent canvas with soft cyan outer bloom + drop shadow."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    tile = tile_rgba
    # shadow
    shadow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sm = squircle_mask(tile.size[0], RX)
    shadow_tile = Image.new("RGBA", tile.size, (0, 0, 0, 160))
    shadow_tile.putalpha(sm)
    shadow.paste(shadow_tile, (pad, pad + 8), shadow_tile)
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    canvas.alpha_composite(shadow)

    # cyan outer bloom from alpha
    bloom = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    cyan_tile = Image.new("RGBA", tile.size, (*CYAN, 255))
    cyan_tile.putalpha(sm)
    bloom.paste(cyan_tile, (pad, pad), cyan_tile)
    for radius, opacity in ((36, 0.35), (56, 0.22)):
        b = bloom.filter(ImageFilter.GaussianBlur(radius))
        r, g, bch, a = b.split()
        a = a.point(lambda v, o=opacity: int(v * o))
        canvas.alpha_composite(Image.merge("RGBA", (r, g, bch, a)))

    canvas.paste(tile, (pad, pad), tile)
    return canvas


def make_wordmark_icon() -> Image.Image:
    tile = make_gradient_tile(TILE, RX)
    # wordmark drawn on full canvas after placement
    canvas = add_outer_glow(tile)
    draw_wordmark(canvas, font_size=200, y_center=SIZE // 2 + 8, brass_rule=True)
    return canvas


def make_photo_slot_frame(hole: bool = True) -> tuple[Image.Image, dict]:
    """
    Colorful icon frame with circular photo slot in center.
    Returns (RGBA image, geometry dict).
    If hole=True, center circle alpha is 0 (transparent hole for compositing).
    """
    tile = make_gradient_tile(TILE, RX)
    canvas = add_outer_glow(tile)

    # Geometry of photo circle (in full 1024 canvas coords)
    photo_d = int(TILE * 0.52)  # ~508
    photo_r = photo_d // 2
    cx = SIZE // 2
    cy = SIZE // 2 - 36  # slightly above center to leave room for wordmark

    # Dual ring: outer brass, inner cyan
    ring = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    # soft outer glow behind ring
    for expand, col, w, blur, op in (
        (18, CYAN, 10, 16, 0.45),
        (10, BRASS_L, 6, 10, 0.35),
    ):
        layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse(
            (cx - photo_r - expand, cy - photo_r - expand,
             cx + photo_r + expand, cy + photo_r + expand),
            outline=(*col, int(255 * op)),
            width=w,
        )
        ring = Image.alpha_composite(ring, layer.filter(ImageFilter.GaussianBlur(blur)))

    # solid rings
    rd = ImageDraw.Draw(ring)
    rd.ellipse(
        (cx - photo_r - 14, cy - photo_r - 14, cx + photo_r + 14, cy + photo_r + 14),
        outline=(*BRASS, 220),
        width=8,
    )
    rd.ellipse(
        (cx - photo_r - 6, cy - photo_r - 6, cx + photo_r + 6, cy + photo_r + 6),
        outline=(*CYAN, 255),
        width=7,
    )
    # inner cream hairline
    rd.ellipse(
        (cx - photo_r - 1, cy - photo_r - 1, cx + photo_r + 1, cy + photo_r + 1),
        outline=(*CREAM, 180),
        width=2,
    )
    canvas.alpha_composite(ring)

    # Wordmark under circle
    draw_wordmark(canvas, font_size=92, y_center=cy + photo_r + 78, glow=True)

    geom = {
        "size": SIZE,
        "cx": cx,
        "cy": cy,
        "radius": photo_r,
        "diameter": photo_d,
        "tile_pad": PAD,
        "corner_rx": RX,
    }

    if hole:
        # Punch transparent hole (and clear inside ring area for photo)
        mask = Image.new("L", (SIZE, SIZE), 255)
        ImageDraw.Draw(mask).ellipse(
            (cx - photo_r, cy - photo_r, cx + photo_r, cy + photo_r),
            fill=0,
        )
        r, g, b, a = canvas.split()
        a = ImageChops_and(a, mask)
        canvas = Image.merge("RGBA", (r, g, b, a))

    return canvas, geom


def ImageChops_and(a: Image.Image, b: Image.Image) -> Image.Image:
    return Image.composite(a, Image.new("L", a.size, 0), b)


def make_placeholder_photo(diameter: int) -> Image.Image:
    """Gradient circle placeholder when no user photo."""
    img = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    px = img.load()
    r = diameter / 2
    for y in range(diameter):
        for x in range(diameter):
            dx, dy = x - r + 0.5, y - r + 0.5
            if dx * dx + dy * dy > r * r:
                continue
            t = (y / max(1, diameter - 1))
            # diagonal-ish cyan → brass cream
            u = (x / max(1, diameter - 1))
            c = lerp(lerp(CYAN_DEEP, CYAN, u), lerp(BRASS, BRASS_L, u), t * 0.7 + 0.15)
            # soft vignette
            dist = math.hypot(dx, dy) / r
            c = lerp(c, (20, 40, 60), max(0, dist - 0.55) / 0.45 * 0.35)
            px[x, y] = (*c, 255)
    # subtle initials
    d = ImageDraw.Draw(img)
    font = load_font(max(48, diameter // 5))
    text = "GO"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(
        ((diameter - tw) // 2 - bbox[0], (diameter - th) // 2 - bbox[1]),
        text,
        font=font,
        fill=(*CREAM, 230),
    )
    return img


def compose_photo(frame: Image.Image, geom: dict, photo_path: Path | None) -> Image.Image:
    d = geom["diameter"]
    cx, cy, r = geom["cx"], geom["cy"], geom["radius"]
    if photo_path and Path(photo_path).is_file():
        photo = Image.open(photo_path).convert("RGBA")
        # cover-fit into square then circle
        photo = ImageOps.fit(photo, (d, d), method=Image.Resampling.LANCZOS)
    else:
        photo = make_placeholder_photo(d)

    circle_mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(circle_mask).ellipse((0, 0, d - 1, d - 1), fill=255)
    photo.putalpha(circle_mask)

    out = frame.copy()
    # If frame has hole, paste photo underneath then frame on top
    base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    base.paste(photo, (cx - r, cy - r), photo)
    # put frame over (frame has transparent hole)
    composed = Image.alpha_composite(base, out)
    return composed


def export_sizes(master: Image.Image, stem_prefix: str = "gilil-on"):
    """Write master + derivatives into ICONS (overwrite package.json paths)."""
    ICONS.mkdir(parents=True, exist_ok=True)
    master_path = ICONS / f"{stem_prefix}-master-1024.png"
    master.save(master_path, "PNG")
    print(f"wrote {master_path}")

    def resize(sz: int) -> Image.Image:
        return master.resize((sz, sz), Image.Resampling.LANCZOS)

    # 512
    r512 = resize(512)
    r512.save(ICONS / f"{stem_prefix}-512.png", "PNG")
    r512.save(ICONS / "gilil-on-android-512.png", "PNG")
    r512.save(ICONS / "gilil-on-macos-512.png", "PNG")

    # macOS 1024
    master.save(ICONS / "gilil-on-macos-1024.png", "PNG")

    # Android adaptive full-bleed (same master; safe zone note in README)
    master.save(ICONS / "gilil-on-android-adaptive-1024.png", "PNG")

    # Tray 32
    resize(32).save(ICONS / "tray-icon.png", "PNG")
    # also root tray used by package.json files list
    resize(32).save(ROOT / "tray-icon.png", "PNG")

    # Windows ICO multi-size
    ico_path = ICONS / "gilil-on-windows.ico"
    write_multi_ico(master, ico_path)
    print(f"wrote {ico_path}")

    # macOS iconset + ICNS via Pillow
    iconset = ICONS / "gilil-on-macos-iconset"
    iconset.mkdir(parents=True, exist_ok=True)
    # Apple iconset names
    mapping = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_16x16_at_2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (64, "icon_32x32_at_2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_128x128_at_2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_256x256_at_2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
        (1024, "icon_512x512_at_2x.png"),
    ]
    for sz, name in mapping:
        resize(sz).save(iconset / name, "PNG")

    # Pillow ICNS — provide common sizes
    icns_sizes = [16, 32, 64, 128, 256, 512, 1024]
    icns_imgs = [resize(s) for s in icns_sizes]
    icns_path = ICONS / "gilil-on-macos.icns"
    try:
        icns_imgs[-1].save(
            icns_path,
            format="ICNS",
            append_images=icns_imgs[:-1],
        )
        print(f"wrote {icns_path}")
    except Exception as e:
        print(f"ICNS write via Pillow failed: {e}")
        # fallback: keep previous if any
    return master_path


def write_svg_colorful():
    """Vector reference matching the colorful style (wordmark)."""
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="GililOn">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#163A5C"/>
      <stop offset="55%" stop-color="#0E4A6E"/>
      <stop offset="100%" stop-color="#08708E"/>
    </linearGradient>
    <radialGradient id="bloom" cx="42%" cy="32%" r="70%">
      <stop offset="0%" stop-color="#2FC6F6" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#2FC6F6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#2FC6F6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="brassPocket" cx="78%" cy="82%" r="40%">
      <stop offset="0%" stop-color="#A8875A" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#A8875A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="specular" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <filter id="textGlow" x="-50%" y="-70%" width="200%" height="240%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b1"/>
      <feComponentTransfer in="b1" result="b1a"><feFuncA type="linear" slope="0.85"/></feComponentTransfer>
      <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="b2"/>
      <feComponentTransfer in="b2" result="b2a"><feFuncA type="linear" slope="0.65"/></feComponentTransfer>
      <feGaussianBlur in="SourceGraphic" stdDeviation="48" result="b3"/>
      <feComponentTransfer in="b3" result="b3a"><feFuncA type="linear" slope="0.42"/></feComponentTransfer>
      <feMerge>
        <feMergeNode in="b3a"/><feMergeNode in="b2a"/><feMergeNode in="b1a"/><feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="tileOuterGlow" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="28" result="g1"/>
      <feFlood flood-color="#2FC6F6" flood-opacity="0.40" result="c1"/>
      <feComposite in="c1" in2="g1" operator="in" result="glow1"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="48" result="g2"/>
      <feFlood flood-color="#2FC6F6" flood-opacity="0.25" result="c2"/>
      <feComposite in="c2" in2="g2" operator="in" result="glow2"/>
      <feMerge>
        <feMergeNode in="glow2"/><feMergeNode in="glow1"/><feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softShadow" x="-12%" y="-12%" width="124%" height="136%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.40"/>
    </filter>
    <clipPath id="tileClip">
      <rect x="24" y="24" width="976" height="976" rx="{RX}" ry="{RX}"/>
    </clipPath>
  </defs>
  <g filter="url(#tileOuterGlow)">
    <rect x="24" y="24" width="976" height="976" rx="{RX}" ry="{RX}" fill="url(#bgGrad)" filter="url(#softShadow)"/>
  </g>
  <g clip-path="url(#tileClip)">
    <rect x="24" y="24" width="976" height="976" fill="url(#bloom)"/>
    <rect x="24" y="24" width="976" height="976" fill="url(#brassPocket)"/>
    <rect x="24" y="24" width="976" height="976" fill="url(#specular)"/>
    <!-- inner rim -->
    <rect x="30" y="30" width="964" height="964" rx="{RX - 6}" ry="{RX - 6}"
          fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="3"/>
    <rect x="34" y="34" width="956" height="956" rx="{RX - 10}" ry="{RX - 10}"
          fill="none" stroke="#2FC6F6" stroke-opacity="0.35" stroke-width="2"/>
  </g>
  <text x="512" y="560" text-anchor="middle"
        font-family="Bebas Neue, Arial Narrow, Impact, sans-serif"
        font-weight="400" font-size="200" letter-spacing="6"
        fill="#2FC6F6" filter="url(#textGlow)">GILILON</text>
  <text x="512" y="560" text-anchor="middle"
        font-family="Bebas Neue, Arial Narrow, Impact, sans-serif"
        font-weight="400" font-size="200" letter-spacing="6"
        fill="#F8FAFC">GILILON</text>
</svg>
'''
    path = ICONS / "gilil-on.svg"
    path.write_text(svg, encoding="utf-8")
    print(f"wrote {path}")


def write_photo_slot_svg(geom: dict):
    cx, cy, r = geom["cx"], geom["cy"], geom["radius"]
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="GililOn photo-slot">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#163A5C"/>
      <stop offset="55%" stop-color="#0E4A6E"/>
      <stop offset="100%" stop-color="#08708E"/>
    </linearGradient>
    <radialGradient id="bloom" cx="42%" cy="32%" r="70%">
      <stop offset="0%" stop-color="#2FC6F6" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#2FC6F6" stop-opacity="0"/>
    </radialGradient>
    <mask id="hole">
      <rect width="1024" height="1024" fill="white"/>
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="black"/>
    </mask>
  </defs>
  <!-- Tile with transparent photo hole -->
  <g mask="url(#hole)">
    <rect x="24" y="24" width="976" height="976" rx="{RX}" ry="{RX}" fill="url(#bgGrad)"/>
    <rect x="24" y="24" width="976" height="976" rx="{RX}" ry="{RX}" fill="url(#bloom)"/>
  </g>
  <!-- Rings -->
  <circle cx="{cx}" cy="{cy}" r="{r + 14}" fill="none" stroke="#A8875A" stroke-width="8"/>
  <circle cx="{cx}" cy="{cy}" r="{r + 6}" fill="none" stroke="#2FC6F6" stroke-width="7"/>
  <circle cx="{cx}" cy="{cy}" r="{r + 1}" fill="none" stroke="#F8FAFC" stroke-opacity="0.7" stroke-width="2"/>
  <!-- Drop photo here: circle r={r} at ({cx},{cy}) -->
  <text x="512" y="{cy + r + 78}" text-anchor="middle"
        font-family="Bebas Neue, Arial Narrow, Impact, sans-serif"
        font-size="92" letter-spacing="4" fill="#F8FAFC">GILILON</text>
</svg>
'''
    (PHOTO_SLOT / "photo-slot-master.svg").write_text(svg, encoding="utf-8")


def make_preview_sheet(images: list[tuple[str, Image.Image]], out: Path, bg=(12, 14, 20)):
    """Labeled row of icons for chat preview."""
    cell = 280
    pad = 32
    label_h = 40
    n = len(images)
    w = pad + n * (cell + pad)
    h = pad + cell + label_h + pad
    sheet = Image.new("RGBA", (w, h), (*bg, 255))
    # checker for transparency feel under icons
    draw = ImageDraw.Draw(sheet)
    try:
        font = load_font(28)
        font_sm = load_font(22)
    except Exception:
        font = ImageFont.load_default()
        font_sm = font

    for i, (label, img) in enumerate(images):
        x = pad + i * (cell + pad)
        y = pad
        # soft plate
        draw.rounded_rectangle((x - 8, y - 8, x + cell + 8, y + cell + 8), radius=28, fill=(20, 28, 40, 255))
        thumb = img.resize((cell, cell), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x, y), thumb if thumb.mode == "RGBA" else None)
        # label
        bbox = draw.textbbox((0, 0), label, font=font_sm)
        tw = bbox[2] - bbox[0]
        draw.text((x + (cell - tw) // 2, y + cell + 10), label, font=font_sm, fill=(*CREAM, 255))
    sheet.convert("RGB").save(out, "PNG", quality=95)
    print(f"wrote {out}")


def sync_platform_copies():
    """Copy key assets into apple/android/windows icon folders (existing layout)."""
    copies = {
        "apple": [
            "gilil-on.svg",
            "gilil-on-master-1024.png",
            "gilil-on-512.png",
            "gilil-on-macos-512.png",
            "gilil-on-macos-1024.png",
            "gilil-on-macos.icns",
        ],
        "android": [
            "gilil-on.svg",
            "gilil-on-master-1024.png",
            "gilil-on-512.png",
            "gilil-on-android-512.png",
            "gilil-on-android-adaptive-1024.png",
        ],
        "windows": [
            "gilil-on.svg",
            "gilil-on-master-1024.png",
            "gilil-on-512.png",
            "gilil-on-windows.ico",
        ],
    }
    import shutil

    for plat, files in copies.items():
        dest_dir = ROOT / plat / "icons"
        dest_dir.mkdir(parents=True, exist_ok=True)
        for f in files:
            src = ICONS / f
            if src.exists():
                shutil.copy2(src, dest_dir / f)
        # iconset for apple
        if plat == "apple":
            src_set = ICONS / "gilil-on-macos-iconset"
            dst_set = dest_dir / "gilil-on-macos-iconset"
            if src_set.is_dir():
                if dst_set.exists():
                    shutil.rmtree(dst_set)
                shutil.copytree(src_set, dst_set)
    print("synced apple/android/windows icon copies")


def main():
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    PHOTO_SLOT.mkdir(parents=True, exist_ok=True)

    # 1) Colorful wordmark master (production — no photo)
    wordmark = make_wordmark_icon()
    export_sizes(wordmark, "gilil-on")
    write_svg_colorful()

    # 2) Photo-slot frame with transparent hole
    frame, geom = make_photo_slot_frame(hole=True)
    frame_path = PHOTO_SLOT / "photo-slot-frame-1024.png"
    frame.save(frame_path, "PNG")
    print(f"wrote {frame_path}")

    # Also save opaque preview of frame with placeholder already? separate below
    write_photo_slot_svg(geom)

    # geometry json for compose script
    import json
    (PHOTO_SLOT / "geometry.json").write_text(json.dumps(geom, indent=2), encoding="utf-8")

    # Solid frame without hole (for docs) — regenerate
    frame_solid, _ = make_photo_slot_frame(hole=False)
    # Actually for solid we still want to show placeholder inside — compose
    with_placeholder = compose_photo(frame, geom, None)
    with_placeholder.save(PHOTO_SLOT / "photo-slot-sample-1024.png", "PNG")
    with_placeholder.save(ICONS / "gilil-on-photo-slot-sample-1024.png", "PNG")

    # Mask-only (white circle on transparent = photo area)
    mask = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(mask).ellipse(
        (geom["cx"] - geom["radius"], geom["cy"] - geom["radius"],
         geom["cx"] + geom["radius"], geom["cy"] + geom["radius"]),
        fill=(255, 255, 255, 255),
    )
    mask.save(PHOTO_SLOT / "photo-slot-mask-1024.png", "PNG")

    # 3) Previews
    # Isolated icons on dark + light
    for name, img, bg in (
        ("preview-wordmark-dark.png", wordmark, (12, 14, 20)),
        ("preview-wordmark-light.png", wordmark, (236, 240, 244)),
        ("preview-photo-slot-dark.png", with_placeholder, (12, 14, 20)),
        ("preview-photo-slot-light.png", with_placeholder, (236, 240, 244)),
    ):
        sheet = Image.new("RGBA", (SIZE + 80, SIZE + 80), (*bg, 255))
        sheet.paste(img, (40, 40), img)
        sheet.convert("RGB").save(PREVIEWS / name, "PNG")
        print(f"wrote {PREVIEWS / name}")

    # Side-by-side comparison
    make_preview_sheet(
        [
            ("Colorful", wordmark),
            ("Photo slot", with_placeholder),
        ],
        PREVIEWS / "preview-compare.png",
    )

    # Size strip
    sizes = [16, 32, 64, 128, 256, 512]
    strip_w = 40 + sum(s + 24 for s in sizes)
    strip_h = 40 + 512 + 50
    for label, src, fname in (
        ("wordmark", wordmark, "preview-sizes-wordmark.png"),
        ("photo-slot", with_placeholder, "preview-sizes-photo-slot.png"),
    ):
        strip = Image.new("RGBA", (strip_w, strip_h), (12, 14, 20, 255))
        d = ImageDraw.Draw(strip)
        font = load_font(22)
        x = 28
        y_base = 40 + 512
        for s in sizes:
            thumb = src.resize((s, s), Image.Resampling.LANCZOS)
            y = y_base - s
            strip.paste(thumb, (x, y), thumb)
            bbox = d.textbbox((0, 0), f"{s}", font=font)
            tw = bbox[2] - bbox[0]
            d.text((x + (s - tw) // 2, y_base + 8), f"{s}", font=font, fill=(*CREAM, 220))
            x += s + 24
        strip.convert("RGB").save(PREVIEWS / fname, "PNG")
        print(f"wrote {PREVIEWS / fname}")

    # Combined all preview (for chat)
    make_preview_sheet(
        [
            ("ICO/master", wordmark),
            ("Android 512", wordmark),
            ("Photo slot", with_placeholder),
        ],
        PREVIEWS / "preview-all-colorful.png",
    )

    # Also refresh legacy preview names at icons root for compatibility
    make_preview_sheet(
        [("Colorful", wordmark), ("Photo slot", with_placeholder)],
        ICONS / "preview-all.png",
    )

    sync_platform_copies()
    print("DONE")


if __name__ == "__main__":
    main()
