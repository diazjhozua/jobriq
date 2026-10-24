import type { GeneratedResume, Profile } from './types'

export type ExportFormat = 'docx' | 'markdown'

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

export async function generateResume(
  profile: Profile,
  jobDescription: string,
): Promise<GeneratedResume> {
  const response = await fetch('/api/resume/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, jobDescription }),
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as GeneratedResume
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
