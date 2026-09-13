export type ProfileStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'FAILED'

export type DeploymentStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type StepStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type NotificationType =
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_SUCCESS'
  | 'DEPLOYMENT_FAILED'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  profileId: string | null
  createdAt: string
}

export const AZ_REGIONS = [
  { value: 'southeastasia', label: 'Southeast Asia (Singapore)' },
  { value: 'eastasia', label: 'East Asia (Hong Kong)' },
  { value: 'australiaeast', label: 'Australia East (Sydney)' },
  { value: 'japaneast', label: 'Japan East (Tokyo)' },
  { value: 'westeurope', label: 'West Europe (Netherlands)' },
  { value: 'eastus', label: 'East US (Virginia)' },
  { value: 'westus2', label: 'West US 2 (Washington)' },
]

export const AVAILABLE_APPS = [
  { value: 'aid-dms', label: 'AiD DMS v0.1.0 — Document Management System' },
]

export const DEPLOYMENT_STEPS = [
  'Initialize environment',
  'Copy application code',
  'Configure Bicep parameters',
  'Build Docker images',
  'Push to Container Registry',
  'Provision Azure resources',
  'Push secrets to Key Vault',
  'Run database migrations',
  'Seed production data',
  'Deploy containers',
  'Health check',
]
