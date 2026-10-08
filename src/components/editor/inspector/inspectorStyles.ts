import { controlSurface } from '../../../lib/controlSurface'

/** Shared layout classes for right-panel inspector fields. */
export const inspectorField = 'w-full min-w-0'
export const inspectorFieldLabel =
  'text-sm font-medium text-foreground/60 shrink-0'

/** 8px vertical gap between stacked controls (Settings & Colors section bodies). */
export const inspectorStackGap = 'gap-2'

/** Flex column shell for stacked inspector fields. */
export const inspectorStackLayout = 'flex w-full min-w-0 flex-col'

/** Standard vertical stack (layout + default gap). */
export const inspectorStack = `${inspectorStackLayout} ${inspectorStackGap}`

/** Bottom padding on Settings / Colors scroll content. */
export const inspectorTabRoot = 'pb-2'

/** Section title band → field stack (same as control gap). */
export const inspectorSectionHeaderGap = inspectorStackGap

/** Section body inset (horizontal + bottom). */
export const inspectorSectionBodyPadding = 'px-3.5 pt-0.5 pb-3.5'

/** Horizontal gap in split rows (e.g. pattern + shuffle). */
export const inspectorInlineGap = 'gap-2'

/** Label → control inside one field block (caption to input/dropdown). */
export const inspectorFieldGap = 'space-y-1'

/** Caption + dropdown / text field block (slight top inset in section stacks). */
export const inspectorLabeledField = `${inspectorField} ${inspectorFieldGap} pt-1`

/** Caption above inspector dropdowns and text fields (2px smaller than `inspectorFieldLabel`). */
export const inspectorControlCaption =
  'text-xs font-medium leading-tight text-foreground/60 shrink-0'

/** Re-export for inspector-only wrappers (same as SliderControl surfaces). */
export { controlSurface }
