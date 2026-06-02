# Float Finder — Electron Desktop App

A textile float detection tool for Jacquard/embroidery design.
Developed for **Balaji & Brother**.

---

## Setup (one time)

```bash
npm install
```

---

## Run (Development)

```bash
npm start
```

Opens the app in an Electron window for testing.

---

## Build — Windows EXE

```bash
npm run dist
```

This creates **both** artifacts inside the `release/` folder:

| File | Type |
|------|------|
| `Float-Finder-Setup-1.0.0.exe` | NSIS Installer (recommended for end users) |
| `Float-Finder-Portable-1.0.0.exe` | Portable EXE (no installation needed) |

### Other build commands

| Command | Description |
|---------|-------------|
| `npm run dist:installer` | Installer only |
| `npm run dist:portable`  | Portable EXE only |

---

## Project Structure

```
Float Finder/
├── FloatFinder.html     ← Main application (self-contained)
├── main.js              ← Electron main process
├── preload.js           ← Context bridge
├── package.json         ← Build configuration
├── assets/
│   └── icon.ico         ← App icon (place your 256x256 ICO here)
└── release/             ← Build output (auto-created by npm run dist)
```

---

## App Icon

Place a `256×256` `.ico` file at `assets/icon.ico`.

The app works without an icon (uses Electron default), but having one
makes the exe and installer look professional.

**Convert PNG → ICO:** https://convertio.co/png-ico/

---

## Requirements

- Node.js ≥ 18
- Windows 10/11 (for building Windows exe)
