// OfficeFlow — tasks, clients and invoices. All data stays on this computer.

const STORAGE_KEY = "officeflow.v1";

const defaultState = () => ({ tasks: [], clients: [], invoices: [] });

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

let state = load();
let taskFilter = "all";

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const $ = (sel) => document.querySelector(sel);
const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

// Build a DOM element safely (text is never parsed as HTML).
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
    for (const name of ["tasks", "clients", "invoices"]) {
      $(`#tab-${name}`).hidden = name !== btn.dataset.tab;
    }
  })
);

/* ---------- Tasks ---------- */
$("#task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#task-title").value.trim();
  if (!title) return;
  state.tasks.unshift({ id: uid(), title, due: $("#task-due").value, done: false });
  e.target.reset();
  save();
  render();
});

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    taskFilter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderTasks();
  })
);

function renderTasks() {
  const list = $("#task-list");
  list.replaceChildren();
  const shown = state.tasks.filter((t) =>
    taskFilter === "all" ? true : taskFilter === "done" ? t.done : !t.done
  );
  if (!shown.length) list.append(el("li", { class: "sub" }, "Nothing here yet."));
  for (const t of shown) {
    const box = el("input", { type: "checkbox" });
    box.checked = t.done;
    box.addEventListener("change", () => {
      t.done = box.checked;
      save();
      renderTasks();
    });
    const info = el("div", { class: "grow" }, el("div", { class: "title" }, t.title));
    if (t.due) info.append(el("div", { class: "sub" }, `Due ${t.due}`));
    list.append(
      el(
        "li",
        { class: t.done ? "done" : "" },
        box,
        info,
        el("button", { class: "del", "aria-label": "Delete task", onclick: () => {
          state.tasks = state.tasks.filter((x) => x.id !== t.id);
          save();
          renderTasks();
        } }, "✕")
      )
    );
  }
}

/* ---------- Clients ---------- */
$("#client-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#client-name").value.trim();
  if (!name) return;
  state.clients.push({
    id: uid(),
    name,
    email: $("#client-email").value.trim(),
    phone: $("#client-phone").value.trim(),
  });
  e.target.reset();
  save();
  render();
});

function renderClients() {
  const list = $("#client-list");
  list.replaceChildren();
  if (!state.clients.length) list.append(el("li", { class: "sub" }, "No clients yet."));
  for (const c of state.clients) {
    const sub = [c.email, c.phone].filter(Boolean).join(" · ");
    list.append(
      el(
        "li",
        {},
        el("div", { class: "grow" }, el("div", { class: "title" }, c.name), el("div", { class: "sub" }, sub)),
        el("button", { class: "del", "aria-label": "Delete client", onclick: () => {
          const used = state.invoices.some((i) => i.clientId === c.id);
          if (used) {
            alert("This client has invoices. Delete those invoices first.");
            return;
          }
          state.clients = state.clients.filter((x) => x.id !== c.id);
          save();
          render();
        } }, "✕")
      )
    );
  }
}

/* ---------- Invoices ---------- */
$("#invoice-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const clientId = $("#invoice-client").value;
  const amount = parseFloat($("#invoice-amount").value);
  const desc = $("#invoice-desc").value.trim();
  if (!clientId || !desc || !Number.isFinite(amount) || amount < 0) return;
  const number = `INV-${String(state.invoices.length + 1).padStart(4, "0")}`;
  state.invoices.unshift({
    id: uid(),
    number,
    clientId,
    desc,
    amount,
    paid: false,
    date: new Date().toISOString().slice(0, 10),
  });
  e.target.reset();
  save();
  render();
});

function renderInvoices() {
  const select = $("#invoice-client");
  const prev = select.value;
  select.replaceChildren(el("option", { value: "" }, state.clients.length ? "Select client…" : "Add a client first"));
  for (const c of state.clients) select.append(el("option", { value: c.id }, c.name));
  select.value = prev;

  const list = $("#invoice-list");
  list.replaceChildren();
  const unpaid = state.invoices.filter((i) => !i.paid).reduce((s, i) => s + i.amount, 0);
  $("#invoice-total").textContent = `Outstanding: ${money(unpaid)}`;
  if (!state.invoices.length) list.append(el("li", { class: "sub" }, "No invoices yet."));
  for (const inv of state.invoices) {
    const client = state.clients.find((c) => c.id === inv.clientId);
    list.append(
      el(
        "li",
        {},
        el(
          "div",
          { class: "grow" },
          el("div", { class: "title" }, `${inv.number} — ${client ? client.name : "Unknown client"}`),
          el("div", { class: "sub" }, `${inv.desc} · ${inv.date}`)
        ),
        el("strong", {}, money(inv.amount)),
        el("button", { class: `badge ${inv.paid ? "paid" : "unpaid"}`, onclick: () => {
          inv.paid = !inv.paid;
          save();
          renderInvoices();
        } }, inv.paid ? "Paid" : "Unpaid"),
        el("button", { class: "ghost noprint", onclick: () => window.print() }, "Print"),
        el("button", { class: "del", "aria-label": "Delete invoice", onclick: () => {
          state.invoices = state.invoices.filter((x) => x.id !== inv.id);
          save();
          renderInvoices();
        } }, "✕")
      )
    );
  }
}

/* ---------- Backup ---------- */
$("#export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: `officeflow-backup-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

$("#import-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.tasks) || !Array.isArray(data.clients) || !Array.isArray(data.invoices)) {
      throw new Error("bad shape");
    }
    state = { tasks: data.tasks, clients: data.clients, invoices: data.invoices };
    save();
    render();
  } catch {
    alert("That file is not a valid OfficeFlow backup.");
  }
});

function render() {
  renderTasks();
  renderClients();
  renderInvoices();
}

render();
