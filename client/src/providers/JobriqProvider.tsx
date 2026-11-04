import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as api from '../lib/api'
import type {
  ApplicationDetailsInput,
  NewApplicationInput,
  PromptStyleInput,
  ResumeThemeInput,
} from '../lib/api'
import { createEmptyState } from '../lib/defaults'
import { monthYearToIso } from '../lib/monthYear'
import type {
  ApplicationStatus,
  GeneratedResume,
  JobApplication,
  JobriqState,
  PiiMasking,
  Profile,
  ProfileReview,
  PromptStyles,
  ResumeThemes,
} from '../lib/types'

type LoadStatus = 'loading' | 'ready' | 'error'

interface JobriqContextValue {
  profile: Profile
  applications: JobApplication[]
  standaloneResume: GeneratedResume | null
  promptStyles: PromptStyles
  resumeThemes: ResumeThemes
  piiMasking: PiiMasking
  status: LoadStatus
  loadError: string | null
  syncError: string | null
  retry: () => void
  clearSyncError: () => void
  saveProfile: (profile: Profile) => Promise<void>
  addApplication: (application: NewApplicationInput) => Promise<JobApplication>
  updateApplication: (
    id: string,
    details: ApplicationDetailsInput,
  ) => Promise<void>
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  saveGeneratedResume: (id: string, resume: GeneratedResume) => Promise<void>
  generateCoverLetter: (id: string) => Promise<void>
  generateStandaloneResume: (profile: Profile, jobDescription?: string) => Promise<void>
  createPromptStyle: (input: PromptStyleInput) => Promise<void>
  updatePromptStyle: (id: string, input: PromptStyleInput) => Promise<void>
  deletePromptStyle: (id: string) => Promise<void>
  activatePromptStyle: (id: string) => Promise<void>
  createResumeTheme: (input: ResumeThemeInput) => Promise<void>
  updateResumeTheme: (id: string, input: ResumeThemeInput) => Promise<void>
  deleteResumeTheme: (id: string) => Promise<void>
  activateResumeTheme: (id: string) => Promise<void>
  setPiiMasking: (enabled: boolean) => Promise<void>
  review: ProfileReview | null
  reviewedAt: string | null
  reviewing: boolean
  reviewError: string | null
  reviewProfile: (profile: Profile) => Promise<boolean>
}

const JobriqContext = createContext<JobriqContextValue | null>(null)

function errorMessage(
  error: unknown,
  fallback = 'The change could not be saved.',
): string {
  return error instanceof Error ? error.message : fallback
}

function replaceApplication(
  state: JobriqState,
  application: JobApplication,
): JobriqState {
  return {
    ...state,
    applications: state.applications.map((current) =>
      current.id === application.id ? application : current,
    ),
  }
}

