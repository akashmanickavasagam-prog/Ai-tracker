/* ==========================================================================
   assessments.js — assessments.html only
   ========================================================================== */

function suggestedScore(assessment) {
  const done = assessment.items.filter((i) => AppStorage.isTaskDone(i.id)).length;
  return Math.round((done / assessment.items.length) * 100);
}

function assessmentCardHTML(a) {
  const phase = Engine.getPhase(a.phaseId);
  const unlocked = Engine.isPhaseUnlocked(a.phaseId);
  const result = AppStorage.getAssessmentResult(a.id);
  const doneCount = a.items.filter((i) => AppStorage.isTaskDone(i.id)).length;
  const suggested = suggestedScore(a);

  const historyRows = result.history.length
    ? `<table class="simple-table mt-12"><thead><tr><th>Date</th><th>Score</th><th>Result</th></tr></thead><tbody>
        ${result.history.slice().reverse().map((h) => `<tr><td>${UI.fmtDate(h.date)}</td><td class="mono">${h.score}/100</td><td>${h.score >= a.passThreshold ? "Pass" : "Fail"}</td></tr>`).join("")}
      </tbody></table>`
    : "";

  return `
    <section class="card mb-16" id="assessment-${a.id}" style="opacity:${unlocked ? 1 : 0.6}">
      <div class="flex justify-between items-start mb-8" style="flex-wrap:wrap; gap:10px;">
        <div>
          <div class="small muted">PHASE ${a.phaseId} · ${UI.esc(phase.name)}</div>
          <div style="font-weight:600; font-size:15.5px; margin-top:2px;">${UI.esc(a.name)}</div>
        </div>
        ${!unlocked ? UI.statusBadge("locked") : result.passed ? UI.statusBadge("completed") : UI.statusBadge("in-progress")}
      </div>

      ${!unlocked ? `<div class="locked-banner">${icon("lock")}<div>Unlocks once Phase ${a.phaseId}'s weeks and project(s) are complete.</div></div>` : `
      <div class="checklist-progress"><span class="small muted">Self-check</span><span class="count">${doneCount}/${a.items.length}</span></div>
      <div class="checklist mb-16">
        ${a.items.map((i) => `
          <div class="check-row ${AppStorage.isTaskDone(i.id) ? "done" : ""}">
            <div class="checkbox" data-a-item="${i.id}" data-a-id="${a.id}">${ICONS.check}</div>
            <div class="check-label">${UI.esc(i.label)}</div>
          </div>`).join("")}
      </div>

      <div class="divider"></div>
      <div class="flex justify-between items-end" style="flex-wrap:wrap; gap:14px;">
        <div class="field" style="margin-bottom:0; max-width:160px;">
          <label>Score (suggested ${suggested})</label>
          <input type="number" min="0" max="100" id="score-${a.id}" value="${result.score !== null ? result.score : suggested}">
        </div>
        <div class="flex-col" style="align-items:flex-end;">
          <span class="small muted mb-8">Pass threshold: ${a.passThreshold}%</span>
          <button class="btn btn-primary btn-sm" data-submit-score="${a.id}">Submit Score</button>
        </div>
      </div>
      ${result.score !== null ? `<div class="mt-12">${result.passed ? UI.statusBadge("completed") + ' <span class="small muted">Phase unlocked next.</span>' : UI.statusBadge("blocked") + ' <span class="small muted">Below threshold — review the phase\'s weeks and try again.</span>'}</div>` : ""}
      ${historyRows}
      `}
    </section>`;
}

function renderAssessments() {
  document.getElementById("assessments-list").innerHTML = ASSESSMENTS.map(assessmentCardHTML).join("");

  UI.qsa("[data-a-item]").forEach((el) => {
    el.addEventListener("click", () => { AppStorage.toggleTask(el.getAttribute("data-a-item")); renderAssessments(); });
  });
  UI.qsa("[data-submit-score]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = Number(el.getAttribute("data-submit-score"));
      const a = ASSESSMENTS.find((x) => x.id === id);
      const input = document.getElementById("score-" + id);
      let score = Number(input.value);
      if (Number.isNaN(score)) { UI.toast("Enter a valid score.", "error"); return; }
      score = Math.max(0, Math.min(100, score));
      const passed = score >= a.passThreshold;
      AppStorage.recordAssessmentScore(id, score, passed);
      UI.toast(passed ? `Passed! Phase ${a.phaseId} assessment recorded.` : "Recorded — below threshold, phase stays in progress.", passed ? "success" : "default");
      renderAssessments();
    });
  });

  const phaseParam = new URLSearchParams(location.search).get("phase");
  if (phaseParam) {
    const a = ASSESSMENTS.find((x) => x.phaseId === Number(phaseParam));
    if (a) document.getElementById("assessment-" + a.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

document.addEventListener("app:ready", renderAssessments);
