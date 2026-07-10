// Service worker: keeps the declarativeNetRequest dynamic rule in sync with
// what the user has configured in the popup (stored in chrome.storage.local).

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
  const { enabled = false, headers = [] } =
    await chrome.storage.local.get(["enabled", "headers"]);

  // Build the list of header modifications from valid rows only.
  const requestHeaders = headers
    .filter((h) => h && typeof h.name === "string" && h.name.trim() !== "")
    .map((h) => ({
      header: h.name.trim(),
      operation: "set",
      value: h.value != null ? String(h.value) : ""
    }));

  const addRules =
    enabled && requestHeaders.length > 0
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
  if (area === "local" && (changes.enabled || changes.headers)) {
    syncRules();
  }
});

// ...and on install / browser startup so persisted rules come back.
chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
