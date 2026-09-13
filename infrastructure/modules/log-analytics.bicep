param location string
param prefix   string

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name:     'log-${prefix}'
  location: location
  properties: {
    sku:             { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

output workspaceId string = workspace.properties.customerId
@secure()
output primaryKey  string = workspace.listKeys().primarySharedKey
