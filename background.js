// Service worker: keeps the declarativeNetRequest dynamic rule in sync with
// what the user has configured in the popup (stored in chrome.storage.local).

importScripts("presets.js"); // PRESETS, presetHeaders()

const RULE_ID = 1;

// All resource types, so headers are overridden on every kind of request
// (page loads, XHR/fetch, images, scripts, etc.).
const ALL_RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "other"
];

async function syncRules() {
  const { enabled = false, headers = [], presets = {} } =
    await chrome.storage.local.get(["enabled", "headers", "presets"]);

  // Custom headers (master switch) from valid rows only.
  const custom = enabled
    ? headers
        .filter((h) => h && typeof h.name === "string" && h.name.trim() !== "")
        .map((h) => ({ name: h.name.trim(), value: h.value != null ? String(h.value) : "" }))
    : [];

  // Debug presets have their own switches. A custom header with the same
  // name replaces the preset's value, since it is the more explicit choice.
  const customNames = new Set(custom.map((h) => h.name.toLowerCase()));
  const combined = [
    ...presetHeaders(presets).filter((h) => !customNames.has(h.name.toLowerCase())),
    ...custom
  ];

  const requestHeaders = combined.map((h) => ({
    header: h.name,
    operation: "set",
    value: h.value
  }));

  const addRules =
    requestHeaders.length > 0
      ? [
          {
            id: RULE_ID,
            priority: 1,
            action: {
              type: "modifyHeaders",
              requestHeaders
            },
            condition: {
              urlFilter: "*",
              resourceTypes: ALL_RESOURCE_TYPES
            }
          }
        ]
      : [];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules
  });

  // Badge shows ON when overrides are live.
  const active = addRules.length > 0;
  await chrome.action.setBadgeText({ text: active ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
}

// Re-sync whenever the popup changes the config...
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.enabled || changes.headers || changes.presets)) {
    syncRules();
  }
});

// ...and on install / browser startup so persisted rules come back.
chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
