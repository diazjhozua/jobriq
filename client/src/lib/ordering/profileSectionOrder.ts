import type {
  Award,
  Certification,
  Education,
  Profile,
  Project,
  WorkExperience,
} from '../types'
import { compareDateSortKeysDesc, toDateSortKey } from './dateSortKey'

export interface ProfileSectionDescriptor<T extends { id: string }> {
  primary: (entry: T) => string
  secondary?: (entry: T) => string
}

export interface ProfileSectionDescriptors {
  experience: ProfileSectionDescriptor<WorkExperience>
  education: ProfileSectionDescriptor<Education>
  certifications: ProfileSectionDescriptor<Certification>
  awards: ProfileSectionDescriptor<Award>
  projects: ProfileSectionDescriptor<Project>
}

/**
 * Which date fields order each profile section. Ranges order by start date
 * with the end date as a tie-break; certifications and awards order by their
 * issue date only.
 */
export const PROFILE_SECTION_ORDER: ProfileSectionDescriptors = {
  experience: {
    primary: (entry) => entry.startDate,
    secondary: (entry) => entry.endDate,
  },
  education: {
    primary: (entry) => entry.startDate,
    secondary: (entry) => entry.endDate,
  },
  certifications: {
    primary: (entry) => entry.issueDate,
  },
  awards: {
    primary: (entry) => entry.issueDate,
  },
  projects: {
    primary: (entry) => entry.startDate,
    secondary: (entry) => entry.endDate,
  },
}

export function createEntryComparator<T extends { id: string }>(
  descriptor: ProfileSectionDescriptor<T>,
): (left: T, right: T) => number {
  return (left, right) => {
    const leftPrimary = toDateSortKey(descriptor.primary(left))
    const rightPrimary = toDateSortKey(descriptor.primary(right))
    const primary = compareDateSortKeysDesc(leftPrimary, rightPrimary)

    if (primary !== 0) {
      return primary
    }

    // Undated entries are last as a group and keep their relative order.
    if (leftPrimary.kind === 'unparseable' || rightPrimary.kind === 'unparseable') {
      return 0
    }

    if (!descriptor.secondary) {
      return 0
    }

    return compareDateSortKeysDesc(
      toDateSortKey(descriptor.secondary(left)),
      toDateSortKey(descriptor.secondary(right)),
    )
  }
}

/** Stable sort that preserves the original order of equal entries. */
export function sortStableBy<T>(
  entries: readonly T[],
  compare: (left: T, right: T) => number,
): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => compare(left.entry, right.entry) || left.index - right.index)
    .map(({ entry }) => entry)
}

export function sortProfileEntries<T extends { id: string }>(
  entries: readonly T[],
  descriptor: ProfileSectionDescriptor<T>,
): T[] {
  return sortStableBy(entries, createEntryComparator(descriptor))
}

export const compareExperience = createEntryComparator(
  PROFILE_SECTION_ORDER.experience,
)
export const compareEducation = createEntryComparator(
  PROFILE_SECTION_ORDER.education,
)
export const compareCertifications = createEntryComparator(
  PROFILE_SECTION_ORDER.certifications,
)
export const compareAwards = createEntryComparator(PROFILE_SECTION_ORDER.awards)
export const compareProjects = createEntryComparator(PROFILE_SECTION_ORDER.projects)

/** Returns a copy of the profile with every dated section ordered newest first. */
export function sortProfile(profile: Profile): Profile {
  return {
    ...profile,
    experience: sortProfileEntries(
      profile.experience,
      PROFILE_SECTION_ORDER.experience,
    ),
    education: sortProfileEntries(
      profile.education,
      PROFILE_SECTION_ORDER.education,
    ),
    certifications: sortProfileEntries(
      profile.certifications,
      PROFILE_SECTION_ORDER.certifications,
    ),
    awards: sortProfileEntries(profile.awards, PROFILE_SECTION_ORDER.awards),
    projects: sortProfileEntries(profile.projects, PROFILE_SECTION_ORDER.projects),
  }
}
