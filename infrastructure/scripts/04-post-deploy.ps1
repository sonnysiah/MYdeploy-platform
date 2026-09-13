#Requires -Version 7
<#
.SYNOPSIS
  Post-deploy: run migrations and seed admin/manager users on the live database.

.DESCRIPTION
  Run once after the first successful GitHub Actions deploy.
  Required env vars:
    DATABASE_URL  - Production PostgreSQL connection string

.EXAMPLE
  $env:DATABASE_URL = "postgresql://pgadmin:pw@host/mydeploy?sslmode=require&schema=public"
  .\04-post-deploy.ps1
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) { Write-Error 'Set $env:DATABASE_URL first.' }

$platform = Join-Path $PSScriptRoot "..\..\..\"  # platform/ root

Write-Host "==> Running Prisma migrate deploy..." -ForegroundColor Cyan
Push-Location $platform
try {
    npx prisma migrate deploy
    Write-Host "    Migrations applied." -ForegroundColor Green

    Write-Host "==> Seeding admin and manager users..." -ForegroundColor Cyan
    npm run db:seed
    Write-Host "    Seed complete." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "MYdeploy is ready. Log in at your Container App FQDN with:" -ForegroundColor Green
Write-Host "  admin@mydeploy.io   / Admin@1234   (change immediately!)" -ForegroundColor Yellow
Write-Host "  manager@mydeploy.io / Manager@1234 (change immediately!)" -ForegroundColor Yellow
