/* ==========================================================================
   dashboard.js — index.html only
   ========================================================================== */

function renderHereCard(pos) {
  const host = document.getElementById("here-card");
  if (pos.finished) {
    host.innerHTML = `
      <div class="card" style="background:linear-gradient(160deg, rgba(70,209,137,0.14), rgba(70,209,137,0.03)); border-color: rgba(70,209,137,0.35);">
        <div class="page-eyebrow" style="color:var(--success)">Roadmap Complete</div>
        <h2 style="font-size:22px;">🎉 All 25 weeks, 12 projects, and 10 assessments are done.</h2>
        <p class="secondary-text mt-8">Head to Analytics for your full stats, or Journal for career-readiness notes on next projects.</p>
        <div class="flex gap-10 mt-16">
          <a href="analytics.html" class="btn btn-primary">View Analytics</a>
          <a href="projects.html" class="btn btn-ghost">Review Portfolio</a>
        </div>
      </div>`;
    return;
  }
  const gateNote = pos.gateBlocking
    ? `<div class="locked-banner mt-12" style="border-color:rgba(255,180,84,0.4); background:rgba(255,180,84,0.08);">
        ${icon("lock")} <div><b>Phase gate:</b> every week here is done, but Week ${pos.weekId + 1} won't unlock until you clear this — ${UI.esc(pos.nextAction.label.replace(/^Finish project: |^Take the /,""))}.</div>
      </div>`
    : "";
  host.innerHTML = `
    <div class="card" style="position:relative; overflow:hidden;">
      <div style="position:absolute; inset:0; background:radial-gradient(420px 200px at 90% 0%, rgba(255,180,84,0.10), transparent 70%); pointer-events:none;"></div>
      <div class="page-eyebrow">You Are Here</div>
      <div class="flex justify-between items-start" style="flex-wrap:wrap; gap:18px;">
        <div>
          <h2 style="font-size:24px;">Week ${pos.weekId} <span class="muted" style="font-weight:500; font-size:16px;">/ 25 — ${UI.esc(pos.phase.name)}</span></h2>
          <p class="secondary-text mt-8">Current: <b style="color:var(--text-primary)">${UI.esc(pos.currentTopic)}</b></p>
          <p class="small muted mt-8">${UI.statusBadge(pos.gateBlocking ? "blocked" : "in-progress")} ${pos.blocked ? UI.statusBadge("blocked") + ' <span class="small">has open blockers</span>' : ""}</p>
        </div>
        <div style="min-width:200px;">
          <div class="flex justify-between small muted mb-8"><span>This week</span><span>${pos.weekProgress.done}/${pos.weekProgress.total} tasks</span></div>
          ${UI.progressBar(pos.weekProgress.pct, { tone: "accent" })}
          <div class="flex justify-between small muted mt-8" style="margin-top:10px;"><span>Exit criteria</span><span>${pos.exitProgress.done}/${pos.exitProgress.total}</span></div>
          ${UI.progressBar(pos.exitProgress.pct, { tone: pos.exitProgress.pct === 100 ? "success" : "info" })}
        </div>
      </div>
      ${gateNote}
      <div class="divider"></div>
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:14px;">
        <div>
          <div class="small muted">NEXT ACTION</div>
          <div style="font-weight:600; margin-top:2px;">${UI.esc(pos.nextAction.label)}</div>
        </div>
        <a href="${pos.nextAction.href}" class="btn btn-primary">Continue →</a>
      </div>
      <div class="small muted mt-12">Next milestone: ${UI.esc(pos.nextMilestone)} · Completed weeks: ${Engine.completedWeeksCount()}/25</div>
    </div>`;
}

function renderStatGrid(pos) {
  const stats = Engine.allTaskStats();
  const blocked = Engine.blockedTasksCount();
  const cards = [
    { label: "Overall Progress", value: pos.overall.pct + "%", foot: `${pos.overall.done}/${pos.overall.total} roadmap units`, tone: "accent" },
    { label: "Completed Weeks", value: Engine.completedWeeksCount(), unit: "/ 25", foot: `${25 - Engine.completedWeeksCount()} remaining` },
    { label: "Completed Projects", value: Engine.completedProjectsCount(), unit: "/ 12", foot: "shipped to portfolio", tone: Engine.completedProjectsCount() > 0 ? "success" : "" },
    { label: "Tasks Completed", value: stats.done, unit: "/ " + stats.total, foot: `${stats.pending} pending` },
    { label: "Blocked Tasks", value: blocked, foot: blocked ? "needs attention" : "all clear", tone: blocked ? "danger" : "success" },
  ];
  document.getElementById("stat-grid").innerHTML = cards.map((c) => `
    <div class="card stat-card ${c.tone ? "tone-" + c.tone : ""}">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value">${c.value}${c.unit ? `<span class="unit">${c.unit}</span>` : ""}</div>
      <div class="stat-foot">${c.foot || ""}</div>
    </div>`).join("");
}

