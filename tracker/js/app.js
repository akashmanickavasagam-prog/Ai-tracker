/* ==========================================================================
   app.js — Shared engine (pure progress/unlock logic) + UI helpers
   (sidebar, badges, progress bars, toasts, modals) used by every page.
   Depends on: data.js (PHASES/WEEKS/PROJECTS/SKILLS/ASSESSMENTS), storage.js (AppStorage)
   ========================================================================== */

/* ---------------------------- Icons (inline SVG, currentColor) ---------------------------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>',
  roadmap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20 C4 20 4 4 9 4 C14 4 10 14 15 14 C20 14 20 4 20 4" stroke-linecap="round"/><circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none"/><circle cx="20" cy="4" r="1.6" fill="currentColor" stroke="none"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
  skills: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  assessments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="2.5"/></svg>',
  journal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h11a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.8.4L14 18H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><line x1="6.5" y1="8" x2="14.5" y2="8"/><line x1="6.5" y1="11.5" x2="14.5" y2="11.5"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="5" y1="20" x2="5" y2="11"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="19" y1="20" x2="19" y2="14"/><line x1="3" y1="20" x2="21" y2="20" stroke-linecap="round"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4"/><path d="M5 4h11l-2.5 3.5L16 11H5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="19" y2="19" stroke-linecap="round"/><line x1="19" y1="5" x2="5" y2="19" stroke-linecap="round"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 5 8 12 15 19" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 5 16 12 9 19" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12" stroke-linecap="round"/><polyline points="7 10 12 15 17 10" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 19h16" stroke-linecap="round"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 15V3" stroke-linecap="round"/><polyline points="7 8 12 3 17 8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 19h16" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16" stroke-linecap="round"/><path d="M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="7" x2="20" y2="7" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke-linecap="round"/><line x1="4" y1="17" x2="20" y2="17" stroke-linecap="round"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14 20 4" stroke-linecap="round"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="4 12 9 17 20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
function icon(name, cls) { return `<span class="icon ${cls||""}">${ICONS[name]||""}</span>`; }

/* ---------------------------- Engine (pure logic over data + storage) ---------------------------- */
const Engine = (function () {
  const weekById = Object.fromEntries(WEEKS.map((w) => [w.id, w]));
  const phaseById = Object.fromEntries(PHASES.map((p) => [p.id, p]));
  const projectById = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
  const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
  const assessmentByPhase = Object.fromEntries(ASSESSMENTS.map((a) => [a.phaseId, a]));

  function getWeek(id) { return weekById[Number(id)]; }
  function getPhase(id) { return phaseById[Number(id)]; }
  function getProject(id) { return projectById[Number(id)]; }
  function getSkill(id) { return skillById[id]; }
  function getAssessmentForPhase(phaseId) { return assessmentByPhase[Number(phaseId)]; }
  function phaseOfWeek(weekId) { return getPhase(getWeek(weekId).phaseId); }
  function isFirstWeekOfPhase(weekId) {
    const w = getWeek(weekId);
    const p = getPhase(w.phaseId);
    return Math.min(...p.weeks) === w.id;
  }
  function isLastWeekOfPhase(weekId) {
    const w = getWeek(weekId);
    const p = getPhase(w.phaseId);
    return Math.max(...p.weeks) === w.id;
  }

  function weekTaskProgress(weekId) {
    const w = getWeek(weekId);
    const total = w.tasks.length;
    const done = w.tasks.filter((t) => AppStorage.isTaskDone(t.id)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function weekExitProgress(weekId) {
    const w = getWeek(weekId);
    const total = w.exitCriteria.length;
    const done = w.exitCriteria.filter((e) => AppStorage.isExitDone(e.id)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function isWeekComplete(weekId) {
    const p = weekExitProgress(weekId);
    return p.total > 0 && p.done === p.total;
  }
  function weekHasOpenBlockers(weekId) {
    return AppStorage.getOpenBlockers().some((b) => b.weekId === weekId);
  }
  function weekStatus(weekId) {
    if (isWeekComplete(weekId)) return "completed";
    const t = weekTaskProgress(weekId), e = weekExitProgress(weekId);
    if (t.done > 0 || e.done > 0) return "in-progress";
    return "not-started";
  }

  function projectProgress(projectId) {
    const p = getProject(projectId);
    if (!p) return { done: 0, total: 0, pct: 0 };
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => AppStorage.isProjectTaskDone(t.id)).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function isProjectComplete(projectId) {
    const p = projectProgress(projectId);
    return p.total > 0 && p.done === p.total;
  }

  function isPhaseComplete(phaseId) {
    const p = getPhase(phaseId);
    const weeksOk = p.weeks.every((wid) => isWeekComplete(wid));
    const projectsOk = p.projectIds.every((pid) => isProjectComplete(pid));
    const assessment = getAssessmentForPhase(phaseId);
    const assessmentOk = assessment ? AppStorage.getAssessmentResult(assessment.id).passed : true;
    return weeksOk && projectsOk && assessmentOk;
  }
  function isPhaseUnlocked(phaseId) {
    if (phaseId === 1) return true;
    return isPhaseComplete(phaseId - 1);
  }
  function isWeekUnlocked(weekId) {
    if (weekId === 1) return true;
    const w = getWeek(weekId);
    if (isFirstWeekOfPhase(weekId)) {
      return isPhaseUnlocked(w.phaseId);
    }
    return isWeekComplete(weekId - 1);
  }

  function weekDisplayStatus(weekId) {
    // 'completed' | 'current' | 'available' | 'locked'
    if (isWeekComplete(weekId)) return "completed";
    if (!isWeekUnlocked(weekId)) return "locked";
    if (weekId === getCurrentWeekId()) return "current";
    return "available";
  }

  function getFirstIncompletePhase() {
    return PHASES.find((p) => !isPhaseComplete(p.id)) || null;
  }
  function isPhaseGateBlocking(phaseId) {
    // true when every week in the phase is individually complete, but the phase
    // itself isn't (an unfinished project and/or an unpassed assessment).
    const p = getPhase(phaseId);
    return p.weeks.every((wid) => isWeekComplete(wid)) && !isPhaseComplete(phaseId);
  }
  function getCurrentWeekId() {
    const phase = getFirstIncompletePhase();
    if (!phase) return null; // every phase complete = whole roadmap done
    const incomplete = phase.weeks.find((wid) => !isWeekComplete(wid));
    if (incomplete) return incomplete;
    // Every week in this phase is done, but the phase's project(s)/assessment
    // gate isn't clear yet — position stays at the phase's last week until it is.
    return Math.max(...phase.weeks);
  }
  function getPhaseGateBlockers(phaseId) {
    const p = getPhase(phaseId);
    const incompleteProjects = p.projectIds.filter((pid) => !isProjectComplete(pid));
    const assessment = getAssessmentForPhase(phaseId);
    const assessmentPending = !!assessment && !AppStorage.getAssessmentResult(assessment.id).passed;
    return { incompleteProjects, assessment, assessmentPending };
  }

  function completedWeeksCount() { return WEEKS.filter((w) => isWeekComplete(w.id)).length; }
  function completedProjectsCount() { return PROJECTS.filter((p) => isProjectComplete(p.id)).length; }

  function allTaskStats() {
    let doneT = 0, totalT = 0;
    WEEKS.forEach((w) => { totalT += w.tasks.length; doneT += w.tasks.filter((t) => AppStorage.isTaskDone(t.id)).length; });
    PROJECTS.forEach((p) => { totalT += p.tasks.length; doneT += p.tasks.filter((t) => AppStorage.isProjectTaskDone(t.id)).length; });
    return { done: doneT, total: totalT, pending: totalT - doneT };
  }
  function blockedTasksCount() { return AppStorage.getOpenBlockers().length; }

  // Overall / phase progress is based on exit criteria + project tasks + assessment pass —
  // never on calendar time — per the "don't use time as progress" requirement.
  function overallProgress() {
    let done = 0, total = 0;
    WEEKS.forEach((w) => { total += w.exitCriteria.length; done += w.exitCriteria.filter((e) => AppStorage.isExitDone(e.id)).length; });
    PROJECTS.forEach((p) => { total += p.tasks.length; done += p.tasks.filter((t) => AppStorage.isProjectTaskDone(t.id)).length; });
    ASSESSMENTS.forEach((a) => { total += 1; done += AppStorage.getAssessmentResult(a.id).passed ? 1 : 0; });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function phaseProgress(phaseId) {
    const p = getPhase(phaseId);
    let done = 0, total = 0;
    p.weeks.forEach((wid) => {
      const w = getWeek(wid);
      total += w.exitCriteria.length;
      done += w.exitCriteria.filter((e) => AppStorage.isExitDone(e.id)).length;
    });
    p.projectIds.forEach((pid) => {
      const pr = getProject(pid);
      total += pr.tasks.length;
      done += pr.tasks.filter((t) => AppStorage.isProjectTaskDone(t.id)).length;
    });
    const assessment = getAssessmentForPhase(phaseId);
    if (assessment) { total += 1; done += AppStorage.getAssessmentResult(assessment.id).passed ? 1 : 0; }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function nextActionFor(weekId) {
    const w = getWeek(weekId);
    const openTask = w.tasks.find((t) => !AppStorage.isTaskDone(t.id));
    if (openTask) return { label: "Complete: " + openTask.label, href: `week.html?week=${weekId}` };
    const openExit = w.exitCriteria.find((e) => !AppStorage.isExitDone(e.id));
    if (openExit) return { label: "Meet exit criteria: " + openExit.label, href: `week.html?week=${weekId}` };
    // This week's own checklist is done — check whether the *whole phase's* gate is clear
    // (a phase can span several weeks and several projects, e.g. Machine Learning weeks 10-13).
    const gate = getPhaseGateBlockers(w.phaseId);
    if (gate.incompleteProjects.length) {
      const pid = gate.incompleteProjects[0];
      const proj = getProject(pid);
      const pp = projectProgress(pid);
      return { label: `Finish project: ${proj.name} (${pp.done}/${pp.total})`, href: `project.html?id=${pid}` };
    }
    if (gate.assessmentPending) {
      return { label: "Take the " + gate.assessment.name, href: `assessments.html?phase=${w.phaseId}` };
    }
    if (weekId < 25) return { label: `Week ${weekId} complete — move to Week ${weekId + 1}`, href: `week.html?week=${weekId + 1}` };
    return { label: "🎉 Roadmap complete — see Career Readiness in your journal notes", href: "analytics.html" };
  }

  function getCurrentPosition() {
    const weekId = getCurrentWeekId();
    if (weekId === null) {
      return { finished: true, overall: overallProgress() };
    }
    const w = getWeek(weekId);
    const phase = getPhase(w.phaseId);
    const wp = weekTaskProgress(weekId);
    const ep = weekExitProgress(weekId);
    const openTask = w.tasks.find((t) => !AppStorage.isTaskDone(t.id));
    const na = nextActionFor(weekId);
    const gateBlocking = isPhaseGateBlocking(phase.id);
    let currentTopic;
    if (gateBlocking) currentTopic = "Phase gate: " + na.label.replace(/^Finish project: |^Take the /, "");
    else if (openTask) currentTopic = openTask.label;
    else if (ep.done < ep.total) currentTopic = "Exit criteria";
    else currentTopic = "Wrapping up this week";
    let nextMilestone;
    if (!isWeekComplete(weekId)) nextMilestone = `Finish Week ${weekId}`;
    else if (gateBlocking) nextMilestone = na.label;
    else nextMilestone = weekId < 25 ? `Start Week ${weekId + 1}` : "Wrap up the capstone";
    return {
      finished: false,
      weekId, week: w, phase,
      currentTopic,
      weekProgress: wp, exitProgress: ep,
      phaseProgress: phaseProgress(phase.id),
      overall: overallProgress(),
      nextAction: na, nextMilestone,
      blocked: weekHasOpenBlockers(weekId),
      gateBlocking,
    };
  }

  return {
    getWeek, getPhase, getProject, getSkill, getAssessmentForPhase, phaseOfWeek,
    isFirstWeekOfPhase, isLastWeekOfPhase,
    weekTaskProgress, weekExitProgress, isWeekComplete, weekHasOpenBlockers, weekStatus,
    projectProgress, isProjectComplete,
    isPhaseComplete, isPhaseUnlocked, isWeekUnlocked, weekDisplayStatus,
    getFirstIncompletePhase, isPhaseGateBlocking, getPhaseGateBlockers,
    getCurrentWeekId, getCurrentPosition,
    completedWeeksCount, completedProjectsCount, allTaskStats, blockedTasksCount,
    overallProgress, phaseProgress, nextActionFor,
  };
})();

/* ---------------------------- UI helpers ---------------------------- */
const UI = {
  qs: (sel, root) => (root || document).querySelector(sel),
  qsa: (sel, root) => Array.from((root || document).querySelectorAll(sel)),
  esc: (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  fmtDate: (ts) => { const d = new Date(ts); return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); },

  progressBar(pct, opts) {
    opts = opts || {};
    const p = Math.max(0, Math.min(100, pct));
    const tone = opts.tone || (p === 100 ? "success" : p > 0 ? "accent" : "muted");
    return `<div class="pbar ${opts.size === "sm" ? "pbar-sm" : ""}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
      <div class="pbar-fill tone-${tone}" style="width:${p}%"></div>
    </div>`;
  },

  statusBadge(status) {
    const map = {
      "not-started": ["NOT STARTED", "muted"],
      "in-progress": ["IN PROGRESS", "warn"],
      "completed": ["COMPLETED", "success"],
      "blocked": ["BLOCKED", "danger"],
      "locked": ["LOCKED", "muted"],
      "current": ["CURRENT", "accent"],
      "available": ["AVAILABLE", "info"],
    };
    const [label, tone] = map[status] || [status.toUpperCase(), "muted"];
    return `<span class="badge tone-${tone}">${label}</span>`;
  },

  weekGlyph(status) {
    const map = { completed: "✓", current: "→", available: "○", locked: "🔒", blocked: "!" };
    return map[status] || "○";
  },

  toast(msg, type) {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = `toast tone-${type || "default"}`;
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 250); }, 3200);
  },

  modal(contentHTML, opts) {
    opts = opts || {};
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<div class="modal-box ${opts.wide ? "modal-wide" : ""}" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Close">${ICONS.close}</button>
      <div class="modal-content">${contentHTML}</div>
    </div>`;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("show"));
    function close() {
      backdrop.classList.remove("show");
      setTimeout(() => backdrop.remove(), 200);
    }
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector(".modal-close").addEventListener("click", close);
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    return { el: backdrop, close };
  },

  confirm(message, onConfirm, opts) {
    opts = opts || {};
    const m = UI.modal(`
      <h3 class="modal-title">${opts.title || "Are you sure?"}</h3>
      <p class="modal-msg">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button class="btn ${opts.danger ? "btn-danger" : "btn-primary"}" data-act="ok">${opts.confirmLabel || "Confirm"}</button>
      </div>`);
    m.el.querySelector('[data-act="cancel"]').addEventListener("click", m.close);
    m.el.querySelector('[data-act="ok"]').addEventListener("click", () => { m.close(); onConfirm(); });
  },

  NAV_ITEMS: [
    { href: "index.html", label: "Dashboard", icon: "dashboard" },
    { href: "roadmap.html", label: "Roadmap", icon: "roadmap" },
    { href: "projects.html", label: "Projects", icon: "projects" },
    { href: "skills.html", label: "Skills", icon: "skills" },
    { href: "assessments.html", label: "Assessments", icon: "assessments" },
    { href: "journal.html", label: "Journal", icon: "journal" },
    { href: "analytics.html", label: "Analytics", icon: "analytics" },
    { href: "settings.html", label: "Settings", icon: "settings" },
  ],

  renderSidebar(activeHref) {
    const root = document.getElementById("sidebar-root");
    if (!root) return;
    const pos = Engine.getCurrentPosition();
    const overallPct = pos.overall.pct;
    const items = UI.NAV_ITEMS.map((item) => {
      const active = item.href === activeHref;
      return `<a class="nav-item ${active ? "active" : ""}" href="${item.href}">
        ${icon(item.icon)}<span>${item.label}</span>
      </a>`;
    }).join("");

    const beacon = pos.finished
      ? `<div class="sidebar-beacon finished"><div class="beacon-title">🎉 Roadmap complete</div></div>`
      : `<a class="sidebar-beacon" href="week.html?week=${pos.weekId}">
          <div class="beacon-label">YOU ARE HERE</div>
          <div class="beacon-week">Week ${pos.weekId} <span>/ 25</span></div>
          <div class="beacon-phase">${UI.esc(pos.phase.name)}</div>
          ${UI.progressBar(pos.weekProgress.pct, { size: "sm", tone: "accent" })}
          <div class="beacon-pct">${pos.weekProgress.pct}% this week</div>
        </a>`;

    root.innerHTML = `
      <div class="sidebar-head">
        <div class="brand"><span class="brand-mark">◆</span> AI Tracker</div>
        <button class="sidebar-close" aria-label="Close menu">${ICONS.close}</button>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      ${beacon}
      <div class="sidebar-overall">
        <div class="sidebar-overall-row"><span>Overall</span><span>${overallPct}%</span></div>
        ${UI.progressBar(overallPct, { size: "sm" })}
      </div>
      <div class="account-panel">
        <div class="account-email" title="${UI.esc(Auth.getUser() && Auth.getUser().email)}">${UI.esc(Auth.getUser() && Auth.getUser().email)}</div>
        <button class="btn btn-ghost btn-sm btn-block" id="logout-btn" type="button">Log out</button>
      </div>
    `;

    const topbar = document.getElementById("topbar-root");
    if (topbar) {
      topbar.innerHTML = `
        <button class="topbar-menu" aria-label="Open menu">${ICONS.menu}</button>
        <div class="topbar-brand"><span class="brand-mark">◆</span> AI Tracker</div>
        <div class="topbar-pct">${overallPct}%</div>
      `;
      const openBtn = topbar.querySelector(".topbar-menu");
      const closeBtn = root.querySelector(".sidebar-close");
      const logoutBtn = root.querySelector("#logout-btn");
      if (logoutBtn) logoutBtn.addEventListener("click", () => Auth.logout());
      openBtn.addEventListener("click", () => document.body.classList.add("sidebar-open"));
      closeBtn.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
      document.addEventListener("click", (e) => {
        if (e.target.closest(".topbar-menu") || e.target.closest(".sidebar-close")) return;
        if (document.body.classList.contains("sidebar-open") && !root.contains(e.target) && !openBtn.contains(e.target)) {
          document.body.classList.remove("sidebar-open");
        }
      });
    }
  },

  renderBlockerCount() {
    const n = Engine.blockedTasksCount();
    const hosts = UI.qsa(".blocker-count");
    hosts.forEach((h) => {
      h.textContent = `⚠️ ${n} BLOCKED TASK${n === 1 ? "" : "S"}`;
      h.style.display = n > 0 ? "" : "none";
    });
  },
};

// Shared, lock-respecting navigation for any element marked data-week-link="N"
// (used by the dashboard mini-roadmap, the full roadmap page, and prev/next
// buttons on week.html) so the "don't allow navigation into locked content"
// rule only has to be implemented once.
document.addEventListener("click", (e) => {
  const menuButton = e.target.closest(".topbar-menu");
  if (menuButton) {
    e.preventDefault();
    e.stopImmediatePropagation();
    document.body.classList.add("sidebar-open");
    return;
  }
  const sidebarClose = e.target.closest(".sidebar-close");
  if (sidebarClose) {
    e.preventDefault();
    e.stopImmediatePropagation();
    document.body.classList.remove("sidebar-open");
    return;
  }
  const el = e.target.closest("[data-week-link]");
  if (!el) return;
  const wid = Number(el.getAttribute("data-week-link"));
  if (Engine.isWeekUnlocked(wid)) {
    window.location.href = `week.html?week=${wid}`;
  } else {
    e.preventDefault();
    const gate = Engine.getPhaseGateBlockers(Engine.getWeek(wid).phaseId);
    let why = `Complete Week ${wid - 1} first.`;
    if (Engine.isFirstWeekOfPhase(wid)) {
      why = gate.incompleteProjects.length
        ? "Finish the previous phase's project(s) first."
        : gate.assessmentPending
        ? "Pass the previous phase's assessment first."
        : "Finish the previous phase first.";
    }
    UI.toast(`🔒 Week ${wid} is locked. ${why}`, "default");
  }
});

document.addEventListener("app:ready", () => {
  const active = document.body.getAttribute("data-page") + ".html";
  UI.renderSidebar(active);
  UI.renderBlockerCount();
});
document.addEventListener("state:changed", () => {
  const active = document.body.getAttribute("data-page") + ".html";
  UI.renderSidebar(active);
  UI.renderBlockerCount();
});
