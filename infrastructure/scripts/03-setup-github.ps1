#Requires -Version 7
<#
.SYNOPSIS
  Create OIDC service principal and set GitHub Actions secrets for MYdeploy.

.DESCRIPTION
  Required env vars:
    GITHUB_ORG           - GitHub org or user (e.g. "myorg")
    GITHUB_REPO          - Repository name (e.g. "mydeploy")
    AZURE_SUBSCRIPTION_ID
    AZURE_TENANT_ID
    RG_NAME              - Resource group (e.g. "rg-mydeploy-prod")
    ACR_LOGIN_SERVER     - (from 01-provision output)
    ACR_NAME             - (from 01-provision output)
    DATABASE_URL         - Full PostgreSQL connection string (for migrations step)
    POSTGRES_ADMIN_PASSWORD
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($v in @('GITHUB_ORG','GITHUB_REPO','AZURE_SUBSCRIPTION_ID','AZURE_TENANT_ID',
                  'RG_NAME','ACR_LOGIN_SERVER','ACR_NAME','DATABASE_URL','POSTGRES_ADMIN_PASSWORD')) {
    if (-not (Get-Item "env:$v" -ErrorAction SilentlyContinue)) {
        Write-Error "Required env var `$$v is not set."
    }
}

$org      = $env:GITHUB_ORG
$repo     = $env:GITHUB_REPO
$subId    = $env:AZURE_SUBSCRIPTION_ID
$tenantId = $env:AZURE_TENANT_ID
$rgName   = $env:RG_NAME
$appName  = "sp-mydeploy-ghactions"

Write-Host "==> Creating service principal: $appName" -ForegroundColor Cyan
$sp = az ad app create --display-name $appName --output json | ConvertFrom-Json
$appId = $sp.appId
az ad sp create --id $appId | Out-Null

# Federated credential for main branch
$fedCred = @{
    name        = 'github-main'
    issuer      = 'https://token.actions.githubusercontent.com'
    subject     = "repo:${org}/${repo}:ref:refs/heads/main"
    audiences   = @('api://AzureADTokenExchange')
    description = 'MYdeploy GitHub Actions OIDC'
} | ConvertTo-Json -Depth 5

$fedCred | az ad app federated-credential create --id $appId --parameters '@-' | Out-Null
Write-Host "    Federated credential created." -ForegroundColor Green

# Assign Contributor on resource group + AcrPush on ACR
$spId = (az ad sp show --id $appId --query id -o tsv)
az role assignment create --assignee $spId --role Contributor `
    --scope "/subscriptions/$subId/resourceGroups/$rgName" | Out-Null
az role assignment create --assignee $spId --role AcrPush `
    --scope "/subscriptions/$subId/resourceGroups/$rgName/providers/Microsoft.ContainerRegistry/registries/$($env:ACR_NAME)" | Out-Null
Write-Host "    Role assignments done." -ForegroundColor Green

# Set GitHub Actions secrets
Write-Host "==> Setting GitHub Actions secrets..." -ForegroundColor Cyan
$ghSecrets = @{
    AZURE_CLIENT_ID          = $appId
    AZURE_TENANT_ID          = $tenantId
    AZURE_SUBSCRIPTION_ID    = $subId
    ACR_LOGIN_SERVER         = $env:ACR_LOGIN_SERVER
    ACR_NAME                 = $env:ACR_NAME
    DATABASE_URL             = $env:DATABASE_URL
    POSTGRES_ADMIN_PASSWORD  = $env:POSTGRES_ADMIN_PASSWORD
}

foreach ($name in $ghSecrets.Keys) {
    gh secret set $name --repo "${org}/${repo}" --body $ghSecrets[$name]
    Write-Host "    $name -> set" -ForegroundColor Green
}

Write-Host ""
Write-Host "==> Done. Push to main or trigger the workflow to deploy." -ForegroundColor Green
