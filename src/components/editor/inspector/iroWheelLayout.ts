/**
 * iro.js wheel handle layout (matches @jaames/iro defaults used by VisualizationPaletteControl).
 * Archived: overlap → 4px compact wheel dots (no numbers when crowded).
 */

const TAU = Math.PI * 2
const mod = (a: number, n: number) => (a % n + n) % n

export type IroWheelLayoutProps = {
  width: number
  padding: number
  handleRadius: number
  borderWidth: number
  wheelAngle: number
  wheelDirection: 'clockwise' | 'anticlockwise'
}

export const IRO_WHEEL_LAYOUT: IroWheelLayoutProps = {
  width: 200,
  padding: 6,
  handleRadius: 8,
  borderWidth: 0,
  wheelAngle: 0,
  wheelDirection: 'anticlockwise',
}

function getHandleRange(props: IroWheelLayoutProps) {
  return props.width / 2 - props.padding - props.handleRadius - props.borderWidth
}

function translateWheelAngle(props: IroWheelLayoutProps, angle: number, invert: boolean) {
  const { wheelAngle, wheelDirection } = props
  if (invert && wheelDirection === 'clockwise') angle = wheelAngle + angle
  else if (wheelDirection === 'clockwise') angle = 360 - wheelAngle + angle
  else if (invert && wheelDirection === 'anticlockwise') angle = wheelAngle + 180 - angle
  else if (wheelDirection === 'anticlockwise') angle = wheelAngle - angle
  return mod(angle, 360)
}

/** Handle center in iro wheel local coordinates (top-left of IroWheel box). */
export function wheelHandleLocalPosition(
  props: IroWheelLayoutProps,
  hue: number,
  saturation: number,
): { x: number; y: number } {
  const r = props.width / 2
  const cx = r
  const cy = r
  const handleRange = getHandleRange(props)
  const handleAngle = (180 + translateWheelAngle(props, hue, true)) * (TAU / 360)
  const handleDist = (saturation / 100) * handleRange
  const direction = props.wheelDirection === 'clockwise' ? -1 : 1
  return {
    x: cx + handleDist * Math.cos(handleAngle) * direction,
    y: cy + handleDist * Math.sin(handleAngle) * direction,
  }
}
