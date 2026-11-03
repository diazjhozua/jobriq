import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import type { Profile } from '../../lib/types'
import {
  allMissingSkills,
  missingSkillsGroups,
} from './skillsGained'

const EMPTY_ENTRIES: never[] = []

interface SkillsGainedSuggestionsProps {
  control: Control<Profile>
  overallSkills: string[]
  disabled?: boolean
  onAdd: (skill: string) => void
  onAddAll: (skills: string[]) => void
}

export function SkillsGainedSuggestions({
  control,
  overallSkills,
  disabled,
  onAdd,
  onAddAll,
}: SkillsGainedSuggestionsProps) {
  const experience = useWatch({ control, name: 'experience' }) ?? EMPTY_ENTRIES
  const education = useWatch({ control, name: 'education' }) ?? EMPTY_ENTRIES
  const certifications =
    useWatch({ control, name: 'certifications' }) ?? EMPTY_ENTRIES
  const projects = useWatch({ control, name: 'projects' }) ?? EMPTY_ENTRIES

  const groups = useMemo(
    () =>
      missingSkillsGroups(
        { experience, education, certifications, projects },
        overallSkills,
      ),
    [experience, education, certifications, projects, overallSkills],
  )

  if (groups.length === 0) {
    return null
  }

  return (
    <section
      id="skills-gained-suggestions"
      aria-labelledby="skills-gained-suggestions-title"
      className="mt-4 border-t border-border pt-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="skills-gained-suggestions-title"
            className="font-sans text-[0.85rem] font-medium text-navy"
          >
            Skills gained not in your Skills list
          </h3>
          <p className="mt-1 text-[0.75rem] leading-5 text-muted">
            Add them here if they belong in your overall list.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onAddAll(allMissingSkills(groups))}
        >
          Add all missing
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.key} role="group" aria-label={group.label}>
            <p className="text-[0.75rem] font-medium text-muted">{group.label}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {group.skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  data-skill-chip
                  disabled={disabled}
                  aria-label={`Add ${skill} to skills`}
                  onClick={(event) => {
                    const next = event.currentTarget.nextElementSibling
                    onAdd(skill)
                    requestAnimationFrame(() => {
                      if (next instanceof HTMLElement && next.isConnected) {
                        next.focus()
                        return
                      }

                      const first = document
                        .getElementById('skills-gained-suggestions')
                        ?.querySelector<HTMLElement>('[data-skill-chip]')
                      ;(first ?? document.getElementById('skills'))?.focus()
                    })
                  }}
                  className="inline-flex max-w-full min-w-0 items-center gap-1 break-words border border-border bg-canvas px-2 py-0.5 text-[0.78rem] text-body transition-colors hover:border-muted/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue [overflow-wrap:anywhere]"
                >
                  <Plus aria-hidden="true" size={12} />
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
