import { useCallback, useState } from 'react'
import type { PaletteTokenEntry } from '../../chart-spec/paletteCatalog'
type PaletteSwatchCardProps = {
  entry: PaletteTokenEntry
}

function HexRow({
  themeLabel,
  hex,
}: {
  themeLabel: 'Light' | 'Dark'
  hex: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore */
    }
  }, [hex])

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md bg-control/60 px-2 py-1 text-left hover:bg-control transition-colors"
      title={`Copy ${hex}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {themeLabel}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-foreground/80 truncate">
        {copied ? 'Copied' : hex}
      </span>
    </button>
  )
}

export function PaletteSwatchCard({ entry }: PaletteSwatchCardProps) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-panel/50">
      <div className="grid grid-cols-2 h-16 shrink-0">
        <div
          className="h-full w-full border-r border-border/60"
          style={{ background: entry.light }}
          title={entry.light}
        />
        <div className="h-full w-full" style={{ background: entry.dark }} title={entry.dark} />
      </div>
      <div className="flex flex-col gap-1.5 p-2.5 min-w-0">
        <p className="font-mono text-sm font-medium text-foreground/85 truncate">{entry.token}</p>
        <div className="flex flex-col gap-1">
          <HexRow themeLabel="Light" hex={entry.light} />
          <HexRow themeLabel="Dark" hex={entry.dark} />
        </div>
      </div>
    </div>
  )
}
