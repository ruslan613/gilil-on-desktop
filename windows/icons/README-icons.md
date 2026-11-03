# GililOn — application icons (colorful iPhone-like)

## Design (2026-10-31)
Rounded squircle tile (**corner ≈ 22.5%** of edge — iOS continuous feel):
- **Background:** vertical navy→teal gradient + radial **#2FC6F6** cyan bloom + soft top specular (volume) + optional brass warm pocket
- **Rim:** white + cyan inner hairline; brass accent on lower arc / photo ring
- **Wordmark:** Bebas Neue **GILILON**, cream `#F8FAFC`, dark halo + cyan bloom; thin brass+cyan rule under letters
- **Photo-slot variant:** circular photo (⌀ ≈ 52% of tile) with dual brass/cyan frame; small GILILON under circle

Master raster is Pillow + Bebas Neue. `gilil-on.svg` is the vector reference.

## Files
| File | Purpose |
|------|---------|
| `gilil-on.svg` | Vector source (colorful gradients + glow) |
| `gilil-on-master-1024.png` | Master 1024×1024 (**production wordmark**, no photo) |
| `gilil-on-512.png` | General 512 |
| `gilil-on-windows.ico` | Windows multi-size ICO (16,24,32,48,64,128,256) |
| `gilil-on-macos.icns` | Full macOS ICNS |
| `gilil-on-macos-iconset/` | PNG set (`_at_2x` + `@2x`) |
| `gilil-on-macos-512.png` / `gilil-on-macos-1024.png` | Standalone macOS sizes |
| `gilil-on-android-512.png` | Android 512 |
| `gilil-on-android-adaptive-1024.png` | Adaptive full-bleed |
| `tray-icon.png` | Tray 32×32 |
| `photo-slot/` | Photo template + compose outputs — see `photo-slot/README.md` |
| `previews/` | Chat preview PNGs |

## Electron / package.json paths (unchanged)
- `icons/gilil-on-windows.ico`
- `icons/gilil-on-512.png`
- `icons/tray-icon.png`
- root `tray-icon.png`

## Rebuild
```bash
python3 scripts/generate-colorful-icons.py
```

## Insert your photo
```bash
python3 scripts/compose-icon-photo.py --photo /path/to/photo.jpg
# optional: also overwrite package icons
python3 scripts/compose-icon-photo.py --photo /path/to/photo.jpg --rebuild-package-icons
```

## Rebuild `.icns` on a Mac (optional)
```bash
cd gilil-on-macos-iconset
for f in *_at_2x.png; do cp "$f" "${f/_at_2x/@2x}"; done
cd ..
cp -R gilil-on-macos-iconset gilil-on-macos.iconset
iconutil -c icns gilil-on-macos.iconset -o gilil-on-macos.icns
```
(Or use the shipped `gilil-on-macos.icns` from the generator.)
