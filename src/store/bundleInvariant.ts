import type { ChartSpec, ChartVariant } from '../chart-spec/types'

const ALL_VARIANTS: ChartVariant[] = ['classic', 'breakdown', 'hierarchy']

export function assertBundleInvariant(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, ChartSpec>
}) {
  if (!import.meta.env.DEV) return
  const v = state.spec.variant
  if (state.spec !== state.specsByVariant[v]) {
    console.warn(
      `[euclid] spec is not the same reference as specsByVariant[${v}]`,
    )
  }
  for (const variant of ALL_VARIANTS) {
    const slot = state.specsByVariant[variant]
    if (slot.variant !== variant) {
      console.warn(
        `[euclid] specsByVariant[${variant}].variant is "${slot.variant}"`,
      )
    }
  }
}
