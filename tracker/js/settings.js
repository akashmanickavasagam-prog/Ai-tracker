/* ==========================================================================
   settings.js — settings.html only
   ========================================================================== */

function renderDataOverview() {
  const s = AppStorage.get();
  const cards = [
    { label: "Tasks Marked Done", value: Object.values(s.taskDone).filter(Boolean).length },
    { label: "Exit Criteria Met", value: Object.values(s.exitDone).filter(Boolean).length },
    { label: "Journal Entries", value: s.journal.length },
    { label: "Open Blockers", value: AppStorage.getOpenBlockers().length },
    { label: "Skills Touched", value: Object.keys(s.skills).length },
    { label: "Assessments Recorded", value: Object.keys(s.assessments).length },
  ];
  document.getElementById("data-overview").innerHTML = cards.map((c) => `
    <div class="stat-card"><div class="stat-label">${c.label}</div><div class="stat-value" style="font-size:20px;">${c.value}</div></div>`).join("");
  document.getElementById("last-updated").textContent = "Last updated: " + UI.fmtDate(s.meta.updatedAt);
}

function initSettings() {
  renderDataOverview();

  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([AppStorage.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ai-tracker-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    UI.toast("Backup downloaded.", "success");
  });

  const fileInput = document.getElementById("import-file");
  document.getElementById("import-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    document.getElementById("import-filename").textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      UI.confirm("Import this backup? It will replace all progress in your cloud account.", () => {
        try {
          AppStorage.importJSON(reader.result);
          UI.toast("Backup imported.", "success");
          renderDataOverview();
        } catch (e) {
          UI.toast("That file doesn't look like a valid backup.", "error");
        }
      }, { confirmLabel: "Import & Replace", danger: true });
    };
    reader.readAsText(file);
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    UI.confirm(
      "This permanently deletes all tasks, projects, skills, journal entries, blockers, and assessment results in your cloud account. This cannot be undone.",
      () => { AppStorage.resetAll(); UI.toast("All progress reset.", "success"); renderDataOverview(); },
      { title: "Reset everything?", confirmLabel: "Yes, reset everything", danger: true }
    );
  });
}

document.addEventListener("app:ready", initSettings);
