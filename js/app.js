/* =============================================================
   app.js — To-do List Life Dashboard
   All widgets live in this single file, one section per widget.
   ============================================================= */

/* -----------------------------------------------------------
   localStorage availability guard
   Requirements: 2.8, 3.4, 9.4
   ----------------------------------------------------------- */
let storageAvailable = false;
function checkStorage() {
  // Use a temporary unique key so the probe does not overwrite existing data.
  const testKey = '__dashboard_storage_test__' + Date.now() + '_' + Math.random().toString(36).slice(2);
  try {
    localStorage.setItem(testKey, '1');
    storageAvailable = localStorage.getItem(testKey) === '1';
  } catch (_e) {
    storageAvailable = false;
  } finally {
    // Also clean up when the write succeeded but the read failed.
    try {
      localStorage.removeItem(testKey);
    } catch (_e) {
      storageAvailable = false;
    }
  }
}
checkStorage();

/* =============================================================
   3. Theme Module
   Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   ============================================================= */
const Theme = {
  STORAGE_KEY: 'dashboard_theme', // 'light' | 'dark'
  current: 'light',

  /**
   * Entry point. Apply saved theme immediately (before first paint)
   * to prevent a flash of the wrong colour scheme, then bind the
   * toggle button.
   */
  init() {
    // Apply saved/detected theme before anything else renders.
    this.apply(this._getSaved(), false);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * Return the persisted preference, falling back to
   * prefers-color-scheme, then 'light'.
   * @returns {'light'|'dark'}
   */
  _getSaved() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (_e) {
      // localStorage unavailable — fall through to system preference
    }

    // System preference fallback
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  },

  /**
   * Apply `theme` to <body> and update the toggle button label/icon.
   * Also persists the choice to localStorage.
   * @param {'light'|'dark'} theme
   */
  apply(theme, persist = true) {
    this.current = theme;
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add('theme-' + theme);

    // Swap body classes
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-' + theme);

    // Show the active theme; the accessible label explains the next action.
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon) icon.textContent = '🌙';
        if (label) label.textContent = 'Theme: Dark';
        btn.setAttribute('aria-label', 'Dark theme active. Switch to light theme');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon) icon.textContent = '☀️';
        if (label) label.textContent = 'Theme: Light';
        btn.setAttribute('aria-label', 'Light theme active. Switch to dark theme');
        btn.setAttribute('aria-pressed', 'false');
      }
    }

    if (persist) {
      if (!storageAvailable) checkStorage();
      let saved = false;
      if (storageAvailable) {
        try {
          localStorage.setItem(this.STORAGE_KEY, theme);
          saved = true;
        } catch (_e) { /* Keep the chosen theme for this session. */ }
      }
      const error = document.getElementById('theme-error');
      if (error) error.textContent = saved ? '' : 'Theme changed for this session, but could not be saved.';
    }
  },

  /**
   * Flip the current theme and persist.
   */
  toggle() {
    this.apply(this.current === 'light' ? 'dark' : 'light');
  },
};

/* =============================================================
   4. Greeting Module
   Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
   ============================================================= */
