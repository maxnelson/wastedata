import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_DATA_BASE_URL

/**
 * Fetches a jurisdiction's waste-characterization file (`${BASE}/${slug}.json`).
 *
 * Returns null while the file is loading, when the jurisdiction has no
 * characterization data, or when the fetch fails; callers then fall back to
 * the statewide averages. The result is keyed by slug so a response for a
 * previous city is never shown under the current one.
 */
export function useCharacterization(slug, hasCharacterization) {
  const [fetched, setFetched] = useState({ slug: null, data: null })

  useEffect(() => {
    if (!hasCharacterization || !BASE || !slug) return
    let cancelled = false
    fetch(`${BASE}/${slug}.json`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(data => { if (!cancelled) setFetched({ slug, data }) })
    return () => { cancelled = true }
  }, [slug, hasCharacterization])

  return hasCharacterization && fetched.slug === slug ? fetched.data : null
}
