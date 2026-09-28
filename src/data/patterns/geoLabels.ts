import { mulberry32 } from '../prng'

export const COUNTRY_NAMES = [
  'India',
  'United States',
  'Brazil',
  'Germany',
  'Japan',
  'Australia',
  'Canada',
  'France',
  'Mexico',
  'South Africa',
]

export const STATE_NAMES = [
  'Maharashtra',
  'Bihar',
  'West Bengal',
  'Kerala',
  'Gujarat',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Karnataka',
  'Uttar Pradesh',
]

export const CITY_NAMES = [
  'Mumbai',
  'Patna',
  'Kolkata',
  'Kochi',
  'Indore',
  'Ahmedabad',
  'Pune',
  'Gaya',
  'Bhagalpur',
  'Chennai',
]

function pickUnique(pool: string[], count: number, seed: number): string[] {
  const rng = mulberry32(seed)
  const bag = [...pool]
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag.push(...pool.map((n) => `${n} ${i}`))
    const idx = Math.floor(rng() * bag.length)
    out.push(bag.splice(idx, 1)[0]!)
  }
  return out
}

/** Category / group axis — countries. */
export function generateCountryNames(count: number, seed: number): string[] {
  return pickUnique(COUNTRY_NAMES, count, seed)
}

/** Series / secondary axis — states (shuffled by seed). */
export function generateStateNames(count: number, seed: number): string[] {
  return pickUnique(STATE_NAMES, count, seed + 17)
}

export function geoNameForTreeDepth(depth: number, index: number): string {
  if (depth === 0) return COUNTRY_NAMES[index % COUNTRY_NAMES.length]!
  if (depth === 1) return STATE_NAMES[index % STATE_NAMES.length]!
  return CITY_NAMES[index % CITY_NAMES.length]!
}
