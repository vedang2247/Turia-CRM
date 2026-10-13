# Turia Agent Center CRM

A local demo of an **Agent Center** with three agent modules: **Task**, **DSC** and **License**.
You can create, edit, save as draft, publish, disable and *simulate* agents, and review what each simulated run did.

The project includes the original simulated Agent Center plus a CRM workspace with tasks,
clients, templates, Gmail inbox integration, and a WhatsApp inbox bridge. Agent test runs
remain simulated; Gmail and WhatsApp actions are real only when their external credentials
and accounts are configured.

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, JavaScript, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, REST/JSON |
| Database | SQLite via `better-sqlite3` (a single file, created automatically) |
| WhatsApp bridge | Node.js, Socket.IO, `whatsapp-web.js` (port 4001) |

---

## 1. Prerequisites

- **Node.js 20 LTS or newer** and **npm** (check with `node -v` and `npm -v`).
- `better-sqlite3` normally installs a prebuilt binary. If `npm install` in `backend/` fails while compiling it, install a build toolchain: Windows → *Visual Studio Build Tools* ("Desktop development with C++"); macOS → `xcode-select --install`; Linux → `sudo apt install build-essential python3`.
- The backend uses port **4000** and the frontend uses port **3000** by default.
If either port is occupied, identify the existing listener before changing or stopping
anything; do not start duplicate backend instances.

## 2. Run it from a clean checkout

Open **three terminals**. Start the backend and WhatsApp bridge before the
frontend.

**Terminal 1: backend**
```bash
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev                 # or: npm start
```
Check it: <http://localhost:4000/api/health> should return `{"success":true,"data":{"status":"ok","database":"connected",...}}`.
The API endpoint is `/api/health`; `GET /api` returning 404 is expected because
there is no route registered at the API prefix itself. Also verify the agent list:
<http://localhost:4000/api/agents>.

**Terminal 2: frontend**
```bash
cd frontend
cp .env.example .env.local  # Windows PowerShell: Copy-Item .env.example .env.local
npm install
npm run dev
```
Open <http://localhost:3000> (it redirects to the Agent Center).

Start the backend first. If the API request fails, the frontend shows the exact
request URL and browser error details with a *Try again* button instead of
claiming every failure means the backend is offline.

To diagnose a local port conflict on macOS or Linux:
```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```
If the listener is the existing Turia backend, use that instance or stop it
gracefully before running another one. The backend also reports the conflicting
port and a safe configuration alternative instead of failing silently.

### Production build of the frontend

```bash
cd frontend
npm run lint        # ESLint (Next.js "core-web-vitals" rules); `next build` also fails on lint errors
npm run build       # production build
npm start           # serves the production build on http://localhost:3000
```

### CRM integrations

Run the WhatsApp bridge in a third terminal when WhatsApp is needed:

```bash
cd whatsapp-server
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm start
```

The bridge serves Socket.IO on port `4001` and displays a QR code in its terminal
on first login. Gmail is accessed by frontend route handlers; configure these
variables in `frontend/.env.local`, then open **Connections** and complete Google OAuth:

| Variable | Meaning |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Authorized callback, normally `http://localhost:3000/api/auth/google/callback` |
| `SESSION_SECRET` | Long random secret used to encrypt the Gmail session cookie |
| `NEXT_PUBLIC_WA_SERVER_URL` | WhatsApp bridge URL, normally `http://localhost:4001` |

Email threads can be converted into tasks or linked to existing tasks. Task emails
are sent through Gmail first and then recorded in the backend, including an automatic
email timeline link. If recording fails after Gmail accepts the message, the modal
reports that state so the operator can retry. External OAuth, Gmail delivery,
WhatsApp QR authentication, and browser-level smoke tests require real accounts and
are not covered by the automated suite.
Run the backend in another terminal as above. After changing `NEXT_PUBLIC_API_URL` you must run `npm run build` again, because that value is baked into the build.
For a production-style backend run use `npm start` instead of `npm run dev`.

