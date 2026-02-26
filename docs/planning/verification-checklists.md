# Forge — Human Verification Checklists

> **Prerequisites:** Demo mode is on (`PUBLIC_DEMO_MODE=true`). Demo data is seeded (click
> "Load Sample Data" in the amber banner if not already loaded).
>
> **Demo classroom code:** `DEMO01`
>
> | Demo Student  | PIN  |
> | ------------- | ---- |
> | Alex Chen     | 1234 |
> | Jordan Rivera | 5678 |
> | Sam Patel     | 9012 |
> | Maya Johnson  | 3456 |
> | Kai Williams  | 7890 |

---

## Teacher Checklist

### 1. Login & Navigation

- [ ] Visit `/` — auto-authenticated as "Demo Teacher" (no login step required)
- [ ] "My Classrooms" page shows a card for the demo classroom with name, role badge, and display code
- [ ] Click the classroom card — navigates to `/classroom/[id]`

### 2. Classroom Layout

- [ ] Header shows classroom name and display code
- [ ] Navigation tabs visible: **Dashboard**, **Presence**, **Help**, **Ninja**, **Roster**, **Settings**
- [ ] "Smartboard" link opens `/display/DEMO01` in a new tab
- [ ] "Back to classrooms" link returns to `/`

### 3. Dashboard — Session Control

- [ ] Shows "No active session" with a **Start Session** button
- [ ] Click **Start Session** — session becomes active, green pulsing indicator appears
- [ ] With active session, **End Session** button (red) is available
- [ ] Click **End Session** — returns to "No active session" state
- [ ] Quick Links section shows: "Manage Students", "Classroom Settings", "Open Smartboard Display"

### 4. Dashboard — Profile

- [ ] "My Profile" card shows display name
- [ ] Click **Edit** — inline form appears with Display Name, Pronouns, and Ask Me About fields
- [ ] Click **Cancel** — form closes without changes

### 5. Presence (start a session first)

- [ ] Navigate to **Presence** tab
- [ ] "Your Presence" card shows sign-in status (gray dot = not signed in)
- [ ] Click **Sign In** — green dot appears, "You are signed in"
- [ ] Click **Sign Out** — gray dot returns
- [ ] "Who's Here" section shows a grid of avatar cards for each signed-in person
- [ ] **Sign-In Log** table shows sign-in history with Name, Signed In, Signed Out columns
- [ ] Teacher can click **Sign Out** next to a student's name in the log to sign them out

### 6. Help Queue (session must be active)

