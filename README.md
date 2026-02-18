# kiddies-census-api

REST API for **Kiddies** — a church census system for tracking children’s ministry attendance, teachers, and offerings (“Counting God’s Army”). This service handles auth, census data, and settings.

## What it does

- **Auth** — Login and register (register requires a valid invite token). JWT is issued on login/register; protected routes use `Authorization: Bearer <token>`. First registered user is made admin.
- **Invites** — Admins send invites by email; invite links point to the frontend (using `FRONTEND_URL`). New users complete onboarding with token, name, phone, password.
- **Census** — Create census entries (date, service, age brackets, teachers, offering, tithe); get census by date; list census dates; get report for a date range; dashboard stats (e.g. monthly attendance, growth).
- **Settings** — Services (CRUD), motto (get/update), logo (get/update as base64). Stored in a `Settings` collection with keys like `services`, `motto`, `logo`.
- **Profile** — Get/update authenticated user profile (name, phone, image).
- **Admin** — Get all users (admin only).
- **Health** — `GET /api/health` for liveness checks.

All persistent data is in **MongoDB** (local or Atlas). CORS is configured using `FRONTEND_URL` so only the configured frontend origin can call the API.

## Tech stack

- **Node.js** + **Express** + **TypeScript**
- **MongoDB** via **Mongoose**
- **JWT** (jsonwebtoken) for auth
- **bcryptjs** for password hashing
- **Nodemailer** for invite emails
- **dotenv** for env config
- **cors** for allowed origin

## Prerequisites

- Node.js (v18+)
- MongoDB (local or MongoDB Atlas). Use a database name in the URI (e.g. `.../kiddies`).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Create a `.env` in this directory. Copy from `env.example` or see `documentation/ENV_SETUP.md`. Required/minimal:

   - `MONGODB_URI` — Connection string (include DB name, e.g. `.../kiddies`)
   - `JWT_SECRET` — Long random string for signing JWTs
   - `FRONTEND_URL` — Frontend origin for CORS and invite links (e.g. `http://localhost:3000` in dev, Netlify URL in prod)
   - For invites: `EMAIL_*` (e.g. Gmail + App Password)

3. **Seed (optional)**

   Creates a default admin user (see `documentation/SEED.md`):

   ```bash
   npm run seed
   ```

   Default: `admin@church.org` / `password` (override with `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env` if needed).

4. **Run locally**

   ```bash
   npm run dev
   ```

   API runs at **http://localhost:5001** (or the port in `PORT`). Routes are under `/api` (e.g. `/api/auth/login`, `/api/census`, `/api/settings`, `/api/health`).

## Scripts

| Command          | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start with nodemon (TS)        |
| `npm run build`  | Compile TypeScript to `dist/`  |
| `npm start`      | Run `dist/server.js` (prod)    |
| `npm run seed`   | Run seed script (default admin)|

## Project structure (main bits)

- `src/server.ts` — App entry, CORS, routes, DB connect
- `src/routes/` — `authRoutes`, `censusRoutes`, `settingsRoutes`
- `src/controllers/` — Auth, census, settings logic
- `src/models/` — User, Invite, Census, Settings (Mongoose)
- `src/middleware/auth.ts` — JWT auth and admin check
- `src/utils/` — JWT, email helpers
- `src/scripts/seed.ts` — Default admin seed
- `documentation/` — ENV_SETUP, SEED, Postman collection

## API overview

| Base path     | Description                          |
|---------------|--------------------------------------|
| `/api/auth`   | Login, register, invite, verify-invite, profile, users |
| `/api/census` | Stats, create, dates, by date, report |
| `/api/settings` | Services, motto, logo, get/update by key |
| `/api/health` | Liveness check                       |

Use the Postman collection in `documentation/` (or repo root) to hit all endpoints; Login/Register scripts save the token for authenticated requests.

## Deployment

- Set `NODE_ENV=production`, `PORT` (e.g. Render provides it), `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (your frontend URL for CORS and emails), and `EMAIL_*` if you use invites.
- **Render:** Use **Build command** `npm run render-build` (or `npm install --include=dev && npm run build`) so devDependencies (TypeScript, `@types/*`) are installed and the project compiles. Start: `node dist/server.js`.
- Start: `npm start`

See the repo root **DEPLOYMENT.md** for hosting the backend on Render (free tier) with the frontend on Netlify.
