# Deploying HireFlow to AWS EC2 with Docker

## Architecture

```
                 Internet
                    │  http://<app-public-ip>
          ┌─────────▼──────────────────────────┐
EC2 #1    │ frontend container (nginx :80)     │  serves React, forwards /api → backend
"app"     │ backend container  (node :8000)    │  not exposed to the internet
          └─────────┬──────────────┬───────────┘
                    │ :5432        │ IAM role (no keys)
          ┌─────────▼─────────┐    ▼
EC2 #2    │ postgres :5432    │   S3 bucket jobboard-hireflow (resumes)
"db"      │ pgadmin  :5050    │
          └───────────────────┘
Images are stored in Amazon ECR (hireflow-backend, hireflow-frontend).
```

Everything is in **us-east-1** (same region as the S3 bucket).

---

## Step 0 – Test the images locally (Docker Desktop)

From the `HIRING-PLATFORM` folder:
```powershell
docker compose up --build
```
Open http://localhost:8080. This starts a fresh Postgres (port 5433) with the tables already created,
the backend, and the frontend behind nginx. Stop with `Ctrl+C`, remove everything with `docker compose down -v`.

---

## Step 1 – Push the images to ECR

Your laptop's `hireflow-local` IAM user can only touch S3 resumes. For ECR, either use an admin
profile or add this inline policy to a deploy user: **AmazonEC2ContainerRegistryPowerUser** (AWS managed).

```powershell
.\deploy\push-images.ps1
```
It creates the two ECR repositories (first time), logs Docker in to ECR, builds for `linux/amd64` and pushes:
- `<account>.dkr.ecr.us-east-1.amazonaws.com/hireflow-backend:latest`
- `<account>.dkr.ecr.us-east-1.amazonaws.com/hireflow-frontend:latest`

> If PowerShell blocks the script: `Set-ExecutionPolicy -Scope Process Bypass` then run it again.

---

## Step 2 – IAM role for the app server

IAM → **Roles** → Create role → Trusted entity: **AWS service → EC2** → attach:
- `AmazonEC2ContainerRegistryReadOnly` (pull images)
- your S3 resume policy (`HireFlowResumesAccess`, or create the same inline JSON)

Name it `hireflow-app-role`.

---

## Step 3 – Security groups (EC2 → Security Groups → Create)

| Name | Inbound rule | Source |
|---|---|---|
| `hireflow-app-sg` | HTTP 80 | `0.0.0.0/0` (everyone) |
| | SSH 22 | **My IP** |
| `hireflow-db-sg` | PostgreSQL 5432 | **`hireflow-app-sg`** (pick the security group, not an IP) |
| | Custom TCP 5050 (pgAdmin) | **My IP** |
| | SSH 22 | **My IP** |

The database is never open to the internet: only the app server can reach port 5432.

---

## Step 4 – Launch the two EC2 instances

EC2 → **Launch instance** (do this twice):

| Setting | DB server | App server |
|---|---|---|
| Name | `hireflow-db` | `hireflow-app` |
| AMI | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS |
| Instance type | t3.micro (free tier) | t3.micro (free tier) |
| Key pair | create `hireflow-key` (.pem) once, reuse | `hireflow-key` |
| Security group | `hireflow-db-sg` | `hireflow-app-sg` |
| Storage | 20 GB gp3 | 15 GB gp3 |
| IAM instance profile | none | `hireflow-app-role` |
| User data (Advanced details) | paste `deploy/ec2-user-data.sh` | paste `deploy/ec2-user-data.sh` |

User data installs Docker, Docker Compose, AWS CLI and swap automatically (wait ~3 minutes after launch).

Note each instance's **Public IPv4** and the DB server's **Private IPv4** address.

**Windows: fix the .pem permissions once** (otherwise ssh refuses the key):
```powershell
icacls "$HOME\Downloads\hireflow-key.pem" /inheritance:r /grant:r "$($env:USERNAME):R"
```

---

## Step 5 – Start PostgreSQL + pgAdmin on the DB server

Copy the files (from `HIRING-PLATFORM`):
```powershell
scp -i "$HOME\Downloads\hireflow-key.pem" -r deploy\db\docker-compose.yml deploy\db\init deploy\db\.env.example ubuntu@<DB_PUBLIC_IP>:~/hireflow/
```
SSH in and start:
```bash
ssh -i ~/Downloads/hireflow-key.pem ubuntu@<DB_PUBLIC_IP>
cd ~/hireflow
cp .env.example .env && nano .env        # set strong passwords
docker compose up -d
docker compose ps                         # postgres should be "healthy"
docker compose exec postgres psql -U hireflow -d jobboard -c '\dt'   # 5 tables
```
pgAdmin: open `http://<DB_PUBLIC_IP>:5050`, log in with `PGADMIN_EMAIL` / `PGADMIN_PASSWORD`,
then **Add New Server** → Connection: Host `postgres`, Port `5432`, user/password from `.env`.

---

## Step 6 – Start frontend + backend on the app server

```powershell
scp -i "$HOME\Downloads\hireflow-key.pem" deploy\app\docker-compose.yml deploy\app\.env.example deploy\app\.env.backend.example ubuntu@<APP_PUBLIC_IP>:~/hireflow/
```
```bash
ssh -i ~/Downloads/hireflow-key.pem ubuntu@<APP_PUBLIC_IP>
cd ~/hireflow
cp .env.example .env && nano .env                     # set ECR_REGISTRY
cp .env.backend.example .env.backend && nano .env.backend   # DB private IP, DB password, JWT_SECRET, CORS_ORIGIN

# log in to ECR using the instance role (no keys needed)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker compose pull
docker compose up -d
docker compose ps
curl localhost/health          # {"status":"ok","db":"up"}
```
Open **http://<APP_PUBLIC_IP>** in your browser. 🎉

---

## Updating after a code change

1. Laptop: `.\deploy\push-images.ps1`
2. App server: `docker compose pull && docker compose up -d`

## Useful commands on the servers

```bash
docker compose logs -f backend        # structured JSON logs
docker compose restart backend
docker compose down                   # stop (data volume is kept)
docker system prune -f                # remove old images
```

## Troubleshooting

| Problem | Check |
|---|---|
| `/health` shows `"db":"down"` | DB private IP / password in `.env.backend`; `hireflow-db-sg` allows 5432 from `hireflow-app-sg` |
| `docker compose pull` → no basic auth / denied | Run the `aws ecr get-login-password` login again; role has `AmazonEC2ContainerRegistryReadOnly` |
| Resume upload fails | App server's IAM role has the S3 policy; `S3_BUCKET` and `AWS_REGION=us-east-1` |
| Site doesn't load | `hireflow-app-sg` allows port 80; `docker compose ps` shows frontend running |
| `ssh: Permissions for key are too open` | Run the `icacls` command from Step 4 |

## Production improvements (talking points)

- **HTTPS**: put a domain on it and use Caddy / Let's Encrypt, or an Application Load Balancer + ACM certificate.
- **RDS** instead of Postgres on EC2: automated backups, patching and failover.
- **Backups** now: `docker compose exec postgres pg_dump -U hireflow jobboard > backup.sql` (cron + upload to S3).
- **CI/CD**: GitHub Actions builds and pushes to ECR on every push to `main`, then deploys over SSH.
- **Secrets**: move `.env.backend` values to AWS SSM Parameter Store.
