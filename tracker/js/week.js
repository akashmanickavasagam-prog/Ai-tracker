/* ==========================================================================
   week.js — week.html only
   ========================================================================== */

function getWeekIdFromURL() {
  const params = new URLSearchParams(location.search);
  const w = Number(params.get("week"));
  if (w >= 1 && w <= 25) return w;
  return Engine.getCurrentWeekId() || 1;
}

function taskRowHTML(task, done, weekId, disabled) {
  const blocker = AppStorage.getBlockerForTask(task.id);
  const isBlocked = !!blocker;
  const catLabel = { learning: "Learn", practice: "Practice", build: "Build" }[task.cat] || task.cat;
  return `
    <div class="check-row ${done ? "done" : ""} ${isBlocked ? "blocked" : ""}">
      <div class="checkbox" data-task="${task.id}" ${disabled ? "" : ""} style="${disabled ? "pointer-events:none;opacity:0.5;" : ""}">${ICONS.check}</div>
      <div class="check-label"><span class="check-cat">${catLabel}</span>${UI.esc(task.label)}</div>
      <button class="check-flag ${isBlocked ? "is-blocked" : ""}" data-blocker-for="${task.id}" data-week="${weekId}" title="${isBlocked ? "View / resolve blocker" : "Flag as blocked"}" ${disabled ? "disabled" : ""}>${ICONS.flag}</button>
    </div>`;
}

function exitRowHTML(item, done, disabled) {
  return `
    <div class="check-row ${done ? "done" : ""}">
      <div class="checkbox" data-exit="${item.id}" style="${disabled ? "pointer-events:none;opacity:0.5;" : ""}">${ICONS.check}</div>
      <div class="check-label">${UI.esc(item.label)}</div>
    </div>`;
}

