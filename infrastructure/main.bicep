targetScope = 'subscription'

@description('Azure region for all resources')
param location string = 'southeastasia'

@description('Short environment tag — prod or dev')
@allowed(['prod', 'dev'])
param env string = 'prod'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('Container image tag to deploy (e.g. sha-abc1234)')
param imageTag string = 'latest'

// ── Naming ─────────────────────────────────────────────────────────────────
var prefix = 'mydeploy-${env}'
var rgName  = 'rg-${prefix}'

// ── Resource Group ──────────────────────────────────────────────────────────
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name:     rgName
  location: location
}

// ── Modules ─────────────────────────────────────────────────────────────────
module identity 'modules/managed-identity.bicep' = {
  name:  'identity'
  scope: rg
  params: { location: location, prefix: prefix }
}

module acr 'modules/container-registry.bicep' = {
  name:  'acr'
  scope: rg
  params: {
    location:       location
    prefix:         prefix
    principalId:    identity.outputs.principalId
  }
}

module postgres 'modules/postgresql.bicep' = {
  name:  'postgres'
  scope: rg
  params: {
    location:      location
    prefix:        prefix
    adminPassword: postgresAdminPassword
  }
}

module kv 'modules/key-vault.bicep' = {
  name:  'kv'
  scope: rg
  params: {
    location:    location
    prefix:      prefix
    principalId: identity.outputs.principalId
  }
}

module logs 'modules/log-analytics.bicep' = {
  name:  'logs'
  scope: rg
  params: { location: location, prefix: prefix }
}

module env_aca 'modules/container-apps-env.bicep' = {
  name:  'env-aca'
  scope: rg
  params: {
    location:            location
    prefix:              prefix
    logAnalyticsId:      logs.outputs.workspaceId
    logAnalyticsKey:     logs.outputs.primaryKey
  }
}

module app 'modules/container-app.bicep' = {
  name:  'app'
  scope: rg
  params: {
    location:          location
    prefix:            prefix
    identityId:        identity.outputs.identityId
    acrLoginServer:    acr.outputs.loginServer
    imageTag:          imageTag
    envId:             env_aca.outputs.envId
    kvName:            kv.outputs.kvName
  }
}

// ── Outputs ──────────────────────────────────────────────────────────────────
output resourceGroup   string = rgName
output acrLoginServer  string = acr.outputs.loginServer
output appFqdn         string = app.outputs.fqdn
output kvName          string = kv.outputs.kvName
output postgresHost    string = postgres.outputs.host
