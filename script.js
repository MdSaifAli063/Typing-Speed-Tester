(() => {
  "use strict";

  // DOM references
  const els = {
    displayText: document.getElementById("display-text"),
    textInput: document.getElementById("text-input"),
    startBtn: document.getElementById("start-button"),
    resetBtn: document.getElementById("reset-button"),
    pauseResumeBtn: document.getElementById("pause-resume-button"),
    newTextBtn: document.getElementById("new-text-button"),
    clearHistoryBtn: document.getElementById("clear-history-button"),

    timer: document.getElementById("timer"),
    wpm: document.getElementById("wpm"),
    accuracy: document.getElementById("accuracy"),
    errors: document.getElementById("errors"),
    cpm: document.getElementById("cpm"),
    bestWpm: document.getElementById("best-wpm"),

    durationSelect: document.getElementById("duration-select"),
    sourceSelect: document.getElementById("source-select"),
    difficultySelect: document.getElementById("difficulty-select"),

    progress: document.getElementById("time-progress"),
    message: document.getElementById("message-box"),

    historyList: document.getElementById("history-list"),
  };

  // Sample texts categorized
  const TEXT_BANK = {
    quotes: [
      "Simplicity is the soul of efficiency.",
      "Programs must be written for people to read, and only incidentally for machines to execute.",
      "Premature optimization is the root of all evil.",
      "First, solve the problem. Then, write the code.",
      "Talk is cheap. Show me the code.",
      "The only way to go fast, is to go well.",
    ],
    pangrams: [
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "Jackdaws love my big sphinx of quartz.",
      "Sympathizing would fix Quaker objectives.",
      "Amazingly few discotheques provide jukeboxes.",
    ],
    code: [
      "for (let i = 0; i < 10; i++) { console.log(i); }",
      "const sum = (a, b) => a + b; // pure function",
      "if (user && user.isAdmin) { grantAccess(); } else { deny(); }",
      "try { doWork(); } catch (e) { handle(e); } finally { cleanup(); }",
      "function fib(n){return n<2?n:fib(n-1)+fib(n-2)}",
    ],
    lorem: [
      "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.",
      "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
    ],
  };

  // State
  const state = {
    status: "idle", // idle | running | paused | finished
    durationSec: 30,
    startTimeMs: 0,
    elapsedMs: 0,
    timerId: null,

    targetText: "",
    targetChars: [],
    index: 0,

    typedChars: 0,
    correctChars: 0,
    errors: 0,

    difficulty: "normal", // normal | hard (no backspace)
  };

  // LocalStorage keys
  const LS_KEYS = {
    BEST_WPM: "typing-best-wpm",
    HISTORY: "typing-history",
  };

  // Utils
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  const now = () => performance.now();

  function chooseRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setMessage(text) {
    els.message.textContent = text;
  }

  function setProgress(percent) {
    els.progress.style.width = `${clamp(percent, 0, 100)}%`;
  }

  function resetStatsDisplay() {
    els.timer.textContent = fmtTime(0);
    els.wpm.textContent = "0";
    els.accuracy.textContent = "100%";
    els.errors.textContent = "0";
    els.cpm.textContent = "0";
  }

  function loadBestWPM() {
    const best = parseFloat(localStorage.getItem(LS_KEYS.BEST_WPM) || "0");
    els.bestWpm.textContent = isFinite(best) ? String(Math.round(best)) : "0";
  }

  function saveBestWPM(wpm) {
    const best = parseFloat(localStorage.getItem(LS_KEYS.BEST_WPM) || "0");
    if (!isFinite(best) || wpm > best) {
      localStorage.setItem(LS_KEYS.BEST_WPM, String(wpm));
      els.bestWpm.textContent = String(Math.round(wpm));
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(LS_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(list.slice(0, 15)));
  }

  function pushHistory(entry) {
    const list = loadHistory();
    list.unshift(entry);
    saveHistory(list);
    renderHistory();
  }

  function renderHistory() {
    const list = loadHistory();
    els.historyList.innerHTML = "";
    if (list.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No results yet. Finish a test to see your history.";
      els.historyList.appendChild(li);
      return;
    }
    list.forEach((item) => {
      const li = document.createElement("li");
      const summary = document.createElement("div");
      summary.innerHTML = `
        <span class="highlight">${Math.round(item.wpm)} WPM</span>
        • Acc <span class="${item.accuracy >= 95 ? "good" : item.accuracy < 80 ? "bad" : ""}">${item.accuracy}%</span>
        • ${item.duration}s • ${item.source} • ${item.difficulty}
      `;
      const cpm = document.createElement("div");
      cpm.className = "meta";
      cpm.textContent = `${item.cpm} cpm`;
      const errors = document.createElement("div");
      errors.className = "meta";
      errors.textContent = `${item.errors} errors`;
      const when = document.createElement("div");
      when.className = "meta";
      when.textContent = new Date(item.timestamp).toLocaleString();

      li.appendChild(summary);
      li.appendChild(cpm);
      li.appendChild(errors);
      li.appendChild(when);
      els.historyList.appendChild(li);
    });
  }

  // Text rendering and highlighting
  function renderTargetText(text) {
    els.displayText.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      span.className = "char";
      if (text[i] === " ") span.classList.add("space");
      span.textContent = text[i];
      frag.appendChild(span);
    }
    els.displayText.appendChild(frag);
    updateCurrentCharHighlight(0);
  }

  function updateCurrentCharHighlight(idx) {
    const nodes = els.displayText.children;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle("current", i === idx && state.status !== "finished");
    }
  }

  function loadNewText() {
    const source = els.sourceSelect.value;
    const candidates = TEXT_BANK[source] || TEXT_BANK.quotes;
    const chosen = chooseRandom(candidates).trim();
    state.targetText = chosen;
    state.targetChars = Array.from(chosen);
    state.index = 0;
    renderTargetText(chosen);
  }

  function loadSettingsFromDOM() {
    state.durationSec = parseInt(els.durationSelect.value, 10) || 30;
    state.difficulty = els.difficultySelect.value;
  }

  function updateStats() {
    const elapsedSec = state.elapsedMs / 1000;
    const minutes = Math.max(elapsedSec / 60, 1e-9); // avoid division by zero
    const wpm = (state.correctChars / 5) / minutes;
    const cpm = (state.correctChars) / minutes;
    const accuracy = state.typedChars > 0 ? (state.correctChars / state.typedChars) * 100 : 100;

    els.wpm.textContent = String(Math.round(wpm));
    els.cpm.textContent = String(Math.round(cpm));
    els.accuracy.textContent = `${Math.max(0, Math.min(100, Math.round(accuracy)))}%`;
    els.errors.textContent = String(state.errors);
    els.timer.textContent = fmtTime(Math.floor(elapsedSec));
  }

  function finishTest() {
    state.status = "finished";
    clearInterval(state.timerId);
    state.timerId = null;
    els.textInput.disabled = true;
    els.startBtn.disabled = false;
    els.pauseResumeBtn.disabled = true;
    els.pauseResumeBtn.textContent = "Pause";
    updateCurrentCharHighlight(-1);
    setProgress(100);

    const elapsedSec = Math.max(state.elapsedMs / 1000, 1e-6);
    const minutes = elapsedSec / 60;
    const wpm = (state.correctChars / 5) / minutes;
    const cpm = state.correctChars / minutes;
    const accuracy = state.typedChars ? Math.round((state.correctChars / state.typedChars) * 100) : 100;

    setMessage(`Finished! WPM ${Math.round(wpm)}, Accuracy ${accuracy}%, Errors ${state.errors}, Elapsed ${Math.round(elapsedSec)}s.`);
    saveBestWPM(wpm);
    pushHistory({
      wpm: Math.round(wpm),
      cpm: Math.round(cpm),
      accuracy,
      errors: state.errors,
      duration: state.durationSec,
      source: els.sourceSelect.value,
      difficulty: state.difficulty,
      timestamp: Date.now(),
    });
  }

  function tick() {
    const elapsed = now() - state.startTimeMs;
    state.elapsedMs = elapsed;
    const remaining = Math.max(state.durationSec * 1000 - elapsed, 0);
    const percent = ((state.durationSec * 1000 - remaining) / (state.durationSec * 1000)) * 100;
    setProgress(percent);
    updateStats();
    if (remaining <= 0) {
      finishTest();
    }
  }

  function startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.startTimeMs = now() - state.elapsedMs; // supports resume
    state.timerId = setInterval(tick, 100);
  }

  function startTest() {
    if (state.status === "running") return;
    loadSettingsFromDOM();
    if (!state.targetText) {
      loadNewText();
    }

    // Reset counters if starting fresh
    if (state.status !== "paused") {
      state.index = 0;
      state.typedChars = 0;
      state.correctChars = 0;
      state.errors = 0;
      state.elapsedMs = 0;
      els.textInput.value = "";
      resetStatsDisplay();
      setProgress(0);
    }

    state.status = "running";
    els.textInput.disabled = false;
    els.textInput.focus();
    els.startBtn.disabled = true;
    els.pauseResumeBtn.disabled = false;
    setMessage("Typing...");

    startTimer();
    updateCurrentCharHighlight(state.index);
  }

  function pauseTest() {
    if (state.status !== "running") return;
    state.status = "paused";
    clearInterval(state.timerId);
    state.timerId = null;
    els.textInput.disabled = true;
    els.pauseResumeBtn.textContent = "Resume";
    setMessage("Paused. Press Resume or Space to continue.");
  }

  function resumeTest() {
    if (state.status !== "paused") return;
    state.status = "running";
    els.textInput.disabled = false;
    els.textInput.focus();
    els.pauseResumeBtn.textContent = "Pause";
    setMessage("Typing...");
    startTimer();
  }

  function resetTest() {
    clearInterval(state.timerId);
    state.timerId = null;
    state.status = "idle";
    state.index = 0;
    state.typedChars = 0;
    state.correctChars = 0;
    state.errors = 0;
    state.elapsedMs = 0;
    setProgress(0);
    els.textInput.value = "";
    els.textInput.disabled = true;
    els.startBtn.disabled = false;
    els.pauseResumeBtn.disabled = true;
    els.pauseResumeBtn.textContent = "Pause";
    updateCurrentCharHighlight(-1);
    loadNewText();
    resetStatsDisplay();
    setMessage("Ready. Choose duration and source, then press Start or hit Enter to begin.");
    updateStats();
  }

  // Input handling
  function handleInput(e) {
    if (state.status !== "running") {
      // If user starts typing while idle/paused, start test
      return;
    }

    const value = els.textInput.value;
    const lastChar = value[value.length - 1];

    // Count typed chars only when a new keystroke increases length
    state.typedChars = value.length;

    // Hard mode: disallow backspace edits
    if (state.difficulty === "hard" && e.inputType === "deleteContentBackward") {
      // Revert deletion
      els.textInput.value = state.targetText.slice(0, state.index);
      return;
    }

    // Sync index to typed length but bounded by target length
    const newIndex = Math.min(value.length, state.targetChars.length);

    // Update correctness highlights from old index to newIndex
    const nodes = els.displayText.children;
    const start = Math.min(state.index, newIndex);
    const end = Math.max(state.index, newIndex);

    // Recompute correctness for the changed range
    for (let i = start; i < end; i++) {
      const expected = state.targetChars[i];
      const typed = value[i];
      const isCorrect = typed === expected;
      nodes[i].classList.toggle("correct", isCorrect);
      nodes[i].classList.toggle("incorrect", !isCorrect && typeof typed !== "undefined");
      if (typeof typed === "undefined") {
        nodes[i].classList.remove("correct", "incorrect");
      }
    }

    // Count correct chars and errors
    let correct = 0;
    let errors = 0;
    for (let i = 0; i < newIndex; i++) {
      const expected = state.targetChars[i];
      const typed = value[i];
      if (typed === expected) correct++;
      else errors++;
    }
    state.correctChars = correct;
    state.errors = errors;

    state.index = newIndex;
    updateCurrentCharHighlight(state.index);

    // Autocomplete finalization when fully typed
    if (state.index >= state.targetChars.length) {
      finishTest();
    }

    updateStats();
  }

  // Keyboard shortcuts at the document level
  function handleGlobalKeydown(e) {
    const isTyping = document.activeElement === els.textInput;

    if (e.key === "Enter" && (state.status === "idle" || state.status === "finished")) {
      e.preventDefault();
      startTest();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      resetTest();
      return;
    }

    // Only toggle pause/resume with Space when NOT typing in the textarea
    if (e.code === "Space" && !isTyping) {
      e.preventDefault();
      if (state.status === "running") {
        pauseTest();
      } else if (state.status === "paused") {
        resumeTest();
      }
    }
  }

  // Event bindings
  function bindEvents() {
    els.startBtn.addEventListener("click", startTest);
    els.resetBtn.addEventListener("click", resetTest);
    els.pauseResumeBtn.addEventListener("click", () => {
      if (state.status === "running") pauseTest();
      else if (state.status === "paused") resumeTest();
    });
    els.newTextBtn.addEventListener("click", () => {
      if (state.status === "running") pauseTest();
      loadNewText();
      setMessage("Loaded a new text. Press Start to begin.");
    });
    els.clearHistoryBtn.addEventListener("click", () => {
      localStorage.removeItem(LS_KEYS.HISTORY);
      renderHistory();
    });

    els.textInput.addEventListener("input", handleInput);

    // When changing settings during idle
    els.durationSelect.addEventListener("change", () => {
      loadSettingsFromDOM();
      setMessage(`Duration set to ${state.durationSec}s.`);
    });
    els.sourceSelect.addEventListener("change", () => {
      if (state.status === "running") pauseTest();
      loadNewText();
      setMessage(`Source set to ${els.sourceSelect.value}. Press Start.`);
    });
    els.difficultySelect.addEventListener("change", () => {
      loadSettingsFromDOM();
      setMessage(`Difficulty: ${state.difficulty}.`);
    });

    document.addEventListener("keydown", handleGlobalKeydown);

    // Autofocus input on click anywhere in typing area
    document.querySelector(".typing-area")?.addEventListener("click", () => {
      if (state.status === "running") els.textInput.focus();
    });
  }

  // Initialize
  function init() {
    loadSettingsFromDOM();
    loadBestWPM();
    renderHistory();
    loadNewText();
    resetStatsDisplay();
    setProgress(0);
    setMessage("Ready. Choose duration and source, then press Start or hit Enter to begin.");
  }

  bindEvents();
  init();
})();