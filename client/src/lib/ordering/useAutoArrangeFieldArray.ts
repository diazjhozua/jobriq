import {
  useFieldArray,
  type Control,
  type FieldArrayPath,
  type FieldValues,
  type Path,
  type UseFieldArrayReturn,
  type UseFormGetValues,
} from 'react-hook-form'
import { sortStableBy } from './orderingPolicy'

type FieldArrayEntry<T extends FieldValues, K extends FieldArrayPath<T>> =
  T[K] extends readonly (infer Entry)[] ? Entry : never

export interface UseAutoArrangeFieldArrayOptions<
  T extends FieldValues,
  K extends FieldArrayPath<T>,
> {
  control: Control<T>
  getValues: UseFormGetValues<T>
  name: K
  compare: (left: FieldArrayEntry<T, K>, right: FieldArrayEntry<T, K>) => number
}

export type UseAutoArrangeFieldArrayResult<
  T extends FieldValues,
  K extends FieldArrayPath<T>,
> = UseFieldArrayReturn<T, K, 'id'> & {
  /**
   * Reorders the live values newest first. Returns true when at least one
   * move was applied. Safe to call after a date commit: `move` keeps each
   * entry's key, so cards are relocated instead of remounted.
   */
  arrange: () => boolean
}

export function useAutoArrangeFieldArray<
  T extends FieldValues,
  K extends FieldArrayPath<T>,
>({
  control,
  getValues,
  name,
  compare,
}: UseAutoArrangeFieldArrayOptions<T, K>): UseAutoArrangeFieldArrayResult<
  T,
  K
> {
  const fieldArray = useFieldArray({ control, name })

  const arrange = () => {
    const current = getValues(name as Path<T>) as unknown as
      | FieldArrayEntry<T, K>[]
      | undefined

    if (!current || current.length < 2) {
      return false
    }

    const ids = current.map((entry) => (entry as { id?: string }).id)

    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      return false
    }

    const ordered = sortStableBy(current, compare)
    const working = ids as string[]
    let moved = false

    ordered.forEach((entry, index) => {
      const targetId = (entry as { id: string }).id
      const from = working.indexOf(targetId, index)

      if (from === index) {
        return
      }

      fieldArray.move(from, index)
      working.splice(from, 1)
      working.splice(index, 0, targetId)
      moved = true
    })

    return moved
  }

  return { ...fieldArray, arrange }
}
