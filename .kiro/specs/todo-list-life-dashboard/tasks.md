# Implementation Plan: To-do List Life Dashboard

## Overview

Build a single-page, no-framework dashboard with four widgets (Greeting, To-Do List, Focus Timer, Quick Links) plus a global Theme Toggle. Everything lives in three files: `index.html`, `css/style.css`, and `js/app.js`. All data is persisted to `localStorage`. Implementation is broken into sequential steps — each step produces working, testable output before the next begins.

## Tasks

- [x] 1. Project scaffolding — file structure and HTML skeleton
  - [x] 1.1 Create the root `index.html` with correct `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, a `<link>` to `css/style.css`, and a `<script src="js/app.js" defer>` tag at the end of `<body>`
    - Create `css/style.css` and `js/app.js` as empty files so the HTML references resolve without 404 errors
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 1.2 Add semantic HTML sections inside `<body>`: a `<header>` containing the theme-toggle button, and four `<section>` elements with ids `greeting-widget`, `todo-widget`, `timer-widget`, and `links-widget`
    - Each section needs a visible `<h2>` heading so the layout is readable before CSS is applied
    - _Requirements: 10.1, 10.4_

- [x] 2. CSS foundation — custom properties, reset, and base layout
  - [x] 2.1 Define CSS custom properties for the light theme on `:root` (`--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-border`, `--color-error`) and override them inside a `.theme-dark` selector on `body`
    - This must be done before any module CSS so all widget styles can reference the variables
    - _Requirements: 9.2, 9.3_
  - [x] 2.2 Write a minimal CSS reset (box-sizing, margin/padding zero on `*`) and global typography (`font-family`, `line-height`, `color` from `--color-text`, `background` from `--color-bg`)
    - _Requirements: 10.4, 11.1_
  - [x] 2.3 Lay out the four widget sections using CSS Grid or Flexbox so they display in a readable two-column (desktop) / one-column (mobile) arrangement; add padding and a card-style surface (`--color-surface`, `--color-border`, `border-radius`) to each section
    - _Requirements: 10.4, 11.1_

- [x] 3. Theme module — toggle, persist, and prefers-color-scheme fallback
  - [x] 3.1 Implement `Theme` in `js/app.js`: the `STORAGE_KEY`, `current` property, `_getSaved()` (reads `localStorage`, falls back to `prefers-color-scheme`, then `'light'`), `apply(theme)` (adds `theme-light`/`theme-dark` class to `<body>`, updates toggle button label/icon), and `toggle()`
    - Wrap the `localStorage` read in `try/catch`
    - `apply()` must run before the first paint to prevent a theme flash — call it at the very top of `Theme.init()`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 3.2 Write property test for Theme toggle invertibility
    - **Property 10: Theme toggle is idempotent-free and invertible**
    - Calling `Theme.toggle()` twice from any starting theme returns to the original theme; `document.body` class always matches `Theme.current`
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 4. Greeting module — live clock, date display, and time-of-day greeting
  - [x] 4.1 Implement `Greeting._getGreetingPhrase(hour)`: returns `"Good Morning"` for 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–23 and 0–4
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 4.2 Write property test for greeting phrase coverage
    - **Property 1: Greeting phrase covers all hours**
    - For any integer 0–23, `_getGreetingPhrase` returns exactly one of the three valid strings with no gaps or overlaps
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [x] 4.3 Implement `Greeting._renderClock()` (formats `Date` → `HH:MM`, writes to DOM, falls back to `"--:--"`), `_renderDate()` (formats full day/date/month/year string, falls back to `"-- --, ----"`), and `_renderGreeting()` (uses `_getGreetingPhrase` + stored name, renders name in `<strong>` with the larger font size)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_
  - [x] 4.4 Implement `Greeting._tick()` (called every second via `setInterval(1000)`; updates clock and re-renders greeting only when the displayed minute changes), `_loadName()` (reads `localStorage`, returns stored name or `'Friend'`), `_saveName(name)` (validates ≤ 50 chars, writes to `localStorage`, returns bool), and `_bindNameEdit()` (wires edit button and input)
    - Show inline error `"Name must be 50 characters or fewer."` when validation fails; clear it on the next valid keystroke
    - _Requirements: 1.1, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [ ]* 4.5 Write unit tests for `_saveName`
    - Test: empty string → false, exactly 50 chars → true, 51 chars → false, special characters → true (if ≤ 50)
    - _Requirements: 2.5, 2.6_

- [x] 5. To-Do List module — add, render, complete, edit, delete, and persist
  - [x] 5.1 Implement `TodoList` data layer: `STORAGE_KEY`, `MAX_TASKS = 100`, `MAX_CHARS = 200`, `tasks = []`, `_loadTasks()` (parses JSON from `localStorage`, returns `[]` on error), `_saveTasks()` (serialises `tasks` to `localStorage`)
    - Each task object: `{ id, text, done, createdAt }` — use `crypto.randomUUID()` with `Date.now()` fallback for `id`
    - _Requirements: 3.4, 4.1_
  - [x] 5.2 Implement `TodoList.addTask(text)`: trim input, reject empty/whitespace (show error, keep input focused), reject if `tasks.length >= MAX_TASKS` (show limit message, disable Add button), otherwise push task, save, and re-render within 100 ms
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [ ]* 5.3 Write property test for whitespace-only task rejection
    - **Property 2: Whitespace-only task names are rejected**
    - Any string where `s.trim() === ''` must leave `tasks` unchanged and not write to `localStorage`
    - **Validates: Requirements 3.3**
  - [ ]* 5.4 Write property test for task add/remove round-trip persistence
    - **Property 3: Task add/remove round-trip persists correctly**
    - After `addTask(text)` + `_loadTasks()`, the array contains a task with the same text at the same position
    - **Validates: Requirements 3.4**
  - [ ]* 5.5 Write property test for max task count enforcement
    - **Property 4: Task list never exceeds the maximum**
    - After any sequence of `addTask` calls starting from a full list of 100, `tasks.length` stays at 100
    - **Validates: Requirements 3.5**
  - [x] 5.6 Implement `TodoList._renderTask(task, index)` (returns a `<li>` with checkbox, text span, Edit button, Delete button) and `_renderList()` (clears and rebuilds the `<ul>`)
    - Completed tasks get `text-decoration: line-through` via a CSS class toggled on the `<li>`
    - _Requirements: 3.2, 4.1_
  - [x] 5.7 Implement `TodoList.toggleComplete(id)` (flips `done`, saves, re-renders within 100 ms) and `deleteTask(id)` (splices array, saves, re-renders within 200 ms, no confirmation prompt)
    - _Requirements: 4.1, 4.5_
  - [x] 5.8 Implement `TodoList.startEdit(id)` (replaces `<li>` text span with an inline `<input>` pre-filled with current text), `saveEdit(id, newText)` (validates 1–200 non-whitespace chars, updates task, saves, re-renders within 200 ms; on failure restores original text and shows error), and `cancelEdit(id)` (re-renders without change)
    - _Requirements: 4.2, 4.3, 4.4_
  - [ ]* 5.9 Write property test for edit preserving task identity
    - **Property 5: Edit preserves task identity**
    - After `saveEdit(id, newText)`, the task's `id`, `done`, and `createdAt` are unchanged
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint — verify Greeting and To-Do List
  - Ensure all implemented functions behave correctly for the happy path; check `localStorage` keys `dashboard_username` and `dashboard_todos` in DevTools; ask the user if questions arise.

- [x] 7. Focus Timer module — Pomodoro state machine, controls, display, and notification
  - [x] 7.1 Implement `FocusTimer._formatTime(seconds)`: zero-pads minutes and seconds, returns `"MM:SS"` string
    - _Requirements: 5.5_
  - [ ]* 7.2 Write property test for timer format round-trip
    - **Property 9: Timer format is always MM:SS**
    - For any integer 0–5999, `_formatTime(s)` matches `/^\d{2}:\d{2}$/` and decoding back equals `s`
    - **Validates: Requirements 5.5**
  - [x] 7.3 Implement `FocusTimer` state: `DURATIONS`, `state` object (`phase`, `remaining`, `running`, `completedPomodoros`), `_advancePhase()` (work → short → long → work cycle per Requirement 5 rules, increments/resets `completedPomodoros`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_
  - [ ]* 7.4 Write property test for Pomodoro phase sequence
    - **Property 8: Pomodoro phase sequence is deterministic**
    - Starting from any `completedPomodoros` in 0–3, a full cycle of `_advancePhase()` calls always terminates at `completedPomodoros = 0`, `phase = 'work'`
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  - [x] 7.5 Implement `FocusTimer.start()` (sets `running = true`, starts `setInterval(1000)`, disables Start button), `stop()` (clears interval, sets `running = false`, enables Start button — does NOT increment `completedPomodoros`), `reset()` (clears interval, restores full duration for current phase, re-renders, does NOT advance phase)
    - _Requirements: 6.1, 6.2, 6.3, 5.6_
  - [x] 7.6 Implement `FocusTimer._tick()` (decrements `remaining`; on zero calls `_onSessionEnd()`), `_onSessionEnd()` (calls `_playBeep()`, `_showNotification()`, `_advancePhase()`, then waits for user to press Start), `_updateDisplay()` (writes phase label + `_formatTime(remaining)` to DOM every second), and `_updateButtons()` (enables/disables Start, Stop, Reset per running state)
    - _Requirements: 5.5, 6.1, 6.2, 6.4, 6.5_
  - [x] 7.7 Implement `FocusTimer._playBeep()` using `AudioContext` oscillator (single 440 Hz beep, ~300 ms); wrap everything in `try/catch` so audio errors are silent. Implement `_showNotification(msg)` (renders a dismissible on-screen alert; auto-dismisses after 10 s via `setTimeout`) and `_dismissNotification()`
    - _Requirements: 6.4_

- [x] 8. Quick Links module — add with validation, render, open, delete with confirmation, persist
  - [x] 8.1 Implement `QuickLinks._validateUrl(url)`: returns `true` if and only if `url` starts with `"http://"` or `"https://"`
    - _Requirements: 7.2, 7.7_
  - [ ]* 8.2 Write property test for URL validation
    - **Property 6: URL validation accepts only http/https**
    - For any string, `_validateUrl` returns `true` iff the string starts with `"http://"` or `"https://"`
    - **Validates: Requirements 7.2, 7.7**
  - [x] 8.3 Implement `QuickLinks` data layer: `STORAGE_KEY`, `LABEL_MAX_LEN = 50`, `links = []`, `_loadLinks()`, `_saveLinks()`
    - Each link object: `{ id, label, url }` — use `crypto.randomUUID()` with fallback
    - _Requirements: 7.4, 7.5_
  - [x] 8.4 Implement `QuickLinks.addLink(label, url)`: reject empty label or empty URL (silently, per Requirement 7.6), reject invalid URL scheme (show error `"URL must start with http:// or https://"`), otherwise push link, save, re-render
    - _Requirements: 7.1, 7.2, 7.6, 7.7_
  - [ ]* 8.5 Write property test for quick-link add/remove round-trip persistence
    - **Property 7: Quick-link add/remove round-trip persists correctly**
    - After `addLink(label, url)` + `_loadLinks()`, the array contains a link with matching label and URL
    - **Validates: Requirements 7.4, 7.5**
  - [x] 8.6 Implement `QuickLinks._renderLinks()` (rebuilds the links panel; each link is a `<button>` that calls `_openLink(url)` and has a Delete icon), `_openLink(url)` (`window.open(url, '_blank', 'noopener')`), and `deleteLink(id)` (shows `window.confirm` prompt; on confirm removes link, saves — if `_saveLinks()` throws, retains link in UI and shows error `"Deletion failed. Please try again."`)
    - _Requirements: 7.3, 7.4, 8.1, 8.2, 8.3_

- [x] 9. Checkpoint — verify Focus Timer and Quick Links
  - Ensure timer cycles correctly through all four Pomodoro sessions, notification appears and auto-dismisses, and links persist across reloads; ask the user if questions arise.

- [x] 10. Wire everything together in `App.init()`
  - [x] 10.1 Write `App.init()` in `js/app.js`: call `Theme.init()`, then `Greeting.init()`, `TodoList.init()`, `FocusTimer.init()`, `QuickLinks.init()` in that order; attach `App.init` to `DOMContentLoaded`
    - Theme must be first to prevent the flash-of-wrong-theme; all other order is fixed per the design's initialization sequence diagram
    - _Requirements: 9.4, 10.3_
  - [x] 10.2 Add a `localStorage`-unavailable guard at the top of `app.js`: attempt a test write/read in `try/catch`; if it throws, set a module-level `storageAvailable = false` flag that all `_save*()` methods check before attempting writes
    - When storage is unavailable, all widgets should still render with in-memory defaults and not throw
    - _Requirements: 2.8, 3.4, 9.4_

- [x] 11. Polish — responsive layout, accessibility, and error-state styling
  - [x] 11.1 Add CSS media queries to collapse the two-column grid to a single column below 768 px; verify all touch targets are at least 44×44 px
    - _Requirements: 10.4, 11.1_
  - [x] 11.2 Add visible `:focus` ring styles for all interactive elements (buttons, inputs) using `--color-primary`; ensure theme-toggle button has a visible indicator of the currently active theme (icon or label change)
    - _Requirements: 9.1, 10.4_
  - [x] 11.3 Style all inline error messages using `--color-error` and add `role="alert"` so screen readers announce them; style the timer notification as a fixed banner with a dismiss button
    - _Requirements: 3.3, 4.4, 6.4, 7.7, 8.3_

- [x] 12. Final checkpoint — cross-browser smoke test
  - Open `index.html` directly from the filesystem (no server) in Chrome, Firefox, Edge, and Safari; verify all four widgets render without console errors, `localStorage` data survives a reload, and dark/light theme applies correctly to every element; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP — they are property and unit tests that validate correctness properties from the design document
- Property tests use [fast-check](https://fast-check.dev/) running in Node.js (`node test.js`) on pure helper functions extracted from `app.js` — no bundler required
- Each task references the specific requirements it satisfies for full traceability
- Checkpoints at tasks 6, 9, and 12 provide natural validation breaks
- The Focus Timer does NOT persist state to `localStorage` — a page refresh resets it (intentional design decision)
- Always wrap `localStorage` reads/writes in `try/catch`; return safe defaults on error
- Use `crypto.randomUUID()` for IDs with `Date.now().toString() + Math.random()` as a fallback for older Safari

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["3.1", "4.1", "5.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["3.2", "4.2", "5.2", "7.2", "8.3"] },
    { "id": 6, "tasks": ["4.3", "5.3", "5.4", "5.5", "7.3", "8.2"] },
    { "id": 7, "tasks": ["4.4", "5.6", "7.4", "8.4"] },
    { "id": 8, "tasks": ["4.5", "5.7", "7.5", "8.5"] },
    { "id": 9, "tasks": ["5.8", "7.6", "8.6"] },
    { "id": 10, "tasks": ["5.9", "7.7"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
