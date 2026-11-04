import { useWatch, type Control } from 'react-hook-form'
import type { Education, Profile, WorkExperience } from '../../lib/types'
import { uniqueStrings } from '../../lib/utils'

export const PERSONAL_PROJECT = 'Personal Project'

export function companyOptions(experience: readonly WorkExperience[]): string[] {
  return uniqueStrings(experience.map((entry) => entry.company))
}

export function schoolOptions(education: readonly Education[]): string[] {
  return uniqueStrings(education.map((entry) => entry.school))
}

export function projectAssociationOptions(
  profile: Pick<Profile, 'experience' | 'education'>,
): string[] {
  return uniqueStrings([
    ...companyOptions(profile.experience),
    ...schoolOptions(profile.education),
    PERSONAL_PROJECT,
  ])
}

export function awardAssociationOptions(
  profile: Pick<Profile, 'experience' | 'education'>,
): string[] {
  return uniqueStrings([
    ...companyOptions(profile.experience),
    ...schoolOptions(profile.education),
  ])
}

export function issuerOptions(
  profile: Pick<Profile, 'experience' | 'education' | 'certifications' | 'awards'>,
): string[] {
  return uniqueStrings([
    ...companyOptions(profile.experience),
    ...schoolOptions(profile.education),
    ...profile.certifications.map((entry) => entry.issuingOrganization),
    ...profile.awards.map((entry) => entry.issuer),
  ])
}

export interface ProfileOptionSets {
  projectAssociations: string[]
  awardAssociations: string[]
  issuerSuggestions: string[]
}

export function useProfileOptionSets(control: Control<Profile>): ProfileOptionSets {
  const experience = useWatch({ control, name: 'experience' }) ?? []
  const education = useWatch({ control, name: 'education' }) ?? []
  const certifications = useWatch({ control, name: 'certifications' }) ?? []
  const awards = useWatch({ control, name: 'awards' }) ?? []

  return {
    projectAssociations: projectAssociationOptions({ experience, education }),
    awardAssociations: awardAssociationOptions({ experience, education }),
    issuerSuggestions: issuerOptions({
      experience,
      education,
      certifications,
      awards,
    }),
  }
}
