# Requirements Document

## Introduction

The To-do List Life Dashboard is a simple, beginner-friendly website that helps users organize their day. It runs entirely in the browser with no backend required. The dashboard shows the current time and date with a personalized greeting, a to-do list for managing tasks, a Pomodoro-based focus timer, and a quick-links panel for favorite websites. All user data is saved in the browser's Local Storage so nothing is lost on page reload. The site supports light and dark themes and is compatible with all modern browsers.

## Glossary

- **Dashboard**: The main webpage that displays all features together in one view.
- **Local_Storage**: The browser's built-in key-value storage API used to save data on the user's device without a server.
- **Greeting_Widget**: The section of the Dashboard that shows the current time, date, and a personalized greeting message.
- **Todo_List**: The section of the Dashboard that lets users add, edit, complete, and delete tasks.
- **Task**: A single item in the Todo_List with a text description and a completion status.
- **Focus_Timer**: The section of the Dashboard that implements the Pomodoro Technique with work and break sessions.
- **Pomodoro_Session**: A 25-minute focused work interval in the Focus_Timer.
- **Short_Break**: A 5-minute rest interval that follows each Pomodoro_Session (after sessions 1, 2, and 3 in a cycle).
- **Long_Break**: A 15-minute rest interval that follows the 4th completed Pomodoro_Session in a cycle.
- **Quick_Links**: The section of the Dashboard that displays user-saved website shortcuts as clickable buttons.
- **Link**: A single entry in Quick_Links consisting of a label and a URL.
- **Theme**: The visual color scheme of the Dashboard, either light or dark.
- **Timer_Notification**: An audio or visual signal shown when a Focus_Timer session ends.

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a user, I want to see the current time and date on the dashboard, so that I always know what time it is without leaving the page.

#### Acceptance Criteria

1. WHILE the Dashboard is open, THE Greeting_Widget SHALL display the current local device time in HH:MM format, updating the display once per minute on the minute boundary.
2. THE Greeting_Widget SHALL display the current date in the format: full day name, numeric day, full month name, and four-digit year (e.g., "Sunday, 19 October 2026").
3. IF the device clock is unavailable, THEN THE Greeting_Widget SHALL display "--:--" for the time and "-- --, ----" for the date instead of leaving those fields empty.

---

### Requirement 2: Personalized Greeting

**User Story:** As a user, I want to see a greeting that uses my name and changes based on the time of day, so that the dashboard feels personal and welcoming.

#### Acceptance Criteria

1. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good Morning, [Name]!".
2. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good Afternoon, [Name]!".
3. WHEN the local time is between 18:00 and 23:59 or between 00:00 and 04:59, THE Greeting_Widget SHALL display the message "Good Evening, [Name]!".
4. THE Greeting_Widget SHALL render the user's name in bold font weight and at a font size at least 4px larger than the surrounding greeting text.
5. WHEN a user saves a custom name of 1 to 50 characters, THE Greeting_Widget SHALL persist the name in Local_Storage so it is restored on the next page load.
6. IF the user attempts to save a name exceeding 50 characters, THEN THE Greeting_Widget SHALL not save the name and SHALL display an inline error message indicating the name is too long.
7. IF no name has been saved, THEN THE Greeting_Widget SHALL display the default placeholder name "Friend".
8. IF Local_Storage is unavailable or the stored name cannot be read, THEN THE Greeting_Widget SHALL fall back to displaying the default placeholder name "Friend" without showing an error.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list, so that I can keep track of what I need to do today.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field accepting up to 200 characters and an "Add" button for entering new tasks.
2. WHEN a user submits a non-empty task name (after trimming leading and trailing whitespace), THE Todo_List SHALL add the Task to the bottom of the list and display it within 100 milliseconds.
3. IF the user submits an empty or whitespace-only task name, THEN THE Todo_List SHALL not add the Task, SHALL display an inline error message indicating the task name cannot be empty, and SHALL keep the input field focused.
4. THE Todo_List SHALL save all tasks to Local_Storage so that on the next page load all previously saved task names are restored and displayed in the same order they were added.
5. IF the number of tasks in the list reaches 100, THEN THE Todo_List SHALL disable the "Add" button and display a message indicating the maximum task limit has been reached.

