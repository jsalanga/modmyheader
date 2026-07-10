// Popup: edit the list of header overrides and the master on/off toggle.
// Everything is saved to chrome.storage.local; the service worker watches
// storage and rebuilds the declarativeNetRequest rule.

const rowsEl = document.getElementById("rows");
const enabledEl = document.getElementById("enabled");
const statusEl = document.getElementById("status");
const addBtn = document.getElementById("add");

let saveTimer = null;

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
    headers: readHeaders()
  });
  statusEl.textContent = "Saved";
  statusEl.classList.add("saved");
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.classList.remove("saved");
  }, 1200);
}

async function load() {
  const { enabled = false, headers = [] } =
    await chrome.storage.local.get(["enabled", "headers"]);
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