function renderWeekPage() {
  const weekId = getWeekIdFromURL();
  const w = Engine.getWeek(weekId);
  const host = document.getElementById("week-content");
  if (!w) { host.innerHTML = `<div class="empty-state"><h3>Week not found</h3><a href="roadmap.html" class="btn btn-ghost mt-12">Back to roadmap</a></div>`; return; }

  const phase = Engine.getPhase(w.phaseId);
  const unlocked = Engine.isWeekUnlocked(weekId);
  const status = Engine.weekDisplayStatus(weekId);
  const tp = Engine.weekTaskProgress(weekId);
  const ep = Engine.weekExitProgress(weekId);
  const project = w.projectId ? Engine.getProject(w.projectId) : null;
  const isLastOfPhase = Engine.isLastWeekOfPhase(weekId);
  const gate = isLastOfPhase ? Engine.getPhaseGateBlockers(w.phaseId) : null;
  const note = AppStorage.getNote(weekId);
  const review = AppStorage.getWeeklyReview(weekId) || {};
  const studyMin = AppStorage.getStudyTime(weekId);
  const disabled = !unlocked;

  const lockedBanner = !unlocked ? `
    <div class="locked-banner">
      ${icon("lock")}
      <div>
        <b>This week is locked.</b> ${Engine.isFirstWeekOfPhase(weekId)
          ? `Finish Phase ${w.phaseId - 1} — its remaining weeks, project(s), and assessment — to unlock Phase ${w.phaseId}.`
          : `Complete Week ${weekId - 1}'s exit criteria to unlock this week.`}
        You can preview the content below, but it's read-only until then.
      </div>
    </div>` : "";

  const gateBanner = (isLastOfPhase && gate && (gate.incompleteProjects.length || gate.assessmentPending) && ep.done === ep.total) ? `
    <div class="locked-banner" style="border-color:rgba(255,180,84,0.4); background:rgba(255,180,84,0.08);">
      ${icon("lock")}
      <div><b>Phase ${w.phaseId} gate:</b> this week's exit criteria are done, but the phase isn't complete —
      ${gate.incompleteProjects.length ? `finish <a href="project.html?id=${gate.incompleteProjects[0]}" class="link-ext" style="display:inline">${UI.esc(Engine.getProject(gate.incompleteProjects[0]).name)}</a>` : ""}
      ${gate.incompleteProjects.length && gate.assessmentPending ? " and " : ""}
      ${gate.assessmentPending ? `pass the <a href="assessments.html?phase=${w.phaseId}" class="link-ext" style="display:inline">${UI.esc(gate.assessment.name)}</a>` : ""}
      to unlock the next phase.</div>
    </div>` : "";

  const learningTasks = w.tasks.filter((t) => t.cat === "learning");
  const practiceTasks = w.tasks.filter((t) => t.cat === "practice");
  const buildTasks = w.tasks.filter((t) => t.cat === "build");

  host.innerHTML = `
    <div class="flex justify-between items-center mb-16" style="flex-wrap:wrap; gap:10px;">
      <button class="btn btn-ghost btn-sm" data-week-link="${weekId - 1}" ${weekId <= 1 ? "disabled" : ""}>${ICONS.chevronLeft} Week ${weekId - 1}</button>
      <a href="roadmap.html" class="small muted link-ext">Back to full roadmap</a>
      <button class="btn btn-ghost btn-sm" data-week-link="${weekId + 1}" ${weekId >= 25 ? "disabled" : ""}>Week ${weekId + 1} ${ICONS.chevronRight}</button>
    </div>

    <div class="page-eyebrow">Phase ${phase.id} — ${UI.esc(phase.name)}</div>
    <div class="flex justify-between items-start mb-8" style="flex-wrap:wrap; gap:10px;">
      <h1 class="page-title">Week ${weekId} — ${UI.esc(w.title)}</h1>
      ${UI.statusBadge(status)}
    </div>
    <p class="page-sub">${UI.esc(w.goal)}</p>

    ${lockedBanner}
    ${gateBanner}

    <div class="grid grid-2 mt-20 mb-20">
      <div class="card card-tight">
        <div class="flex justify-between small muted mb-8"><span>Weekly tasks</span><span class="mono">${tp.done}/${tp.total}</span></div>
        ${UI.progressBar(tp.pct, { tone: "accent" })}
      </div>
      <div class="card card-tight">
        <div class="flex justify-between small muted mb-8"><span>Exit criteria</span><span class="mono">${ep.done}/${ep.total}</span></div>
        ${UI.progressBar(ep.pct, { tone: ep.pct === 100 ? "success" : "info" })}
      </div>
    </div>

    ${project ? `
    <a href="project.html?id=${project.id}" class="card card-link mb-20" style="display:block;">
      <div class="flex justify-between items-center">
        <div>
          <div class="small muted">LINKED PROJECT</div>
          <div style="font-weight:600; margin-top:2px;">${UI.esc(project.name)}</div>
        </div>
        <div style="text-align:right;">
          <div class="mono small">${Engine.projectProgress(project.id).done}/${Engine.projectProgress(project.id).total}</div>
          <div style="width:100px; margin-top:6px;">${UI.progressBar(Engine.projectProgress(project.id).pct, { size: "sm" })}</div>
        </div>
      </div>
    </a>` : ""}

    <section class="card mb-20">
      <div class="checklist-progress">
        <div class="section-title" style="margin-bottom:0;">Learning Tasks</div>
        <span class="count">${learningTasks.filter(t=>AppStorage.isTaskDone(t.id)).length}/${learningTasks.length}</span>
      </div>
      <div class="checklist" id="learning-list">${learningTasks.map((t) => taskRowHTML(t, AppStorage.isTaskDone(t.id), weekId, disabled)).join("")}</div>

      <div class="divider"></div>
      <div class="checklist-progress">
        <div class="section-title" style="margin-bottom:0;">Practice Tasks</div>
        <span class="count">${practiceTasks.filter(t=>AppStorage.isTaskDone(t.id)).length}/${practiceTasks.length}</span>
      </div>
      <div class="checklist" id="practice-list">${practiceTasks.map((t) => taskRowHTML(t, AppStorage.isTaskDone(t.id), weekId, disabled)).join("")}</div>

      <div class="divider"></div>
      <div class="checklist-progress">
        <div class="section-title" style="margin-bottom:0;">Build / Project Tasks</div>
        <span class="count">${buildTasks.filter(t=>AppStorage.isTaskDone(t.id)).length}/${buildTasks.length}</span>
      </div>
      <div class="checklist" id="build-list">${buildTasks.map((t) => taskRowHTML(t, AppStorage.isTaskDone(t.id), weekId, disabled)).join("")}</div>
    </section>

    <section class="card mb-20">
      <div class="flex justify-between items-center mb-12">
        <div class="section-title" style="margin-bottom:0;">Exit Criteria</div>
        <span class="small muted">Required to unlock Week ${weekId + 1 <= 25 ? weekId + 1 : "—"}</span>
      </div>
      <div class="checklist" id="exit-list">${w.exitCriteria.map((e) => exitRowHTML(e, AppStorage.isExitDone(e.id), disabled)).join("")}</div>
    </section>

    <section class="card mb-20">
      <div class="flex justify-between items-center mb-12">
        <div class="section-title" style="margin-bottom:0;">Notes</div>
        <div class="small muted">Study time this week: <b class="mono" id="study-total">${studyMin}</b> min</div>
      </div>
      <div class="field" style="margin-bottom:10px;">
        <textarea id="week-notes" placeholder="Freeform notes for this week...">${UI.esc(note)}</textarea>
      </div>
      <div class="flex gap-10 items-center" style="flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="save-notes-btn">Save Notes</button>
        <div class="flex items-center gap-6">
          <input type="number" min="0" id="study-min-input" placeholder="minutes" style="width:90px;">
          <button class="btn btn-ghost btn-sm" id="log-time-btn">Log Time</button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="section-title">Weekly Review</div>
      <p class="small muted mb-16">Fill this in when you wrap up the week — it's a habit that pays off later in interviews and retros.</p>
      <div class="field"><label>Completed</label><textarea id="rev-completed" placeholder="What did you finish this week?">${UI.esc(review.completed || "")}</textarea></div>
      <div class="field"><label>Still Pending</label><textarea id="rev-pending" placeholder="What's left over?">${UI.esc(review.pending || "")}</textarea></div>
      <div class="field"><label>Problems</label><textarea id="rev-problems" placeholder="What got in the way?">${UI.esc(review.problems || "")}</textarea></div>
      <div class="field"><label>Skills Improved</label><textarea id="rev-skills" placeholder="What got noticeably better?">${UI.esc(review.skillsImproved || "")}</textarea></div>
      <div class="field"><label>Project Progress</label><textarea id="rev-project" placeholder="Where's the linked project at?">${UI.esc(review.projectProgress || "")}</textarea></div>
      <div class="field"><label>Assessment</label><textarea id="rev-assessment" placeholder="Any assessment notes?">${UI.esc(review.assessment || "")}</textarea></div>
      <div class="field"><label>Next Week</label><textarea id="rev-next" placeholder="What's the plan for next week?">${UI.esc(review.nextWeek || "")}</textarea></div>
      <div class="flex justify-between items-center">
        <span class="small muted">${review.savedAt ? "Last saved " + UI.fmtDate(review.savedAt) : "Not saved yet"}</span>
        <button class="btn btn-primary" id="save-review-btn">Save Weekly Review</button>
      </div>
    </section>
  `;

  wireWeekEvents(weekId, disabled);
}

function wireWeekEvents(weekId, disabled) {
  if (!disabled) {
    UI.qsa("[data-task]").forEach((el) => {
      el.addEventListener("click", () => { AppStorage.toggleTask(el.getAttribute("data-task")); renderWeekPage(); });
    });
    UI.qsa("[data-exit]").forEach((el) => {
      el.addEventListener("click", () => { AppStorage.toggleExit(el.getAttribute("data-exit")); renderWeekPage(); });
    });
  }
  UI.qsa("[data-blocker-for]").forEach((el) => {
    el.addEventListener("click", () => openBlockerModal(el.getAttribute("data-blocker-for"), Number(el.getAttribute("data-week"))));
  });

  const notesBox = document.getElementById("week-notes");
  const saveNotesBtn = document.getElementById("save-notes-btn");
  if (saveNotesBtn) saveNotesBtn.addEventListener("click", () => { AppStorage.setNote(weekId, notesBox.value); UI.toast("Notes saved."); });
  if (notesBox) notesBox.addEventListener("blur", () => AppStorage.setNote(weekId, notesBox.value));

  const logBtn = document.getElementById("log-time-btn");
  if (logBtn) logBtn.addEventListener("click", () => {
    const input = document.getElementById("study-min-input");
    const mins = Number(input.value);
    if (!mins || mins <= 0) { UI.toast("Enter minutes first.", "error"); return; }
    AppStorage.addStudyTime(weekId, mins);
    input.value = "";
    document.getElementById("study-total").textContent = AppStorage.getStudyTime(weekId);
    UI.toast(`Logged ${mins} min.`, "success");
  });

  const saveReviewBtn = document.getElementById("save-review-btn");
  if (saveReviewBtn) saveReviewBtn.addEventListener("click", () => {
    AppStorage.saveWeeklyReview(weekId, {
      completed: document.getElementById("rev-completed").value,
      pending: document.getElementById("rev-pending").value,
      problems: document.getElementById("rev-problems").value,
      skillsImproved: document.getElementById("rev-skills").value,
      projectProgress: document.getElementById("rev-project").value,
      assessment: document.getElementById("rev-assessment").value,
      nextWeek: document.getElementById("rev-next").value,
    });
    UI.toast("Weekly review saved.", "success");
    renderWeekPage();
  });
}

function openBlockerModal(taskId, weekId) {
  const w = Engine.getWeek(weekId);
  const task = w.tasks.find((t) => t.id === taskId);
  const existing = AppStorage.getBlockerForTask(taskId);

  if (existing) {
    const m = UI.modal(`
      <h3 class="modal-title">Blocker: ${UI.esc(existing.topic)}</h3>
      <div class="field"><label>Problem</label><textarea id="blk-problem">${UI.esc(existing.problem)}</textarea></div>
      <div class="field"><label>What I tried</label><textarea id="blk-tried">${UI.esc(existing.tried)}</textarea></div>
      <div class="field"><label>Next Action</label><textarea id="blk-next">${UI.esc(existing.nextAction)}</textarea></div>
      <div class="modal-actions" style="justify-content:space-between;">
        <button class="btn btn-danger btn-sm" data-act="delete">Delete</button>
        <div class="flex gap-10">
          <button class="btn btn-ghost" data-act="update">Save Update</button>
          <button class="btn btn-primary" data-act="resolve">Mark Resolved</button>
        </div>
      </div>`, { wide: true });
    m.el.querySelector('[data-act="resolve"]').addEventListener("click", () => {
      AppStorage.updateBlocker(existing.id, { problem: document.getElementById("blk-problem").value, tried: document.getElementById("blk-tried").value, nextAction: document.getElementById("blk-next").value });
      AppStorage.resolveBlocker(existing.id);
      UI.toast("Blocker resolved. 🎉", "success");
      m.close(); renderWeekPage();
    });
    m.el.querySelector('[data-act="update"]').addEventListener("click", () => {
      AppStorage.updateBlocker(existing.id, { problem: document.getElementById("blk-problem").value, tried: document.getElementById("blk-tried").value, nextAction: document.getElementById("blk-next").value });
      UI.toast("Blocker updated.");
      m.close(); renderWeekPage();
    });
    m.el.querySelector('[data-act="delete"]').addEventListener("click", () => {
      AppStorage.deleteBlocker(existing.id);
      m.close(); renderWeekPage();
    });
    return;
  }

  const m = UI.modal(`
    <h3 class="modal-title">Flag as Blocked</h3>
    <div class="field"><label>Topic</label><input type="text" id="blk-topic" value="${UI.esc(task ? task.label : "")}"></div>
    <div class="field"><label>Problem</label><textarea id="blk-problem" placeholder="What's not working?"></textarea></div>
    <div class="field"><label>What I tried</label><textarea id="blk-tried" placeholder="Steps already attempted..."></textarea></div>
    <div class="field"><label>Next Action</label><textarea id="blk-next" placeholder="What will you try next?"></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="cancel">Cancel</button>
      <button class="btn btn-danger" data-act="save">Mark as Blocked</button>
    </div>`, { wide: true });
  m.el.querySelector('[data-act="cancel"]').addEventListener("click", m.close);
  m.el.querySelector('[data-act="save"]').addEventListener("click", () => {
    AppStorage.addBlocker({
      taskId, weekId,
      topic: document.getElementById("blk-topic").value,
      problem: document.getElementById("blk-problem").value,
      tried: document.getElementById("blk-tried").value,
      nextAction: document.getElementById("blk-next").value,
    });
    AppStorage.setTaskDone(taskId, false);
    UI.toast("Marked as blocked.");
    m.close(); renderWeekPage();
  });
}

document.addEventListener("app:ready", renderWeekPage);
document.addEventListener("state:changed", () => { /* re-render happens explicitly after each mutation above to avoid cursor-jump in open textareas */ });