---

### Requirement 4: To-Do List — Complete, Edit, and Delete Tasks

**User Story:** As a user, I want to mark tasks as done, edit them, and remove them, so that I can manage my list as my day changes.

#### Acceptance Criteria

1. WHEN a user marks a Task as complete, THE Todo_List SHALL visually distinguish the completed Task using strikethrough text and update the Task's completion status in Local_Storage.
2. WHEN a user clicks the edit control on a Task, THE Todo_List SHALL display the Task's current text in an editable input field inline within the list.
3. WHEN a user saves an edited Task with text between 1 and 200 characters, THE Todo_List SHALL update the Task's text in the list and in Local_Storage within 200 milliseconds.
4. IF a user edits a Task and submits empty or whitespace-only text, THEN THE Todo_List SHALL discard the change, restore the original Task text in the list, and display an error message indicating the Task text cannot be empty.
5. WHEN a user deletes a Task, THE Todo_List SHALL remove the Task from the list and from Local_Storage within 200 milliseconds, with no confirmation prompt required.

---

### Requirement 5: Focus Timer — Pomodoro Sessions and Breaks

**User Story:** As a user, I want a Pomodoro timer that automatically cycles through work and break sessions, so that I can stay focused and take structured breaks.

#### Acceptance Criteria

1. WHEN a user starts the Focus_Timer, THE Focus_Timer SHALL begin a Pomodoro_Session lasting exactly 25 minutes.
2. WHEN a Pomodoro_Session ends and the completed Pomodoro_Session count in the current cycle is fewer than 4, THE Focus_Timer SHALL automatically start a Short_Break lasting exactly 5 minutes.
3. WHEN a Pomodoro_Session ends and the completed Pomodoro_Session count in the current cycle reaches 4, THE Focus_Timer SHALL automatically start a Long_Break lasting exactly 15 minutes.
4. WHEN a Long_Break ends, THE Focus_Timer SHALL reset the completed Pomodoro_Session count to zero and automatically start a new Pomodoro_Session.
5. WHILE the Focus_Timer is running, THE Focus_Timer SHALL update the display every second showing the current session type ("Work", "Short Break", or "Long Break") and the remaining time in MM:SS format.
6. WHEN a user manually stops the Focus_Timer before a Pomodoro_Session elapses fully, THE Focus_Timer SHALL NOT increment the completed Pomodoro_Session count for that session.

---

### Requirement 6: Focus Timer — Controls and Notification

**User Story:** As a user, I want to start, stop, and reset the timer, and get notified when a session ends, so that I stay in control of my focus sessions.

#### Acceptance Criteria

1. WHEN the user activates the Start button, THE Focus_Timer SHALL begin the countdown from the current session's full duration and disable the Start button for the duration of the countdown.
2. WHILE the countdown is running, THE Focus_Timer SHALL provide an active Stop button that pauses the countdown; IF the countdown is not running, THEN THE Focus_Timer SHALL disable the Stop button.
3. WHEN the user activates the Reset button, THE Focus_Timer SHALL stop the countdown and restore the current session's full duration without advancing to the next session type.
4. WHEN a session ends, THE Focus_Timer SHALL display a Timer_Notification as a visible on-screen alert that remains until the user dismisses it or 10 seconds elapse, and, WHERE the browser grants audio permission, THE Focus_Timer SHALL play a single audio beep.
5. WHEN a session ends, THE Focus_Timer SHALL advance to the next session type in the Pomodoro sequence and wait in a stopped state until the user activates the Start button.

---

### Requirement 7: Quick Links — Add and Display Links

