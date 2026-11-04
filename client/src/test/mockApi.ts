import { vi } from 'vitest'
import { createEmptyState, DEFAULT_RESUME_THEME_ID } from '../lib/defaults'
import type {
  ApplicationStatus,
  CoverLetter,
  GeneratedResume,
  JobApplication,
  JobriqState,
  Profile,
  ProfileReview,
  ResumeTheme,
  ResumeThemeStyles,
  ReviewSuggestion,
} from '../lib/types'

type Operation =
  | 'state'
  | 'profile'
  | 'profileExport'
  | 'review'
  | 'create'
  | 'status'
  | 'delete'
  | 'generated'
  | 'generate'
  | 'standalone'
  | 'coverLetter'
  | 'coverLetterExport'
  | 'promptStyleCreate'
  | 'promptStyleUpdate'
  | 'promptStyleDelete'
  | 'promptStyleActivate'
  | 'resumeThemeCreate'
  | 'resumeThemeUpdate'
  | 'resumeThemeDelete'
  | 'resumeThemeActivate'
  | 'piiMaskingUpdate'

export interface MockFailure {
  status?: number
  detail?: string
  code?: string
}

export type MockFailures = Partial<Record<Operation, MockFailure>>

interface MockApiOptions {
  state?: JobriqState
  generatedResume?: GeneratedResume
  coverLetter?: CoverLetter
  review?: ProfileReview
  reviewGate?: Promise<unknown>
  profileGate?: Promise<unknown>
  exportGate?: Promise<unknown>
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
  coverLetter,
  review,
  reviewGate,
  profileGate,
  exportGate,
  fail = {},
}: MockApiOptions = {}) {
  const current = structuredClone(state)
  const calls: Call[] = []

  const snapshotThemes = () => {
    const active = current.resumeThemes.activeThemeId

    return {
      themes: current.resumeThemes.themes.map((theme) => ({
        ...theme,
        isActive: theme.id === active,
      })),
      builtIns: current.resumeThemes.builtIns.map((theme) => ({
        ...theme,
        isActive: theme.id === active,
      })),
      activeThemeId: active,
    }
  }

  const themeNameTaken = (name: string, exceptId?: string) => {
    const normalized = name.toLowerCase()

    return (
      current.resumeThemes.builtIns.some(
        (theme) => theme.name.toLowerCase() === normalized,
      ) ||
      current.resumeThemes.themes.some(
        (theme) =>
          theme.id !== exceptId && theme.name.toLowerCase() === normalized,
      )
    )
  }

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
      return json({
        profile: current.profile,
        applications: current.applications,
        standaloneResume: current.standaloneResume,
        promptStyles: current.promptStyles,
        resumeThemes: current.resumeThemes,
        piiMasking: current.piiMasking,
      })
    }

    if (path === '/api/prompt-styles' && method === 'POST') {
      const name = String(body?.name ?? '').trim()
      const instructions = String(body?.instructions ?? '').trim()
      const taken = current.promptStyles.styles.some(
        (style) => style.name.toLowerCase() === name.toLowerCase(),
      )

      if (taken) {
        return problem({
          status: 409,
          detail: `A prompt style named "${name}" already exists.`,
          code: 'prompt_style_name_conflict',
        })
      }

      const now = new Date().toISOString()
      const isFirst = current.promptStyles.styles.length === 0
      const style = {
        id: crypto.randomUUID(),
        name,
        instructions,
        isActive: isFirst,
        createdAt: now,
        updatedAt: now,
      }

      current.promptStyles.styles.push(style)

      if (isFirst) {
        current.promptStyles.activeStyleId = style.id
      }

      return json(current.promptStyles, 201)
    }

    const promptStyleActivateMatch =
      /^\/api\/prompt-styles\/([^/]+)\/activate$/.exec(path)
    if (promptStyleActivateMatch && method === 'POST') {
      const id = decodeURIComponent(promptStyleActivateMatch[1])
      const style = current.promptStyles.styles.find(
        (candidate) => candidate.id === id,
      )

      if (!style) {
        return problem({
          status: 404,
          detail: 'The prompt style was not found.',
          code: 'prompt_style_not_found',
        })
      }

      for (const candidate of current.promptStyles.styles) {
        candidate.isActive = candidate.id === id
      }

      current.promptStyles.activeStyleId = id
      return json(current.promptStyles)
    }

    const promptStyleMatch = /^\/api\/prompt-styles\/([^/]+)$/.exec(path)
    if (promptStyleMatch && method === 'PUT') {
      const id = decodeURIComponent(promptStyleMatch[1])
      const style = current.promptStyles.styles.find(
        (candidate) => candidate.id === id,
      )

      if (!style) {
        return problem({
          status: 404,
          detail: 'The prompt style was not found.',
          code: 'prompt_style_not_found',
        })
      }

      const name = String(body?.name ?? style.name).trim()
      const taken = current.promptStyles.styles.some(
        (candidate) =>
          candidate.id !== id &&
          candidate.name.toLowerCase() === name.toLowerCase(),
      )

      if (taken) {
        return problem({
          status: 409,
          detail: `A prompt style named "${name}" already exists.`,
          code: 'prompt_style_name_conflict',
        })
      }

      style.name = name
      style.instructions = String(body?.instructions ?? style.instructions).trim()
      style.updatedAt = new Date().toISOString()
      return json(current.promptStyles)
    }

    if (promptStyleMatch && method === 'DELETE') {
      const id = decodeURIComponent(promptStyleMatch[1])
      const index = current.promptStyles.styles.findIndex(
        (candidate) => candidate.id === id,
      )

      if (index === -1) {
        return problem({
          status: 404,
          detail: 'The prompt style was not found.',
          code: 'prompt_style_not_found',
        })
      }

      current.promptStyles.styles.splice(index, 1)

      if (current.promptStyles.activeStyleId === id) {
        current.promptStyles.activeStyleId = null
      }

      return json(current.promptStyles)
    }

    if (path === '/api/resume-themes' && method === 'POST') {
      const name = String(body?.name ?? '').trim()

      if (themeNameTaken(name)) {
        return problem({
          status: 409,
          detail: `A resume theme named "${name}" already exists.`,
          code: 'resume_theme_name_conflict',
        })
      }

      const now = new Date().toISOString()
      const theme: ResumeTheme = {
        id: crypto.randomUUID(),
        name,
        styles: body?.styles as ResumeThemeStyles,
        isActive: false,
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
      }

      current.resumeThemes.themes.push(theme)
      return json(snapshotThemes(), 201)
    }

    const resumeThemeActivateMatch =
      /^\/api\/resume-themes\/([^/]+)\/activate$/.exec(path)
    if (resumeThemeActivateMatch && method === 'POST') {
      const id = decodeURIComponent(resumeThemeActivateMatch[1])
      const exists =
        current.resumeThemes.themes.some((theme) => theme.id === id) ||
        current.resumeThemes.builtIns.some((theme) => theme.id === id)

      if (!exists) {
        return problem({
          status: 404,
          detail: 'The resume theme was not found.',
          code: 'resume_theme_not_found',
        })
      }

      current.resumeThemes.activeThemeId = id
      return json(snapshotThemes())
    }

    const resumeThemeMatch = /^\/api\/resume-themes\/([^/]+)$/.exec(path)
    if (resumeThemeMatch && method === 'PUT') {
      const id = decodeURIComponent(resumeThemeMatch[1])

      if (current.resumeThemes.builtIns.some((theme) => theme.id === id)) {
        return problem({
          status: 409,
          detail: 'Built-in resume themes cannot be changed.',
          code: 'resume_theme_read_only',
        })
      }

      const theme = current.resumeThemes.themes.find(
        (candidate) => candidate.id === id,
      )

      if (!theme) {
        return problem({
          status: 404,
          detail: 'The resume theme was not found.',
          code: 'resume_theme_not_found',
        })
      }

      const name = String(body?.name ?? theme.name).trim()

      if (themeNameTaken(name, id)) {
        return problem({
          status: 409,
          detail: `A resume theme named "${name}" already exists.`,
          code: 'resume_theme_name_conflict',
        })
      }

      theme.name = name
      theme.styles =
        (body?.styles as ResumeThemeStyles | undefined) ?? theme.styles
      theme.updatedAt = new Date().toISOString()
      return json(snapshotThemes())
    }

    if (resumeThemeMatch && method === 'DELETE') {
      const id = decodeURIComponent(resumeThemeMatch[1])

      if (current.resumeThemes.builtIns.some((theme) => theme.id === id)) {
        return problem({
          status: 409,
          detail: 'Built-in resume themes cannot be deleted.',
          code: 'resume_theme_read_only',
        })
      }

      const index = current.resumeThemes.themes.findIndex(
        (theme) => theme.id === id,
      )

      if (index === -1) {
        return problem({
          status: 404,
          detail: 'The resume theme was not found.',
          code: 'resume_theme_not_found',
        })
      }

      current.resumeThemes.themes.splice(index, 1)

      if (current.resumeThemes.activeThemeId === id) {
        current.resumeThemes.activeThemeId = DEFAULT_RESUME_THEME_ID
      }

      return json(snapshotThemes())
    }

    if (path === '/api/pii-masking' && method === 'PUT') {
      current.piiMasking = { enabled: Boolean(body?.enabled) }
      return json(current.piiMasking)
    }

    if (path === '/api/profile' && method === 'PUT') {
      if (profileGate) {
        await profileGate
      }

      current.profile = body?.profile as JobriqState['profile']
      return json({ profile: current.profile })
    }

    if (path === '/api/profile/export' && method === 'POST') {
      if (exportGate) {
        await exportGate
      }

      return new Response(new Blob(['[PERSONAL]']), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="jane-doe-profile-20260102-030405.txt"',
        },
      })
    }

    if (path === '/api/profile/review' && method === 'POST') {
      if (reviewGate) {
        await reviewGate
      }

      return json(
        review ?? defaultReview(body?.profile as Profile | undefined),
      )
    }

    if (path === '/api/applications' && method === 'POST') {
      const application: JobApplication = {
        id: crypto.randomUUID(),
        company: String(body?.company ?? ''),
        role: String(body?.role ?? ''),
        jobDescription: String(body?.jobDescription ?? ''),
        status: (body?.status as ApplicationStatus | undefined) ?? 'saved',
        createdAt: new Date().toISOString(),
        appliedDate: String(body?.appliedDate ?? ''),
        generatedResume: null,
        coverLetter: null,
      }

      current.applications.unshift(application)
      return json({ application }, 201)
    }

    const updateMatch = /^\/api\/applications\/([^/]+)$/.exec(path)
    if (updateMatch && method === 'PUT') {
      const application = current.applications.find(
        (candidate) => candidate.id === decodeURIComponent(updateMatch[1]),
      )

      if (!application) {
        return problem({
          status: 404,
          detail: 'The application was not found.',
          code: 'application_not_found',
        })
      }

      application.company = String(body?.company ?? application.company)
      application.role = String(body?.role ?? application.role)
      application.appliedDate = String(body?.appliedDate ?? '')
      return json({ application })
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

    const coverLetterMatch = /^\/api\/applications\/([^/]+)\/cover-letter$/.exec(path)
    if (coverLetterMatch && method === 'POST') {
      const application = current.applications.find(
        (candidate) => candidate.id === decodeURIComponent(coverLetterMatch[1]),
      )

      if (!application) {
        return problem({
          status: 404,
          detail: 'The application was not found.',
          code: 'application_not_found',
        })
      }

      application.coverLetter =
        coverLetter ?? defaultCoverLetter(application, current.profile)
      return json({ application })
    }

    if (path === '/api/cover-letter/export' && method === 'POST') {
      return new Response(new Blob(['docx']), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition':
            'attachment; filename="jane-doe-cover-letter.docx"',
        },
      })
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
          certifications: [],
          awards: [],
          skills: [],
          projects: [],
          keywords: null,
          generatedAt: new Date().toISOString(),
        },
      )
    }

    if (path === '/api/profile/resume' && method === 'POST') {
      const resume = generatedResume ?? {
        personal: current.profile.personal,
        summary: 'Generated summary.',
        experience: [],
        education: [],
        certifications: [],
        awards: [],
        skills: [],
        projects: [],
        keywords: null,
        generatedAt: new Date().toISOString(),
      }

      current.standaloneResume = resume
      return json(resume)
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

  if (path === '/api/pii-masking') {
    return 'piiMaskingUpdate'
  }

  if (path === '/api/profile/export') {
    return 'profileExport'
  }

  if (path === '/api/profile/review') {
    return 'review'
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

  if (path === '/api/cover-letter/export') {
    return 'coverLetterExport'
  }

  if (path === '/api/resume-themes' && method === 'POST') {
    return 'resumeThemeCreate'
  }

  if (path.startsWith('/api/resume-themes/') && path.endsWith('/activate')) {
    return 'resumeThemeActivate'
  }

  if (path.startsWith('/api/resume-themes/') && method === 'PUT') {
    return 'resumeThemeUpdate'
  }

  if (path.startsWith('/api/resume-themes/') && method === 'DELETE') {
    return 'resumeThemeDelete'
  }

  if (path === '/api/prompt-styles' && method === 'POST') {
    return 'promptStyleCreate'
  }

  if (path.endsWith('/activate')) {
    return 'promptStyleActivate'
  }

  if (path.startsWith('/api/prompt-styles/') && method === 'PUT') {
    return 'promptStyleUpdate'
  }

  if (path.startsWith('/api/prompt-styles/') && method === 'DELETE') {
    return 'promptStyleDelete'
  }

  if (path.endsWith('/cover-letter')) {
    return 'coverLetter'
  }

  if (path.startsWith('/api/applications/') && method === 'DELETE') {
    return 'delete'
  }

  if (path === '/api/resume/generate') {
    return 'generate'
  }

  if (path === '/api/profile/resume') {
    return 'standalone'
  }

  return null
}

function defaultReview(profile: Profile | undefined): ProfileReview {
  const suggestions: ReviewSuggestion[] = []
  const summary = profile?.summary.trim() ?? ''

  suggestions.push({
    id: 'review-summary',
    section: 'summary',
    itemId: null,
    bulletIndex: null,
    category: 'completeness',
    title: 'Add a professional summary',
    detail: 'Summaries help reviewers understand your focus quickly.',
    originalText: summary || null,
    proposedText: 'Deterministic reviewed summary.',
  })

  const experience = profile?.experience.find((entry) => entry.bullets.length > 0)
  if (experience) {
    suggestions.push({
      id: 'review-experience',
      section: 'experience',
      itemId: experience.id,
      bulletIndex: 0,
      category: 'impact',
      title: 'Quantify your impact',
      detail: 'Add a measurable result to this bullet.',
      originalText: experience.bullets[0] ?? null,
      proposedText: `Reviewed: ${experience.bullets[0]}`,
    })
  }

  suggestions.push({
    id: 'review-skills',
    section: 'skills',
    itemId: null,
    bulletIndex: null,
    category: 'clarity',
    title: 'Group related skills',
    detail: 'Group skills by category so reviewers can scan them.',
    originalText: null,
    proposedText: null,
  })

  return { suggestions }
}

function defaultCoverLetter(
  application: JobApplication,
  profile: Profile,
): CoverLetter {
  return {
    personal: profile.personal,
    company: application.company,
    role: application.role,
    salutation: `Dear ${application.company} Hiring Team,`,
    paragraphs: [
      `A cover letter paragraph about the ${application.role} role.`,
      'A second paragraph connecting past work to the job description.',
      'A closing paragraph about what I would bring to the team.',
    ],
    closing: 'Sincerely,',
    signature: profile.personal.name,
    generatedAt: new Date().toISOString(),
  }
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
