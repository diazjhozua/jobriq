import { vi } from 'vitest'
import { createEmptyState } from '../lib/defaults'
import type {
  ApplicationStatus,
  GeneratedResume,
  JobApplication,
  JobriqState,
} from '../lib/types'

type Operation =
  | 'state'
  | 'profile'
  | 'create'
  | 'status'
  | 'delete'
  | 'generated'
  | 'generate'

export interface MockFailure {
  status?: number
  detail?: string
  code?: string
}

export type MockFailures = Partial<Record<Operation, MockFailure>>

interface MockApiOptions {
  state?: JobriqState
  generatedResume?: GeneratedResume
  fail?: MockFailures
}

interface Call {
  method: string
  path: string
  body?: unknown
}

export function installMockApi({
  state = createEmptyState(),
  generatedResume,
  fail = {},
}: MockApiOptions = {}) {
  const current = structuredClone(state)
  const calls: Call[] = []

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url
    const path = new URL(rawUrl, 'http://localhost').pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    const body =
      typeof init?.body === 'string'
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : undefined

    calls.push({ method, path, body })

    const operation = operationFor(path, method)
    const failure = operation ? fail[operation] : undefined
    if (failure) {
      return problem(failure)
    }

    if (path === '/api/state' && method === 'GET') {
      return json({ profile: current.profile, applications: current.applications })
    }

    if (path === '/api/profile' && method === 'PUT') {
      current.profile = body?.profile as JobriqState['profile']
      return json({ profile: current.profile })
    }

    if (path === '/api/applications' && method === 'POST') {
      const application: JobApplication = {
        id: crypto.randomUUID(),
        company: String(body?.company ?? ''),
        role: String(body?.role ?? ''),
        jobDescription: String(body?.jobDescription ?? ''),
        status: (body?.status as ApplicationStatus | undefined) ?? 'saved',
        createdAt: new Date().toISOString(),
        generatedResume: null,
      }

      current.applications.unshift(application)
      return json({ application }, 201)
    }

    const statusMatch = /^\/api\/applications\/([^/]+)\/status$/.exec(path)
    if (statusMatch && method === 'PATCH') {
      const application = current.applications.find(
        (candidate) => candidate.id === decodeURIComponent(statusMatch[1]),
      )

      if (!application) {
        return problem({
          status: 404,
          detail: 'The application was not found.',
          code: 'application_not_found',
        })
      }

      application.status = body?.status as ApplicationStatus
      return json({ application })
    }

    const generatedMatch = /^\/api\/applications\/([^/]+)\/generated-resume$/.exec(path)
    if (generatedMatch && method === 'PUT') {
      const application = current.applications.find(
        (candidate) => candidate.id === decodeURIComponent(generatedMatch[1]),
      )

      if (!application) {
        return problem({
          status: 404,
          detail: 'The application was not found.',
          code: 'application_not_found',
        })
      }

      application.generatedResume = body?.resume as GeneratedResume
      return json({ application })
    }

    const applicationMatch = /^\/api\/applications\/([^/]+)$/.exec(path)
    if (applicationMatch && method === 'DELETE') {
      const id = decodeURIComponent(applicationMatch[1])
      const index = current.applications.findIndex(
        (candidate) => candidate.id === id,
      )

      if (index === -1) {
        return problem({
          status: 404,
          detail: 'The application was not found.',
          code: 'application_not_found',
        })
      }

      current.applications.splice(index, 1)
      return new Response(null, { status: 204 })
    }

    if (path === '/api/resume/generate' && method === 'POST') {
      return json(
        generatedResume ?? {
          personal: current.profile.personal,
          summary: 'Generated summary.',
          experience: [],
          education: [],
          skills: [],
          projects: [],
          keywords: null,
          generatedAt: new Date().toISOString(),
        },
      )
    }

    return problem({ status: 404, detail: 'Not found.', code: 'not_found' })
  })

  vi.stubGlobal('fetch', fetchMock)

  return { state: current, calls, fail, fetchMock }
}

function operationFor(path: string, method: string): Operation | null {
  if (path === '/api/state') {
    return 'state'
  }

  if (path === '/api/profile') {
    return 'profile'
  }

  if (path === '/api/applications' && method === 'POST') {
    return 'create'
  }

  if (path.endsWith('/status')) {
    return 'status'
  }

  if (path.endsWith('/generated-resume')) {
    return 'generated'
  }

  if (path.startsWith('/api/applications/') && method === 'DELETE') {
    return 'delete'
  }

  if (path === '/api/resume/generate') {
    return 'generate'
  }

  return null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problem(failure: MockFailure): Response {
  return new Response(
    JSON.stringify({
      title: 'Request failed',
      detail: failure.detail ?? 'The request failed.',
      code: failure.code ?? 'request_failed',
    }),
    {
      status: failure.status ?? 500,
      headers: { 'Content-Type': 'application/problem+json' },
    },
  )
}