**User Story:** As a user, I want to save my favorite website links on the dashboard, so that I can open them quickly without typing URLs.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide an input form accepting a link label of up to 50 characters and a URL.
2. WHEN a user submits a label of 1 to 50 characters and a URL beginning with `http://` or `https://`, THE Quick_Links SHALL add the Link as a clickable button and display it immediately.
3. WHEN a user clicks a Link button, THE Quick_Links SHALL open the saved URL in a new browser tab.
4. WHEN a user adds or removes a Link, THE Quick_Links SHALL write all current links to Local_Storage.
5. WHEN the page loads, THE Quick_Links SHALL read all links from Local_Storage and display each one as a clickable button.
6. IF the user submits a link with an empty label or an empty URL, THEN THE Quick_Links SHALL not add the Link.
7. IF the user submits a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL not add the Link and SHALL display an error message indicating the URL format is invalid.

---

### Requirement 8: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays tidy.

#### Acceptance Criteria

1. WHEN a user confirms deletion of a Link, THE Quick_Links SHALL remove the Link button from the panel and delete the Link from Local_Storage immediately.
2. WHEN a user initiates deletion of a Link, THE Quick_Links SHALL display a confirmation prompt before removing the Link.
3. IF Local_Storage fails to delete the Link, THEN THE Quick_Links SHALL retain the Link button in the panel and display an error message indicating the deletion failed.

---

### Requirement 9: Light and Dark Theme Toggle

**User Story:** As a user, I want to switch between a light theme and a dark theme, so that the dashboard is comfortable to view in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control for switching between the light Theme and the dark Theme that displays a visible indicator of the currently active Theme.
2. WHEN a user activates the dark Theme, THE Dashboard SHALL apply a dark color scheme to all backgrounds, text, borders, and interactive controls.
3. WHEN a user activates the light Theme, THE Dashboard SHALL apply a light color scheme to all backgrounds, text, borders, and interactive controls.
4. THE Dashboard SHALL read the saved Theme preference from Local_Storage and apply it before the initial render to prevent a flash of the alternate Theme.
5. IF no Theme preference has been saved in Local_Storage, THEN THE Dashboard SHALL check the system `prefers-color-scheme` setting; IF the system setting is dark, THEN THE Dashboard SHALL apply the dark Theme; OTHERWISE THE Dashboard SHALL apply the light Theme by default.

---

### Requirement 10: File and Code Structure

**User Story:** As a beginner developer, I want the project files to be organized simply, so that I can find and understand each file easily.

#### Acceptance Criteria

1. THE Dashboard SHALL be structured with exactly one HTML file at the project root (index.html), one CSS file inside a css/ folder, and one JavaScript file inside a js/ folder.
2. THE Dashboard SHALL require no backend server process to run, meaning all HTML, CSS, and JavaScript files SHALL be served directly from the local filesystem without a runtime server dependency.
3. WHEN a user opens index.html directly in a browser from the local filesystem, THE Dashboard SHALL render all UI elements and respond to all interactions without requiring a network connection.
4. THE Dashboard SHALL render all UI elements without visual errors and respond to all user interactions without JavaScript console errors in the current stable release versions of Chrome, Firefox, Edge, and Safari at the time of project delivery.

---

### Requirement 11: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to load fast and respond to my actions without any noticeable delay, so that it feels smooth to use.

#### Acceptance Criteria

1. THE Dashboard SHALL load and display all widgets within 3 seconds when opened over a network connection of at least 25 Mbps download speed and 50 ms or less latency.
2. WHEN a user interacts with any widget (add task, click timer, toggle theme), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. IF the Dashboard fails to fully render within 10 seconds of being opened, THEN THE Dashboard SHALL display a loading indicator during the wait and, upon timeout, show a message instructing the user to refresh the page.
4. IF a widget interaction fails to update the UI within 100 milliseconds due to a JavaScript error, THEN THE Dashboard SHALL revert to the last known stable state of that widget and display a brief error message to the user.