export function JobriqProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JobriqState>(createEmptyState)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [review, setReview] = useState<ProfileReview | null>(null)
  const [reviewedAt, setReviewedAt] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const stateRef = useRef(state)
  const piiMaskingRequestId = useRef(0)

  const setJobriqState = useCallback(
    (update: (current: JobriqState) => JobriqState) => {
      setState((current) => {
        const next = update(current)
        stateRef.current = next
        return next
      })
    },
    [],
  )

  useEffect(() => {
    let active = true

    api
      .fetchState()
      .then((next) => {
        if (!active) {
          return
        }

        setJobriqState(() => next)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }

        setLoadError(errorMessage(error))
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey, setJobriqState])

  const retry = useCallback(() => {
    setStatus('loading')
    setLoadError(null)
    setReloadKey((current) => current + 1)
  }, [])

  const clearSyncError = useCallback(() => setSyncError(null), [])

  const saveProfile = useCallback(
    async (profile: Profile) => {
      try {
        const saved = await api.saveProfile(profile)
        setJobriqState((current) => ({ ...current, profile: saved }))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const addApplication = useCallback(
    async (application: NewApplicationInput) => {
      try {
        const created = await api.createApplication({
          ...application,
          company: application.company.trim(),
          role: application.role.trim(),
          jobDescription: application.jobDescription.trim(),
          appliedDate: monthYearToIso(application.appliedDate?.trim() ?? ''),
        })

        setJobriqState((current) => ({
          ...current,
          applications: [created, ...current.applications],
        }))
        setSyncError(null)

        return created
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const updateApplication = useCallback(
    async (id: string, details: ApplicationDetailsInput) => {
      const previous = stateRef.current.applications.find(
        (application) => application.id === id,
      )

      if (!previous) {
        return
      }

      const company = details.company.trim()
      const role = details.role.trim()
      const appliedDate = monthYearToIso(details.appliedDate?.trim() ?? '') ?? ''

      setJobriqState((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id
            ? { ...application, company, role, appliedDate }
            : application,
        ),
      }))

      try {
        const updated = await api.updateApplication(id, {
          company,
          role,
          appliedDate: appliedDate || null,
        })
        setJobriqState((current) => replaceApplication(current, updated))
        setSyncError(null)
      } catch (error) {
        setJobriqState((current) => replaceApplication(current, previous))
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const updateApplicationStatus = useCallback(
    async (id: string, nextStatus: ApplicationStatus) => {
      const previous = stateRef.current.applications.find(
        (application) => application.id === id,
      )

      if (!previous) {
        return
      }

      setJobriqState((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id
            ? { ...application, status: nextStatus }
            : application,
        ),
      }))

      try {
        const updated = await api.updateApplicationStatus(id, nextStatus)
        setJobriqState((current) => replaceApplication(current, updated))
        setSyncError(null)
      } catch (error) {
        setJobriqState((current) => replaceApplication(current, previous))
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const deleteApplication = useCallback(
    async (id: string) => {
      const index = stateRef.current.applications.findIndex(
        (application) => application.id === id,
      )
      const previous = stateRef.current.applications[index]

      if (!previous) {
        return
      }

      setJobriqState((current) => ({
        ...current,
        applications: current.applications.filter(
          (application) => application.id !== id,
        ),
      }))

      try {
        await api.deleteApplication(id)
        setSyncError(null)
      } catch (error) {
        setJobriqState((current) => {
          if (current.applications.some((application) => application.id === id)) {
            return current
          }

          const applications = [...current.applications]
          applications.splice(Math.min(index, applications.length), 0, previous)

          return { ...current, applications }
        })
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const saveGeneratedResume = useCallback(
    async (id: string, resume: GeneratedResume) => {
      try {
        const updated = await api.saveGeneratedResume(id, resume)
        setJobriqState((current) => replaceApplication(current, updated))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const generateCoverLetter = useCallback(
    async (id: string) => {
      try {
        const updated = await api.generateCoverLetter(id)
        setJobriqState((current) => replaceApplication(current, updated))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const generateStandaloneResume = useCallback(
    async (profile: Profile, jobDescription?: string) => {
      try {
        const generated = await api.generateStandaloneResume(profile, jobDescription)
        setJobriqState((current) => ({
          ...current,
          standaloneResume: generated,
        }))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const replacePromptStyles = useCallback(
    async (operation: () => Promise<PromptStyles>) => {
      try {
        const next = await operation()
        setJobriqState((current) => ({ ...current, promptStyles: next }))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const createPromptStyle = useCallback(
    (input: PromptStyleInput) =>
      replacePromptStyles(() => api.createPromptStyle(input)),
    [replacePromptStyles],
  )

  const updatePromptStyle = useCallback(
    (id: string, input: PromptStyleInput) =>
      replacePromptStyles(() => api.updatePromptStyle(id, input)),
    [replacePromptStyles],
  )

  const deletePromptStyle = useCallback(
    (id: string) => replacePromptStyles(() => api.deletePromptStyle(id)),
    [replacePromptStyles],
  )

  const activatePromptStyle = useCallback(
    (id: string) => replacePromptStyles(() => api.activatePromptStyle(id)),
    [replacePromptStyles],
  )

  const replaceResumeThemes = useCallback(
    async (operation: () => Promise<ResumeThemes>) => {
      try {
        const next = await operation()
        setJobriqState((current) => ({ ...current, resumeThemes: next }))
        setSyncError(null)
      } catch (error) {
        setSyncError(errorMessage(error))
        throw error
      }
    },
    [setJobriqState],
  )

  const createResumeTheme = useCallback(
    (input: ResumeThemeInput) =>
      replaceResumeThemes(() => api.createResumeTheme(input)),
    [replaceResumeThemes],
  )

  const updateResumeTheme = useCallback(
    (id: string, input: ResumeThemeInput) =>
      replaceResumeThemes(() => api.updateResumeTheme(id, input)),
    [replaceResumeThemes],
  )

  const deleteResumeTheme = useCallback(
    (id: string) => replaceResumeThemes(() => api.deleteResumeTheme(id)),
    [replaceResumeThemes],
  )

  const activateResumeTheme = useCallback(
    (id: string) => replaceResumeThemes(() => api.activateResumeTheme(id)),
    [replaceResumeThemes],
  )

  const setPiiMasking = useCallback(
    async (enabled: boolean) => {
      const previous = stateRef.current.piiMasking
      const requestId = piiMaskingRequestId.current + 1
      piiMaskingRequestId.current = requestId

      setJobriqState((current) => ({ ...current, piiMasking: { enabled } }))

      try {
        const next = await api.updatePiiMasking(enabled)
        if (piiMaskingRequestId.current !== requestId) {
          return
        }

        setJobriqState((current) => ({ ...current, piiMasking: next }))
        setSyncError(null)
      } catch (error) {
        if (piiMaskingRequestId.current === requestId) {
          setJobriqState((current) =>
            current.piiMasking.enabled === enabled
              ? { ...current, piiMasking: previous }
              : current,
          )
          setSyncError(errorMessage(error))
        }

        throw error
      }
    },
    [setJobriqState],
  )

  const reviewProfile = useCallback(async (profile: Profile) => {
    setReviewing(true)
    setReviewError(null)

    try {
      const next = await api.reviewProfile(profile)
      setReview(next)
      setReviewedAt(new Date().toISOString())
      return true
    } catch (error) {
      setReviewError(errorMessage(error, 'The review could not be completed.'))
      return false
    } finally {
      setReviewing(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      profile: state.profile,
      applications: state.applications,
      standaloneResume: state.standaloneResume,
      promptStyles: state.promptStyles,
      resumeThemes: state.resumeThemes,
      piiMasking: state.piiMasking,
      status,
      loadError,
      syncError,
      retry,
      clearSyncError,
      saveProfile,
      addApplication,
      updateApplication,
      updateApplicationStatus,
      deleteApplication,
      saveGeneratedResume,
      generateCoverLetter,
      generateStandaloneResume,
      createPromptStyle,
      updatePromptStyle,
      deletePromptStyle,
      activatePromptStyle,
      createResumeTheme,
      updateResumeTheme,
      deleteResumeTheme,
      activateResumeTheme,
      setPiiMasking,
      review,
      reviewedAt,
      reviewing,
      reviewError,
      reviewProfile,
    }),
    [
      state.profile,
      state.applications,
      state.standaloneResume,
      state.promptStyles,
      state.resumeThemes,
      state.piiMasking,
      status,
      loadError,
      syncError,
      retry,
      clearSyncError,
      saveProfile,
      addApplication,
      updateApplication,
      updateApplicationStatus,
      deleteApplication,
      saveGeneratedResume,
      generateCoverLetter,
      generateStandaloneResume,
      createPromptStyle,
      updatePromptStyle,
      deletePromptStyle,
      activatePromptStyle,
      createResumeTheme,
      updateResumeTheme,
      deleteResumeTheme,
      activateResumeTheme,
      setPiiMasking,
      review,
      reviewedAt,
      reviewing,
      reviewError,
      reviewProfile,
    ],
  )

  return <JobriqContext.Provider value={value}>{children}</JobriqContext.Provider>
}

export function useJobriq(): JobriqContextValue {
  const context = useContext(JobriqContext)
  if (!context) {
    throw new Error('useJobriq must be used within JobriqProvider.')
  }

  return context
}
