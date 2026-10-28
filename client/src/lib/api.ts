import type { ZodType } from 'zod'
import {
  apiStateSchema,
  applicationResponseSchema,
  generatedResumeSchema,
  profileResponseSchema,
  profileReviewSchema,
} from './schemas'
import type {
  ApplicationStatus,
  GeneratedResume,
  JobApplication,
  JobriqState,
  Profile,
  ProfileReview,
} from './types'

export type ExportFormat = 'docx' | 'markdown'

export interface NewApplicationInput {
  company: string
  role: string
  jobDescription: string
  status: ApplicationStatus
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
  code?: string
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails = {}
  try {
    problem = (await response.json()) as ProblemDetails
  } catch {
    // The body was not JSON; fall back to the status text.
  }

  return new ApiError(
    problem.detail ?? problem.title ?? response.statusText ?? 'The request failed.',
    response.status,
    problem.code,
  )
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  schema: ZodType<T>,
): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw await toApiError(response)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError(
      'The server returned an invalid response.',
      response.status,
      'invalid_response',
    )
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError(
      'The server returned an unexpected response.',
      response.status,
      'invalid_response',
    )
  }

  return parsed.data
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function applicationUrl(id: string): string {
  return `/api/applications/${encodeURIComponent(id)}`
}

export async function fetchState(): Promise<JobriqState> {
  return requestJson('/api/state', { method: 'GET' }, apiStateSchema)
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const result = await requestJson(
    '/api/profile',
    jsonRequest('PUT', { profile }),
    profileResponseSchema,
  )

  return result.profile
}

export async function reviewProfile(profile: Profile): Promise<ProfileReview> {
  return requestJson(
    '/api/profile/review',
    jsonRequest('POST', { profile }),
    profileReviewSchema,
  )
}

export async function createApplication(
  application: NewApplicationInput,
): Promise<JobApplication> {
  const result = await requestJson(
    '/api/applications',
    jsonRequest('POST', application),
    applicationResponseSchema,
  )

  return result.application
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<JobApplication> {
  const result = await requestJson(
    `${applicationUrl(id)}/status`,
    jsonRequest('PATCH', { status }),
    applicationResponseSchema,
  )

  return result.application
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(applicationUrl(id), { method: 'DELETE' })

  if (!response.ok) {
    throw await toApiError(response)
  }
}

export async function saveGeneratedResume(
  id: string,
  resume: GeneratedResume,
): Promise<JobApplication> {
  const result = await requestJson(
    `${applicationUrl(id)}/generated-resume`,
    jsonRequest('PUT', { resume }),
    applicationResponseSchema,
  )

  return result.application
}

export async function generateResume(
  profile: Profile,
  jobDescription?: string,
): Promise<GeneratedResume> {
  return requestJson(
    '/api/resume/generate',
    jsonRequest('POST', { profile, jobDescription: jobDescription?.trim() || null }),
    generatedResumeSchema,
  )
}

export async function generateStandaloneResume(
  profile: Profile,
  jobDescription?: string,
): Promise<GeneratedResume> {
  return requestJson(
    '/api/profile/resume',
    jsonRequest('POST', { profile, jobDescription: jobDescription?.trim() || null }),
    generatedResumeSchema,
  )
}

export async function downloadResume(
  resume: GeneratedResume,
  format: ExportFormat,
): Promise<void> {
  const response = await fetch('/api/resume/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, format }),
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  const blob = await response.blob()
  const fileName =
    fileNameFromDisposition(response.headers.get('Content-Disposition')) ??
    `resume.${format === 'docx' ? 'docx' : 'md'}`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function fileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) {
    return null
  }

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (encoded) {
    return decodeURIComponent(encoded[1])
  }

  const quoted = /filename="?([^";]+)"?/i.exec(disposition)
  return quoted ? quoted[1] : null
}
