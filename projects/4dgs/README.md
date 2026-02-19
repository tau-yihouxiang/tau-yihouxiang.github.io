# 4DGS Static Package

This folder is a standalone static webpage package.

## Included

- `index.html` (viewer page)
- `dist/` (Spark runtime)
- `vendor/three/` (Three.js runtime)
- `public/` (local frame assets)
- `pico-logo.png`, `pico-viewer.png`, SVG assets
- `serve.js` (local server with dynamic scene discovery API)

## How to deploy to GitHub Pages

1. Create a new repository (for example: `tau-yihouxiang.github.io` or any project repo).
2. Copy all files in this `4dgs` folder to the repo root.
3. Push to GitHub.
4. In repository settings, enable **Pages** and choose branch `main` and folder `/ (root)`.

## Configure your scenes

Place your scene folders under `public/`, for example:

- `public/bear/0000.spz`
- `public/少年派/0000.sog`

When running `serve.js`, the UI calls `/api/scenes` and auto-discovers all subfolders and supported frame files.

## Notes

- This package now depends on `/api/scenes` for folder discovery.
- If you open `index.html` directly with `file://`, folder discovery will not work; use `node serve.js` or another server that provides `/api/scenes`.
