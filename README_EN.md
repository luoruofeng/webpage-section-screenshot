<div align="center">

# Webpage Section Screenshot

**🌐 Language / Choose Language / 选择语言 / 言語を選択 / Choisir la langue / Sprache wählen / Seleccionar idioma / Selecionar idioma / 언어 선택 / Выберите язык**

| [🇨🇳 简体中文](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇫🇷 Français](README_FR.md) |
| :---: | :---: | :---: | :---: |
| [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md) | [🇵🇹 Português](README_PT.md) | [🇰🇷 한국어](README_KO.md) |
| [🇷🇺 Русский](README_RU.md) | | | |

</div>

A **Chrome Manifest V3** extension that lets you manually select multiple sections of a webpage using a Photoshop-style ruler, and save each section as an independent PNG image. It supports dividing areas via ruler guides, mouse selection boxes, and auto-selection by CSS Class, with high-definition export that is automatically archived into folders named by timestamp.

## Features

### Area Division (three methods can be combined)

- **Pixel ruler bar**: Rulers at the top (X axis) and leftmost side (Y axis) of the page, with ticks and numbers, adapted for HiDPI screens
- **Drag to create guides**: Hold the left mouse button on the ruler and drag to create vertical / horizontal guides
- **Guide management**: Positions can be dragged to modify; click a guide to show a delete button; supports clearing all guides at once
- **Selection box**: After enabling selection-box mode, drag directly on the page to select any area, and that box becomes a screenshot region
- **Auto-selection (Class)**: Enter a CSS Class name, and the extension automatically creates selection boxes for all matching elements

### Screenshot & Export

- **High-definition export**: The full-page canvas and saved PNGs are rendered at `document size × devicePixelRatio × EXPORT_SCALE`, with a 2× magnification for sharper output
- **Section crop PNG**: One-click crop saves each region (guide grid cell + selection box) as an independent PNG image
- **Progress modal**: Detailed progress bar, current/total, cancel operation, and completion feedback (with a one-click "open download folder" button)
- **Huge image download**: Uses an Offscreen Document to send the data URL in chunks and convert it to a Blob, bypassing the 2MB length limit of `chrome.downloads` for data URLs, so ultra-high-resolution screenshots save completely
- **Automatic time-based archiving**: Each batch is saved into an independent folder named by the current time (e.g. `2026年08月25日 14时30分55秒_500_A1B2`), avoiding overwrites and directory pollution

### Usability

- **PNG naming rule**: `序号_网页名称.png` (e.g. `1_example.png`), with the web name automatically parsed from the URL
- **Guide persistence**: Guides are automatically restored after page refresh, and are isolated per URL so different pages do not share guides
- **Shortcut key**: Press `P` by default to quickly toggle selection-box mode (`ESC` to exit), customizable in Settings
- **Settings panel**: Supports configuring and persisting the selection-box shortcut key
- **Dual-entry control**: Browser toolbar Popup + in-page floating toolbar

### Other

- **Buy the author a coffee**: Built-in donation popup with QR code to support the author

## Loading Locally (Development Mode)