const Greeting = {
  STORAGE_KEY: 'dashboard_username',
  NAME_MAX_LEN: 50,

  _name: 'Friend',
  _lastRenderedMinute: -1, // tracks the last minute rendered to avoid redundant updates

  /**
   * Entry point: loads saved name, does initial render, binds controls,
   * and starts the per-second tick interval.
   */
  init() {
    this._name = this._loadName();
    this._renderClock();
    this._renderDate();
    this._renderGreeting();
    this._bindNameEdit();

    // Tick every second so we catch the exact minute boundary.
    setInterval(() => this._tick(), 1000);
  },

  /**
   * Called every second. Always refreshes the clock display; only
   * re-renders the greeting when the minute actually changes.
   * Requirements: 1.1
   */
  _tick() {
    const now = new Date();
    const minute = now.getMinutes();

    this._renderClock();

    if (minute !== this._lastRenderedMinute) {
      this._lastRenderedMinute = minute;
      this._renderDate();
      this._renderGreeting();
    }
  },

  /**
   * Writes the current local time as "HH:MM" to the clock element.
   * Falls back to "--:--" if the Date object is invalid.
   * Requirements: 1.1, 1.3
   */
  _renderClock() {
    const el = document.getElementById('greeting-clock');
    if (!el) return;

    try {
      const now = new Date();
      if (isNaN(now.getTime())) throw new Error('Invalid date');

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `${hh}:${mm}`;
    } catch (_e) {
      el.textContent = '--:--';
    }
  },

  /**
   * Writes the current date as "Weekday, D Month YYYY" to the date element.
   * Falls back to "-- --, ----" on error.
   * Requirements: 1.2, 1.3
   */
  _renderDate() {
    const el = document.getElementById('greeting-date');
    if (!el) return;

    try {
      const now = new Date();
      if (isNaN(now.getTime())) throw new Error('Invalid date');

      const formatted = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      // toLocaleDateString gives "Sunday, 19 October 2026" in en-GB — matches the spec exactly.
      el.textContent = formatted;
    } catch (_e) {
      el.textContent = '-- --, ----';
    }
  },

  /**
   * Reads the current hour, picks the greeting phrase, and writes the
   * full greeting (with name in <strong>) to the DOM.
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  _renderGreeting() {
    const el = document.getElementById('greeting-text');
    if (!el) return;

    try {
      const hour = new Date().getHours();
      const phrase = this._getGreetingPhrase(hour);

      // Build:  "Good Morning, <strong>Name</strong>!"
      // The <strong> provides bold + the CSS class provides the larger font size.
      el.textContent = `${phrase}, `;

      const strong = document.createElement('strong');
      strong.id = 'greeting-name';
      strong.className = 'greeting-name-bold';
      strong.textContent = this._name;
      el.appendChild(strong);

      const suffix = document.createTextNode('!');
      el.appendChild(suffix);
    } catch (_e) {
      // Silently leave the last rendered value intact.
    }
  },

  /**
   * Returns the greeting phrase for a given 24-hour value.
   * Requirements: 2.1, 2.2, 2.3
   * @param {number} hour  Integer 0–23
   * @returns {'Good Morning'|'Good Afternoon'|'Good Evening'}
   */
  _getGreetingPhrase(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening'; // covers 18–23 and 0–4
  },

  /**
   * Reads the username from localStorage.
   * Returns 'Friend' on any error or if no name is stored.
   * Requirements: 2.7, 2.8
   * @returns {string}
   */
  _loadName() {
    if (!storageAvailable) return 'Friend';
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        return stored;
      }
    } catch (_e) {
      // Fall through to default
    }
    return 'Friend';
  },

  /**
   * Validates and persists the given name to localStorage.
   * Requirements: 2.5, 2.6, 2.8
   * @param {string} name
   * @returns {boolean} true on success, false on validation or storage failure
   */
  _saveName(name) {
    if (name.length === 0 || name.length > this.NAME_MAX_LEN) {
      return false;
    }

    // Preserve the requested name in memory even if persistence fails.
    this._name = name;
    if (!storageAvailable) checkStorage();
    if (!storageAvailable) return false;
    try {
      localStorage.setItem(this.STORAGE_KEY, name);
      return true;
    } catch (_e) {
      return false;
    }
  },

  /**
   * Shows an inline error message below the name input.
   * @param {string} msg
   */
  _showNameError(msg) {
    const el = document.getElementById('greeting-name-error');
    if (el) el.textContent = msg;
  },

  /**
   * Clears the inline error message.
   */
  _clearNameError() {
    const el = document.getElementById('greeting-name-error');
    if (el) el.textContent = '';
  },

  /**
   * Wires up the "Edit Name" button, inline input, Save, and Cancel controls.
   * Requirements: 2.5, 2.6
   */
  _bindNameEdit() {
    const editBtn   = document.getElementById('greeting-edit-btn');
    const input     = document.getElementById('greeting-name-input');
    const saveBtn   = document.getElementById('greeting-save-btn');
    const cancelBtn = document.getElementById('greeting-cancel-btn');

    if (!editBtn || !input || !saveBtn || !cancelBtn) return;

    // Show the edit controls when the user clicks "Edit Name"
    editBtn.addEventListener('click', () => {
      input.value = this._name === 'Friend' ? '' : this._name;
      input.hidden = false;
      saveBtn.hidden = false;
      cancelBtn.hidden = false;
      editBtn.hidden = true;
      this._clearNameError();
      input.focus();
    });

    // Clear error on every keystroke so feedback is responsive
    input.addEventListener('input', () => {
      if (input.value.length <= this.NAME_MAX_LEN) {
        this._clearNameError();
      }
    });

    // Save on button click
    saveBtn.addEventListener('click', () => this._handleSave(input));

    // Save on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSave(input);
      if (e.key === 'Escape') this._handleCancel();
    });

    // Cancel
    cancelBtn.addEventListener('click', () => this._handleCancel());
  },

  /**
   * Shared save logic: validates, persists, re-renders, and hides edit controls.
   * @param {HTMLInputElement} input
   */
  _handleSave(input) {
    const trimmed = input.value.trim();

    // Reject empty (use 'Friend' as implicit default instead of erroring)
    if (trimmed.length === 0) {
      this._name = 'Friend';
      this._hideEditControls();
      this._renderGreeting();
      return;
    }

    // Reject > 50 characters
    if (trimmed.length > this.NAME_MAX_LEN) {
      this._showNameError('Name must be 50 characters or fewer.');
      input.focus();
      return;
    }

    const saved = this._saveName(trimmed);
    this._hideEditControls();
    this._renderGreeting();
    if (saved) this._clearNameError();
    else this._showNameError('Name updated for this session, but could not be saved. Try saving again before refreshing.');
  },

  /**
   * Cancels editing without saving changes.
   */
  _handleCancel() {
    this._clearNameError();
    this._hideEditControls();
  },

  /**
   * Restores the UI to its non-editing state.
   */
  _hideEditControls() {
    const editBtn   = document.getElementById('greeting-edit-btn');
    const input     = document.getElementById('greeting-name-input');
    const saveBtn   = document.getElementById('greeting-save-btn');
    const cancelBtn = document.getElementById('greeting-cancel-btn');

    if (input)     input.hidden = true;
    if (saveBtn)   saveBtn.hidden = true;
    if (cancelBtn) cancelBtn.hidden = true;
    if (editBtn)   editBtn.hidden = false;
  },
};

/* =============================================================
   5. TodoList Module
   Requirements: 3.4, 4.1
   ============================================================= */
