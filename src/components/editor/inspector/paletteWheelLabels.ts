import { converter } from 'culori'
import type { IroWheelLayoutProps } from './iroWheelLayout'
import { wheelHandleLocalPosition } from './iroWheelLayout'

const toHsv = converter('hsv')

export type WheelLabel = {
  sequence: number
  hex: string
  x: number
  y: number
}

export function hsvFromHex(hex: string): { h: number; s: number; v: number } {
  const c = toHsv(hex)
  if (!c) return { h: 0, s: 100, v: 100 }
  return {
    h: c.h ?? 0,
    s: Math.min(100, Math.max(0, (c.s ?? 1) * 100)),
    v: Math.min(100, Math.max(0, (c.v ?? 1) * 100)),
  }
}

/** Radial distance on the 2D hue wheel (fold HSV value in for lightness). */
export function wheelRadialPercent(saturation: number, value: number): number {
  const s = Math.min(100, Math.max(0, saturation))
  const v = Math.min(100, Math.max(0, value))
  return (s / 100) * (v / 100) * 100
}

export function computeWheelLabels(
  sequence: { sequence: number; hex: string }[],
  layout: IroWheelLayoutProps,
  offsetX: number,
  offsetY: number,
): WheelLabel[] {
  return sequence.map((slot) => {
    const { h, s, v } = hsvFromHex(slot.hex)
    const local = wheelHandleLocalPosition(layout, h, wheelRadialPercent(s, v))
    return {
      sequence: slot.sequence,
      hex: slot.hex,
      x: offsetX + local.x,
      y: offsetY + local.y,
    }
  })
}
