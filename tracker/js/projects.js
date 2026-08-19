/* ==========================================================================
   projects.js — projects.html (list) and project.html (detail)
   ========================================================================== */

const README_CHECKLIST = [
  "Problem statement written",
  "Architecture diagram included",
  "Setup / run instructions",
  "Screenshots or demo",
  "Results / metrics documented",
  "Known limitations noted",
];

function renderProjectsList() {
  const statsHost = document.getElementById("projects-stats");
  const done = Engine.completedProjectsCount();
  const inProgress = PROJECTS.filter((p) => { const pp = Engine.projectProgress(p.id); return pp.done > 0 && pp.done < pp.total; }).length;
  const notStarted = PROJECTS.length - done - inProgress;
  statsHost.innerHTML = [
    { label: "Total Projects", value: PROJECTS.length },
    { label: "Completed", value: done, tone: "success" },
    { label: "In Progress", value: inProgress, tone: "accent" },
    { label: "Not Started", value: notStarted },
  ].map((c) => `<div class="card stat-card ${c.tone ? "tone-" + c.tone : ""}"><div class="stat-label">${c.label}</div><div class="stat-value">${c.value}</div></div>`).join("");

  const grid = document.getElementById("projects-grid");
  grid.innerHTML = PROJECTS.map((p, idx) => {
    const pp = Engine.projectProgress(p.id);
    const complete = Engine.isProjectComplete(p.id);
    const status = complete ? "completed" : pp.done > 0 ? "in-progress" : "not-started";
    const week = Engine.getWeek(p.weekIntroduced);
    return `
      <a href="project.html?id=${p.id}" class="card card-link flex-col gap-10" style="display:flex;">
        <div class="flex justify-between items-start">
          <span class="small muted mono">PROJECT ${idx + 1}</span>
          ${UI.statusBadge(status)}
        </div>
        <div style="font-weight:600; font-size:15px; line-height:1.35;">${UI.esc(p.name)}</div>
        <div class="small muted">Introduced Week ${p.weekIntroduced} — ${UI.esc(week.title)}</div>
        <div class="pill-row">${p.techStack.slice(0, 3).map((t) => `<span class="tech-pill">${UI.esc(t)}</span>`).join("")}${p.techStack.length > 3 ? `<span class="tech-pill">+${p.techStack.length - 3}</span>` : ""}</div>
        <div class="mt-8">
          <div class="flex justify-between small muted mb-8"><span>Tasks</span><span>${pp.done}/${pp.total}</span></div>
          ${UI.progressBar(pp.pct, { tone: complete ? "success" : "accent" })}
        </div>
      </a>`;
  }).join("");
}

