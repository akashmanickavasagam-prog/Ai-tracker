/* ==========================================================================
  storage.js — in-memory tracker state with local cache and Supabase persistence.
   ========================================================================== */

const AppStorage = (function () {
  const KEY = "ai_tracker_state_v1";
  const TABLE = "tracker_state";

  function defaultState() {
    return {
      version: 1,
      taskDone: {},          // taskId -> true
      exitDone: {},          // exitCriteriaId -> true
      projectTaskDone: {},   // projectTaskId -> true
      blockers: [],          // [{id, taskId, weekId, topic, problem, tried, nextAction, status, createdAt, resolvedAt}]
      projectMeta: {},       // projectId -> {githubLink, demoLink, deployment}
      skills: {},            // skillId -> {status, confidence, review:{learned,practiced,built,reviewed,confident}}
      journal: [],           // [{id, date, week, topic, learned, practiced, built, problem, tried, timeSpent, status, nextAction, createdAt}]
      assessments: {},       // assessmentId -> {score, passed, history:[{score,date}]}
      weeklyReviews: {},     // weekId -> {completed, pending, problems, skillsImproved, projectProgress, assessment, nextWeek, savedAt}
      notes: {},             // weekId -> string
      studyTime: {},         // weekId -> minutes (display-only stat, never used for progress math)
      settings: { theme: "dark" },
      meta: { createdAt: Date.now(), updatedAt: Date.now() },
    };
  }

  function deepMerge(base, incoming) {
    // Shallow-per-key merge that's good enough for our flat-ish schema:
    // guarantees new fields added to defaultState() in future versions
    // still exist even if the saved blob predates them.
    const out = { ...base };
    for (const k of Object.keys(base)) {
      if (incoming && Object.prototype.hasOwnProperty.call(incoming, k)) {
        if (
          typeof base[k] === "object" &&
          base[k] !== null &&
          !Array.isArray(base[k]) &&
          typeof incoming[k] === "object" &&
          incoming[k] !== null &&
          !Array.isArray(incoming[k])
        ) {
          out[k] = { ...base[k], ...incoming[k] };
        } else {
          out[k] = incoming[k];
        }
      }
    }
    return out;
  }

  let state = null;
  let cloudClient = null;
  let cloudUser = null;
  let pendingSnapshot = null;
  let syncInProgress = false;
  let lastPersistedSnapshot = null;

  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? deepMerge(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) {
      console.error("AppStorage: failed to load, resetting to defaults.", e);
      state = defaultState();
    }
    return state;
  }

  async function hydrate(user, client) {
    cloudUser = user;
    cloudClient = client;
    const result = await cloudClient.from(TABLE).select("state").eq("user_id", user.id).maybeSingle();
    if (result.error) throw result.error;

    if (result.data && result.data.state) {
      state = deepMerge(defaultState(), result.data.state);
    } else {
      let localState = null;
      try {
        const raw = localStorage.getItem(KEY);
        localState = raw ? deepMerge(defaultState(), JSON.parse(raw)) : null;
      } catch (e) {
        console.warn("AppStorage: local cache could not be read.", e);
      }
      const shouldMigrate = localState && window.confirm("We found tracker progress saved in this browser. Import it into your new cloud account?");
      state = shouldMigrate ? localState : defaultState();
      await persistNow();
    }
    localStorage.setItem(KEY, JSON.stringify(state));
    lastPersistedSnapshot = JSON.stringify(state);
    document.dispatchEvent(new CustomEvent("state:changed"));
    return state;
  }

  async function persistNow() {
    if (!cloudClient || !cloudUser || !state) return;
    const snapshot = JSON.stringify(state);
    const result = await cloudClient.from(TABLE).upsert(
      { user_id: cloudUser.id, state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (result.error) throw result.error;
    lastPersistedSnapshot = snapshot;
  }

  async function drainCloudQueue() {
    if (syncInProgress || !cloudClient || !cloudUser || !pendingSnapshot) return;
    syncInProgress = true;
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    try {
      const payload = JSON.parse(snapshot);
      const result = await cloudClient.from(TABLE).upsert(
        { user_id: cloudUser.id, state: payload, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (result.error) throw result.error;
      lastPersistedSnapshot = snapshot;
    } catch (error) {
      pendingSnapshot = pendingSnapshot || snapshot;
      if (typeof Auth !== "undefined") Auth.reportCloudError(error);
      setTimeout(drainCloudQueue, 3000);
    } finally {
      syncInProgress = false;
      if (pendingSnapshot) drainCloudQueue();
    }
  }

  function save() {
    const s = load();
    s.meta.updatedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error("AppStorage: failed to save.", e);
      if (window.Toast) window.Toast.show("Couldn't save — browser storage may be full.", "error");
    }
    document.dispatchEvent(new CustomEvent("state:changed"));
    if (cloudClient && cloudUser) {
      const snapshot = JSON.stringify(state);
      if (snapshot !== lastPersistedSnapshot) {
        pendingSnapshot = snapshot;
        drainCloudQueue();
      }
    }
  }

  function get() {
    return load();
  }

  // ---------- Tasks (weekly learning/practice/build) ----------
  function isTaskDone(taskId) {
    return !!load().taskDone[taskId];
  }
  function setTaskDone(taskId, done) {
    load().taskDone[taskId] = !!done;
    save();
  }
  function toggleTask(taskId) {
    setTaskDone(taskId, !isTaskDone(taskId));
  }

  // ---------- Exit criteria ----------
  function isExitDone(id) {
    return !!load().exitDone[id];
  }
  function setExitDone(id, done) {
    load().exitDone[id] = !!done;
    save();
  }
  function toggleExit(id) {
    setExitDone(id, !isExitDone(id));
  }

  // ---------- Project tasks ----------
  function isProjectTaskDone(id) {
    return !!load().projectTaskDone[id];
  }
  function setProjectTaskDone(id, done) {
    load().projectTaskDone[id] = !!done;
    save();
  }
  function toggleProjectTask(id) {
    setProjectTaskDone(id, !isProjectTaskDone(id));
  }
  function getProjectMeta(projectId) {
    const s = load();
    return s.projectMeta[projectId] || { githubLink: "", demoLink: "", deployment: "not-deployed" };
  }
  function setProjectMeta(projectId, patch) {
    const s = load();
    s.projectMeta[projectId] = { ...getProjectMeta(projectId), ...patch };
    save();
  }

  // ---------- Blockers ----------
  function getBlockers() {
    return load().blockers;
  }
  function getOpenBlockers() {
    return getBlockers().filter((b) => b.status === "open");
  }
  function getBlockerForTask(taskId) {
    return getBlockers().find((b) => b.taskId === taskId && b.status === "open") || null;
  }
  function addBlocker(data) {
    const s = load();
    const b = {
      id: "blk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      taskId: data.taskId || null,
      weekId: data.weekId || null,
      topic: data.topic || "",
      problem: data.problem || "",
      tried: data.tried || "",
      nextAction: data.nextAction || "",
      status: "open",
      createdAt: Date.now(),
      resolvedAt: null,
    };
    s.blockers.unshift(b);
    save();
    return b;
  }
  function updateBlocker(id, patch) {
    const s = load();
    const b = s.blockers.find((x) => x.id === id);
    if (b) Object.assign(b, patch);
    save();
  }
  function resolveBlocker(id) {
    updateBlocker(id, { status: "resolved", resolvedAt: Date.now() });
  }
  function reopenBlocker(id) {
    updateBlocker(id, { status: "open", resolvedAt: null });
  }
  function deleteBlocker(id) {
    const s = load();
    s.blockers = s.blockers.filter((x) => x.id !== id);
    save();
  }

  // ---------- Skills ----------
  function getSkillState(skillId) {
    const s = load();
    return (
      s.skills[skillId] || {
        status: "not-started",
        confidence: 0,
        review: { learned: false, practiced: false, built: false, reviewed: false, confident: false },
      }
    );
  }
  function setSkillState(skillId, patch) {
    const s = load();
    const current = getSkillState(skillId);
    s.skills[skillId] = {
      ...current,
      ...patch,
      review: { ...current.review, ...(patch.review || {}) },
    };
    save();
  }

  // ---------- Journal ----------
  function getJournal() {
    return load().journal;
  }
  function addJournalEntry(entry) {
    const s = load();
    const e = {
      id: "jr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      date: entry.date || new Date().toISOString().slice(0, 10),
      week: entry.week || null,
      topic: entry.topic || "",
      learned: entry.learned || "",
      practiced: entry.practiced || "",
      built: entry.built || "",
      problem: entry.problem || "",
      tried: entry.tried || "",
      timeSpent: entry.timeSpent || "",
      status: entry.status || "in-progress",
      nextAction: entry.nextAction || "",
      createdAt: Date.now(),
    };
    s.journal.unshift(e);
    save();
    return e;
  }
  function updateJournalEntry(id, patch) {
    const s = load();
    const e = s.journal.find((x) => x.id === id);
    if (e) Object.assign(e, patch);
    save();
  }
  function deleteJournalEntry(id) {
    const s = load();
    s.journal = s.journal.filter((x) => x.id !== id);
    save();
  }

  // ---------- Assessments ----------
  function getAssessmentResult(assessmentId) {
    const s = load();
    return s.assessments[assessmentId] || { score: null, passed: false, history: [] };
  }
  function recordAssessmentScore(assessmentId, score, passed) {
    const s = load();
    const current = getAssessmentResult(assessmentId);
    const history = [...current.history, { score, date: Date.now() }];
    s.assessments[assessmentId] = { score, passed, history };
    save();
  }

  // ---------- Weekly reviews ----------
  function getWeeklyReview(weekId) {
    return load().weeklyReviews[weekId] || null;
  }
  function saveWeeklyReview(weekId, data) {
    const s = load();
    s.weeklyReviews[weekId] = { ...data, savedAt: Date.now() };
    save();
  }

  // ---------- Notes ----------
  function getNote(weekId) {
    return load().notes[weekId] || "";
  }
  function setNote(weekId, text) {
    const s = load();
    s.notes[weekId] = text;
    save();
  }

  // ---------- Study time (display-only; never drives progress %) ----------
  function getStudyTime(weekId) {
    return load().studyTime[weekId] || 0;
  }
  function addStudyTime(weekId, minutes) {
    const s = load();
    s.studyTime[weekId] = (s.studyTime[weekId] || 0) + Number(minutes || 0);
    save();
  }
  function getTotalStudyTime() {
    const s = load();
    return Object.values(s.studyTime).reduce((a, b) => a + b, 0);
  }

  // ---------- Settings ----------
  function getSettings() {
    return load().settings;
  }
  function setSettings(patch) {
    const s = load();
    s.settings = { ...s.settings, ...patch };
    save();
  }

  // ---------- Export / Import / Reset ----------
  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }
  function importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null) throw new Error("Invalid backup file.");
    state = deepMerge(defaultState(), parsed);
    save();
  }
  function resetAll() {
    state = defaultState();
    save();
  }

  return {
    load, get, save, hydrate,
    isTaskDone, setTaskDone, toggleTask,
    isExitDone, setExitDone, toggleExit,
    isProjectTaskDone, setProjectTaskDone, toggleProjectTask,
    getProjectMeta, setProjectMeta,
    getBlockers, getOpenBlockers, getBlockerForTask, addBlocker, updateBlocker, resolveBlocker, reopenBlocker, deleteBlocker,
    getSkillState, setSkillState,
    getJournal, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    getAssessmentResult, recordAssessmentScore,
    getWeeklyReview, saveWeeklyReview,
    getNote, setNote,
    getStudyTime, addStudyTime, getTotalStudyTime,
    getSettings, setSettings,
    exportJSON, importJSON, resetAll,
  };
})();