const TodoList = {
  STORAGE_KEY: 'dashboard_todos',
  MAX_TASKS: 100,
  MAX_CHARS: 200,

  tasks: [], // array of { id, text, done, createdAt }
  _storageError: false,

  /**
   * Entry point: loads persisted tasks into memory, renders the list,
   * binds the add form, and sets the initial button state.
   */
  init() {
    this.tasks = this._loadTasks();
    this._renderList();
    this._bindAddForm();
    this._updateAddButton();
  },

  /**
   * Generates a unique ID using crypto.randomUUID() when available,
   * falling back to a Date.now + Math.random combination for older Safari.
   * @returns {string}
   */
  _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).slice(2);
  },

  /**
   * Reads and parses the tasks array from localStorage.
   * Returns [] on any error (missing key, invalid JSON, storage unavailable).
   * Requirements: 3.4
   * @returns {Array}
   */
  _loadTasks() {
    if (!storageAvailable) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      // Guard: must be an array
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (_e) {
      return [];
    }
  },

  /**
   * Serialises the current tasks array to localStorage.
   * Keeps pending changes in memory and reports storage failures with a retry.
   * Requirements: 3.4
   */
  _saveTasks() {
    this._storageError = true;
    if (storageAvailable) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
        this._storageError = false;
      } catch (_e) { /* Keep changes in memory and offer an explicit retry. */ }
    }
    this._renderStorageNotice();
    return !this._storageError;
  },

  _renderStorageNotice() {
    const error = document.getElementById('todo-storage-error');
    const retry = document.getElementById('todo-retry-save');
    if (error) error.textContent = this._storageError
      ? 'Changes are only kept for this session. Saving failed; retry before refreshing.' : '';
    if (retry) retry.hidden = !this._storageError;
  },

  retrySave() {
    checkStorage();
    return this._saveTasks();
  },

  /**
   * Adds a new task from user-supplied text.
   * Requirements: 3.1, 3.2, 3.3, 3.5
   * @param {string} text
   * @returns {boolean} true on success, false when rejected
   */
  addTask(text) {
    const trimmed = (text || '').trim();

    // Reject empty / whitespace-only input
    if (trimmed.length === 0) {
      this._showAddError('Task name cannot be empty.');
      const input = document.getElementById('todo-input');
      if (input) input.focus();
      return false;
    }

    if (trimmed.length > this.MAX_CHARS) {
      this._showAddError(`Task text must be ${this.MAX_CHARS} characters or fewer.`);
      const input = document.getElementById('todo-input');
      if (input) input.focus();
      return false;
    }

    // Reject if at capacity
    if (this.tasks.length >= this.MAX_TASKS) {
      this._showAddError('Maximum task limit reached.');
      this._updateAddButton();
      return false;
    }

    // Create, persist, and render
    const task = {
      id: this._generateId(),
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    };
    this.tasks.push(task);
    this._saveTasks();
    this._renderList();
    this._clearAddError();

    // Clear the input field
    const input = document.getElementById('todo-input');
    if (input) input.value = '';

    return true;
  },

  /**
   * Builds and returns a <li> element representing a single task.
   * Requirements: 3.2, 4.1
   * @param {{ id: string, text: string, done: boolean, createdAt: number }} task
   * @param {number} index
   * @returns {HTMLLIElement}
   */
  _renderTask(task, index) {
    const li = document.createElement('li');
    li.dataset.taskId = task.id;
    if (task.done) li.classList.add('todo-task-done');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute(
      'aria-label',
      task.done ? 'Mark task incomplete' : 'Mark task complete'
    );
    checkbox.addEventListener('change', () => this.toggleComplete(task.id));

    // Text span
    const span = document.createElement('span');
    span.className = 'todo-task-text';
    span.textContent = task.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'todo-edit-btn';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => this.startEdit(task.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete-btn';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

    // The label provides a 44px touch target around the native checkbox.
    const checkboxTarget = document.createElement('label');
    checkboxTarget.className = 'todo-checkbox-target';
    checkboxTarget.appendChild(checkbox);

    li.appendChild(checkboxTarget);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Clears and rebuilds the task <ul> from the current tasks array.
   * Shows an empty-state message when there are no tasks.
   * Requirements: 3.2, 4.1
   */
  _renderList() {
    const ul = document.getElementById('todo-list');
    if (!ul) return;

    ul.innerHTML = '';

    if (this.tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-empty-msg';
      empty.textContent = 'No tasks yet. Add one above!';
      ul.appendChild(empty);
      this._updateAddButton();
      return;
    }

    this.tasks.forEach((task, index) => {
      ul.appendChild(this._renderTask(task, index));
    });

    this._updateAddButton();
  },

  /**
   * Shows an error message in the add-form error slot.
   * @param {string} msg
   */
  _showAddError(msg) {
    const el = document.getElementById('todo-add-error');
    if (el) el.textContent = msg;
  },

  /**
   * Clears the add-form error message.
   */
  _clearAddError() {
    const el = document.getElementById('todo-add-error');
    if (el) el.textContent = this.tasks.length >= this.MAX_TASKS ? 'Maximum task limit reached.' : '';
  },

  /**
   * Enables or disables the Add button based on the current task count.
   */
  _updateAddButton() {
    const btn = document.getElementById('todo-add-btn');
    if (!btn) return;
    const full = this.tasks.length >= this.MAX_TASKS;
    btn.disabled = full;
    const error = document.getElementById('todo-add-error');
    if (full) this._showAddError('Maximum task limit reached.');
    else if (error && error.textContent === 'Maximum task limit reached.') error.textContent = '';
  },

  /**
   * Flips the `done` state of the task with the given id, then saves and re-renders.
   * Requirements: 4.1
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      this._saveTasks();
      this._renderList();
    }
  },

  /**
   * Removes the task with the given id from the array, then saves and re-renders.
   * No confirmation prompt — deletion is immediate.
   * Requirements: 4.5
   * @param {string} id
   */
  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this._saveTasks();
      this._renderList();
    }
  },

  /**
   * Switches a task's display into inline-edit mode.
   * Replaces the text span and Edit button with an input, Save, and Cancel.
   * Requirements: 4.2
   * @param {string} id
   */
  startEdit(id) {
    const ul = document.getElementById('todo-list');
    if (!ul) return;

    const li = ul.querySelector(`[data-task-id="${id}"]`);
    const task = this.tasks.find((t) => t.id === id);
    if (!li || !task) return;

    const span = li.querySelector('.todo-task-text');
    const editBtn = li.querySelector('.todo-edit-btn');
    if (!span || !editBtn) return;

    // Build inline input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = task.text;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task text');

    // Error span
    const errorSpan = document.createElement('span');
    errorSpan.className = 'todo-edit-error';
    errorSpan.setAttribute('role', 'alert');
    errorSpan.textContent = '';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'todo-save-btn';
    saveBtn.textContent = '💾 Save';
    saveBtn.setAttribute('aria-label', 'Save task');

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'todo-cancel-btn';
    cancelBtn.textContent = '✕ Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    // Wire up events
    saveBtn.addEventListener('click', () => this.saveEdit(id, input.value));
    cancelBtn.addEventListener('click', () => this.cancelEdit(id));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveEdit(id, input.value);
      if (e.key === 'Escape') this.cancelEdit(id);
    });

    // Swap span → input + error span
    li.replaceChild(input, span);
    li.insertBefore(errorSpan, input.nextSibling);

    // Swap Edit button → Save + Cancel buttons
    li.replaceChild(saveBtn, editBtn);
    // Insert Cancel after Save (saveBtn may have moved, use its nextSibling)
    saveBtn.insertAdjacentElement('afterend', cancelBtn);

    input.focus();
  },

  /**
   * Validates newText and, on success, persists and re-renders.
   * Empty edits restore the original row; overlong edits keep input focus.
   * Requirements: 4.2, 4.3, 4.4
   * @param {string} id
   * @param {string} newText
   * @returns {boolean}
   */
  saveEdit(id, newText) {
    const trimmed = (newText || '').trim();

    // Helper: show error in the <li>'s edit-error span and refocus the input
    const showError = (msg) => {
      const ul = document.getElementById('todo-list');
      if (!ul) return;
      const li = ul.querySelector(`[data-task-id="${id}"]`);
      if (!li) return;
      const errSpan = li.querySelector('.todo-edit-error');
      if (errSpan) errSpan.textContent = msg;
      const input = li.querySelector('.todo-edit-input');
      if (input) input.focus();
    };

    if (trimmed.length === 0) {
      this._renderList();
      this._showAddError('Task text cannot be empty. Original text restored.');
      const ul = document.getElementById('todo-list');
      const li = ul && ul.querySelector(`[data-task-id="${id}"]`);
      const edit = li && li.querySelector('.todo-edit-btn');
      if (edit) edit.focus();
      return false;
    }

    if (trimmed.length > this.MAX_CHARS) {
      showError(`Task text must be ${this.MAX_CHARS} characters or fewer.`);
      return false;
    }

    const task = this.tasks.find((t) => t.id === id);
    if (!task) return false;

    task.text = trimmed;
    this._saveTasks();
    this._renderList();
    return true;
  },

  /**
   * Cancels an in-progress edit, restoring the original task text via re-render.
   * Requirements: 4.2
   * @param {string} id
   */
  cancelEdit(id) {
    this._renderList();
  },

  /**
   * Binds the Add button, Enter-key shortcut, and input-event error clearing.
   */
  _bindAddForm() {
    const btn   = document.getElementById('todo-add-btn');
    const input = document.getElementById('todo-input');
    if (!btn || !input) return;
    const retry = document.getElementById('todo-retry-save');
    if (retry) retry.addEventListener('click', () => this.retrySave());

    btn.addEventListener('click', () => {
      this.addTask(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask(input.value);
    });

    input.addEventListener('input', () => {
      this._clearAddError();
    });
  },
};

