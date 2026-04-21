/**
 * Parse a URL segment like "san-francisco-ca" → city object.
 * The state abbreviation is always the last hyphen-delimited token (2 chars).
 * Returns null if the slug doesn't match a known jurisdiction.
 */
export function segmentToCityObj(jurisdictions, segment) {
  if (!segment) return null
  const parts = segment.split('-')
  const state = parts.pop().toUpperCase()   // "ca" → "CA"
  const slug  = parts.join('-')             // "san-francisco"
  const entry = Object.values(jurisdictions).find(e => e.slug === slug)
  if (!entry) return null
  return { city: entry.name, state, key: `${entry.name}|${state}` }
}

/**
 * Build a URL segment from a city object.
 * { city: 'San Francisco', state: 'CA' } → "san-francisco-ca"
 */
export function cityObjToSegment(jurisdictions, cityObj) {
  const entry = jurisdictions[cityObj.city]
  const slug  = entry?.slug ?? cityObj.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug}-${cityObj.state.toLowerCase()}`
}

/**
 * 159-city pool for random default: pop > 50k, has characterization, no agencies/unincorporated.
 */
export function buildRandomPool(jurisdictions) {
  return Object.entries(jurisdictions)
    .filter(([name, v]) =>
      v.perCapita &&
      v.hasCharacterization &&
      (v.pop2024 ?? 0) > 50_000 &&
      !name.includes('Authority') &&
      !name.includes('Agency') &&
      !name.includes('Unincorporated')
    )
    .map(([name]) => ({ city: name, state: 'CA', key: `${name}|CA` }))
}

/**
 * Pick two distinct random cities from the pool.
 */
export function randomCityPair(jurisdictions) {
  const pool  = [...buildRandomPool(jurisdictions)]
  const idxA  = Math.floor(Math.random() * pool.length)
  const cityA = pool.splice(idxA, 1)[0]
  const idxB  = Math.floor(Math.random() * pool.length)
  const cityB = pool[idxB]
  return [cityA, cityB]
}
