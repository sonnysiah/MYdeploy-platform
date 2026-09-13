#Requires -Version 7
<#
.SYNOPSIS
  Provision all Azure infrastructure for MYdeploy platform.

.DESCRIPTION
  Runs az deployment sub create with main.bicep + prod.bicepparam.
  Requires: az login, POSTGRES_ADMIN_PASSWORD env var set.

.EXAMPLE
  $env:POSTGRES_ADMIN_PASSWORD = "SuperSecret123!"
  .\01-provision.ps1
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Validate prereqs ───────────────────────────────────────────────────────
if (-not $env:POSTGRES_ADMIN_PASSWORD) {
    Write-Error "Set `$env:POSTGRES_ADMIN_PASSWORD before running this script."
}

$here     = Split-Path $MyInvocation.MyCommand.Path
$mainBicep = Join-Path $here "..\main.bicep"
$params    = Join-Path $here "..\parameters\prod.bicepparam"

Write-Host "==> Validating Bicep..." -ForegroundColor Cyan
az deployment sub validate `
    --location southeastasia `
    --template-file $mainBicep `
    --parameters $params | Out-Null
Write-Host "    Validation passed." -ForegroundColor Green

Write-Host "==> Deploying infrastructure (this takes ~8 min)..." -ForegroundColor Cyan
$result = az deployment sub create `
    --location southeastasia `
    --template-file $mainBicep `
    --parameters $params `
    --output json | ConvertFrom-Json

$outputs = $result.properties.outputs

Write-Host ""
Write-Host "==> Deployment complete." -ForegroundColor Green
Write-Host "    Resource Group : $($outputs.resourceGroup.value)"
Write-Host "    ACR            : $($outputs.acrLoginServer.value)"
Write-Host "    Key Vault      : $($outputs.kvName.value)"
Write-Host "    Postgres host  : $($outputs.postgresHost.value)"
Write-Host "    App FQDN       : $($outputs.appFqdn.value)"
Write-Host ""
Write-Host "Next: run 02-push-secrets.ps1 to populate Key Vault." -ForegroundColor Yellow
