# MYdeploy Platform — Deploy Runbook

Deploy MYdeploy itself to Azure Container Apps (dogfooding).

## Prerequisites

| Tool | Min version |
|---|---|
| Azure CLI | 2.60+ |
| Bicep | 0.26+ (`az bicep install`) |
| Docker Desktop | running |
| GitHub CLI (`gh`) | authenticated |
| Node.js | 20.9+ |

```bash
az login
az account set --subscription <your-subscription-id>
gh auth login
```

---

## Step 0 — Generate secrets

```powershell
# JWT secret (64-char hex)
$env:JWT_SECRET = (openssl rand -hex 32)

# Strong Postgres password
$env:POSTGRES_ADMIN_PASSWORD = "MyStr0ng!Passw0rd"
```

---

## Step 1 — Provision infrastructure

```powershell
cd platform/infrastructure/scripts
.\01-provision.ps1
```

Note the outputs — you need them for Step 2.

---

## Step 2 — Push secrets to Key Vault

```powershell
$env:KV_NAME               = "<from step 1>"
$env:POSTGRES_HOST         = "<from step 1>"
$env:GITHUB_TOKEN          = "ghp_..."   # PAT with repo+workflow scope
.\02-push-secrets.ps1
```

---

## Step 3 — Wire up GitHub Actions

Create a GitHub repo for the platform code, then:

```powershell
$env:GITHUB_ORG            = "<your-org>"
$env:GITHUB_REPO           = "mydeploy"
$env:AZURE_SUBSCRIPTION_ID = "<sub-id>"
$env:AZURE_TENANT_ID       = "<tenant-id>"
$env:RG_NAME               = "rg-mydeploy-prod"
$env:ACR_LOGIN_SERVER      = "<from step 1>"
$env:ACR_NAME              = "<from step 1>"
$env:DATABASE_URL          = "postgresql://pgadmin:${env:POSTGRES_ADMIN_PASSWORD}@${env:POSTGRES_HOST}/mydeploy?sslmode=require&schema=public"
.\03-setup-github.ps1
```

---

## Step 4 — Deploy

Push to `main`. The GitHub Actions workflow (`infrastructure/pipelines/deploy.yml`) will:
1. Build and push the Docker image to ACR
2. Run `prisma migrate deploy`
3. Deploy Bicep (idempotent)
4. Health-check `/login` until HTTP 200

Monitor progress at `https://github.com/<org>/mydeploy/actions`.

---

## Step 5 — Post-deploy seed

Run once after the first successful deployment:

```powershell
$env:DATABASE_URL = "<production DATABASE_URL>"
.\04-post-deploy.ps1
```

This seeds the two built-in users. **Change the passwords immediately after first login.**

---

## Step 6 — Access the dashboard

```
https://<appFqdn from step 1>
```

Default credentials (change immediately):
- `admin@mydeploy.io` / `Admin@1234`
- `manager@mydeploy.io` / `Manager@1234`

---

## What's next — Stage 5

Once MYdeploy is live, log in as admin and create the first real deployment profile for AiD DMS through the dashboard. The AiD DMS runbook is at `docs/TUCSON_STAGE4_RUNBOOK.md`.
