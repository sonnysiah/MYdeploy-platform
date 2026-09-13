#Requires -Version 7
<#
.SYNOPSIS
  Push three secrets into Key Vault for MYdeploy platform.

.DESCRIPTION
  Requires: az login, Key Vault already provisioned (run 01-provision.ps1 first).
  Required env vars:
    KV_NAME              - Key Vault name (from 01-provision output)
    POSTGRES_HOST        - PostgreSQL FQDN (from 01-provision output)
    POSTGRES_ADMIN_PASSWORD
    JWT_SECRET           - 64-char hex (generate with: openssl rand -hex 32)
    GITHUB_TOKEN         - PAT with repo+workflow scope (leave blank to skip)

.EXAMPLE
  $env:KV_NAME               = "kv-mydeploy-prod"
  $env:POSTGRES_HOST         = "pgmydeployprod.postgres.database.azure.com"
  $env:POSTGRES_ADMIN_PASSWORD = "SuperSecret123!"
  $env:JWT_SECRET            = "..."
  $env:GITHUB_TOKEN          = "ghp_..."
  .\02-push-secrets.ps1
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($v in @('KV_NAME','POSTGRES_HOST','POSTGRES_ADMIN_PASSWORD','JWT_SECRET')) {
    if (-not (Get-Item "env:$v" -ErrorAction SilentlyContinue)) {
        Write-Error "Required env var `$$v is not set."
    }
}

$kvName      = $env:KV_NAME
$pgHost      = $env:POSTGRES_HOST
$pgPassword  = $env:POSTGRES_ADMIN_PASSWORD
$jwtSecret   = $env:JWT_SECRET
$githubToken = $env:GITHUB_TOKEN ?? ''

$databaseUrl = "postgresql://pgadmin:${pgPassword}@${pgHost}/mydeploy?sslmode=require&schema=public"

Write-Host "==> Pushing secrets to Key Vault: $kvName" -ForegroundColor Cyan

$secrets = @{
    'database-url' = $databaseUrl
    'jwt-secret'   = $jwtSecret
    'github-token' = $githubToken
}

foreach ($name in $secrets.Keys) {
    $value = $secrets[$name]
    if (-not $value) {
        Write-Host "    Skipping $name (empty)" -ForegroundColor DarkGray
        continue
    }
    az keyvault secret set --vault-name $kvName --name $name --value $value | Out-Null
    Write-Host "    $name -> set" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: run 03-setup-github.ps1 to configure OIDC and GitHub secrets." -ForegroundColor Yellow
