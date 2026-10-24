import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadState, saveState } from '../lib/storage'
import type {
  ApplicationStatus,
  GeneratedResume,
  JobApplication,
  JobriqState,
  Profile,
} from '../lib/types'

interface NewApplication {
  company: string
  role: string
  jobDescription: string
  status: ApplicationStatus
}

interface JobriqContextValue {
  profile: Profile
  applications: JobApplication[]
  storageError: string | null
  clearStorageError: () => void
  saveProfile: (profile: Profile) => void
  addApplication: (application: NewApplication) => JobApplication
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void
  deleteApplication: (id: string) => void
  saveGeneratedResume: (id: string, resume: GeneratedResume) => void
}

const JobriqContext = createContext<JobriqContextValue | null>(null)

export function JobriqProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JobriqState>(() => loadState())
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    if (!saveState(state)) {
      setStorageError(
        'Changes could not be saved to this browser. Storage may be full or blocked.',
      )
    }
  }, [state])

  const saveProfile = useCallback((profile: Profile) => {
    setState((current) => ({ ...current, profile }))
  }, [])

  const addApplication = useCallback((application: NewApplication) => {
    const created: JobApplication = {
      id: crypto.randomUUID(),
      company: application.company.trim(),
      role: application.role.trim(),
      jobDescription: application.jobDescription.trim(),
      status: application.status,
      createdAt: new Date().toISOString(),
      generatedResume: null,
    }

    setState((current) => ({
      ...current,
      applications: [created, ...current.applications],
    }))

    return created
  }, [])

  const updateApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      setState((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === id ? { ...application, status } : application,
        ),
      }))
    },
    [],
  )

  const deleteApplication = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      applications: current.applications.filter(
        (application) => application.id !== id,
      ),
    }))
  }, [])

  const saveGeneratedResume = useCallback((id: string, resume: GeneratedResume) => {
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) =>
        application.id === id
          ? { ...application, generatedResume: resume }
          : application,
      ),
    }))
  }, [])

  const clearStorageError = useCallback(() => setStorageError(null), [])

  const value = useMemo(
    () => ({
      profile: state.profile,
      applications: state.applications,
      storageError,
      clearStorageError,
      saveProfile,
      addApplication,
      updateApplicationStatus,
      deleteApplication,
      saveGeneratedResume,
    }),
    [
      state.profile,
      state.applications,
      storageError,
      clearStorageError,
      saveProfile,
      addApplication,
      updateApplicationStatus,
      deleteApplication,
      saveGeneratedResume,
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
