using '../main.bicep'

param location             = 'southeastasia'
param env                  = 'prod'
param postgresAdminPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
param imageTag             = readEnvironmentVariable('IMAGE_TAG', 'latest')
