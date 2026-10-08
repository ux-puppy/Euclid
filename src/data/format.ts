import type { ChartSpec } from '../chart-spec/types'

export function formatValue(
  value: number,
  format: ChartSpec['labels']['valueFormat'],
): string {
  const { style, decimals, prefix, suffix } = format
  let core: string
  const places = Math.min(2, Math.max(0, decimals))
  if (style === 'percent') {
    core = `${(value * 100).toFixed(places)}`
  } else {
    core = value.toFixed(places)
  }
  return `${prefix}${core}${suffix}`
}

export function formatLabelTemplate(
  template: string,
  value: number,
  label: string,
  valueFormat: ChartSpec['labels']['valueFormat'],
): string {
  const formatted = formatValue(value, valueFormat)
  return template.replace('{value}', formatted).replace('{label}', label).trim()
}

export function barLabelFields(
  template: string,
  value: number,
  name: string,
  valueFormat: ChartSpec['labels']['valueFormat'],
): { label: string; valueText?: string; nameText?: string } {
  const label = formatLabelTemplate(template, value, name, valueFormat)
  const split = template.includes('{value}') && template.includes('{label}')
  if (!split) return { label }
  return {
    label,
    valueText: formatValue(value, valueFormat),
    nameText: name,
  }
}
