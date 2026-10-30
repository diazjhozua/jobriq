import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useActiveAnchor } from './useActiveAnchor'

function Harness({ ids, revision }: { ids: string[]; revision?: string }) {
  const active = useActiveAnchor(ids, revision)

  return <p data-testid="active">{active ?? 'none'}</p>
}

describe('useActiveAnchor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tracks the topmost visible anchor', () => {
    let callback: IntersectionObserverCallback = () => {}

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(observerCallback: IntersectionObserverCallback) {
          callback = observerCallback
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )

    render(
      <>
        <Harness ids={['one', 'two']} />
        <div id="one" />
        <div id="two" />
      </>,
    )

    expect(screen.getByTestId('active')).toHaveTextContent('one')

    const one = document.getElementById('one') as HTMLElement
    const two = document.getElementById('two') as HTMLElement
    one.getBoundingClientRect = () => ({ top: 80 }) as DOMRect
    two.getBoundingClientRect = () => ({ top: 20 }) as DOMRect

    act(() => {
      callback(
        [
          {
            isIntersecting: true,
            target: two,
            boundingClientRect: { top: 20 },
          },
          {
            isIntersecting: true,
            target: one,
            boundingClientRect: { top: 80 },
          },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByTestId('active')).toHaveTextContent('two')
  })

  it('keeps the topmost visible anchor when only one entry leaves', () => {
    let callback: IntersectionObserverCallback = () => {}

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(observerCallback: IntersectionObserverCallback) {
          callback = observerCallback
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )

    render(
      <>
        <Harness ids={['one', 'two']} />
        <div id="one" />
        <div id="two" />
      </>,
    )

    act(() => {
      callback(
        [
          {
            isIntersecting: true,
            target: document.getElementById('one'),
            boundingClientRect: { top: 0 },
          },
          {
            isIntersecting: true,
            target: document.getElementById('two'),
            boundingClientRect: { top: 200 },
          },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByTestId('active')).toHaveTextContent('one')

    act(() => {
      callback(
        [
          {
            isIntersecting: false,
            target: document.getElementById('one'),
            boundingClientRect: { top: -400 },
          },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByTestId('active')).toHaveTextContent('two')
  })

  it('resets to the first anchor when the ids change', () => {
    const { rerender } = render(<Harness ids={['one', 'two']} />)
    expect(screen.getByTestId('active')).toHaveTextContent('one')

    rerender(<Harness ids={['three']} />)

    expect(screen.getByTestId('active')).toHaveTextContent('three')
  })

  it('reobserves replaced nodes when the revision changes', () => {
    const observed: Element[] = []
    let disconnects = 0

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(element: Element) {
          observed.push(element)
        }
        unobserve() {}
        disconnect() {
          disconnects += 1
        }
      },
    )

    function Targets({ revision }: { revision: number }) {
      return <div key={revision} id="one" />
    }

    const { rerender } = render(
      <>
        <Harness ids={['one']} revision="1" />
        <Targets revision={1} />
      </>,
    )

    const first = observed[0]
    expect(observed).toHaveLength(1)

    rerender(
      <>
        <Harness ids={['one']} revision="2" />
        <Targets revision={2} />
      </>,
    )

    expect(disconnects).toBe(1)
    expect(observed).toHaveLength(2)
    expect(observed[1]).not.toBe(first)
  })
})
