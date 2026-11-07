import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import type { WorkExperience } from '../types'
import { compareExperience } from './profileSectionOrder'
import { useAutoArrangeFieldArray } from './useAutoArrangeFieldArray'

interface FormValues {
  experience: WorkExperience[]
}

function entry(id: string, startDate: string, endDate = ''): WorkExperience {
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

function useHarness(initial: WorkExperience[]) {
  const form = useForm<FormValues>({ defaultValues: { experience: initial } })
  const fieldArray = useAutoArrangeFieldArray({
    control: form.control,
    getValues: form.getValues,
    name: 'experience',
    compare: compareExperience,
  })

  return { form, fieldArray }
}

function arrange(initial: WorkExperience[]) {
  const { result } = renderHook(() => useHarness(initial))
  let moved = false

  act(() => {
    moved = result.current.fieldArray.arrange()
  })

  return {
    moved,
    ids: result.current.form.getValues('experience').map((item) => item.id),
    fields: result.current.fieldArray.fields.map((field) => field.id),
  }
}

describe('useAutoArrangeFieldArray', () => {
  it('does nothing when entries are already newest first', () => {
    const { moved, ids } = arrange([
      entry('new', 'Aug 2022'),
      entry('old', 'Jan 2018'),
    ])

    expect(moved).toBe(false)
    expect(ids).toEqual(['new', 'old'])
  })

  it('moves an edited entry above the entries it is newer than', () => {
    const { moved, ids } = arrange([
      entry('old', 'Jan 2018'),
      entry('new', 'Aug 2022'),
      entry('middle', 'Mar 2020'),
    ])

    expect(moved).toBe(true)
    expect(ids).toEqual(['new', 'middle', 'old'])
  })

  it('ranks an entry without an end date above an ended entry', () => {
    const { moved, ids } = arrange([
      entry('ended', 'Jan 2020', 'Jan 2021'),
      entry('open', 'Jan 2015'),
    ])

    expect(moved).toBe(true)
    expect(ids).toEqual(['open', 'ended'])
  })

  it('composes several moves in one call', () => {
    const { moved, ids } = arrange([
      entry('third', 'Jan 2016'),
      entry('first', 'Jan 2024'),
      entry('fourth', ''),
      entry('second', 'Jan 2020'),
    ])

    expect(moved).toBe(true)
    expect(ids).toEqual(['first', 'second', 'third', 'fourth'])
  })

  it('keeps the moved entries mounted with the same field keys', () => {
    const { result } = renderHook(() =>
      useHarness([entry('old', 'Jan 2018'), entry('new', 'Aug 2022')]),
    )
    const keysBefore = result.current.fieldArray.fields.map((field) => field.id)

    act(() => {
      result.current.fieldArray.arrange()
    })

    expect(result.current.fieldArray.fields.map((field) => field.id)).toEqual(
      [...keysBefore].reverse(),
    )
  })

  it('does nothing for a single entry or an empty section', () => {
    expect(arrange([entry('only', 'Jan 2020')])).toMatchObject({
      moved: false,
      ids: ['only'],
    })
    expect(arrange([])).toMatchObject({ moved: false, ids: [] })
  })

  it('refuses to move entries without unique ids', () => {
    const duplicate = arrange([
      entry('same', 'Jan 2018'),
      entry('same', 'Aug 2022'),
    ])

    expect(duplicate.moved).toBe(false)
    expect(duplicate.ids).toEqual(['same', 'same'])

    const missing = arrange([
      { ...entry('dated', 'Aug 2022'), id: '' },
      entry('other', 'Jan 2018'),
    ])

    expect(missing.moved).toBe(false)
  })

  it('leaves the form values unchanged when no move is needed', () => {
    const entries = [entry('new', 'Aug 2022'), entry('old', 'Jan 2018')]
    const { result } = renderHook(() => useHarness(entries))

    act(() => {
      result.current.fieldArray.arrange()
    })

    expect(result.current.form.getValues('experience')).toEqual(entries)
  })
})
