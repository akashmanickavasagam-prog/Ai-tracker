/* ==========================================================================
   roadmap.js — roadmap.html only
   ========================================================================== */

function renderRoadmap() {
  const html = PHASES.map((p) => {
    const pp = Engine.phaseProgress(p.id);
    const unlocked = Engine.isPhaseUnlocked(p.id);
    const complete = Engine.isPhaseComplete(p.id);
    const weekLabel = p.weeks.length > 1 ? `Weeks ${p.weeks[0]}–${p.weeks[p.weeks.length - 1]}` : `Week ${p.weeks[0]}`;

    const weekRows = p.weeks.map((wid) => {
      const w = Engine.getWeek(wid);
      const status = Engine.weekDisplayStatus(wid);
      const ep = Engine.weekExitProgress(wid);
      const hasBlocker = Engine.weekHasOpenBlockers(wid);
      const glyph = hasBlocker ? "!" : UI.weekGlyph(status);
      return `
        <div class="week-row ${status}" data-week-link="${wid}">
          <span class="week-glyph ${hasBlocker ? "" : "glyph " + status}" ${hasBlocker ? 'style="color:var(--danger)"' : ""}>${glyph}</span>
          <span class="week-row-num">W${wid}</span>
          <span class="week-row-title">${UI.esc(w.title)}${w.projectId ? `<small>Project: ${UI.esc(Engine.getProject(w.projectId).name)}</small>` : ""}</span>
          <span class="week-row-bar">${UI.progressBar(ep.pct, { size: "sm", tone: status === "completed" ? "success" : status === "locked" ? "muted" : "accent" })}</span>
          <span class="week-row-pct">${ep.pct}%</span>
        </div>`;
    }).join("");

    return `
      <div class="timeline-phase">
        <div class="timeline-phase-head">
          <span class="glyph ${complete ? "completed" : !unlocked ? "locked" : "current"}">${complete ? "✓" : !unlocked ? "🔒" : "→"}</span>
          <span class="timeline-phase-title">Phase ${p.id} — ${UI.esc(p.name)}</span>
          <span class="small muted">${weekLabel}</span>
          ${UI.statusBadge(complete ? "completed" : !unlocked ? "locked" : "in-progress")}
          <span class="small muted" style="margin-left:auto;">${pp.pct}%</span>
        </div>
        <div class="timeline-weeks">${weekRows}</div>
      </div>`;
  }).join("");

  document.getElementById("roadmap-timeline").innerHTML = html;
}

document.addEventListener("app:ready", renderRoadmap);
document.addEventListener("state:changed", renderRoadmap);
