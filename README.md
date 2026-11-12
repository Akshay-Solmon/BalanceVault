# BalanceVault

A modern fintech web app built with React, TypeScript, and Three.js.

🌐 **Live Frontend:** https://balance-vault-three.vercel.app  
🔌 **Live Backend API:** https://balancevault-backend-0mlz.onrender.com

---

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Deployment Guide](#deployment-guide)
  - [Frontend (Vercel)](#frontend-vercel)
  - [Backend (Render)](#backend-render)
  - [Neon PostgreSQL Setup](#neon-postgresql-setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Folder Structure](#folder-structure)
- [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Project Overview
BalanceVault provides a clean, trustworthy UI for managing accounts, transfers, and audits. It follows the design tokens defined in `tokens/designTokens.ts` and uses **react‑three‑fiber** for subtle 3D effects.

---

## Prerequisites
- Node.js **20 LTS** (recommended)
- Yarn or npm (npm is used in CI/CD)
- Docker (for building the backend image locally)
- A **GitHub** account with access to `https://github.com/Akshay-Solmon/BalanceVault`
- **Vercel** account (free tier works)
- **Render** account (free starter tier works)
- **Neon** account (free tier for PostgreSQL)

---

## Local Development
```bash
# Clone the repo (once the remote exists)
git clone https://github.com/Akshay-Solmon/BalanceVault.git
cd BalanceVault

# Install dependencies for both frontend and backend
npm ci   # installs root dev dependencies (includes workspace support)

# Frontend
cd frontend
npm ci
cp .env.example .env   # fill VITE_API_BASE if needed
npm run dev            # starts Vite dev server at http://localhost:5173

# Backend
cd ../backend
npm ci
cp .env.example .env   # set DATABASE_URL to your local Neon connection string
npx prisma migrate dev # apply schema locally
npm run dev            # starts backend (usually on http://localhost:3000)
```

---

## Deployment Guide
### Frontend – Vercel
1. **Create a Vercel project** and link it to the GitHub repository.
2. Vercel automatically detects the `frontend` folder because of the `vercel.json` at the repo root.
3. **Environment Variables** – add:
   - `VITE_API_BASE` – URL of the Render backend service (e.g., `https://balancevault-backend.onrender.com/api`).
4. **Build Settings** – Vercel uses the `@vercel/static-build` builder with `distDir: "frontend/dist"` (defined in `vercel.json`).
5. Deploy – push to `main/master` and Vercel will run `npm install && npm run build` inside `frontend`.

### Backend – Render
1. **Create a New Service** on Render → **Web Service**.
2. Choose **Docker** as the runtime.
3. Point the service to the GitHub repo and set the **Dockerfile path** to `backend/Dockerfile`.
4. **Environment Variables** – add:
   - `DATABASE_URL` – Neon connection string (see Neon setup).
   - `NODE_ENV=production` (optional, Render adds this automatically).
5. Render will build the Docker image, run migrations (`npx prisma migrate deploy`), and start the app on port `3000`.
6. After the service is live, note the generated URL (e.g., `https://balancevault-backend.onrender.com`). This is the value for the frontend `VITE_API_BASE`.

### Neon PostgreSQL Setup
1. Sign in to the **Neon** console and create a new project.
2. In the project dashboard, copy the **connection string** (it looks like `postgresql://...`).
3. Add this string as the `DATABASE_URL` environment variable on Render (and locally in `.env`).
4. Run `npx prisma migrate deploy` on Render (handled automatically by the Dockerfile) or locally with `npx prisma migrate dev`.

---

## Environment Variables
| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_API_BASE` | Frontend (Vercel) | Base URL for backend API calls |
| `DATABASE_URL` | Backend (Render) | Neon PostgreSQL connection string |
| `NODE_ENV` | Backend | Usually `production` |

---

## Scripts
| Script | Location | Description |
|--------|----------|-------------|
| `npm run dev` | `frontend` | Starts Vite dev server |
| `npm run build` | `frontend` | Produces production assets in `dist/` |
| `npm start` | `backend` | Starts the compiled backend server |
| `npm run build` | `backend` | Transpiles TypeScript (if present) |
| `npx prisma generate` | `backend` | Generates Prisma client |
| `npx prisma migrate dev` | `backend` | Applies migrations locally |
| `npx prisma migrate deploy` | `backend` (Docker) | Applies migrations on Render |

---

## Folder Structure
```
BalanceVault/
├─ frontend/               # React app
│   ├─ src/                # Components, pages, three‑fiber scenes
│   ├─ public/             # Static assets
│   ├─ vite.config.ts      # Vite config
│   └─ vercel.json         # (auto‑picked from root)
├─ backend/                # API server (Express/Fastify)
│   ├─ src/                # Controllers, services
│   ├─ prisma/             # Prisma schema & migrations
│   ├─ Dockerfile          # Render deployment image
│   └─ render.yaml         # Optional Render config file
├─ tokens/                 # Design token definitions
│   └─ designTokens.ts
├─ .gitignore
├─ README.md               # This file
└─ vercel.json             # Vercel static‑build config
```

---

## FAQ & Troubleshooting
**Q:** *My Vercel build fails because it cannot find `frontend/dist`.*
**A:** Ensure `vercel.json` points to the correct `distDir`. The current config uses `frontend/dist` which matches the default Vite output.

**Q:** *Render shows `DATABASE_URL not set`.*
**A:** Add the variable in the Render service settings. Use the exact name `DATABASE_URL` and paste the Neon connection string.

**Q:** *Frontend cannot reach the backend (CORS errors).*
**A:** Add CORS middleware on the backend allowing origin `*` for development or the specific Vercel domain for production.

**Q:** *3D animations are jittery on low‑end devices.*
**A:** The UI respects `prefers-reduced-motion` – the 3‑D components lazy‑load and fallback to a static gradient when `window.devicePixelRatio > 2` or motion is reduced.

---

*Happy coding! 🎉*
