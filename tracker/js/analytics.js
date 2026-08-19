/* ==========================================================================
   analytics.js — analytics.html only
   ========================================================================== */

function svgRing(pct, size, strokeWidth, color, label) {
  size = size || 140; strokeWidth = strokeWidth || 12; color = color || "var(--accent)";
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return `<div class="ring" style="--ring-size:${size}px;">
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--bg-inset)" stroke-width="${strokeWidth}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" style="transition: stroke-dashoffset 0.5s;"/>
    </svg>
    <div class="ring-label"><b>${pct}%</b><span>${label || ""}</span></div>
  </div>`;
}

function fmtMinutes(min) {
  if (!min) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function renderOverallRing() {
  const overall = Engine.overallProgress();
  document.getElementById("overall-ring-card").innerHTML = `
    ${svgRing(overall.pct, 130, 11, "var(--accent)", "overall")}
    <div>
      <div class="stat-label">Overall Roadmap Progress</div>
      <div class="stat-value mt-8">${overall.done}<span class="unit">/ ${overall.total} units</span></div>
      <div class="stat-foot mt-8">Based on exit criteria + project tasks + passed assessments.</div>
    </div>`;
}

function renderAnalyticsStats() {
  const stats = Engine.allTaskStats();
  const totalMin = AppStorage.getTotalStudyTime();
  const passedAssessments = ASSESSMENTS.filter((a) => AppStorage.getAssessmentResult(a.id).passed).length;
  const cards = [
    { label: "Completed Weeks", value: Engine.completedWeeksCount(), unit: "/ 25" },
    { label: "Completed Projects", value: Engine.completedProjectsCount(), unit: "/ 12" },
    { label: "Assessments Passed", value: passedAssessments, unit: "/ 10" },
    { label: "Tasks Completed", value: stats.done, unit: "/ " + stats.total },
    { label: "Tasks Pending", value: stats.pending },
    { label: "Blocked Tasks", value: Engine.blockedTasksCount(), tone: Engine.blockedTasksCount() ? "danger" : "success" },
    { label: "Total Study Time", value: fmtMinutes(totalMin) },
    { label: "Journal Entries", value: AppStorage.getJournal().length },
  ];
  document.getElementById("analytics-stats").innerHTML = cards.map((c) => `
    <div class="card stat-card ${c.tone ? "tone-" + c.tone : ""}">
      <div class="stat-label">${c.label}</div>
      <div class="stat-value">${c.value}${c.unit ? `<span class="unit">${c.unit}</span>` : ""}</div>
    </div>`).join("");
}

function renderAnalyticsPhases() {
  document.getElementById("analytics-phases").innerHTML = PHASES.map((p) => {
    const pp = Engine.phaseProgress(p.id);
    const complete = Engine.isPhaseComplete(p.id);
    const unlocked = Engine.isPhaseUnlocked(p.id);
    return `
      <div>
        <div class="flex justify-between items-center mb-6">
          <span class="small" style="font-weight:600;">Phase ${p.id} — ${UI.esc(p.name)}</span>
          <span class="small muted mono">${pp.done}/${pp.total} · ${pp.pct}%</span>
        </div>
        ${UI.progressBar(pp.pct, { size: "sm", tone: complete ? "success" : !unlocked ? "muted" : "accent" })}
      </div>`;
  }).join("");
}

function renderStudyTime() {
  const perPhase = PHASES.map((p) => {
    const min = p.weeks.reduce((sum, wid) => sum + AppStorage.getStudyTime(wid), 0);
    return { phase: p, min };
  });
  const max = Math.max(1, ...perPhase.map((x) => x.min));
  const host = document.getElementById("analytics-time");
  if (perPhase.every((x) => x.min === 0)) {
    host.innerHTML = `<p class="small muted">No study time logged yet — log it from any week's page.</p>`;
    return;
  }
  host.innerHTML = perPhase.map((x) => `
    <div>
      <div class="flex justify-between small muted mb-6"><span>Phase ${x.phase.id}</span><span class="mono">${fmtMinutes(x.min)}</span></div>
      ${UI.progressBar((x.min / max) * 100, { size: "sm", tone: "info" })}
    </div>`).join("");
}

function renderSkillsAnalytics() {
  const sorted = [...SKILLS].sort((a, b) => {
    const la = SKILL_STATUS_LEVELS.indexOf(AppStorage.getSkillState(a.id).status);
    const lb = SKILL_STATUS_LEVELS.indexOf(AppStorage.getSkillState(b.id).status);
    return lb - la;
  });
  document.getElementById("analytics-skills").innerHTML = sorted.map((s) => {
    const state = AppStorage.getSkillState(s.id);
    const lvl = SKILL_STATUS_LEVELS.indexOf(state.status);
    const pct = Math.round((lvl / (SKILL_STATUS_LEVELS.length - 1)) * 100);
    return `
      <div class="flex items-center gap-10">
        <span class="small" style="width:118px; flex-shrink:0;">${UI.esc(s.name)}</span>
        <div style="flex:1;">${UI.progressBar(pct, { size: "sm", tone: pct === 100 ? "success" : pct === 0 ? "muted" : "accent" })}</div>
        <span class="small muted" style="width:100px; text-align:right; flex-shrink:0;">${SKILL_STATUS_LABELS[state.status]}</span>
      </div>`;
  }).join("");
}

function renderBlockersAnalytics() {
  const open = AppStorage.getOpenBlockers();
  const pill = document.getElementById("analytics-blocker-pill");
  pill.style.display = open.length ? "inline-flex" : "none";
  pill.textContent = `⚠️ ${open.length} OPEN`;

  const host = document.getElementById("analytics-blockers");
  if (!open.length) {
    host.innerHTML = `<div class="empty-state">${icon("flag")}<h3>No open blockers</h3><p class="small">Nice — nothing's stuck right now.</p></div>`;
    return;
  }
  host.innerHTML = open.map((b) => `
    <div class="card card-tight mb-10">
      <div class="flex justify-between items-start gap-10">
        <div>
          <div style="font-weight:600; font-size:13.8px;">${UI.esc(b.topic || "Untitled blocker")}</div>
          <div class="small muted mt-8">${b.weekId ? `Week ${b.weekId} · ` : ""}since ${UI.fmtDate(b.createdAt)}</div>
          ${b.problem ? `<div class="small secondary-text mt-8">${UI.esc(b.problem)}</div>` : ""}
        </div>
        <div class="flex gap-8" style="flex-shrink:0;">
          ${b.weekId ? `<a href="week.html?week=${b.weekId}" class="btn btn-ghost btn-sm">Open Week</a>` : ""}
          <button class="btn btn-primary btn-sm" data-resolve="${b.id}">Resolve</button>
        </div>
      </div>
    </div>`).join("");

  UI.qsa("[data-resolve]").forEach((el) => {
    el.addEventListener("click", () => { AppStorage.resolveBlocker(el.getAttribute("data-resolve")); renderAnalytics(); UI.toast("Blocker resolved.", "success"); });
  });
}

function renderJournalAnalytics() {
  const entries = AppStorage.getJournal();
  const last = entries[0];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = entries.filter((e) => e.createdAt >= sevenDaysAgo).length;
  const cards = [
    { label: "Total Entries", value: entries.length },
    { label: "Last 7 Days", value: recentCount },
    { label: "Most Recent", value: last ? UI.fmtDate(last.createdAt) : "—", small: true },
  ];
  document.getElementById("analytics-journal").innerHTML = cards.map((c) => `
    <div class="stat-card"><div class="stat-label">${c.label}</div><div class="${c.small ? "small" : "stat-value"}" style="${c.small ? "font-weight:600; margin-top:6px;" : ""}">${c.value}</div></div>`).join("");
}

function renderAnalytics() {
  renderOverallRing();
  renderAnalyticsStats();
  renderAnalyticsPhases();
  renderStudyTime();
  renderSkillsAnalytics();
  renderBlockersAnalytics();
  renderJournalAnalytics();
}

document.addEventListener("app:ready", renderAnalytics);
