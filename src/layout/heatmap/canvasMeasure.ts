const Y_LABEL_MAX_WIDTH = 108

let canvas: HTMLCanvasElement | null = null

function ctx(font: string): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  canvas ??= document.createElement('canvas')
  const c = canvas.getContext('2d')
  if (!c) return null
  c.font = font
  return c
}

export function measureTextWidth(text: string, font: string): number {
  const c = ctx(font)
  if (!c) return text.length * 7
  return c.measureText(text).width
}

export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const c = ctx(font)
  if (!c || maxWidth <= 0) return [text]

  const pushBroken = (word: string, out: string[]) => {
    if (c.measureText(word).width <= maxWidth) {
      out.push(word)
      return
    }
    let chunk = ''
    for (const ch of word) {
      const next = chunk + ch
      if (chunk && c.measureText(next).width > maxWidth) {
        out.push(chunk)
        chunk = ch
      } else {
        chunk = next
      }
    }
    if (chunk) out.push(chunk)
  }

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let line = words[0]!
  for (let i = 1; i < words.length; i++) {
    const word = words[i]!
    const candidate = `${line} ${word}`
    if (c.measureText(candidate).width <= maxWidth) {
      line = candidate
    } else {
      pushBroken(line, lines)
      line = word
    }
  }
  pushBroken(line, lines)
  return lines
}

export function yAxisLabelMaxWidth(): number {
  return Y_LABEL_MAX_WIDTH
}

export function wrappedLabelBlockHeight(lineCount: number, fontSize: number): number {
  return lineCount * fontSize * 1.25
}
