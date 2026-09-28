declare module 'culori' {
  export function converter(mode: string): (color: string) => Record<string, number> | undefined
  export function clampChroma(
    color: Record<string, unknown>,
    mode?: string,
    rgbGamut?: string,
  ): Record<string, unknown>
  export function formatHex(color: Record<string, unknown>): string | undefined
  export function oklch(color: Record<string, unknown>): { l?: number; c?: number; h?: number }
  export function differenceEuclidean(
    mode?: string,
    weights?: number[],
  ): (a: Record<string, unknown>, b: Record<string, unknown>) => number
}
