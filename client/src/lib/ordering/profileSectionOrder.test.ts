import { describe, expect, it } from 'vitest'
import { createEmptyState } from '../defaults'
import type {
  Award,
  Certification,
  Education,
  Profile,
  Project,
  WorkExperience,
} from '../types'
import {
  PROFILE_SECTION_ORDER,
  sortProfile,
  sortProfileEntries,
} from './profileSectionOrder'

function experience(
  id: string,
  startDate: string,
  endDate = '',
): WorkExperience {
  return {
    id,
    company: id,
    title: '',
    startDate,
    endDate,
    bullets: [''],
    skillsGained: [],
  }
}

function education(id: string, startDate: string, endDate = ''): Education {
  return {
    id,
    school: id,
    degree: '',
    field: '',
    startDate,
    endDate,
    gpa: '',
    skillsGained: [],
  }
}

function certification(
  id: string,
  issueDate: string,
  expirationDate = '',
): Certification {
  return {
    id,
    name: id,
    issuingOrganization: '',
    issueDate,
    expirationDate,
    credentialId: '',
    credentialUrl: '',
    skillsGained: [],
  }
}

function award(id: string, issueDate: string): Award {
  return {
    id,
    title: id,
    associatedWith: '',
    issuer: '',
    issueDate,
    description: '',
  }
}

function project(id: string, startDate: string, endDate = ''): Project {
  return {
    id,
    name: id,
    url: '',
    startDate,
    endDate,
    associatedWith: '',
    bullets: [''],
    skillsGained: [],
  }
}

const ids = (entries: readonly { id: string }[]) => entries.map((entry) => entry.id)

describe('PROFILE_SECTION_ORDER', () => {
  it('maps ranges to start then end and single dates to the issue date', () => {
    expect(PROFILE_SECTION_ORDER.experience.secondary).toBeDefined()
    expect(PROFILE_SECTION_ORDER.education.secondary).toBeDefined()
    expect(PROFILE_SECTION_ORDER.projects.secondary).toBeDefined()
    expect(PROFILE_SECTION_ORDER.certifications.secondary).toBeUndefined()
    expect(PROFILE_SECTION_ORDER.awards.secondary).toBeUndefined()
  })
})

describe('sortProfileEntries', () => {
  it('orders range entries by start date, newest first', () => {
    const entries = [
      experience('old', 'Jan 2018'),
      experience('new', 'Aug 2022'),
      experience('middle', 'Mar 2020'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['new', 'middle', 'old'])
  })

  it('breaks start-date ties with the end date, Present first', () => {
    const entries = [
      experience('ended', 'Jan 2020', 'Jan 2021'),
      experience('current', 'Jan 2020', 'Present'),
      experience('undated-end', 'Jan 2020', ''),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['current', 'ended', 'undated-end'])
  })

  it('places undated entries last and keeps them stable', () => {
    const entries = [
      experience('legacy', 'Spring 2020'),
      experience('dated', 'Aug 2022'),
      experience('empty', ''),
      experience('legacy-two', 'Fall 2019'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['dated', 'legacy', 'empty', 'legacy-two'])
  })

  it('ranks a year-only start below a month in the same year', () => {
    const entries = [
      experience('year-only', '2018'),
      experience('august', 'Aug 2018'),
      experience('december', 'Dec 2017'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['august', 'year-only', 'december'])
  })

  it('keeps equal entries in their original order', () => {
    const entries = [
      experience('first', 'Jan 2020', 'Jan 2021'),
      experience('second', 'Jan 2020', 'Jan 2021'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['first', 'second'])
  })

  it('orders certifications by issue date and ignores expiration', () => {
    const entries = [
      certification('old', 'Jan 2019', 'Jan 2030'),
      certification('new', 'Jun 2023', 'Jan 2024'),
      certification('undated', ''),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.certifications)),
    ).toEqual(['new', 'old', 'undated'])
  })

  it('orders awards by issue date', () => {
    const entries = [
      award('old', 'May 2015'),
      award('new', 'Nov 2021'),
      award('undated', ''),
    ]

    expect(ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.awards))).toEqual(
      ['new', 'old', 'undated'],
    )
  })

  it('does not mutate the input array', () => {
    const entries = [experience('old', 'Jan 2018'), experience('new', 'Jan 2022')]
    sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)

    expect(ids(entries)).toEqual(['old', 'new'])
  })
})

describe('sortProfile', () => {
  function unsortedProfile(): Profile {
    const profile = createEmptyState().profile
    profile.experience = [
      experience('exp-old', 'Jan 2018'),
      experience('exp-new', 'Aug 2022'),
    ]
    profile.education = [
      education('edu-old', 'Sep 2012'),
      education('edu-new', 'Sep 2019'),
    ]
    profile.certifications = [
      certification('cert-old', 'Jan 2015'),
      certification('cert-new', 'Jun 2023'),
    ]
    profile.awards = [award('award-old', 'May 2015'), award('award-new', 'Nov 2021')]
    profile.projects = [
      project('project-old', 'Feb 2020'),
      project('project-new', 'Jul 2024'),
    ]
    return profile
  }

  it('orders all five dated sections', () => {
    const sorted = sortProfile(unsortedProfile())

    expect(ids(sorted.experience)).toEqual(['exp-new', 'exp-old'])
    expect(ids(sorted.education)).toEqual(['edu-new', 'edu-old'])
    expect(ids(sorted.certifications)).toEqual(['cert-new', 'cert-old'])
    expect(ids(sorted.awards)).toEqual(['award-new', 'award-old'])
    expect(ids(sorted.projects)).toEqual(['project-new', 'project-old'])
  })

  it('leaves the undated parts of the profile untouched', () => {
    const profile = unsortedProfile()
    const sorted = sortProfile(profile)

    expect(sorted.personal).toBe(profile.personal)
    expect(sorted.summary).toBe(profile.summary)
    expect(sorted.summaryType).toBe(profile.summaryType)
    expect(sorted.skills).toBe(profile.skills)
  })

  it('does not mutate the input profile', () => {
    const profile = unsortedProfile()
    sortProfile(profile)

    expect(ids(profile.experience)).toEqual(['exp-old', 'exp-new'])
    expect(ids(profile.certifications)).toEqual(['cert-old', 'cert-new'])
  })

  it('handles empty and single-entry sections', () => {
    const profile = createEmptyState().profile
    profile.experience = [experience('only', 'Jan 2020')]

    const sorted = sortProfile(profile)

    expect(ids(sorted.experience)).toEqual(['only'])
    expect(sorted.education).toEqual([])
    expect(sorted.awards).toEqual([])
  })
})
