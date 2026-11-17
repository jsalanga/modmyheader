// Popup: debug preset toggles, plus the list of custom header overrides and
// their on/off toggle.
// Everything is saved to chrome.storage.local; the service worker watches
// storage and rebuilds the declarativeNetRequest rule.

const rowsEl = document.getElementById("rows");
const enabledEl = document.getElementById("enabled");
const statusEl = document.getElementById("status");
const addBtn = document.getElementById("add");
const presetsEl = document.getElementById("presets");

let saveTimer = null;
// { [presetId]: { on: boolean, options?: { [directive]: boolean } } }
let presetState = {};

function createPreset(preset) {
  const state = (presetState[preset.id] ||= { on: false });

  const wrap = document.createElement("div");
  wrap.className = "preset";

  const head = document.createElement("div");
  head.className = "preset-head";

  const expand = document.createElement("button");
  expand.type = "button";
  expand.className = "expand";
  if (preset.list) {
    expand.classList.add("chevron");
    expand.title = "Choose " + preset.list.header + " directives";
    expand.setAttribute("aria-expanded", "false");
  } else {
    expand.disabled = true;
    expand.setAttribute("aria-hidden", "true");
  }

  const text = document.createElement("div");
  text.className = "preset-text";
  const name = document.createElement("div");
  name.className = "preset-name";
  name.textContent = preset.name;
  const desc = document.createElement("div");
  desc.className = "preset-desc";
  desc.textContent = preset.description;
  text.append(name, desc);

  const sw = document.createElement("label");
  sw.className = "switch small";
  sw.title = "Send " + preset.name + " debug headers";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = !!state.on;
  const slider = document.createElement("span");
  slider.className = "slider";
  sw.append(toggle, slider);
  toggle.addEventListener("change", () => {
    state.on = toggle.checked;
    save();
  });

  head.append(expand, text, sw);
  wrap.appendChild(head);

  if (preset.list) {
    const opts = document.createElement("div");
    opts.className = "options";
    opts.hidden = true;

    const label = document.createElement("div");
    label.className = "options-label";
    label.textContent = "Sends " + preset.list.header + ":";
    opts.appendChild(label);

    const checked = new Set(selectedOptions(preset, state));
    for (const o of preset.list.options) {
      const row = document.createElement("label");
      row.className = "option";
      row.title = o.value;
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = checked.has(o.value);
      cb.addEventListener("change", () => {
        state.options ||= {};
        state.options[o.value] = cb.checked;
        save();
      });
      const span = document.createElement("span");
      span.textContent = o.label;
      row.append(cb, span);
      opts.appendChild(row);
    }

    expand.addEventListener("click", () => {
      opts.hidden = !opts.hidden;
      expand.setAttribute("aria-expanded", String(!opts.hidden));
      expand.classList.toggle("open", !opts.hidden);
    });
    wrap.appendChild(opts);
  }

  presetsEl.appendChild(wrap);
}

function createRow(name = "", value = "") {
  const row = document.createElement("div");
  row.className = "row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Header name";
  nameInput.value = name;
  nameInput.className = "h-name";

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.placeholder = "Value";
  valueInput.value = value;
  valueInput.className = "h-value";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "×"; // ×
  remove.title = "Remove header";
  remove.addEventListener("click", () => {
    row.remove();
    if (!rowsEl.children.length) createRow(); // never leave it empty
    scheduleSave();
  });

  nameInput.addEventListener("input", scheduleSave);
  valueInput.addEventListener("input", scheduleSave);

  row.append(nameInput, valueInput, remove);
  rowsEl.appendChild(row);
  return row;
}

function readHeaders() {
  return [...rowsEl.querySelectorAll(".row")].map((row) => ({
    name: row.querySelector(".h-name").value,
    value: row.querySelector(".h-value").value
  }));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

async function save() {
  await chrome.storage.local.set({
    enabled: enabledEl.checked,
    headers: readHeaders(),
    presets: presetState
  });
  statusEl.textContent = "Saved";
  statusEl.classList.add("saved");
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.classList.remove("saved");
  }, 1200);
}

async function load() {
  const { enabled = false, headers = [], presets = {} } =
    await chrome.storage.local.get(["enabled", "headers", "presets"]);
  presetState = presets;
  PRESETS.forEach(createPreset);
  enabledEl.checked = enabled;
  if (headers.length) {
    headers.forEach((h) => createRow(h.name, h.value));
  } else {
    createRow();
  }
}

addBtn.addEventListener("click", () => {
  createRow();
  scheduleSave();
});
enabledEl.addEventListener("change", save);

load();
