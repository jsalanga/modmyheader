# ModMyHeader

A Manifest V3 Chrome extension that overrides outgoing **request headers** on
every site, so you can test how a website behaves under different headers.

## Features
- Enter any number of header **name → value** pairs in the popup.
- Master **on/off toggle** — flip overrides without deleting your list.
- Settings **persist across browser restarts** (`chrome.storage.local`).
- Applies to **all sites** and all request types (page loads, fetch/XHR, etc.).
- Badge shows **ON** when overrides are active.

## Load it in Chrome
1. Go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder.
4. Click the ModMyHeader icon, add your headers, and flip the toggle on.

## Notes
- An empty header name means that row is ignored.
- Uses the `declarativeNetRequest` API with `operation: "set"`, which **adds the
  header or replaces its existing value**.
- Some browser-controlled headers (e.g. certain `Sec-*`, `Host`) may be
  restricted by Chrome and cannot be overridden.
- Changes take effect immediately — no need to reload the extension.

## Files
| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3, permissions). |
| `background.js` | Service worker; syncs storage → dynamic header rule. |
| `popup.html/css/js` | The editor UI shown on the toolbar icon. |
