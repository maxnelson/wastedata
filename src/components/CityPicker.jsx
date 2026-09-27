import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import styles from './CityPicker.module.css'
import { useAppData } from '../contexts/useAppData'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" />
    </svg>
  )
}

/**
 * CityPicker — inline textarea variant
 *
 * The city name heading is itself a search textarea. Focusing it shows dropdown
 * results immediately; typing filters them live.
 *
 * Touch notes: the list is deliberately NOT torn down when the textarea blurs
 * without a new focus target. iOS never focuses a tapped <button>, and dismissing
 * the on-screen keyboard is a blur too, so closing on those would unmount an
 * option before its click arrives. Outside taps close the list on pointerup
 * instead, which also leaves it alone while the page is being scrolled.
 *
 * Props:
 *   value        — { city, state, key } | null
 *   onChange     — (cityObj | null) => void
 *   excludeCity  — city object to suppress from results (prevents self-compare)
 *   openOnMount  — open the dropdown immediately (used when City B is first activated)
 *   onCloseEmpty — called when user dismisses without selecting (e.g. Escape with no value set)
 */
export default function CityPicker({ value, onChange, excludeCity, openOnMount, onCloseEmpty }) {
  const { CITY_KEYS } = useAppData()
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [activeIdx, setActiveIdx] = useState(-1) // explicit arrow-key highlight; -1 = none
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // Sorted list of all CA cities built once from CITY_KEYS
  const cityList = useMemo(() =>
    Array.from(CITY_KEYS)
      .map(key => {
        const [city, state] = key.split('|')
        return { city, state, key, hasData: true }
      })
      .sort((a, b) => a.city.localeCompare(b.city)),
    [CITY_KEYS]
  )

  // The value shown in the textarea: city name when closed, live query when open
  const displayValue = open ? query : (value?.city ?? '')

  // Auto-resize the textarea to fit its content (allows multi-line wrapping)
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [displayValue])

  // openOnMount: focus the textarea so the dropdown opens immediately
  useEffect(() => {
    if (openOnMount) inputRef.current?.focus()
  }, [openOnMount])

  const excludeKey = excludeCity?.key

  // Prefix-filtered results, minus the other picker's city. The currently-selected
  // city stays in the list so it shows with a checkmark.
  const visible = useMemo(() => {
    if (!open) return []
    const q = query.trim().toLowerCase()
    return cityList.filter(r =>
      r.key !== excludeKey && (q.length === 0 || r.city.toLowerCase().startsWith(q))
    )
  }, [open, query, cityList, excludeKey])

  // The row Enter commits: the arrow-key highlight if there is one, otherwise the first
  // match once the user has typed something. cityList is sorted, so an exact name match
  // is always the first prefix match.
  const effectiveIdx = activeIdx >= 0
    ? Math.min(activeIdx, visible.length - 1)
    : (query.trim() && visible.length > 0 ? 0 : -1)

  function openList() {
    setQuery(value?.city ?? '')
    setActiveIdx(-1)
    setOpen(true)
  }

  function closeList({ notifyEmpty = true } = {}) {
    setOpen(false)
    setQuery('')
    setActiveIdx(-1)
    if (notifyEmpty && !value) onCloseEmpty?.()
  }

  // Close on an outside click/tap. Mouse and pen close on pointerdown; touch waits for
  // pointerup so a scroll gesture (which ends in pointercancel) leaves the list open.
  useEffect(() => {
    if (!open) return
    let touchStartedOutside = false
    const isOutside = target => containerRef.current && !containerRef.current.contains(target)
    const close = () => {
      setOpen(false)
      setQuery('')
      setActiveIdx(-1)
      if (!value) onCloseEmpty?.()
    }
    function onPointerDown(e) {
      if (!isOutside(e.target)) return
      if (e.pointerType === 'touch') touchStartedOutside = true
      else close()
    }
    function onPointerUp() {
      if (touchStartedOutside) close()
      touchStartedOutside = false
    }
    function onPointerCancel() {
      touchStartedOutside = false
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerCancel)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [open, value, onCloseEmpty])

  // Only a real focus move to something outside the picker (Tab / Shift+Tab / another
  // field) closes here. relatedTarget is null when the on-screen keyboard is dismissed,
  // when a non-focusable area is tapped, when the window loses focus, or when we call
  // blur() ourselves — none of those should tear the list down.
  function handleBlur(e) {
    if (!e.relatedTarget || containerRef.current?.contains(e.relatedTarget)) return
    closeList()
  }

  function handleSelect(result) {
    closeList({ notifyEmpty: false })
    if (result.key !== value?.key) onChange(result)
    // Drop focus so the mobile keyboard dismisses and the next click/tap re-opens via onFocus
    inputRef.current?.blur()
  }

  // First city whose name starts with q (sorted list, so an exact match comes first)
  function firstMatch(q) {
    const norm = q.trim().toLowerCase()
    if (!norm) return null
    return cityList.find(r => r.key !== excludeKey && r.city.toLowerCase().startsWith(norm)) ?? null
  }

  function handleChange(e) {
    const raw = e.target.value
    if (raw.includes('\n')) {
      // Some Android keyboards deliver Enter as inserted text (keyCode 229), not a keydown
      const q = raw.replace(/\n/g, '')
      const target = firstMatch(q)
      if (target) handleSelect(target)
      else setQuery(q)
      return
    }
    if (!open) setOpen(true) // typing after Escape re-opens the list
    setQuery(raw)
    setActiveIdx(-1)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()                     // never insert a newline
      if (e.nativeEvent.isComposing) return  // IME still composing
      const target = visible[effectiveIdx]
      if (target) handleSelect(target)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(Math.min(effectiveIdx + 1, visible.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(Math.max(effectiveIdx - 1, -1))
    } else if (e.key === 'Escape') {
      closeList()
    }
  }

  return (
    <div ref={containerRef} className={styles.picker}>
      {/* City name — a textarea so long names wrap on small screens */}
      <textarea
        ref={inputRef}
        className={styles.cityInput}
        value={displayValue}
        placeholder="Choose a city"
        rows={1}
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="go"
        onFocus={openList}
        onClick={() => { if (!open) openList() }} // re-open when focus was retained (e.g. after Escape)
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {/* Results dropdown */}
      {open && (
        <div className={styles.dropdown} role="listbox">
          {visible.length === 0 && (
            <p className={styles.meta}>No cities found</p>
          )}

          {visible.map((r, i) => {
            const isSelected = r.key === value?.key
            return (
              <button
                key={r.key}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                className={[
                  styles.option,
                  isSelected         ? styles.optionSelected : '',
                  i === effectiveIdx ? styles.optionActive   : '',
                ].join(' ')}
                onMouseDown={e => e.preventDefault()} // keep focus in the textarea; click still fires
                onClick={() => handleSelect(r)}
              >
                {isSelected && <span className={styles.optionCheck}><CheckIcon /></span>}
                <span className={styles.optionName}>{r.city}</span>
                <span className={styles.optionMeta}>{r.state}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