- [ ] Navigate to **Help** tab
- [ ] Shows "Help Queue (0 requests)" with "No one needs help right now" message
- [ ] _(Submit a help request as a student first — see Student Checklist #5)_
- [ ] Help request appears in queue with: position number, student name, urgency badge, wait time
- [ ] Click the **expand chevron** on a queue item — reveals description and "what they tried"
- [ ] Click **Claim** on a pending request — card turns blue-tinted, shows "You are helping"
- [ ] **Release** button returns the request to pending
- [ ] **Resolve** button removes the request from the queue

### 7. Ninja Management

- [ ] Navigate to **Ninja** tab
- [ ] Click **Add Domain** — purple form appears with Domain Name and Description fields
- [ ] Enter a domain name (e.g. "Math") and submit — domain appears in the list
- [ ] Click **Edit** on a domain — inline form with name and description fields
- [ ] Save changes — domain name updates
- [ ] Click **Archive** — domain is removed from the list
- [ ] In **Ninja Assignments** section, select a domain from the dropdown
- [ ] Select a student from the student dropdown — click **Assign Ninja**
- [ ] Student appears as a purple pill tag under that domain
- [ ] Click **×** on the pill tag — assignment is revoked

### 8. Roster

- [ ] Navigate to **Roster** tab
- [ ] Shows "Students (N)" count and student table with Name, Email, Grade, PIN, Actions columns
- [ ] Click **Add Student** — green form with Name (required), Email (required), Grade (optional)
- [ ] Submit — new student appears in table
- [ ] Click **Edit** on a student row — inline editing for Name, Email, Grade
- [ ] Save changes — row updates
- [ ] Click **Remove** — student is removed from the table
- [ ] Click **Import CSV** — textarea appears with format hint
- [ ] Paste CSV data with `name,email` columns — submit — students added in bulk
- [ ] **PIN column:** students with PINs show "Set" (green); others show a **Generate** link
- [ ] Click **Generate** on a student — PIN appears inline (monospace bold)
- [ ] In **PIN Management** section, click **Generate PINs for All Students** — PINs generated for any student without one

### 9. Settings

- [ ] Navigate to **Settings** tab
- [ ] Four module toggles shown: Presence, Help Queue & Ninjas, Projects (Coming Soon), Chores (Coming Soon)
- [ ] Projects and Chores toggles are disabled/greyed out
- [ ] Toggle **Presence** off → click **Save Settings** → Presence tab disappears from nav
- [ ] Toggle **Presence** back on → click **Save Settings** → Presence tab reappears
- [ ] Toggle **Help** off → Help tab disappears from nav
- [ ] Toggle **Help** back on → Help tab reappears

### 10. Smartboard Display

- [ ] Open `/display/DEMO01` (no login needed)
- [ ] Dark theme (dark background, white text)
- [ ] Header shows classroom name and live clock (HH:MM)
- [ ] **No active session:** "No active session" message centered
- [ ] **Active session:** Shows "Who's Here" and "Help Queue" panels side by side
- [ ] Presence panel shows signed-in student cards (with ninja badges/purple highlight if applicable)
- [ ] Help queue panel shows pending requests with urgency indicators and wait times
- [ ] Changes in the classroom (sign-ins, help requests) update the display without page reload

### 11. Demo Banner

- [ ] Amber banner visible at top of every page
- [ ] **Load Sample Data** button reloads page with demo students and classroom
- [ ] **Clear All Data** button reloads page with empty state
- [ ] **Switch to Student** navigates to `/login` (student PIN login page)

---

## Student Checklist

### 1. PIN Login

- [ ] Visit `/login` — shows "Student PIN Login" tab (demo mode shows only this tab)
- [ ] Classroom Code field accepts uppercase alphanumeric (max 6 chars)
- [ ] PIN field is password-masked (max 6 chars)
- [ ] **Sign in with PIN** button is disabled until both fields are filled
- [ ] Demo shortcut: click a student name in the yellow box below the form — code and PIN auto-fill
- [ ] Click **Sign in with PIN** — redirected to `/pin` (student dashboard)
- [ ] Enter wrong PIN — error alert: "Invalid classroom code or PIN"
- [ ] "Back to Teacher View" link navigates to `/`

### 2. Student Dashboard (`/pin`)

- [ ] Header card shows: avatar initial, student name, classroom name, **Log out** link
- [ ] **No active session:** Yellow bar: "No active session. Wait for your teacher to start the session." No sign-in button visible.
- [ ] **Active session:** Green pulsing bar: "Session Active"
- [ ] **Presence card** appears with sign-in status
- [ ] Click **Sign In** — green dot, "You are signed in"
- [ ] Click **Sign Out** — gray dot, "You are not signed in"
- [ ] Footer shows: "Auto-logout after 30 min inactivity or 4 hours max"
- [ ] Click **Log out** — returns to `/login`

### 3. Session Lifecycle (coordinate with teacher)

- [ ] While on `/pin` with no session, have the teacher start a session — session status should update to active (may require page reload or happen via realtime)
- [ ] While signed in, have the teacher end the session — presence resets

### 4. Realtime Updates

- [ ] When teacher starts/ends a session, student page reflects the change
- [ ] ConnectionStatus indicator: hidden when connected, shows colored dot + label when disconnected

---

## Multi-User Scenarios (coordinate teacher + student)

### Help Queue Flow

1. [ ] Teacher: Start a session
2. [ ] Student: Sign in via PIN, then sign into the session on `/pin`
3. [ ] Student: Navigate to help — open a second browser/tab as a Google-signed-in student, or use the classroom help page
4. [ ] _If testing via PIN student only:_ The PIN student dashboard (`/pin`) does not have a help form — help requests require the classroom help page (`/classroom/[id]/help`) via Google login
5. [ ] Teacher: See the request appear in the help queue
6. [ ] Teacher: Claim the request — student sees "being helped" status
7. [ ] Teacher: Resolve the request — removed from queue for both

### Presence Board Flow

1. [ ] Teacher: Start a session
2. [ ] Student A: Sign in via PIN → sign into session
3. [ ] Student B: Sign in via PIN → sign into session
4. [ ] Teacher: Navigate to Presence — both students visible in "Who's Here" grid
5. [ ] Smartboard: Both students visible on the display
6. [ ] Teacher: Sign out Student A from the Sign-In Log
7. [ ] Verify Student A disappears from the presence board and smartboard

### Ninja Visibility on Smartboard

1. [ ] Teacher: Create a ninja domain and assign a student
2. [ ] That student signs in
3. [ ] Smartboard: Student shows with purple background and ninja domain tags
