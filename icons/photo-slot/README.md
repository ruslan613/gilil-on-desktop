# Photo-slot icon — insert your photo

Colorful GililOn frame with a **circular photo hole** (cyan + brass rings). Bebas «GILILON» wordmark sits under the circle.

## Quick insert (1–2 commands)

From the project root (`gilil-on-desktop/`):

```bash
python3 scripts/compose-icon-photo.py --photo /path/to/your-photo.jpg
```

Or with Node:

```bash
node scripts/compose-icon-photo.js --photo /path/to/your-photo.jpg
```

Outputs land in `icons/photo-slot/out/`:
- `gilil-on-photo-1024.png`
- `gilil-on-photo-512.png`
- `gilil-on-photo-windows.ico` (16…256)
- `gilil-on-photo-macos.icns`
- `gilil-on-photo-android-512.png`

### Also overwrite Electron package icons

```bash
python3 scripts/compose-icon-photo.py --photo ./me.jpg --rebuild-package-icons
```

This replaces `icons/gilil-on-master-1024.png`, `gilil-on-512.png`, `gilil-on-windows.ico`, `gilil-on-macos.icns`, `gilil-on-android-512.png`, and `tray-icon.png` (paths already referenced by `package.json`).

## Manual composite (ImageMagick)

If you prefer a shell one-liner (ImageMagick `convert`/`magick`):

```bash
# geometry: circle center 512,476 radius 254 (see geometry.json)
magick icons/photo-slot/sample-user-photo.png -resize 508x508^ -gravity center -extent 508x508 \
  \( +clone -size 508x508 xc:black -fill white -draw 'circle 254,254 254,0' \) -alpha off -compose copyopacity -composite \
  icons/photo-slot/photo-slot-frame-1024.png -geometry +258+222 -compose dstover -composite \
  icons/photo-slot/out/manual-1024.png
```

(Using the Python script is recommended — it matches `geometry.json` exactly.)

## Files in this folder

| File | Role |
|------|------|
| `photo-slot-frame-1024.png` | Master frame with **transparent hole** |
| `photo-slot-mask-1024.png` | White circle = photo area |
| `photo-slot-master.svg` | Vector reference |
| `photo-slot-sample-1024.png` | Preview with placeholder gradient + «GO» |
| `geometry.json` | `cx`, `cy`, `radius`, `diameter` |
| `sample-user-photo.png` | Dummy face for testing compose |
| `out/` | Compose script outputs |

## Regenerate colorful masters (no photo)

```bash
python3 scripts/generate-colorful-icons.py
```
