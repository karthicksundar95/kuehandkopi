## Kueh & Kopi — Mango campaign site

Pitch-ready microsite: pinned scroll hero (GSAP) for mango drinks, a memory game, and a FastAPI backend that issues short-lived win tokens and unique in-store redemption codes.

### Project layout

- [`frontend/`](frontend/) — Vite + React + TypeScript + GSAP (`public/mango_drinks/` holds the drink manifest and images).
- [`backend/`](backend/) — FastAPI + SQLite + JWT win tokens + redemption code pool.

### Brand assets

- Place your logo at `frontend/public/logo.png` (or keep `public/logo.svg`) and sample colours into [`frontend/src/theme.css`](frontend/src/theme.css).
- Add real drink photos under `frontend/public/mango_drinks/` and update [`frontend/public/mango_drinks/manifest.json`](frontend/public/mango_drinks/manifest.json) (paths and labels). The memory game needs **at least eight** drinks in the manifest.

### Configuration

- Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and set a strong `JWT_SECRET`.
- Optional: copy [`.env.example`](.env.example) to `.env` for `VITE_API_BASE` if the API is on a different origin.
- Edit order links in [`frontend/src/config.ts`](frontend/src/config.ts) (Swiggy, Zomato, Instagram).

### Local development

**Why `uv init` at the repo root?** That only created a minimal root [`pyproject.toml`](pyproject.toml) (empty `dependencies`). The API dependencies are declared in [`backend/pyproject.toml`](backend/pyproject.toml) (and mirrored in [`backend/requirements.txt`](backend/requirements.txt)). Use **`uv` in `backend/`** to install and run the server — you do not need a separate `python3 -m venv` unless you prefer it.

If you ever see **`[Errno 28] No space left on device`**, free disk space first, then remove a broken partial venv (`rm -rf backend/.venv`) and run `uv sync` again.

**Terminal 1 — API (recommended: uv)**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 1 — API (pip + venv, alternative)**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/health` to `http://127.0.0.1:8000` (see [`frontend/vite.config.ts`](frontend/vite.config.ts)).

### Deploy frontend on Vercel

This repo has **two apps** (`frontend/` + `backend/`), so Vercel needs an explicit build. The root [`vercel.json`](vercel.json) builds only the Vite app and publishes `frontend/dist`.

1. Import the Git repo in Vercel (leave **Root Directory** as the repository root so `vercel.json` applies).
2. Add **`VITE_API_BASE`** (no trailing slash) so the SPA can reach the API. For the same Vercel deployment with `/_/backend` routing, use your site origin plus the backend prefix, e.g. `https://your-project.vercel.app/_/backend`. If the API is hosted elsewhere, use that base URL instead.
3. Deploy. The FastAPI backend must be hosted separately (Render, Fly, Railway, etc.); Vercel serves the static SPA only.

**Alternative:** In the Vercel project settings, set **Root Directory** to `frontend` and use the default Vite preset; you can remove or simplify `vercel.json` in that case.

### Production (single origin)

Build the frontend, then run Uvicorn from the repo root so `frontend/dist` exists next to `backend`:

```bash
cd frontend && npm run build
cd ../backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If `frontend/dist` is present, the API serves the SPA and static assets from the same host (CORS can be tightened to your domain).

### API overview

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/game/start` | Create a game session |
| `POST` | `/api/game/complete` | Mark session as won; returns JWT `win_token` |
| `POST` | `/api/claim` | Submit lead + `win_token`; returns redemption `code` |
| `GET` | `/health` | Health check |

Redemption codes are seeded into SQLite on startup (see [`backend/app/seed.py`](backend/app/seed.py)).
