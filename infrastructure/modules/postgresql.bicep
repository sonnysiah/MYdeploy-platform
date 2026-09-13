param location      string
param prefix        string
@secure()
param adminPassword string

var serverName = replace('pg-${prefix}', '-', '')

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name:     serverName
  location: location
  sku: {
    name: 'Standard_B2s'
    tier: 'Burstable'
  }
  properties: {
    version:              '16'
    administratorLogin:   'pgadmin'
    administratorLoginPassword: adminPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth:        'Enabled'
    }
    storage: { storageSizeGB: 32 }
    backup:  { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

// Allow all Azure-internal traffic (Container Apps uses Azure backbone)
resource fwRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pg
  name:   'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress:   '0.0.0.0'
  }
}

resource mydeployDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pg
  name:   'mydeploy'
  properties: {
    charset:   'UTF8'
    collation: 'en_US.utf8'
  }
}

output host       string = pg.properties.fullyQualifiedDomainName
output serverName string = pg.name