/* =============================================================
   6. FocusTimer Module
   Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5
   ============================================================= */
const FocusTimer = {
  // Session durations in seconds
  DURATIONS: { work: 1500, short: 300, long: 900 },

  state: {
    phase: 'work',         // 'work' | 'short' | 'long'
    remaining: 1500,       // seconds left in current phase
    running: false,
    completedPomodoros: 0, // 0–4 in current cycle
  },

  _intervalId: null,
  _endTime: null, // absolute finish time in milliseconds while running

  /**
   * Entry point — renders initial display and binds Start/Stop/Reset buttons.
   * Requirements: 6.1
   */
  init() {
    this._updateDisplay();
    this._updateButtons();

    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn  = document.getElementById('timer-stop-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (stopBtn)  stopBtn.addEventListener('click',  () => this.stop());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    Object.keys(this.DURATIONS).forEach((phase) => {
      const button = document.getElementById('timer-mode-' + phase);
      if (button) button.addEventListener('click', () => this.selectPhase(phase));
    });
  },

  /** Select a stopped timer's phase without counting an unfinished session. */
  selectPhase(phase) {
    if (this.state.running || !Object.hasOwn(this.DURATIONS, phase) || phase === this.state.phase) return false;
    this.state.phase = phase;
    this.reset();
    this._dismissNotification();
    return true;
  },

  /**
   * Starts the countdown interval and updates button states.
   * Requirements: 6.1
   */
  start() {
    // Guard: do nothing if already running
    if (this.state.running) return;

    this._endTime = Date.now() + this.state.remaining * 1000;
    this.state.running = true;
    this._intervalId = setInterval(this._tick.bind(this), 1000);
    this._updateDisplay();
    this._updateButtons();
  },

  /**
   * Stops the countdown interval and updates button states.
   * Does NOT increment completedPomodoros (Req 5.6).
   * Requirements: 6.2
   */
  stop() {
    // Guard: do nothing if not running
    if (!this.state.running) return;

    // Include elapsed time since the last callback before pausing.
    // A session whose deadline already passed finishes naturally in _tick().
    this._tick();
    if (!this.state.running) return;

    clearInterval(this._intervalId);
    this._intervalId = null;
    this._endTime = null;
    this.state.running = false;
    this._updateButtons();
  },

  /**
   * Stops the countdown, restores full phase duration, updates display.
   * Does NOT advance the phase.
   * Requirements: 6.3
   */
  reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.state.running = false;
    this._endTime = null;
    this.state.remaining = this.DURATIONS[this.state.phase];
    this._updateDisplay();
    this._updateButtons();
  },

  /**
   * Called every second: derives remaining time from the actual deadline,
   * so delayed browser callbacks do not make the countdown run slowly.
   * Requirements: 5.5, 6.1
   */
  _tick() {
    // Ignore a callback that was already queued when Stop or Reset was pressed.
    if (!this.state.running || this._endTime === null) return;

    // Round up for display: 24:59 remains visible until that second has elapsed.
    this.state.remaining = Math.max(0, Math.ceil((this._endTime - Date.now()) / 1000));

    if (this.state.remaining <= 0) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._onSessionEnd();
    } else {
      this._updateDisplay();
    }
  },

  /**
   * Called when remaining reaches 0: plays beep, shows notification,
   * advances phase, waits for user to press Start.
   * Requirements: 6.4, 6.5
   */
  _onSessionEnd() {
    // Stop the interval (already cleared in _tick, but guard here too)
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._endTime = null;
    this.state.running = false;

    // Determine message before advancing phase
    const endedPhase = this.state.phase;
    let msg;
    if (endedPhase === 'work') {
      msg = 'Work session complete! Time for a break.';
    } else {
      msg = 'Break over! Ready to focus?';
    }

    // Audio notification
    this._playBeep();

    // Advance to next phase (updates state.phase and state.remaining)
    this._advancePhase();

    // Visual notification
    this._showNotification(msg);

    // Refresh UI — timer is now stopped at the start of the new phase
    this._updateDisplay();
    this._updateButtons();
  },

  /**
   * Transitions phase: work → short (×3) → long → work.
   * Increments / resets completedPomodoros per cycle rules.
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  _advancePhase() {
    const s = this.state;

    if (s.phase === 'work') {
      // Req 5.6: only natural completion (not manual stop) calls _advancePhase,
      // so it's safe to increment here.
      s.completedPomodoros += 1;

      if (s.completedPomodoros < 4) {
        // Req 5.2: sessions 1, 2, 3 → short break
        s.phase = 'short';
      } else {
        // Req 5.3: session 4 → long break
        s.phase = 'long';
      }
    } else if (s.phase === 'short') {
      // Req 5.2: after short break → back to work (keep completedPomodoros)
      s.phase = 'work';
    } else {
      // s.phase === 'long'
      // Req 5.4: after long break → reset count, start new work session
      s.completedPomodoros = 0;
      s.phase = 'work';
    }

    // Set remaining to the full duration of the new phase
    s.remaining = this.DURATIONS[s.phase];
  },

  /**
   * Writes the current phase label and MM:SS time to the timer display element.
   * Requirements: 5.5
   */
  _updateDisplay() {
    const phaseEl   = document.getElementById('timer-phase');
    const displayEl = document.getElementById('timer-display');

    if (!phaseEl && !displayEl) return;

    const LABELS = { work: 'Work', short: 'Short Break', long: 'Long Break' };
    const label  = LABELS[this.state.phase] || 'Work';

    if (phaseEl)   phaseEl.textContent   = label;
    if (displayEl) displayEl.textContent = this._formatTime(this.state.remaining);
  },

  /**
   * Enables / disables Start, Stop, and Reset buttons based on running state.
   * Requirements: 6.1, 6.2, 6.3
   */
  _updateButtons() {
    const startBtn = document.getElementById('timer-start-btn');
    const stopBtn  = document.getElementById('timer-stop-btn');
    const resetBtn = document.getElementById('timer-reset-btn');

    if (!startBtn && !stopBtn && !resetBtn) return;

    const running = this.state.running;

    if (startBtn) startBtn.disabled = running;
    if (stopBtn)  stopBtn.disabled  = !running;
    if (resetBtn) resetBtn.disabled = false; // always enabled
    Object.keys(this.DURATIONS).forEach((phase) => {
      const button = document.getElementById('timer-mode-' + phase);
      if (!button) return;
      button.disabled = running;
      button.setAttribute('aria-pressed', String(phase === this.state.phase));
    });
    const hint = document.getElementById('timer-mode-hint');
    if (hint) hint.hidden = !running;
  },

  // Stored references for the active notification
  _notificationEl: null,
  _notificationTimeout: null,

  /**
   * Renders a dismissible on-screen alert inside #timer-notification.
   * Auto-dismisses after 10 s. Clears any existing notification first.
   * Requirements: 6.4
   * @param {string} msg
   */
  _showNotification(msg) {
    // Clear any existing notification before showing a new one
    this._dismissNotification();

    const container = document.getElementById('timer-notification');
    if (!container) return;

    // Build the notification content
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'timer-notification-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss notification');
    dismissBtn.textContent = '×';
    dismissBtn.addEventListener('click', () => this._dismissNotification());

    const msgSpan = document.createElement('span');
    msgSpan.textContent = msg;

    container.textContent = '';
    container.appendChild(msgSpan);
    container.appendChild(dismissBtn);
    container.removeAttribute('hidden');
    container.classList.add('timer-notification-visible');

    this._notificationEl = container;

    // Auto-dismiss after 10 seconds
    this._notificationTimeout = setTimeout(() => {
      this._dismissNotification();
    }, 10000);
  },

  /**
   * Removes the on-screen notification immediately and cancels auto-dismiss.
   * Requirements: 6.4
   */
  _dismissNotification() {
    if (this._notificationTimeout !== null) {
      clearTimeout(this._notificationTimeout);
      this._notificationTimeout = null;
    }

    if (this._notificationEl) {
      this._notificationEl.textContent = '';
      this._notificationEl.setAttribute('hidden', '');
      this._notificationEl.classList.remove('timer-notification-visible');
      this._notificationEl = null;
    }
  },

  /**
   * Creates an AudioContext oscillator beep (~300 ms at 440 Hz).
   * All errors are silently swallowed.
   * Requirements: 6.4
   */
  _playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 440;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // silent — audio is non-critical
    }
  },

  /**
   * Converts a total number of seconds into a zero-padded "MM:SS" string.
   * Requirements: 5.5
   * @param {number} seconds  Integer in range 0–5999
   * @returns {string}        e.g. 0 → "00:00", 65 → "01:05", 1500 → "25:00"
   */
  _formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },
};

