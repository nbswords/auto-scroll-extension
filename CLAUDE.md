# CLAUDE.md

## Project Overview
Auto Scroll is a Chrome extension (Manifest V3) that auto-scrolls web pages with a human-like rhythm: scroll a segment, pause, repeat.

## Architecture
- `manifest.json` — Extension config. No content_scripts; injection is on-demand via `activeTab` + `scripting`.
- `popup.html` / `popup.js` — Popup UI with sliders and theme toggle. Communicates with content script via `chrome.tabs.sendMessage`.
- `content.js` — Injected into the active tab on demand. Handles the scroll loop using `setInterval` + `requestAnimationFrame` with easeInOutCubic easing.
- `privacy-policy.html` — Hosted via GitHub Pages at https://nbswords.github.io/auto-scroll-extension/privacy-policy.html

## Key Design Decisions
- No `<all_urls>` or `content_scripts` in manifest — content script is injected only when the user clicks the extension and starts scrolling, minimizing permissions for Chrome Web Store compliance.
- Popup uses `chrome.scripting.executeScript` as fallback if `sendMessage` fails (content script not yet injected).
- `findScrollable()` in content.js walks the DOM to find the best scrollable container, supporting SPAs and custom scroll containers.
- Theme preference stored in popup's `localStorage`.

## Build & Deploy
- No build step. Raw JS/HTML/CSS.
- Package: `zip -r auto-scroll-extension.zip manifest.json popup.html popup.js content.js icons/`
- Upload ZIP to Chrome Web Store Developer Dashboard.

## Testing
Load unpacked from `chrome://extensions/` with Developer mode enabled. Refresh target pages after reloading the extension.
