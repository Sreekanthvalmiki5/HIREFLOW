# HireFlow – Hiring Platform

Full-stack job board where **recruiters** post jobs and review applicants ranked by skill match, and **candidates** build a profile, upload a resume and apply.

**Stack:** React 19 + TypeScript + Vite + Tailwind + TanStack Query + Zustand + React Hook Form · Node.js + Express 5 + Zod + JWT + pino · PostgreSQL + Prisma · AWS S3 · Docker · AWS EC2 + ECR

```
backend/    REST API (see backend/README.md)
frontend/   React app (see frontend/README.md)
deploy/     Docker Compose files + scripts for the two EC2 servers
DEPLOY.md   Step-by-step AWS deployment guide
```

## Run locally with Docker
```bash
docker compose up --build
```
Open http://localhost:8080 (Postgres with the schema starts automatically).

## Run locally without Docker
See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## Architecture on AWS
```
Browser ─► EC2 app: nginx (frontend) ─/api─► Node backend ─► EC2 db: PostgreSQL (+ pgAdmin)
                                                   └─► S3 (private resumes, pre-signed URLs)
Images in ECR · EC2 IAM role (no access keys) · DB port open only to the app security group
```

## Key features
- JWT auth with candidate / recruiter roles, enforced on every route
- Zod validation on every request body, query and route param
- Applicants ranked by skill-match score; recruiter pipeline (shortlist → interview → hire)
- Resumes in a private S3 bucket, viewed through 5-minute pre-signed URLs
- Structured JSON logging with request ids
- Multi-stage Docker images, health checks, Docker Compose deployment