### Reproducible installs (lockfiles)

The first `npm install` in `backend/` and in `frontend/` creates a `package-lock.json`. **Commit both files** (do not delete them) so every machine installs identical versions. For a clean, exact install from the lockfile use `npm ci` instead of `npm install`.

## 3. Environment variables

**`backend/.env`** (copy from `.env.example`; never commit `.env`)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `4000` | Port the API listens on |
| `NODE_ENV` | `development` | Environment name |
| `DB_PATH` | `./data/agent_center.db` | SQLite file, relative to `backend/` |
| `CORS_ORIGIN` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated frontend origins allowed to call the API |

**`frontend/.env.local`** (copy from `.env.example`)

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend base URL. Changing it requires restarting `npm run dev`. |
| `NEXT_PUBLIC_WA_SERVER_URL` | `http://localhost:4001` | WhatsApp Socket.IO bridge URL. |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/auth/google/callback` | Google OAuth callback URL. |
| `SESSION_SECRET` | — | Random secret of at least 32 characters for Gmail sessions. |

No secrets are used. `NEXT_PUBLIC_*` values are visible in the browser by design, so never put secrets in them.

## 4. Database setup

There is nothing to set up by hand. On every backend start `src/db/database.js` opens `DB_PATH` and runs `src/db/schema.sql`, which uses `CREATE TABLE IF NOT EXISTS` and is therefore safe to repeat; existing data is never touched.

- Tables: `agents` and `agent_runs` (foreign key with `ON DELETE CASCADE`; `CHECK` constraints on module, status and run type; indexes for the list and history queries).
- Timestamps are ISO-8601 UTC strings.
- **Reset the demo data:** stop the backend and delete `backend/data/agent_center.db*` (the `.db`, `.db-wal` and `.db-shm` files). It is recreated empty on the next start.
- The automated tests use a temporary database and never touch this file.

## 5. API

Base URL: `http://localhost:4000/api`. Every response is JSON in one of two shapes:

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Name is required.", "details": ["..."] } }
```

| Method & path | Purpose | Success | Typical errors |
|---|---|---|---|
| `GET /health` | Server + database check | 200 | 503 |
| `GET /agent-definitions` | Triggers, conditions, recipients, channels, actions (used to build the form) | 200 | |
| `GET /agents?module=&status=&search=` | List agents (newest update first) | 200 | 400 invalid filter |
| `POST /agents` | Create an agent (always saved as `draft`) | 201 | 400 validation |
| `GET /agents/:id` | One agent | 200 | 400 bad id, 404 |
| `PUT /agents/:id` | Edit a **draft** (partial updates allowed) | 200 | 400, 404, 409 not a draft |
| `POST /agents/:id/publish` | draft → published | 200 | 400 invalid config, 404, 409 |
| `POST /agents/:id/disable` | published → disabled | 200 | 404, 409 |
| `POST /agents/:id/test-run` | Simulated run (published only) | 201 | 404, 409 |
| `GET /agents/:id/history` | Runs of one agent, newest first | 200 | 400, 404 |
| `GET /history?limit=` | Runs of all agents, newest first (default 100, max 250) | 200 | |

The builder sends `saveDraft: true` when the user clicks **Save Draft**. In
that mode a draft may contain only the workflow steps completed so far; the
stored partial configuration is restored when the draft is reopened. Requests
without `saveDraft: true`, and all publish requests, require the complete
module-specific configuration.

Example `POST /api/agents` body:

```json
{
  "name": "Task due reminder",
  "module": "Task",
  "description": "Notify the assignee before a task is due.",
  "config": {
    "trigger": "Task due soon",
    "conditions": { "daysBeforeDue": 3 },
    "recipient": "Assigned user",
    "channel": "Email",
    "action": "Send notification",
    "message": "Your task is due soon."
  }
}
```

### Agent definitions (one place to change them)

Triggers, per-trigger conditions, recipients, channels and actions live in **`backend/src/config/agentDefinitions.js`**. The validator, the simulator and the frontend form (through `GET /api/agent-definitions`) all read from it.

| Module | Triggers | Condition |
|---|---|---|
| Task | Task created · Task assigned · Task due soon | *Task due soon:* days before due date (1–90, default 2) |
| DSC | DSC expiry approaching · DSC expired · Renewal required | *Expiry approaching / Renewal required:* days before expiry (1–365, default 30) |
| License | License expiry approaching · License expired · Renewal required | same as DSC |

### Status rules

```
draft ──publish──▶ published ──disable──▶ disabled
  ▲ edit (PUT) allowed only here            (final in this MVP)
