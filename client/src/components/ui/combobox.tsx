import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { Input } from './input'

const DEFAULT_EMPTY_MESSAGE = 'No suggestions. Free text is allowed.'

export interface ComboboxProps {
  id: string
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  emptyMessage?: string
}

export function Combobox({
  id,
  label,
  value,
  options,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  allowClear = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  const optionId = (index: number) => `${listboxId}-option-${index}`
  const normalizedQuery = query.trim().toLowerCase()
  const visible = normalizedQuery
    ? options.filter((option) => option.toLowerCase().includes(normalizedQuery))
    : options
  const safeIndex = Math.min(activeIndex, Math.max(visible.length - 1, 0))
  const activeOptionId =
    open && visible.length > 0 ? optionId(safeIndex) : undefined

  useEffect(() => {
    if (!open) {
      return
    }

    document
      .getElementById(`${listboxId}-option-${safeIndex}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [listboxId, open, safeIndex])

  const openList = () => {
    if (disabled) {
      return
    }

    setQuery('')
    setActiveIndex(0)
    setOpen(true)
  }

  const closeList = () => {
    setOpen(false)
    setQuery('')
  }

  const select = (option: string) => {
    onChange(option)
    closeList()
    inputRef.current?.focus()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    onChange(next)
    setQuery(next)
    setActiveIndex(0)
    setOpen(true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      setActiveIndex((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      if (!open) {
        return
      }

      event.preventDefault()
      const option = visible[safeIndex]
      if (option) {
        select(option)
      } else {
        closeList()
      }
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      closeList()
      return
    }

    if (event.key === 'Tab') {
      closeList()
    }
  }

  const handleBlur = () => {
    closeList()
    onBlur?.()
  }

  const handleInteractOutside = (event: Event) => {
    const target = event.target
    if (target instanceof Node && anchorRef.current?.contains(target)) {
      event.preventDefault()
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true)
        } else {
          closeList()
        }
      }}
    >
      <Popover.Anchor asChild>
        <div ref={anchorRef} className="relative">
          <Input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-activedescendant={activeOptionId}
            autoComplete="off"
            className="pr-9"
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={() => {
              if (!open) {
                openList()
              }
            }}
            onBlur={handleBlur}
          />
          {allowClear && value !== '' && !disabled ? (
            <button
              type="button"
              aria-label={`Clear ${label}`}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-colors hover:text-navy"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange('')
                closeList()
                inputRef.current?.focus()
              }}
            >
              <X aria-hidden="true" size={14} />
            </button>
          ) : (
            <ChevronDown
              aria-hidden="true"
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          )}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          role="presentation"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={handleInteractOutside}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[12rem] border border-border bg-surface p-1 shadow-sheet"
        >
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="max-h-56 overflow-y-auto"
          >
            {visible.map((option, index) => (
              <li
                key={option}
                id={optionId(index)}
                role="option"
                aria-selected={
                  option.trim().toLowerCase() === value.trim().toLowerCase()
                }
                className={cn(
                  'cursor-pointer break-words rounded-sm px-2.5 py-1.5 text-[0.85rem] text-body',
                  index === safeIndex
                    ? 'bg-canvas font-medium text-navy'
                    : 'hover:bg-canvas',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option)}
              >
                {option}
              </li>
            ))}
          </ul>
          {visible.length === 0 ? (
            <p role="status" className="px-2.5 py-2 text-[0.8rem] text-muted">
              {emptyMessage}
            </p>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