function renderPhaseProgress() {
  const currentWeek = Engine.getCurrentWeekId();
  const html = PHASES.map((p) => {
    const pp = Engine.phaseProgress(p.id);
    const unlocked = Engine.isPhaseUnlocked(p.id);
    const complete = Engine.isPhaseComplete(p.id);
    const isCurrent = currentWeek && Engine.getWeek(currentWeek).phaseId === p.id;
    const status = complete ? "completed" : !unlocked ? "locked" : isCurrent ? "current" : "in-progress";
    const weekLabel = p.weeks.length > 1 ? `Weeks ${p.weeks[0]}–${p.weeks[p.weeks.length - 1]}` : `Week ${p.weeks[0]}`;
    return `
      <div class="flex-col gap-6" style="opacity:${unlocked ? 1 : 0.55}">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-8">
            <span class="glyph ${status === "completed" ? "completed" : status === "current" ? "current" : "available"}">${status === "completed" ? "✓" : status === "locked" ? "🔒" : status === "current" ? "→" : "○"}</span>
            <span style="font-weight:600; font-size:13.5px;">Phase ${p.id} — ${UI.esc(p.name)}</span>
          </div>
          <span class="small muted">${weekLabel} · ${pp.pct}%</span>
        </div>
        ${UI.progressBar(pp.pct, { size: "sm", tone: status === "completed" ? "success" : status === "locked" ? "muted" : "accent" })}
      </div>`;
  }).join("");
  document.getElementById("phase-progress-list").innerHTML = html;
}

function renderSkillsSnapshot() {
  const counts = {};
  SKILL_STATUS_LEVELS.forEach((l) => (counts[l] = 0));
  SKILLS.forEach((s) => { counts[AppStorage.getSkillState(s.id).status]++; });
  const toneVar = { "not-started": "--muted-tone", "learning": "--info", "practiced": "--accent", "project-experience": "--accent-2", "confident": "--success", "interview-ready": "--success" };
  const toneClass = { "not-started": "muted", "learning": "info", "practiced": "warn", "project-experience": "accent", "confident": "success", "interview-ready": "success" };
  const total = SKILLS.length;
  const bar = SKILL_STATUS_LEVELS.filter((l) => counts[l] > 0).map((l) =>
    `<div class="pbar-fill tone-${toneClass[l]}" style="width:${(counts[l] / total) * 100}%; flex-shrink:0;" title="${SKILL_STATUS_LABELS[l]}: ${counts[l]}"></div>`
  ).join("");
  const legend = SKILL_STATUS_LEVELS.map((l) => counts[l] > 0 ? `<div class="flex items-center gap-6 small"><span style="width:8px;height:8px;border-radius:2px;background:var(${toneVar[l]});"></span><span class="muted">${SKILL_STATUS_LABELS[l]}</span><span class="mono">${counts[l]}</span></div>` : "").join("");
  document.getElementById("skills-snapshot").innerHTML = `
    <div class="pbar" style="display:flex; overflow:hidden;">${bar || ""}</div>
    <div class="flex-col gap-8 mt-12">${legend}</div>
  `;
}

function renderAssessmentsSnapshot() {
  const passed = ASSESSMENTS.filter((a) => AppStorage.getAssessmentResult(a.id).passed).length;
  const nextPending = ASSESSMENTS.find((a) => !AppStorage.getAssessmentResult(a.id).passed && Engine.isPhaseUnlocked(a.phaseId));
  document.getElementById("assessments-snapshot").innerHTML = `
    <div class="flex justify-between small muted mb-8"><span>Passed</span><span>${passed}/${ASSESSMENTS.length}</span></div>
    ${UI.progressBar((passed / ASSESSMENTS.length) * 100, { tone: "success" })}
    <div class="mt-16 small">
      ${nextPending ? `Next up: <b>${UI.esc(nextPending.name)}</b>` : passed === ASSESSMENTS.length ? "All assessments passed 🎉" : "Complete more weeks to unlock the next assessment."}
    </div>`;
}

function renderMiniRoadmap() {
  const chips = WEEKS.map((w) => {
    const status = Engine.weekDisplayStatus(w.id);
    const hasBlocker = Engine.weekHasOpenBlockers(w.id);
    return `<div class="mono" data-week-link="${w.id}" title="Week ${w.id}: ${UI.esc(w.title)}"
      style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:11px;flex-shrink:0;cursor:${status==="locked"?"not-allowed":"pointer"};
      background:${status === "completed" ? "rgba(70,209,137,0.16)" : status === "current" ? "rgba(255,180,84,0.2)" : status === "locked" ? "rgba(124,120,156,0.08)" : "var(--bg-inset)"};
      border:1px solid ${status === "completed" ? "rgba(70,209,137,0.4)" : status === "current" ? "var(--accent)" : "var(--border-soft)"};
      color:${status === "completed" ? "var(--success)" : status === "current" ? "var(--accent)" : status === "locked" ? "var(--text-muted)" : "var(--text-secondary)"};">
      ${hasBlocker ? "!" : status === "completed" ? "✓" : status === "locked" ? "🔒" : w.id}
    </div>`;
  }).join("");
  document.getElementById("mini-roadmap").innerHTML = `<div class="flex gap-6" style="flex-wrap:wrap;">${chips}</div>`;
}

function renderBlockerPill() {
  const n = Engine.blockedTasksCount();
  const pill = document.getElementById("dash-blocker-pill");
  pill.style.display = n > 0 ? "inline-flex" : "none";
  pill.textContent = `⚠️ ${n} BLOCKED TASK${n === 1 ? "" : "S"}`;
}

function renderDashboard() {
  const pos = Engine.getCurrentPosition();
  renderHereCard(pos);
  renderStatGrid(pos);
  renderPhaseProgress();
  renderSkillsSnapshot();
  renderAssessmentsSnapshot();
  renderMiniRoadmap();
  renderBlockerPill();
}

document.addEventListener("app:ready", renderDashboard);
document.addEventListener("state:changed", renderDashboard);
