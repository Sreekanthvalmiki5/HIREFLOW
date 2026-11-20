# Builds the backend + frontend images and pushes them to Amazon ECR.
# Run from the HIRING-PLATFORM folder:   .\deploy\push-images.ps1
# Optional:  .\deploy\push-images.ps1 -Region us-east-1 -Tag v2
param(
  [string]$Region = "us-east-1",
  [string]$Tag = "latest"
)
$ErrorActionPreference = "Stop"

$AccountId = (aws sts get-caller-identity --query Account --output text)
if (-not $AccountId) { throw "AWS CLI is not configured. Run 'aws configure' first." }
$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
Write-Host "Registry: $Registry  Tag: $Tag" -ForegroundColor Cyan

# Create the repositories the first time (ignore 'already exists').
foreach ($repo in @("hireflow-backend", "hireflow-frontend")) {
  aws ecr describe-repositories --repository-names $repo --region $Region *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating ECR repository $repo" -ForegroundColor Yellow
    aws ecr create-repository --repository-name $repo --region $Region --image-scanning-configuration scanOnPush=true | Out-Null
  }
}

# Log Docker in to ECR (token is valid for 12 hours).
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry
if ($LASTEXITCODE -ne 0) { throw "docker login to ECR failed" }

# EC2 runs linux/amd64, so build for that platform.
foreach ($svc in @("backend", "frontend")) {
  $image = "$Registry/hireflow-${svc}:$Tag"
  Write-Host "`nBuilding $image" -ForegroundColor Cyan
  docker build --platform linux/amd64 -t $image ".\$svc"
  if ($LASTEXITCODE -ne 0) { throw "build failed for $svc" }
  docker push $image
  if ($LASTEXITCODE -ne 0) { throw "push failed for $svc" }
}

Write-Host "`nDone. On the app server run:  docker compose pull && docker compose up -d" -ForegroundColor Green
