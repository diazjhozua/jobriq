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
    description: '',
    bullets: [''],
    skillsGained: [],
  }
}

const ids = (entries: readonly { id: string }[]) => entries.map((entry) => entry.id)

describe('PROFILE_SECTION_ORDER', () => {
  it('orders ranges by end date then start date and single dates by issue date', () => {
    expect(PROFILE_SECTION_ORDER.experience.fields).toHaveLength(2)
    expect(PROFILE_SECTION_ORDER.education.fields).toHaveLength(2)
    expect(PROFILE_SECTION_ORDER.projects.fields).toHaveLength(2)
    expect(PROFILE_SECTION_ORDER.certifications.fields).toHaveLength(1)
    expect(PROFILE_SECTION_ORDER.awards.fields).toHaveLength(1)

    expect(
      PROFILE_SECTION_ORDER.projects.fields[0].read(
        project('p', 'Jan 2020', 'Aug 2021'),
      ),
    ).toBe('Aug 2021')
    expect(
      PROFILE_SECTION_ORDER.projects.fields[1].read(
        project('p', 'Jan 2020', 'Aug 2021'),
      ),
    ).toBe('Jan 2020')
    expect(
      PROFILE_SECTION_ORDER.certifications.fields[0].read(
        certification('c', 'Jun 2023'),
      ),
    ).toBe('Jun 2023')
  })
})

describe('sortProfileEntries', () => {
  it('breaks end-date ties with the start date, newest first', () => {
    const entries = [
      experience('old', 'Jan 2018'),
      experience('new', 'Aug 2022'),
      experience('middle', 'Mar 2020'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['new', 'middle', 'old'])
  })

  it('orders ranges by end date and ranks an empty end like Present', () => {
    const entries = [
      experience('ended', 'Jan 2020', 'Jan 2021'),
      experience('current', 'Jan 2020', 'Present'),
      experience('undated-end', 'Jan 2020', ''),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['current', 'undated-end', 'ended'])
  })

  it('orders range entries by end date before start date', () => {
    const entries = [
      experience('newer-start-older-end', 'Aug 2022', 'Jan 2023'),
      experience('older-start-newer-end', 'Jan 2018', 'Jun 2024'),
    ]

    expect(
      ids(sortProfileEntries(entries, PROFILE_SECTION_ORDER.experience)),
    ).toEqual(['older-start-newer-end', 'newer-start-older-end'])
  })

  it('orders education and projects by end date too', () => {
    expect(
      ids(
        sortProfileEntries(
          [
            education('edu-newer-start', 'Aug 2022', 'Jan 2023'),
            education('edu-newer-end', 'Jan 2018', 'Jun 2024'),
          ],
          PROFILE_SECTION_ORDER.education,
        ),
      ),
    ).toEqual(['edu-newer-end', 'edu-newer-start'])

    expect(
      ids(
        sortProfileEntries(
          [
            project('project-newer-start', 'Aug 2022', 'Jan 2023'),
            project('project-newer-end', 'Jan 2018', 'Jun 2024'),
          ],
          PROFILE_SECTION_ORDER.projects,
        ),
      ),
    ).toEqual(['project-newer-end', 'project-newer-start'])
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

  it('ranks a year-only date below a month in the same year', () => {
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
      project('project-old', 'Feb 2020', 'Jun 2024'),
      project('project-new', 'Jul 2024', 'Jan 2024'),
    ]
    return profile
  }

  it('orders all five dated sections', () => {
    const sorted = sortProfile(unsortedProfile())

    expect(ids(sorted.experience)).toEqual(['exp-new', 'exp-old'])
    expect(ids(sorted.education)).toEqual(['edu-new', 'edu-old'])
    expect(ids(sorted.certifications)).toEqual(['cert-new', 'cert-old'])
    expect(ids(sorted.awards)).toEqual(['award-new', 'award-old'])
    expect(ids(sorted.projects)).toEqual(['project-old', 'project-new'])
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
