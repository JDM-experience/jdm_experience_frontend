# jdm_experience_backend

Node.js/TypeScript API for [`jdm_experience_frontend`](https://github.com/achilleslucas79-bot/jdm_experience_frontend).
The full endpoint spec (grouped by Jira epic/story) lives in that repo at
`docs/BACKEND_REQUIREMENTS.md`; this project implements it.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Server starts on `http://localhost:3000` (see `.env`). Health check: `GET /api/health`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot-reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`dist/server.js`) |

## Structure

```
src/
  config/       env loading + typed config
  routes/       Express routers, mounted under /api
  controllers/  request handlers (route -> service glue)
  services/     business logic, DB access
  middleware/   error handling, auth guards, etc.
  models/       DB schema/models
  types/        shared TS types
  utils/        pure helpers
```

Route/controller/service/model split follows one epic per story in
`BACKEND_REQUIREMENTS.md` (auth, tours, cart/checkout, customers, messages, uploads).