```

- New agents are always `draft`. Only **draft** agents can be edited or published.
- Only **published** agents can be disabled or test-run. Draft and disabled agents get `409 INVALID_STATE`.
- Publishing re-validates the stored configuration; an invalid one is refused with `400`.
- A disabled agent cannot be re-enabled (kept simple on purpose).

### What a test run means

`POST /agents/:id/test-run` loads the agent from SQLite, re-validates its configuration, builds a **fixed, fictional sample event** for its trigger (same configuration → same event and result), and writes a row to `agent_runs`.

- `status: "success"` means: *the configuration passed validation and the simulated run completed.* It does **not** mean a message was delivered or a real DSC/license/task was processed.
- `status: "failed"` means the configuration was not valid at run time (for example the database row was edited by hand or damaged). The run is still stored with an `error_message`.
- The HTTP status is `201` in both cases (a run record was created); check `data.status` for the outcome.

## 6. Tests

All backend tests use Node's built-in test runner (no extra packages) and a **temporary** database.

```bash
cd backend
npm test
```

| File | What it covers | Needs Express? |
|---|---|---|
| `tests/validator.test.js` | Valid input per module; empty/blank/over-long fields; wrong module↔trigger; bad recipient/channel/action; condition ranges; legacy data | no |
| `tests/services.test.js` | Create/list/filter/search; edit and Save Draft; draft→published→disabled rules; simulated runs (success, determinism, **failure**); history order and timestamps; DB constraints; **fresh database initialisation** (new file in a missing folder, tables/indexes, no seed data) and **persistence across a backend restart** (close and reopen the database file) | no |
| `tests/controllers.test.js` | Real controllers + error handler: 200/201/400/404/409/500 and JSON shapes, invalid ids (`abc`, `1.5`, `0`, `-1`, `1e2`…), missing records, failed-run response | no |
| `tests/api.test.js` | End-to-end over real HTTP: health, 404 route, malformed JSON, oversized body, CORS, full create→edit→publish→test-run→history→disable flow for all three modules, restart persistence | **yes** (uses the installed `express`) |

### Manual checks (browser behaviour is not covered by the automated tests)

1. **Refresh persistence:** create a draft, publish another agent, run a test; press F5 on Agent Center, an agent page and History. Everything remains.
2. **Backend restart:** stop the backend with Ctrl+C, start it again, reload the page. Agents and history are unchanged.
3. **Backend stopped:** stop the backend and reload. A readable error with *Try again* appears; nothing crashes. Start the backend and click *Try again*.
4. **Module counts:** with agents in several modules, click the *Task* card. The *DSC* and *License* counts must not change.
5. **Edit a draft:** Agent Center → *Edit* on a draft (or *Edit* on its detail page) → change fields → *Save draft*. The detail page shows the changes and the status is still *Draft*. Published agents show no Edit button; opening `/agents/<id>/edit` for one shows a message.
6. **Validation:** submit an empty form, then a name of spaces only, a message of spaces only, and a condition of `0` or `1.5`. Each shows an inline message and nothing is saved.
7. **Each module:** create and publish one Task, one DSC and one License agent (try each trigger, including those with and without a condition), run a test on each, and open *View details* in History.
8. **Failure display:** with the backend stopped, click *Test run* on a published agent. An error notice appears. (A server-side `failed` simulation cannot be triggered from the UI, because the UI only saves valid configurations; the automated tests cover it.)
9. **Missing record:** open `/agents/99999`. You get "Agent not found." and a link back, not a crash.

## 7. Current project structure

```
turia-crm/
├── backend/
│   ├── src/
│   │   ├── app.js, server.js, config.js       Express app, startup and configuration
│   │   ├── config/agentDefinitions.js         Agent modules and form definitions
│   │   ├── controllers/                       Agent and CRM request handlers
│   │   ├── db/                                SQLite connection, schema and seed data
│   │   ├── middleware/errorHandler.js         Consistent API error responses
│   │   ├── routes/                             Agent, history, CRM, task and template routes
│   │   ├── services/                           Agent, task, client, team, template and chat logic
│   │   └── validators/                         Agent and CRM input validation
│   └── tests/                                  API, controller, service, validator and CRM tests
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── agent-center/                    Agent dashboard
│   │   │   ├── agents/                         Agent creation, details and draft editing
│   │   │   ├── api/                            Gmail OAuth, profile, threads and send handlers
│   │   │   ├── connections/                    Gmail and WhatsApp connection status
│   │   │   ├── email/                          Gmail inbox
│   │   │   ├── history/                         Agent execution history
│   │   │   ├── tasks/                           CRM task list and task details
│   │   │   ├── templates/                       Communication template management
│   │   │   └── whatsapp/                        WhatsApp inbox
│   │   ├── components/
│   │   │   ├── connections/                     Connection cards and QR display
│   │   │   ├── email/                           Email list, thread and compose components
│   │   │   ├── tasks/                           Task creation, linking and conversion components
│   │   │   └── whatsapp/                        Chat list, thread and message composer
│   │   ├── lib/                                 Gmail parsing, MIME and Socket.IO helpers
│   │   ├── services/                            Backend and CRM API clients
│   │   └── store/                               Redux Toolkit slices and provider
│   └── .env.example                             Frontend configuration template
├── whatsapp-server/
│   ├── index.js                                 Socket.IO WhatsApp bridge
│   ├── package.json                             Bridge dependencies and scripts
│   └── .env.example                             Bridge configuration template
├── docs/
│   ├── MIGRATION_PLAN.md                        Migration milestones and implementation scope
│   └── agents.md                                Agent/project instructions
├── README.md
└── .gitignore
```

### Main application flows

- **Agent Center:** create, edit, publish, disable and simulate Task, DSC and License agents.
- **CRM tasks:** create and manage tasks, clients, assignees, statuses, priorities and linked communications.
- **Templates:** create, search, edit, preview and delete reusable communication templates.
- **Gmail:** authenticate with Google OAuth, list threads, view messages, send email and link email activity to tasks.
- **WhatsApp:** authenticate through the QR code, load chats and messages, send messages and convert or link messages to tasks.
- **Task badges:** linked email and WhatsApp conversations display the associated task code.

## 8. Known limitations

- Agent executions remain simulated; there is no background scheduler or real Task/DSC/License event processor.
- Gmail and WhatsApp require external account access and valid local credentials. They are not available from a clean checkout until configured.
- Gmail OAuth credentials and `SESSION_SECRET` must remain in an untracked local environment file.
- WhatsApp uses `whatsapp-web.js` and a persisted local browser session. The QR code must be scanned on first authentication.
- The WhatsApp bridge includes compatibility extraction for WhatsApp Web changes; updates to WhatsApp Web may still require library changes.
- There is no authentication or multi-user authorization for the local application.
- Published agents are read-only and disabled agents cannot be re-enabled.
- The frontend has lint/build validation, but no automated browser test suite.
- Agent Center history is capped at 250 rows per request; the CRM task list uses server-side pagination.