1. Open Chrome and visit `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner
3. Click **Load unpacked**
4. Select the plugin root directory (the folder containing `manifest.json`)

## Usage

1. **Set guides**
   - Move the mouse onto the page's **top ruler** (X axis), hold the left button and drag downward to create a **horizontal guide** (a horizontal line representing the Y coordinate).
   - Move the mouse onto the page's **left ruler** (Y axis), hold the left button and drag rightward to create a **vertical guide** (a vertical line representing the X coordinate).
   - The current coordinate (in pixels) is shown in real time while dragging.
   - Guides are positioned by **document coordinates** (attached to page content) and move with the page when scrolling.
2. **Adjust guides**
   - Hold an existing guide and drag to change its position.
   - Click a guide to show a red delete button; click it to delete that guide.
3. **Use the selection box** (best for precisely selecting a region)
   - Click the "Enable Selection Box" button on the toolbar (or press the default shortcut `P`).
   - After enabling, hold the left button and drag directly on the page; the selected rectangle becomes a screenshot region. Multiple regions can be selected at once.
   - Each selection box has a delete button in its top-right corner; press `P` again or `ESC` to exit selection mode.
   - The shortcut can be changed and saved in Settings.
4. **Auto-selection (Class)**
   - Click the "Auto Selection (Class)" button on the toolbar.
   - Enter the Class name of the page elements (the leading `.` may be omitted), then confirm.
   - The extension automatically creates selection boxes for all visible elements matching that Class.
5. **Start cropping**
   - Click the "Start Crop PNG" button on the floating toolbar or in the Popup.
   - The extension hides the rulers / guides / selection boxes / toolbar, captures region by region, and shows a progress modal.
   - Each region is named `序号_网页名称.png` and saved into a subfolder named by the current time.
   - After completion, click "Open Saved Folder" to view the results directly.
6. **Others**
   - "Clear All Guides" removes both all guides and all selection boxes.
   - "Hide/Show Ruler" toggles whether the ruler bar is displayed.
   - "Settings" changes the selection-box shortcut key.
   - "Buy the Author a Coffee" lets you scan a QR code to support the author.

## Project Structure

```
webpage-section-screenshot/
├── manifest.json                # Manifest V3 config
├── background/
│   ├── service-worker.js        # Background Service Worker (screenshot/download message handling)
│   └── offscreen.html/.js       # Offscreen document: huge data URL → Blob conversion & chunk assembly
├── content/
│   ├── index.js                 # content script entry (module assembly & dependency injection)
│   ├── constants.js             # Constants & global SSS namespace
│   ├── Storage.js               # chrome.storage wrapper
│   ├── BackgroundService.js     # Background communication wrapper (incl. chunked download)
│   ├── style.css                # Shadow DOM styles (isolated)
│   └── modules/                 # Feature modules (high cohesion, low coupling)
│       ├── Ruler.js             # Ruler bar
│       ├── GuideManager.js      # Guide management (incl. per-URL persistence)
│       ├── SelectionManager.js  # Selection boxes (mouse drag / Class auto-selection)
│       ├── ScreenshotManager.js # Section screenshot & crop (per-cell canvas stitching)
│       ├── Naming.js            # PNG naming & timestamp-folder rules
│       ├── ProgressModal.js     # Save progress modal
│       ├── SettingsModal.js     # Settings modal (shortcut config)
│       ├── CoffeeModal.js       # Buy-a-coffee (donation) modal
│       ├── ClassSelectionModal.js # Class auto-selection input modal
│       └── Toolbar.js           # In-page floating toolbar
├── lib/
│   └── html-to-image.js         # Supplementary full-page screenshot (SVG foreignObject)
├── assets/
│   ├── icons/                   # Extension icons (16/32/48/128)
│   └── pay_coffee.jpg           # Donation QR code
└── README.md
```

## Technical Notes

### Screenshot Approach (scroll stitching + crop by region)

- **Primary approach**: **Scroll stitching** — regardless of how long/wide the page is (including horizontal and vertical scrollbars), it first divides the full page into a grid by viewport size, then scrolls cell by cell and calls `chrome.tabs.captureVisibleTab` to capture the real rendered image.
  - Unlike the earlier "full-page canvas" approach, the current implementation **no longer creates one huge full-page canvas** (to avoid exceeding the browser's 32k-pixel limit and producing blank images). Instead, it **creates an independent canvas for each region to save**, and while scrolling it draws the intersection between the viewport and each region directly into the corresponding region canvas, significantly reducing memory usage and stitching-failure risk.
  - Both visible and invisible (scroll-required) parts are fully saved.
  - Guides / selection boxes are the only dividing criteria; each region = a grid cell of the guide grid + user-selected boxes.
  - Uses real rendered screenshots, higher fidelity than html2canvas.
- **Capture rate limiting**: `captureVisibleTab` is throttled (at least 500ms between two calls), and automatically backs off and retries when a Chrome quota error occurs, avoiding interruption during cell-by-cell capture.
- **HiDPI upscaling**: `EXPORT_SCALE` (default 2) further enlarges on top of dpr for sharper PNG output.
- **Supplementary approach**: `lib/html-to-image.js` (SVG `foreignObject`), available as a fallback for extreme scenarios (e.g. inner scroll containers), extendable as needed.

### Huge Image Download (Offscreen Document + chunked transfer)

- **Problem**: `chrome.downloads.download` directly accepting a data URL is limited to **2MB**, so ultra-high-resolution screenshots may fail or be wrongly saved as `.txt`; and `URL.createObjectURL` is unavailable in an MV3 Service Worker.
- **Approach**: Dynamically create an **Offscreen Document**, which performs the `data URL → Blob → blob URL` conversion in a normal DOM environment.
  - The Content Script splits the huge data URL into chunks of 4MB and sends them one by one (`DOWNLOAD_CHUNK`); the offscreen document accumulates them by filename;
  - After all chunks are sent, it is notified to assemble them in order into a Blob and generate a blob URL (`DOWNLOAD_ASSEMBLE`); missing chunks cause an error rather than producing a corrupted file;
  - The final download action is performed by the Service Worker using the blob URL via `chrome.downloads.download` (the offscreen document lacks that permission).
- Each image is saved into a timestamp-named subfolder, avoiding overwrites and directory pollution.

### Code Architecture (high cohesion, low coupling)

- Each feature module is encapsulated independently under `content/modules/`, mounted on the global `SSS` namespace (loaded in dependency order by the manifest, not ES Modules).
- The entry `index.js` is only responsible for **dependency injection & assembly**, containing no business logic.
- Modules communicate via **callbacks / messages**, avoiding direct dependencies.
- All UI lives inside a **Shadow DOM**, fully isolated from the host page styles.
- Guide persistence is stored isolated per URL (`{ sss_guides: { [url]: [] } }`), using a serial queue to avoid read-modify-write races.

### Notes

- Full-page stitching relies on the browser viewport capture API and scrolls the whole page cell by cell; the larger the page, the longer it takes (about 250ms wait per cell for repaint to finish).
- If the page contains `position: fixed` elements (e.g. a fixed navbar), those elements appear in every viewport segment during stitching — an inherent limitation of full-page capture.
- Guide coordinates are based on the document (`window` scroll); if the page body lives in an inner scroll container, you may need to target that container instead.
- Due to browser security restrictions, some special pages (e.g. `chrome://`, Web Store) cannot be injected.
- When a page contains cross-origin resources, the capture API returns the real rendered image, unaffected by canvas cross-origin tainting.

## Test Checklist

- [x] All JS files pass syntax checking (`node --check`)
- [x] `manifest.json` passes JSON validation; all referenced files exist
- [x] Naming-rule unit tests (URL → web name → filename)
- [x] Partition-algorithm unit tests (region count, total area coverage, no overlap)
- [ ] Real-world capture on various typical pages (long pages, scrolling pages, pages with fixed elements)
- [ ] Real-world test of guide drag, modify, delete, and clear-all
- [ ] Real-world test of selection-box drag, shortcut toggle, and Class auto-selection
- [ ] Real-world test of progress modal, cancel, ultra-long chunked download, and open-folder

> Tip: After loading the extension, open any webpage and run through the flows above. If you run into issues, right-click the page → "Inspect" → Console and look for logs prefixed with `[SSS]`.