/* =============================================================
   7. QuickLinks Module
   Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3
   ============================================================= */
const QuickLinks = {
  STORAGE_KEY: 'dashboard_links',
  LABEL_MAX_LEN: 50,

  links: [], // array of { id, label, url }

  /**
   * Entry point: loads persisted links, renders the panel, and binds the add form.
   */
  init() {
    this.links = this._loadLinks();
    this._renderLinks();
    this._bindAddForm();
  },

  /**
   * Returns true if and only if `url` starts with "http://" or "https://".
   * Everything else (empty string, ftp://, mailto:, relative paths, etc.)
   * returns false.
   * Requirements: 7.2, 7.7
   * @param {string} url
   * @returns {boolean}
   */
  _validateUrl(url) {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  },

  /**
   * Reads and parses the links array from localStorage.
   * Returns [] on any error (missing key, invalid JSON, storage unavailable).
   * Requirements: 7.5
   * @returns {Array<{id: string, label: string, url: string}>}
   */
  _loadLinks() {
    if (!storageAvailable) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      // Guard: must be an array
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (_e) {
      return [];
    }
  },

  /**
   * Serialises the current links array to localStorage.
   * THROWS on failure so callers can catch it and show an error (Req 8.3).
   * Requirements: 7.4
   */
  _saveLinks() {
    if (!storageAvailable) checkStorage();
    if (!storageAvailable) {
      throw new Error('localStorage is unavailable.');
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.links));
  },

  /**
   * Rebuilds the saved links with separate Open and Delete buttons.
   * User labels are textContent so markup is displayed as plain text.
   * Requirements: 7.2, 7.3, 7.5, 8.2
   */
  _renderLinks() {
    const panel = document.getElementById('links-panel');
    if (!panel) return;
    panel.textContent = '';

    if (this.links.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'links-empty-msg';
      empty.textContent = 'No links yet. Add a label and URL above.';
      panel.appendChild(empty);
      return;
    }

    this.links.forEach((link) => {
      const row = document.createElement('div');
      row.className = 'quick-link-row';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'quick-link-button';
      openBtn.textContent = link.label;
      openBtn.title = link.url;
      openBtn.setAttribute('aria-label', `Open ${link.label} in a new tab`);
      openBtn.addEventListener('click', () => this._openLink(link.url));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'quick-link-delete';
      deleteBtn.setAttribute('aria-label', `Delete ${link.label}`);
      deleteBtn.addEventListener('click', () => this.deleteLink(link.id));

      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6');
      icon.appendChild(path);

      const deleteLabel = document.createElement('span');
      deleteLabel.textContent = 'Delete';
      deleteBtn.appendChild(icon);
      deleteBtn.appendChild(deleteLabel);
      row.appendChild(openBtn);
      row.appendChild(deleteBtn);
      panel.appendChild(row);
    });
  },

  /**
   * Removes a confirmed link. If saving fails, restore its original position
   * and leave the displayed button in place.
   * Requirements: 7.4, 8.1, 8.2, 8.3
   */
  deleteLink(id) {
    const index = this.links.findIndex((link) => link.id === id);
    if (index === -1) return false;
    const link = this.links[index];
    if (!window.confirm(`Delete "${link.label}"?`)) return false;

    this.links.splice(index, 1);
    try {
      this._saveLinks();
    } catch (_e) {
      this.links.splice(index, 0, link);
      this._showAddError('Deletion failed. Please try again.');
      return false;
    }

    this._clearAddError();
    this._renderLinks();

    // Keep keyboard focus near the deleted link, or return to the add form.
    const panel = document.getElementById('links-panel');
    const deleteButtons = panel ? panel.querySelectorAll('.quick-link-delete') : [];
    const nextButton = deleteButtons[index] || deleteButtons[index - 1];
    const focusTarget = nextButton || document.getElementById('links-label-input');
    if (focusTarget) focusTarget.focus();
    return true;
  },

  /** Opens only permitted URL schemes, including when loading stored links. */
  _openLink(url) {
    if (!this._validateUrl(url)) return;
    window.open(url, '_blank', 'noopener');
  },

  /**
   * Generates a unique ID using crypto.randomUUID() when available,
   * falling back to a Date.now + Math.random combination for older Safari.
   * @returns {string}
   */
  _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).slice(2);
  },

  /**
   * Adds a new link after validating label and URL.
   *
   * Validation order (Requirements 7.6, 7.7):
   *   1. Empty / whitespace-only label OR url → silent reject (no error shown)
   *   2. URL does not start with http:// or https:// → show error, return
   *   3. Valid → push, save, render, clear form
   *
   * Requirements: 7.1, 7.2, 7.6, 7.7
   * @param {string} label
   * @param {string} url
   * @returns {boolean} true on success, false when rejected
   */
  addLink(label, url) {
    const trimmedLabel = (label || '').trim();
    const trimmedUrl   = (url   || '').trim();

    // Rule 1 — silently reject empty/whitespace-only fields (Req 7.6)
    if (trimmedLabel.length === 0 || trimmedUrl.length === 0) {
      return false;
    }

    // Rule 2 — reject invalid URL scheme (Req 7.7)
    if (!this._validateUrl(trimmedUrl)) {
      this._showAddError('Enter a website like example.com, or a URL starting with http:// or https://.');
      return false;
    }

    // Enforce the label limit here as well as in the HTML input.
    if (trimmedLabel.length > this.LABEL_MAX_LEN) {
      this._showAddError(`Label must be ${this.LABEL_MAX_LEN} characters or fewer.`);
      return false;
    }

    // Rule 3 — valid: build, push, persist, render
    const link = {
      id: this._generateId(),
      label: trimmedLabel,
      url: trimmedUrl,
    };

    this.links.push(link);

    try {
      this._saveLinks();
    } catch (_e) {
      // Save failed — roll back the push and show an error (design: error-handling table)
      this.links.pop();
      this._showAddError('Could not save the link. Please try again.');
      return false;
    }

    this._renderLinks();
    this._clearAddError();

    // Clear the form inputs after successful add
    const labelInput = document.getElementById('links-label-input');
    const urlInput   = document.getElementById('links-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    return true;
  },

  /** Complete a bare domain before handing it to the strict URL validator. */
  _normalizeInputUrl(raw) {
    const value = raw.trim();
    if (/^https?:\/\//i.test(value)) {
      return value.replace(/^https?:/i, (scheme) => scheme.toLowerCase());
    }
    if (!value || /[\\\s]/.test(value) || value.startsWith('//')) return value;
    try {
      const url = new URL('https://' + value);
      const domain = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
      if (url.username || url.password || !domain.test(url.hostname)) return value;
      return url.href;
    } catch (_e) {
      return value;
    }
  },

  /**
   * Wires the Add Link button (and Enter-key shortcut) to addLink().
   * Uses a click event on the button rather than a form submit because
   * the markup uses a plain <div> wrapper, not a <form> element.
   * Requirements: 7.1
   */
  _bindAddForm() {
    const addBtn     = document.getElementById('links-add-btn');
    const labelInput = document.getElementById('links-label-input');
    const urlInput   = document.getElementById('links-url-input');

    if (!addBtn || !labelInput || !urlInput) return;

    // Complete the address in the form; addLink still requires HTTP(S).
    const completeUrl = () => {
      urlInput.value = this._normalizeInputUrl(urlInput.value);
    };
    const submit = () => {
      completeUrl();
      this.addLink(labelInput.value, urlInput.value);
    };
    urlInput.addEventListener('blur', completeUrl);
    addBtn.addEventListener('click', submit);

    const onEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    labelInput.addEventListener('keydown', onEnter);
    urlInput.addEventListener('keydown', onEnter);

    // Clear error on any input change so feedback is responsive
    const onInput = () => this._clearAddError();
    labelInput.addEventListener('input', onInput);
    urlInput.addEventListener('input', onInput);
  },

  /**
   * Displays an inline error message inside the links add-form.
   * @param {string} msg
   */
  _showAddError(msg) {
    const el = document.getElementById('links-add-error');
    if (el) el.textContent = msg;
  },

  /**
   * Clears the inline error message.
   */
  _clearAddError() {
    const el = document.getElementById('links-add-error');
    if (el) el.textContent = '';
  },
};

