-- Fixes typos from creating the tables by hand in pgAdmin, so the DB matches prisma/schema.prisma.
-- Renames and type changes keep all existing data. Runs in one transaction.
BEGIN;

ALTER TABLE candidates   RENAME COLUMN resume_filename TO resume_file_name;
ALTER TABLE applications RENAME COLUMN recruiter_not   TO recruiter_note;

-- Use timestamptz everywhere (existing values are interpreted in the server's time zone).
ALTER TABLE users      ALTER COLUMN created_at TYPE timestamptz, ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE recruiters ALTER COLUMN created_at TYPE timestamptz, ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE candidates ALTER COLUMN created_at TYPE timestamptz, ALTER COLUMN updated_at TYPE timestamptz,
                       ALTER COLUMN resume_updated_at TYPE timestamptz;

COMMIT;
