# Hiring Platform – Backend API

Node.js + Express 5 + TypeScript REST API with **Zod** validation, **JWT** auth,
**Prisma** (PostgreSQL), **pino** structured logging and **S3** resume storage.

## Run locally

1. The tables already exist (created in pgAdmin), so Prisma only needs to generate its client.
2. Create `.env` from the example and fill in your Postgres password and a JWT secret:
   ```powershell
   Copy-Item .env.example .env
   ```
   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. Install, generate, run:
   ```powershell
   npm install
   ```
   ```powershell
   npx prisma generate
   ```
   ```powershell
   npm run dev
   ```
4. Check: `http://localhost:4000/health` → `{"status":"ok","db":"up"}`

> Do **not** run `prisma migrate dev` – it would try to recreate the tables you made in pgAdmin.

## Project structure

```
src/
  config/env.ts            Zod-validated environment variables (fail fast)
  lib/                     prisma client, pino logger, S3 helpers
  middleware/auth.ts       requireAuth (JWT) + requireRole
  middleware/error.ts      one place that turns errors into JSON responses
  modules/
    auth/                  register, login, me
    recruiters/            recruiter profile + my jobs
    candidates/            candidate profile, resume upload, my applications
    jobs/                  public listing, CRUD, apply, applicants
    applications/          status change, resume link, withdraw
  app.ts                   express app (middleware + routes)
  server.ts                starts server, graceful shutdown
```

## Endpoints

Auth header for protected routes: `Authorization: Bearer <token>`

| Method | Path | Who | What |
|---|---|---|---|
| POST | /api/auth/register | public | Register candidate or recruiter (recruiter needs `companyName`) |
| POST | /api/auth/login | public | Returns `{ token, user }` |
| GET | /api/auth/me | logged in | Current user + profile |
| GET | /api/recruiters/me | recruiter | My recruiter profile |
| PATCH | /api/recruiters/me | recruiter | Update company / designation |
| GET | /api/recruiters/me/jobs | recruiter | My jobs with applicant counts |
| GET | /api/candidates/me | candidate | My profile |
| PATCH | /api/candidates/me | candidate | Update phone, headline, skills… |
| PUT | /api/candidates/me/resume | candidate | Upload resume (form-data field `resume`, PDF/DOCX ≤ 5 MB) to S3 |
| GET | /api/candidates/me/applications | candidate | Jobs I applied to + status |
| GET | /api/jobs | public | Open jobs. Query: `q, location, skill, employmentType, page, limit` |
| GET | /api/jobs/:id | public | Job detail (increments views) |
| POST | /api/jobs | recruiter | Create job |
| PATCH | /api/jobs/:id | owner | Update job / close it |
| DELETE | /api/jobs/:id | owner | Delete job |
| GET | /api/jobs/:id/applications | owner | Applicants. Query: `status, minScore` |
| POST | /api/jobs/:id/apply | candidate | Apply (one per job; gets a skill match score) |
| PATCH | /api/applications/:id/status | owner | Shortlist / interview / reject / hire |
| GET | /api/applications/:id/resume | owner | 5-minute pre-signed S3 link |
| DELETE | /api/applications/:id | candidate | Withdraw (only while APPLIED) |
| GET | /health | public | API + database health |

All errors look like: `{ "error": { "code": "...", "message": "...", "details": ... } }`

## Example requests (Postman or PowerShell)

```powershell
$r = Invoke-RestMethod -Method Post http://localhost:4000/api/auth/register -ContentType "application/json" -Body '{"role":"RECRUITER","firstName":"Ravi","lastName":"Kumar","email":"ravi@acme.com","password":"password123","companyName":"Acme"}'
$h = @{ Authorization = "Bearer $($r.token)" }
Invoke-RestMethod -Method Post http://localhost:4000/api/jobs -Headers $h -ContentType "application/json" -Body '{"title":"React Developer","description":"Build hiring dashboards in React and TypeScript.","location":"Hyderabad","skills":["react","typescript"]}'
Invoke-RestMethod http://localhost:4000/api/jobs
```

## Design decisions (for the review)

- **Validation at the edge:** every body, query and `:id` param goes through Zod; bad input → 400 with field errors.
- **Auth:** bcrypt (12 rounds) password hashes, HS256 JWT with pinned algorithm, role checks via `requireRole`. Login uses the same error and timing for unknown email vs wrong password.
- **Ownership:** recruiters can only see/change their own jobs and applicants; others get 404 so ids can't be probed.
- **Data integrity in the DB:** `UNIQUE(job_id, candidate_id)` stops double applications even under race conditions; views use an atomic `increment`.
- **Counts are computed** (applicants, postings), not stored, so they never go stale.
- **Logging:** pino JSON logs with a request id (also returned as `x-request-id`); tokens and passwords are redacted.
- **Resumes:** private S3 bucket; DB stores only the key; recruiters get a 5-minute pre-signed URL. File type checked by mimetype *and* magic bytes.

## Next steps

- Rate limit `/api/auth/login` (express-rate-limit + Redis).
- Move match scoring to a BullMQ job using an LLM on `resume_text`.
- Dockerfile + docker-compose (api + postgres + redis).