function renderProjectDetail() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const p = Engine.getProject(id);
  const host = document.getElementById("project-content");
  if (!p) { host.innerHTML = `<div class="empty-state"><h3>Project not found</h3><a href="projects.html" class="btn btn-ghost mt-12">Back to projects</a></div>`; return; }

  const pp = Engine.projectProgress(id);
  const complete = Engine.isProjectComplete(id);
  const week = Engine.getWeek(p.weekIntroduced);
  const meta = AppStorage.getProjectMeta(id);
  const idx = PROJECTS.findIndex((x) => x.id === id);

  const readmeDoneCount = README_CHECKLIST.filter((_, i) => AppStorage.isProjectTaskDone(`p${id}-readme-${i}`)).length;

  host.innerHTML = `
    <a href="projects.html" class="small muted link-ext mb-16" style="display:inline-flex;">← All projects</a>
    <div class="flex justify-between items-start mb-8" style="flex-wrap:wrap; gap:10px;">
      <div>
        <div class="page-eyebrow">Project ${idx + 1} of ${PROJECTS.length}</div>
        <h1 class="page-title">${UI.esc(p.name)}</h1>
      </div>
      ${UI.statusBadge(complete ? "completed" : pp.done > 0 ? "in-progress" : "not-started")}
    </div>
    <p class="page-sub">Introduced in <a href="week.html?week=${p.weekIntroduced}" class="link-ext" style="display:inline-flex;">Week ${p.weekIntroduced} — ${UI.esc(week.title)}</a></p>

    <div class="card card-tight mt-20 mb-20">
      <div class="flex justify-between small muted mb-8"><span>Task Progress</span><span class="mono">${pp.done}/${pp.total} (${pp.pct}%)</span></div>
      ${UI.progressBar(pp.pct, { tone: complete ? "success" : "accent" })}
    </div>

    <section class="card mb-16">
      <div class="section-title">Problem Statement</div>
      <p class="secondary-text">${UI.esc(p.problem)}</p>
    </section>

    <section class="card mb-16">
      <div class="section-title">Features</div>
      <ul style="margin:0; padding-left:20px; color:var(--text-secondary); font-size:13.8px; line-height:1.8;">
        ${p.features.map((f) => `<li>${UI.esc(f)}</li>`).join("")}
      </ul>
    </section>

    <section class="card mb-16">
      <div class="section-title">Architecture</div>
      <div class="diagram">${UI.esc(p.architecture)}</div>
    </section>

    <div class="grid grid-2 mb-16">
      <section class="card"><div class="section-title">Input</div><p class="secondary-text small">${UI.esc(p.input)}</p></section>
      <section class="card"><div class="section-title">Output</div><p class="secondary-text small">${UI.esc(p.output)}</p></section>
    </div>

    <section class="card mb-16">
      <div class="section-title">Tech Stack</div>
      <div class="pill-row">${p.techStack.map((t) => `<span class="tech-pill">${UI.esc(t)}</span>`).join("")}</div>
    </section>

    <section class="card mb-16">
      <div class="checklist-progress"><div class="section-title" style="margin-bottom:0;">Tasks</div><span class="count">${pp.done}/${pp.total}</span></div>
      <div class="checklist" id="project-tasks">
        ${p.tasks.map((t) => `
          <div class="check-row ${AppStorage.isProjectTaskDone(t.id) ? "done" : ""}">
            <div class="checkbox" data-ptask="${t.id}">${ICONS.check}</div>
            <div class="check-label">${UI.esc(t.label)}</div>
          </div>`).join("")}
      </div>
    </section>

    <section class="card mb-16">
      <div class="section-title">Testing Checklist</div>
      <ul style="margin:0; padding-left:20px; color:var(--text-secondary); font-size:13.8px; line-height:1.8;">
        ${p.testing.map((t) => `<li>${UI.esc(t)}</li>`).join("")}
      </ul>
    </section>

    <section class="card mb-16">
      <div class="checklist-progress"><div class="section-title" style="margin-bottom:0;">README Checklist</div><span class="count">${readmeDoneCount}/${README_CHECKLIST.length}</span></div>
      <div class="checklist" id="readme-tasks">
        ${README_CHECKLIST.map((label, i) => `
          <div class="check-row ${AppStorage.isProjectTaskDone(`p${id}-readme-${i}`) ? "done" : ""}">
            <div class="checkbox" data-ptask="p${id}-readme-${i}">${ICONS.check}</div>
            <div class="check-label">${UI.esc(label)}</div>
          </div>`).join("")}
      </div>
    </section>

    <section class="card">
      <div class="section-title">Links &amp; Deployment</div>
      <div class="form-row">
        <div class="field"><label>GitHub Repo Link</label><input type="url" id="meta-github" placeholder="https://github.com/you/project" value="${UI.esc(meta.githubLink)}"></div>
        <div class="field"><label>Demo Link</label><input type="url" id="meta-demo" placeholder="https://your-demo.example.com" value="${UI.esc(meta.demoLink)}"></div>
      </div>
      <div class="field" style="max-width:240px;">
        <label>Deployment Status</label>
        <select id="meta-deploy">
          <option value="not-deployed" ${meta.deployment === "not-deployed" ? "selected" : ""}>Not deployed</option>
          <option value="local-only" ${meta.deployment === "local-only" ? "selected" : ""}>Local only</option>
          <option value="deployed" ${meta.deployment === "deployed" ? "selected" : ""}>Deployed</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm mt-8" id="save-meta-btn">Save Links</button>
    </section>
  `;

  UI.qsa("[data-ptask]").forEach((el) => {
    el.addEventListener("click", () => { AppStorage.toggleProjectTask(el.getAttribute("data-ptask")); renderProjectDetail(); });
  });
  document.getElementById("save-meta-btn").addEventListener("click", () => {
    AppStorage.setProjectMeta(id, {
      githubLink: document.getElementById("meta-github").value,
      demoLink: document.getElementById("meta-demo").value,
      deployment: document.getElementById("meta-deploy").value,
    });
    UI.toast("Links saved.", "success");
  });
}

function initProjectsPages() {
  if (document.getElementById("projects-grid")) { renderProjectsList(); document.addEventListener("state:changed", renderProjectsList); }
  if (document.getElementById("project-content")) { renderProjectDetail(); }
}

document.addEventListener("app:ready", initProjectsPages);
