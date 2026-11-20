# HireFlow – Frontend

React 19 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui-style components (Radix UI).
Data with **TanStack Query**, auth state with **Zustand**, forms with **React Hook Form + Zod**, routing with **React Router**.

## Run

```powershell
cd C:\Users\valmi\Downloads\HIRING-PLATFORM\frontend
```
```powershell
npm install
```
```powershell
npm run dev
```
Open http://localhost:5173. The backend must be running (see `../backend`).
`.env` sets the API URL: `VITE_API_URL=http://localhost:8000/api`.

## Test accounts (local database only)

| Role | Email | Password |
|---|---|---|
| Recruiter | recruiter.test@hireflow.test | TestPass123! |
| Candidate | candidate.test@hireflow.test | TestPass123! |

## Pages

| Path | Who | What |
|---|---|---|
| `/` | everyone | Landing page, search, latest jobs |
| `/jobs` | everyone | Job board with search, filters, pagination (filters live in the URL) |
| `/jobs/:id` | everyone | Job detail; candidates apply here (cover letter dialog) |
| `/login`, `/register` | guests | Register as candidate or recruiter |
| `/candidate` | candidate | Dashboard: stats, profile strength, recent applications, recommended jobs |
| `/candidate/applications` | candidate | All applications with status tabs, withdraw |
| `/candidate/profile` | candidate | Profile, skills, resume upload (S3) |
| `/recruiter` | recruiter | Dashboard: stats, jobs table, close/reopen/delete |
| `/recruiter/jobs/new`, `/recruiter/jobs/:id/edit` | recruiter | Create / edit job |
| `/recruiter/jobs/:id/applicants` | recruiter | Pipeline: applicants ranked by match, move status, notes, view resume |
| `/recruiter/profile` | recruiter | Company profile |

Candidates use a **top-navbar** layout; recruiters get a **sidebar dashboard** layout.

## Structure

```
src/
  hooks/queries.ts      every API call as a TanStack Query hook
  lib/api.ts            axios instance (adds JWT, logs out on 401) + error messages
  store/auth.ts         Zustand store (token + user, persisted)
  components/ui/        button, input, card, badge, dialog, dropdown (shadcn style)
  components/           shared pieces (JobCard, TagInput, ProtectedRoute, UserMenu…)
  layouts/              PublicLayout (navbar), RecruiterLayout (sidebar)
  pages/                one folder per area
```