/* =============================================================
   App — top-level coordinator
   Requirements: 9.4, 10.3
   ============================================================= */
const App = {
  _ready: false,
  _guarded: false,
  _activeAction: false,

  init() {
    if (this._ready) return;
    try {
      this._installGuards();
      Theme.init();
      Greeting.init();
      TodoList.init();
      FocusTimer.init();
      QuickLinks.init();

      this._ready = true;
      document.documentElement.dataset.appState = 'ready';
      const dashboard = document.getElementById('dashboard');
      if (dashboard) {
        dashboard.inert = false;
        dashboard.setAttribute('aria-busy', 'false');
      }
      const status = document.getElementById('app-status');
      if (status) status.hidden = true;
    } catch (_e) {
      document.documentElement.dataset.appState = 'error';
      const status = document.getElementById('app-status');
      if (status) {
        status.hidden = false;
        status.setAttribute('role', 'alert');
        status.textContent = 'The dashboard could not load. Refresh the page to try again.';
      }
    } finally {
      if (window.DashboardBoot) clearTimeout(window.DashboardBoot.timeoutId);
    }
  },

  /** Guard public UI actions, keeping each widget's data independent. */
  _installGuards() {
    if (this._guarded) return;
    this._guarded = true;
    const widgets = [
      [Theme, 'greeting-widget', ['toggle']],
      [Greeting, 'greeting-widget', ['_handleSave', '_handleCancel', '_tick']],
      [TodoList, 'todo-widget', ['addTask', 'toggleComplete', 'deleteTask', 'startEdit', 'saveEdit', 'cancelEdit', 'retrySave']],
      [FocusTimer, 'timer-widget', ['start', 'stop', 'reset', 'selectPhase', '_tick', '_dismissNotification']],
      [QuickLinks, 'links-widget', ['addLink', 'deleteLink', '_openLink']],
    ];
    widgets.forEach(([module, id, methods]) => {
      methods.forEach((method) => {
        const original = module[method];
        module[method] = (...args) => this.runAction(module, id, () => original.apply(module, args));
      });
    });
  },

  _capture(module) {
    let data;
    if (module === Theme) data = module.current;
    if (module === Greeting) data = module._name;
    if (module === TodoList) data = { tasks: module.tasks.map((task) => ({ ...task })), storageError: module._storageError };
    if (module === QuickLinks) data = module.links.map((link) => ({ ...link }));
    if (module === FocusTimer) data = { state: { ...module.state }, endTime: module._endTime };
    const snapshot = { data, storageReadable: false, raw: null };
    if (storageAvailable && module.STORAGE_KEY) {
      try {
        snapshot.raw = localStorage.getItem(module.STORAGE_KEY);
        snapshot.storageReadable = true;
      } catch (_e) { /* A failed read must not prevent an in-memory action. */ }
    }
    return snapshot;
  },

  _restore(module, snapshot) {
    let persistenceRestored = true;
    // Undo a write if a later rendering step threw an exception.
    if (snapshot.storageReadable) {
      try {
        if (snapshot.raw === null) localStorage.removeItem(module.STORAGE_KEY);
        else localStorage.setItem(module.STORAGE_KEY, snapshot.raw);
      } catch (_e) { persistenceRestored = false; }
    }
    if (module === Theme) module.apply(snapshot.data, false);
    if (module === Greeting) {
      module._name = snapshot.data;
      module._hideEditControls();
      module._renderGreeting();
    }
    if (module === TodoList) {
      module.tasks = snapshot.data.tasks;
      module._storageError = snapshot.data.storageError || !persistenceRestored;
      module._renderList();
      module._renderStorageNotice();
    }
    if (module === QuickLinks) {
      module.links = snapshot.data;
      module._renderLinks();
    }
    if (module === FocusTimer) {
      clearInterval(module._intervalId);
      module.state = snapshot.data.state;
      module._endTime = snapshot.data.endTime;
      module._intervalId = module.state.running ? setInterval(() => module._tick(), 1000) : null;
      module._updateDisplay();
      module._updateButtons();
    }
    return persistenceRestored;
  },

  runAction(module, id, action) {
    // A timer's stop/reset may call another guarded method in the same action.
    if (this._activeAction) return action();
    let snapshot;
    this._activeAction = true;
    try {
      snapshot = this._capture(module);
      const result = action();
      const container = document.getElementById(id);
      const error = container && container.querySelector('.widget-error');
      if (error) error.textContent = '';
      return result;
    } catch (_e) {
      let restored = false;
      let persistenceRestored = true;
      try {
        if (snapshot) {
          persistenceRestored = this._restore(module, snapshot);
          restored = true;
        }
      } catch (_restoreError) { /* Show recovery instructions if rendering still fails. */ }
      const container = document.getElementById(id);
      if (container) {
        let error = container.querySelector('.widget-error');
        if (!error) {
          error = document.createElement('p');
          error.className = 'widget-error';
          error.setAttribute('role', 'alert');
          container.appendChild(error);
        }
        error.textContent = restored
          ? persistenceRestored
            ? 'The action failed. Your previous data was restored. Please try again.'
            : 'Previous data was restored for this session, but could not be saved. Retry before refreshing.'
          : 'This widget could not recover. Refresh the page to try again.';
      }
      return false;
    } finally {
      this._activeAction = false;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
