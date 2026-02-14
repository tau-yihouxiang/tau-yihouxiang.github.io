# 4DGS Static Package

This folder is a standalone static webpage package.

## Included

- `index.html` (viewer page)
- `dist/` (Spark runtime)
- `vendor/three/` (Three.js runtime)
- `public/` (local frame assets)
- `pico-logo.png`, `pico-viewer.png`, SVG assets
- `scenes.json` (scene list config)

## How to deploy to GitHub Pages

1. Create a new repository (for example: `tau-yihouxiang.github.io` or any project repo).
2. Copy all files in this `4dgs` folder to the repo root.
3. Push to GitHub.
4. In repository settings, enable **Pages** and choose branch `main` and folder `/ (root)`.

## Configure your scenes

Edit `scenes.json`:

Default config already points to local assets under `./public/`.

```json
{
  "scenes": {
    "your-scene": {
      "urls": [
        "https://your-cdn/path/frame_0001.spz",
        "https://your-cdn/path/frame_0002.spz"
      ]
    }
  }
}
```

You can also use this format:

```json
{
  "scenes": {
    "your-scene": {
      "baseUrl": "https://your-cdn/path/",
      "files": ["frame_0001.spz", "frame_0002.spz"]
    }
  }
}
```

Or a pattern:

```json
{
  "scenes": {
    "your-scene": {
      "pattern": "https://your-cdn/path/frame_{0001..0032}.spz"
    }
  }
}
```

## Notes

- This is a static package: no backend API is required.
- If you open `index.html` directly with `file://`, browser CORS may block `scenes.json`; use any static host/server.
