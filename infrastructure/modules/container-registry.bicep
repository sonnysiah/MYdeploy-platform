param location    string
param prefix      string
param principalId string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name:     replace('cr${prefix}', '-', '')
  location: location
  sku:      { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

// Grant AcrPull to the managed identity
resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name:  guid(acr.id, principalId, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId:      principalId
    principalType:    'ServicePrincipal'
  }
}

output loginServer string = acr.properties.loginServer
output acrName     string = acr.name
