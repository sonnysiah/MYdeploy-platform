import type { DeploymentProfile } from '@prisma/client'

type DispatchResult = {
  success: boolean
  runId: string | null
  error?: string
}

export async function dispatchDeployment(profile: DeploymentProfile): Promise<DispatchResult> {
  const token = process.env.GITHUB_TOKEN
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE ?? 'deploy.yml'

  if (!token) {
    return { success: false, runId: null, error: 'GITHUB_TOKEN not configured' }
  }

  const dispatchUrl = `https://api.github.com/repos/${profile.githubOrg}/${profile.githubRepo}/actions/workflows/${workflowFile}/dispatches`

  const dispatchBody = {
    ref: 'main',
    inputs: {
      tenant_code: profile.tenantCode,
      tenant_name: profile.tenantName,
      app_domain: profile.appDomain,
      admin_email: profile.adminEmail,
      region: profile.region,
    },
  }

  try {
    const beforeDispatch = new Date()

    const dispatchRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dispatchBody),
    })

    if (!dispatchRes.ok) {
      const text = await dispatchRes.text()
      return { success: false, runId: null, error: `GitHub API error: ${dispatchRes.status} ${text}` }
    }

    // Poll for the new run (GitHub doesn't return the run ID on dispatch)
    await new Promise((r) => setTimeout(r, 3000))
    const runId = await findLatestRun(profile, beforeDispatch, token)

    return { success: true, runId }
  } catch (err) {
    return { success: false, runId: null, error: String(err) }
  }
}

async function findLatestRun(
  profile: DeploymentProfile,
  after: Date,
  token: string,
): Promise<string | null> {
  const runsUrl = `https://api.github.com/repos/${profile.githubOrg}/${profile.githubRepo}/actions/runs?branch=main&per_page=5`

  try {
    const res = await fetch(runsUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    const runs: Array<{ id: number; created_at: string }> = data.workflow_runs ?? []

    const match = runs.find((r) => new Date(r.created_at) >= after)
    return match ? String(match.id) : null
  } catch {
    return null
  }
}

export async function getRunStatus(
  org: string,
  repo: string,
  runId: string,
): Promise<{ status: string; conclusion: string | null; url: string } | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null

  try {
    const res = await fetch(
      `https://api.github.com/repos/${org}/${repo}/actions/runs/${runId}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 0 },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      status: data.status,
      conclusion: data.conclusion,
      url: data.html_url,
    }
  } catch {
    return null
  }
}
