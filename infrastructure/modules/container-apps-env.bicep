param location          string
param prefix            string
param logAnalyticsId    string
@secure()
param logAnalyticsKey   string

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name:     'cae-${prefix}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsId
        sharedKey:  logAnalyticsKey
      }
    }
  }
}

output envId string = env.id
