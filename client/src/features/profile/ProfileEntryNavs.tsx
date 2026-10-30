import { useWatch, type Control } from 'react-hook-form'
import type { Profile } from '../../lib/types'
import { EntryNav } from './EntryNav'
import {
  educationNavItems,
  experienceNavItems,
  projectNavItems,
} from './entryNavItems'

interface EntryNavControlProps {
  control: Control<Profile>
}

export function ExperienceEntryNav({ control }: EntryNavControlProps) {
  const entries = useWatch({ control, name: 'experience' }) ?? []

  return (
    <EntryNav
      ariaLabel="Work experience entries"
      items={experienceNavItems(entries)}
    />
  )
}

export function EducationEntryNav({ control }: EntryNavControlProps) {
  const entries = useWatch({ control, name: 'education' }) ?? []

  return (
    <EntryNav ariaLabel="Education entries" items={educationNavItems(entries)} />
  )
}

export function ProjectEntryNav({ control }: EntryNavControlProps) {
  const entries = useWatch({ control, name: 'projects' }) ?? []

  return <EntryNav ariaLabel="Project entries" items={projectNavItems(entries)} />
}
