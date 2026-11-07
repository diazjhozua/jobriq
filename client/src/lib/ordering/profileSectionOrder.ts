import type {
  Award,
  Certification,
  Education,
  Profile,
  Project,
  WorkExperience,
} from '../types'
import {
  compareByPolicy,
  rangeOrderingPolicy,
  singleDateOrderingPolicy,
  sortByPolicy,
  type SectionOrderingPolicy,
} from './orderingPolicy'

export interface ProfileSectionPolicies {
  experience: SectionOrderingPolicy<WorkExperience>
  education: SectionOrderingPolicy<Education>
  certifications: SectionOrderingPolicy<Certification>
  awards: SectionOrderingPolicy<Award>
  projects: SectionOrderingPolicy<Project>
}

/**
 * Which dates order each profile section. Ranges order by end date, where an
 * unfilled end means the entry is ongoing (ranked like `Present`), and use the
 * start date as the tie-break; certifications and awards order by issue date.
 */
export const PROFILE_SECTION_ORDER: ProfileSectionPolicies = {
  experience: rangeOrderingPolicy(
    (entry) => entry.startDate,
    (entry) => entry.endDate,
  ),
  education: rangeOrderingPolicy(
    (entry) => entry.startDate,
    (entry) => entry.endDate,
  ),
  certifications: singleDateOrderingPolicy((entry) => entry.issueDate),
  awards: singleDateOrderingPolicy((entry) => entry.issueDate),
  projects: rangeOrderingPolicy(
    (entry) => entry.startDate,
    (entry) => entry.endDate,
  ),
}

export function createEntryComparator<T extends { id: string }>(
  policy: SectionOrderingPolicy<T>,
): (left: T, right: T) => number {
  return (left, right) => compareByPolicy(policy, left, right)
}

export function sortProfileEntries<T extends { id: string }>(
  entries: readonly T[],
  policy: SectionOrderingPolicy<T>,
): T[] {
  return sortByPolicy(entries, policy)
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
