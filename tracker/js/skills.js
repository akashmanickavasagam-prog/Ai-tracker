/* ==========================================================================
   skills.js — skills.html only
   ========================================================================== */

const SKILL_GROUPS = [
  { label: "Programming & Backend", ids: ["python", "fastapi", "rest-apis", "api-integration"] },
  { label: "Data & Databases", ids: ["postgresql", "sql", "db-design"] },
  { label: "Machine Learning & Deep Learning", ids: ["ml", "sklearn", "dl", "tensorflow"] },
  { label: "Generative AI & RAG", ids: ["llms", "prompt-eng", "embeddings", "vector-db", "rag", "langchain"] },
  { label: "Agentic AI", ids: ["langgraph", "ai-agents", "tool-calling"] },
];

const REVIEW_STEPS = [
  { key: "learned", label: "Learned" },
  { key: "practiced", label: "Practiced" },
  { key: "built", label: "Built" },
  { key: "reviewed", label: "Reviewed" },
  { key: "confident", label: "Confident" },
];

function skillCardHTML(skillId) {
  const skill = Engine.getSkill(skillId);
  const state = AppStorage.getSkillState(skillId);
  const levelIdx = SKILL_STATUS_LEVELS.indexOf(state.status);
  const pct = Math.round((levelIdx / (SKILL_STATUS_LEVELS.length - 1)) * 100);
  return `
    <div class="card card-tight mb-12">
      <div class="flex justify-between items-center mb-12" style="flex-wrap:wrap; gap:10px;">
        <div style="font-weight:600; font-size:14px;">${UI.esc(skill.name)}</div>
        <select data-skill-status="${skillId}" style="width:auto; min-width:170px;">
          ${SKILL_STATUS_LEVELS.map((l) => `<option value="${l}" ${state.status === l ? "selected" : ""}>${SKILL_STATUS_LABELS[l]}</option>`).join("")}
        </select>
      </div>
      ${UI.progressBar(pct, { size: "sm", tone: pct === 100 ? "success" : "accent" })}

      <div class="mt-16 mb-12">
        <div class="flex justify-between small muted mb-6"><span>Confidence</span><span class="mono">${state.confidence || 0}/5</span></div>
        <input type="range" class="slider" style="width:100%;" min="0" max="5" step="1" value="${state.confidence || 0}" data-skill-confidence="${skillId}">
      </div>

      <div class="flex gap-8" style="flex-wrap:wrap;">
        ${REVIEW_STEPS.map((s) => `<button class="badge tone-${state.review[s.key] ? "success" : "muted"}" data-skill-review="${skillId}" data-step="${s.key}" style="cursor:pointer;">${state.review[s.key] ? "✓ " : ""}${s.label}</button>`).join("")}
      </div>
    </div>`;
}

function renderSkillsStats() {
  const total = SKILLS.length;
  const confidentPlus = SKILLS.filter((s) => ["confident", "interview-ready"].includes(AppStorage.getSkillState(s.id).status)).length;
  const notStarted = SKILLS.filter((s) => AppStorage.getSkillState(s.id).status === "not-started").length;
  const avgConf = (SKILLS.reduce((sum, s) => sum + (AppStorage.getSkillState(s.id).confidence || 0), 0) / total).toFixed(1);
  document.getElementById("skills-stats").innerHTML = [
    { label: "Total Skills", value: total },
    { label: "Confident or Better", value: confidentPlus, tone: "success" },
    { label: "Not Started", value: notStarted },
    { label: "Avg. Confidence", value: avgConf, unit: "/ 5", tone: "accent" },
  ].map((c) => `<div class="card stat-card ${c.tone ? "tone-" + c.tone : ""}"><div class="stat-label">${c.label}</div><div class="stat-value">${c.value}${c.unit ? `<span class="unit">${c.unit}</span>` : ""}</div></div>`).join("");
}

function renderSkillsGroups() {
  const host = document.getElementById("skills-groups");
  host.innerHTML = SKILL_GROUPS.map((g) => `
    <section class="mb-20">
      <div class="section-title">${UI.esc(g.label)}</div>
      ${g.ids.map(skillCardHTML).join("")}
    </section>`).join("");

  UI.qsa("[data-skill-status]").forEach((el) => {
    el.addEventListener("change", () => { AppStorage.setSkillState(el.getAttribute("data-skill-status"), { status: el.value }); renderAll(); });
  });
  UI.qsa("[data-skill-confidence]").forEach((el) => {
    el.addEventListener("input", () => {
      const id = el.getAttribute("data-skill-confidence");
      AppStorage.setSkillState(id, { confidence: Number(el.value) });
    });
    el.addEventListener("change", renderAll);
  });
  UI.qsa("[data-skill-review]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-skill-review");
      const step = el.getAttribute("data-step");
      const current = AppStorage.getSkillState(id);
      AppStorage.setSkillState(id, { review: { [step]: !current.review[step] } });
      renderAll();
    });
  });
}

function renderAll() {
  renderSkillsStats();
  renderSkillsGroups();
}

document.addEventListener("app:ready", renderAll);
