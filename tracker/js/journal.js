/* ==========================================================================
   journal.js — journal.html only
   ========================================================================== */

function populateWeekSelect() {
  const sel = document.getElementById("j-week");
  sel.innerHTML = `<option value="">—</option>` + WEEKS.map((w) => `<option value="${w.id}">Week ${w.id} — ${UI.esc(w.title)}</option>`).join("");
}

function clearJournalForm() {
  document.getElementById("j-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("j-week").value = String(Engine.getCurrentWeekId() || "");
  document.getElementById("j-status").value = "in-progress";
  ["j-topic", "j-learned", "j-practiced", "j-built", "j-problem", "j-tried", "j-next", "j-time"].forEach((id) => (document.getElementById(id).value = ""));
}

function entryCardHTML(e) {
  const week = e.week ? Engine.getWeek(Number(e.week)) : null;
  const statusTone = { "completed": "success", "blocked": "danger", "in-progress": "warn" }[e.status] || "muted";
  const rows = [
    ["Learned", e.learned], ["Practiced", e.practiced], ["Built", e.built],
    ["Problem", e.problem], ["Tried", e.tried], ["Next Action", e.nextAction],
  ].filter(([, v]) => v && v.trim());
  return `
    <div class="card mb-12" data-entry="${e.id}">
      <div class="flex justify-between items-start mb-8" style="flex-wrap:wrap; gap:8px;">
        <div>
          <div class="flex items-center gap-8 small muted mb-6">
            <span class="mono">${UI.esc(e.date)}</span>
            ${week ? `<span>· Week ${week.id}</span>` : ""}
            ${e.timeSpent ? `<span>· ${UI.esc(e.timeSpent)} min</span>` : ""}
          </div>
          <div style="font-weight:600; font-size:14.5px;">${UI.esc(e.topic || "(no topic)")}</div>
        </div>
        <span class="badge tone-${statusTone}">${e.status.replace("-", " ").toUpperCase()}</span>
      </div>
      ${rows.length ? `<div class="grid grid-2 mt-8" style="gap:8px 20px;">
        ${rows.map(([label, val]) => `<div><div class="small muted" style="margin-bottom:2px;">${label}</div><div class="small secondary-text">${UI.esc(val)}</div></div>`).join("")}
      </div>` : ""}
      <div class="flex gap-8 mt-16">
        <button class="btn btn-ghost btn-sm" data-edit-entry="${e.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete-entry="${e.id}">Delete</button>
      </div>
    </div>`;
}

function renderJournalList() {
  const entries = AppStorage.getJournal();
  document.getElementById("j-count").textContent = `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`;
  const host = document.getElementById("journal-list");
  if (!entries.length) {
    host.innerHTML = `<div class="empty-state">${icon("journal")}<h3>No entries yet</h3><p class="small">Log your first session above.</p></div>`;
    return;
  }
  host.innerHTML = entries.map(entryCardHTML).join("");

  UI.qsa("[data-delete-entry]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-delete-entry");
      UI.confirm("Delete this journal entry? This can't be undone.", () => { AppStorage.deleteJournalEntry(id); renderJournalList(); }, { danger: true, confirmLabel: "Delete" });
    });
  });
  UI.qsa("[data-edit-entry]").forEach((el) => {
    el.addEventListener("click", () => openEditEntry(el.getAttribute("data-edit-entry")));
  });
}

function openEditEntry(id) {
  const e = AppStorage.getJournal().find((x) => x.id === id);
  if (!e) return;
  const m = UI.modal(`
    <h3 class="modal-title">Edit Entry</h3>
    <div class="form-row">
      <div class="field"><label>Date</label><input type="date" id="ed-date" value="${e.date}"></div>
      <div class="field"><label>Topic</label><input type="text" id="ed-topic" value="${UI.esc(e.topic)}"></div>
    </div>
    <div class="field"><label>Status</label>
      <select id="ed-status">
        <option value="in-progress" ${e.status === "in-progress" ? "selected" : ""}>In Progress</option>
        <option value="completed" ${e.status === "completed" ? "selected" : ""}>Completed</option>
        <option value="blocked" ${e.status === "blocked" ? "selected" : ""}>Blocked</option>
      </select>
    </div>
    <div class="field"><label>What I Learned</label><textarea id="ed-learned">${UI.esc(e.learned)}</textarea></div>
    <div class="field"><label>What I Practiced</label><textarea id="ed-practiced">${UI.esc(e.practiced)}</textarea></div>
    <div class="field"><label>What I Built</label><textarea id="ed-built">${UI.esc(e.built)}</textarea></div>
    <div class="field"><label>Problems Faced</label><textarea id="ed-problem">${UI.esc(e.problem)}</textarea></div>
    <div class="field"><label>What I Tried</label><textarea id="ed-tried">${UI.esc(e.tried)}</textarea></div>
    <div class="field"><label>Next Action</label><textarea id="ed-next">${UI.esc(e.nextAction)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="cancel">Cancel</button>
      <button class="btn btn-primary" data-act="save">Save Changes</button>
    </div>`, { wide: true });
  m.el.querySelector('[data-act="cancel"]').addEventListener("click", m.close);
  m.el.querySelector('[data-act="save"]').addEventListener("click", () => {
    AppStorage.updateJournalEntry(id, {
      date: document.getElementById("ed-date").value,
      topic: document.getElementById("ed-topic").value,
      status: document.getElementById("ed-status").value,
      learned: document.getElementById("ed-learned").value,
      practiced: document.getElementById("ed-practiced").value,
      built: document.getElementById("ed-built").value,
      problem: document.getElementById("ed-problem").value,
      tried: document.getElementById("ed-tried").value,
      nextAction: document.getElementById("ed-next").value,
    });
    m.close(); renderJournalList();
    UI.toast("Entry updated.", "success");
  });
}

function initJournal() {
  populateWeekSelect();
  clearJournalForm();
  renderJournalList();

  document.getElementById("j-save-btn").addEventListener("click", () => {
    const topic = document.getElementById("j-topic").value.trim();
    if (!topic) { UI.toast("Add a topic first.", "error"); return; }
    AppStorage.addJournalEntry({
      date: document.getElementById("j-date").value || new Date().toISOString().slice(0, 10),
      week: document.getElementById("j-week").value || null,
      topic,
      learned: document.getElementById("j-learned").value,
      practiced: document.getElementById("j-practiced").value,
      built: document.getElementById("j-built").value,
      problem: document.getElementById("j-problem").value,
      tried: document.getElementById("j-tried").value,
      timeSpent: document.getElementById("j-time").value,
      status: document.getElementById("j-status").value,
      nextAction: document.getElementById("j-next").value,
    });
    clearJournalForm();
    renderJournalList();
    UI.toast("Journal entry saved.", "success");
  });
}

document.addEventListener("app:ready", initJournal);
