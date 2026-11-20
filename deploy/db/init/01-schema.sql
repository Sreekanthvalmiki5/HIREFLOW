-- Runs automatically ONCE, the first time the Postgres container starts with an empty data volume.
-- Same schema as your local database (with the column-name fixes already applied).

CREATE TYPE role AS ENUM ('CANDIDATE','RECRUITER','ADMIN');
CREATE TYPE job_status AS ENUM ('DRAFT','OPEN','CLOSED');
CREATE TYPE employment_type AS ENUM ('FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP');
CREATE TYPE application_status AS ENUM ('APPLIED','SHORTLISTED','INTERVIEW','REJECTED','HIRED');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          role NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruiters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  company_website TEXT,
  designation     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone             TEXT,
  headline          TEXT,
  location          TEXT,
  experience_years  INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  skills            TEXT[] NOT NULL DEFAULT '{}',
  resume_key        TEXT,
  resume_file_name  TEXT,
  resume_updated_at TIMESTAMPTZ,
  resume_text       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id    UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  location        TEXT NOT NULL,
  employment_type employment_type NOT NULL DEFAULT 'FULL_TIME',
  min_experience  INT NOT NULL DEFAULT 0,
  max_experience  INT,
  salary_min      INT,
  salary_max      INT,
  skills          TEXT[] NOT NULL DEFAULT '{}',
  status          job_status NOT NULL DEFAULT 'OPEN',
  views_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  CHECK (max_experience IS NULL OR max_experience >= min_experience),
  CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);
CREATE INDEX idx_jobs_recruiter      ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);

CREATE TABLE applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id      UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status            application_status NOT NULL DEFAULT 'APPLIED',
  match_score       REAL CHECK (match_score BETWEEN 0 AND 100),
  cover_letter      TEXT,
  recruiter_note    TEXT,
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);
CREATE INDEX idx_app_job_status ON applications(job_id, status);
CREATE INDEX idx_app_candidate  ON applications(candidate_id);

CREATE TRIGGER trg_users_updated        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recruiters_updated   BEFORE UPDATE ON recruiters   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_candidates_updated   BEFORE UPDATE ON candidates   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_jobs_updated         BEFORE UPDATE ON jobs         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
