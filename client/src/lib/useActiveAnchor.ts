import { useEffect, useState } from 'react'

export function useActiveAnchor(
  ids: readonly string[],
  revision = '',
): string | undefined {
  const key = ids.join('\n')
  const [selection, setSelection] = useState<{
    key: string
    id: string | undefined
  }>({ key, id: ids[0] })
  const active = selection.key === key ? selection.id : ids[0]

  useEffect(() => {
    const current = key ? key.split('\n') : []

    const elements = current
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) {
      return
    }

    const visible = new Set<string>()

    const selectTopmost = () => {
      const topmost = elements
        .filter((element) => visible.has(element.id))
        .map((element) => ({
          id: element.id,
          top: element.getBoundingClientRect().top,
        }))
        .sort((left, right) => left.top - right.top)[0]

      if (topmost) {
        setSelection({ key, id: topmost.id })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        })

        selectTopmost()
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [key, revision])

  return active
}
