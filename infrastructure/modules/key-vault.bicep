param location    string
param prefix      string
param principalId string

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name:     'kv-${prefix}'
  location: location
  properties: {
    sku:          { family: 'A', name: 'standard' }
    tenantId:     subscription().tenantId
    enableRbacAuthorization:  true
    enableSoftDelete:         true
    softDeleteRetentionInDays: 90
  }
}

// Grant Key Vault Secrets User to the managed identity
resource kvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(kv.id, principalId, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId:      principalId
    principalType:    'ServicePrincipal'
  }
}

output kvName string = kv.name
output kvUri  string = kv.properties.vaultUri
