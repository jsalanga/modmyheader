// Debug header presets, shared by the service worker (importScripts) and the
// popup (<script>). Each preset sends fixed `headers` and/or one comma-joined
// `list` header built from the directives the user has checked.

const PRESETS = [
  {
    id: "akamai",
    name: "Akamai Pragma",
    description: "Cache status, cache key and request ID headers in Akamai responses.",
    list: {
      header: "Pragma",
      options: [
        { value: "akamai-x-cache-on", label: "X-Cache (HIT / MISS)", default: true },
        { value: "akamai-x-cache-remote-on", label: "X-Cache-Remote (parent tier)", default: true },
        { value: "akamai-x-check-cacheable", label: "X-Check-Cacheable", default: true },
        { value: "akamai-x-get-cache-key", label: "X-Cache-Key", default: true },
        { value: "akamai-x-get-true-cache-key", label: "X-True-Cache-Key", default: true },
        { value: "akamai-x-get-request-id", label: "X-Akamai-Request-ID", default: true },
        { value: "akamai-x-serial-no", label: "X-Serial", default: true },
        { value: "akamai-x-get-extracted-values", label: "X-Akamai-Session-Info (variables)", default: true },
        { value: "akamai-x-get-client-ip", label: "Client IP as seen by Akamai", default: false },
        { value: "akamai-x-get-ssl-client-session-id", label: "TLS client session ID", default: false },
        { value: "akamai-x-ro-trace", label: "Resource Optimizer trace", default: false },
        { value: "akamai-x-feo-trace", label: "FEO trace (legacy)", default: false }
      ]
    }
  },
  {
    id: "fastly",
    name: "Fastly",
    description: "Fastly-Debug-Path, Fastly-Debug-TTL and surrogate keys.",
    headers: [{ name: "Fastly-Debug", value: "1" }]
  },
  {
    id: "edgecast",
    name: "Edgio / EdgeCast",
    description: "X-EC-Debug cache status, cacheability and cache key.",
    list: {
      header: "X-EC-Debug",
      options: [
        { value: "x-ec-cache", label: "Cache status", default: true },
        { value: "x-ec-cache-remote", label: "Origin shield cache status", default: true },
        { value: "x-ec-check-cacheable", label: "Cacheable check", default: true },
        { value: "x-ec-cache-key", label: "Cache key", default: true },
        { value: "x-ec-cache-state", label: "Cache state (TTL, age)", default: true }
      ]
    }
  },
  {
    id: "nocache",
    name: "Cache bypass",
    description: "Ask caches to revalidate with the origin.",
    headers: [
      { name: "Cache-Control", value: "no-cache" },
      { name: "Pragma", value: "no-cache" }
    ]
  },
  {
    id: "aem",
    name: "AEM Dispatcher",
    description: "X-Dispatcher-Info explains Dispatcher cache decisions.",
    headers: [{ name: "X-Dispatcher-Info", value: "true" }]
  },
  {
    id: "magento",
    name: "Magento + Varnish",
    description: "X-Magento-Debug adds cache tags and debug headers.",
    headers: [{ name: "X-Magento-Debug", value: "1" }]
  }
];

// Directives checked for a list preset: saved choices, else the defaults.
function selectedOptions(preset, state) {
  const saved = state && state.options;
  return preset.list.options
    .filter((o) => (saved && o.value in saved ? saved[o.value] : o.default))
    .map((o) => o.value);
}

// Headers contributed by the presets that are switched on. Values for the
// same header (e.g. Akamai Pragma + "Pragma: no-cache") are comma-joined.
function presetHeaders(presetState = {}) {
  const merged = new Map(); // lower-case name -> { name, values[] }
  const add = (name, value) => {
    const key = name.toLowerCase();
    if (!merged.has(key)) merged.set(key, { name, values: [] });
    const entry = merged.get(key);
    if (!entry.values.includes(value)) entry.values.push(value);
  };

  for (const preset of PRESETS) {
    const state = presetState[preset.id];
    if (!state || !state.on) continue;
    for (const h of preset.headers || []) add(h.name, h.value);
    if (preset.list) {
      const values = selectedOptions(preset, state);
      if (values.length) add(preset.list.header, values.join(", "));
    }
  }

  return [...merged.values()].map((e) => ({ name: e.name, value: e.values.join(", ") }));
}
