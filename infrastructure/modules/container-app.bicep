param location         string
param prefix           string
param identityId       string
param acrLoginServer   string
param imageTag         string
param envId            string
param kvName           string

var imageName = '${acrLoginServer}/mydeploy-platform:${imageTag}'

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name:     'ca-${prefix}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identityId}': {} }
  }
  properties: {
    managedEnvironmentId: envId
    configuration: {
      ingress: {
        external:   true
        targetPort: 3000
        transport:  'auto'
      }
      registries: [
        {
          server:   acrLoginServer
          identity: identityId
        }
      ]
      secrets: [
        {
          name:        'jwt-secret'
          keyVaultUrl: 'https://${kvName}${environment().suffixes.keyvaultDns}/secrets/jwt-secret'
          identity:    identityId
        }
        {
          name:        'database-url'
          keyVaultUrl: 'https://${kvName}${environment().suffixes.keyvaultDns}/secrets/database-url'
          identity:    identityId
        }
        {
          name:        'github-token'
          keyVaultUrl: 'https://${kvName}${environment().suffixes.keyvaultDns}/secrets/github-token'
          identity:    identityId
        }
      ]
    }
    template: {
      containers: [
        {
          name:  'platform'
          image: imageName
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'NODE_ENV',     value: 'production' }
            { name: 'PORT',         value: '3000' }
            { name: 'JWT_SECRET',   secretRef: 'jwt-secret' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'GITHUB_TOKEN', secretRef: 'github-token' }
            { name: 'GITHUB_WORKFLOW_FILE', value: 'deploy.yml' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

output fqdn string = app.properties.configuration.ingress.fqdn
