import countries from 'world-countries'

export const getCountryOptions = () => {
  const seen = new Set<string>()

  const options = countries.reduce<{ value: string; label: string }[]>((acc, country) => {
    const name = country.translations?.fra?.common ?? country.name.common
    if (!name) {
      return acc
    }

    const normalized = name.trim()

    if (seen.has(normalized)) {
      return acc
    }

    seen.add(normalized)
    acc.push({ value: normalized, label: normalized })
    return acc
  }, [])

  options.push({ value: 'Autre', label: 'Autre' })

  return options.sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}