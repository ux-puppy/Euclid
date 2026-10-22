import { Compass } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CASE_STUDY_HERO_TITLE,
  CASE_STUDY_SECTIONS,
  type CaseStudySectionId,
} from './caseStudySections'
import {
  AccessibilityDemo,
  ChoosingOklchDemo,
  ColorOrderingDemo,
  GeneratedColorsDemo,
  GradientColorsDemo,
  ThematicEquivalenceDemo,
} from './demos/CaseStudyDemos'
import { OverlayScrollArea } from '../components/ui/overlay-scroll-area'
import { applyDocumentTheme } from '../store/editorStore'
import { cn } from '../lib/utils'
import {
  caseStudyPx,
  CASE_STUDY_DEMO_ZOOM,
  CASE_STUDY_UI_SCALE,
} from './caseStudyUiScale'

const CASE_STUDY_BODY_TEXT_CLASS =
  'space-y-2.5 text-sm font-light leading-[1.2] text-white/60'

const DEMO_BY_SECTION: Partial<Record<CaseStudySectionId, ReactNode>> = {
  'generated-colors': <GeneratedColorsDemo />,
  'choosing-oklch': <ChoosingOklchDemo />,
  'thematic-equivalence': <ThematicEquivalenceDemo />,
  'color-ordering': <ColorOrderingDemo />,
  accessibility: <AccessibilityDemo />,
  'gradient-colors': <GradientColorsDemo />,
}

/** Viewport line used to pick the current section while scrolling. */
const SCROLL_SPY_OFFSET_PX = caseStudyPx(112)

function CaseStudyNav({
  activeId,
  onNavigate,
}: {
  activeId: CaseStudySectionId
  onNavigate: (id: CaseStudySectionId) => void
}) {
  return (
    <nav
      className="fixed left-0 top-0 z-10 flex h-[min(100vh,760px)] w-[200px] flex-col justify-center gap-0.5 px-3 py-2 max-lg:hidden"
      style={{ zoom: CASE_STUDY_UI_SCALE }}
      aria-label="Case study sections"
    >
      {CASE_STUDY_SECTIONS.map((section) => {
        const active = section.id === activeId
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-medium transition-colors whitespace-nowrap',
              active ? 'text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            <span
              className={cn(
                'h-2.5 w-[3px] shrink-0 rounded-full bg-white',
                !active && 'opacity-0',
              )}
              aria-hidden
            />
            {section.title ?? section.navLabel}
          </button>
        )
      })}
    </nav>
  )
}

export function CaseStudyPage() {
  const [activeId, setActiveId] = useState<CaseStudySectionId>('introduction')
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef(new Map<CaseStudySectionId, HTMLElement | null>())
  const scrollSpyRafRef = useRef(0)
  const navigateLockRef = useRef(false)
  const navigateUnlockTimerRef = useRef<number | null>(null)
  const scrollSettleTimerRef = useRef<number | null>(null)

  useEffect(() => {
    applyDocumentTheme('dark')
  }, [])

  const resolveActiveSection = useCallback((): CaseStudySectionId => {
    const viewport = scrollViewportRef.current
    if (!viewport) return 'introduction'

    const anchorY = viewport.getBoundingClientRect().top + SCROLL_SPY_OFFSET_PX
    let current: CaseStudySectionId = CASE_STUDY_SECTIONS[0]!.id

    for (const section of CASE_STUDY_SECTIONS) {
      const el = sectionRefs.current.get(section.id)
      if (!el) continue
      const top = el.getBoundingClientRect().top
      if (top <= anchorY + 1) current = section.id
    }

    return current
  }, [])

  const syncActiveFromScroll = useCallback(() => {
    if (navigateLockRef.current) return
    const next = resolveActiveSection()
    setActiveId((prev) => (prev === next ? prev : next))
  }, [resolveActiveSection])

  const scheduleScrollSpy = useCallback(() => {
    cancelAnimationFrame(scrollSpyRafRef.current)
    scrollSpyRafRef.current = requestAnimationFrame(syncActiveFromScroll)
  }, [syncActiveFromScroll])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const onScroll = () => {
      if (navigateLockRef.current && scrollSettleTimerRef.current != null) {
        window.clearTimeout(scrollSettleTimerRef.current)
        scrollSettleTimerRef.current = window.setTimeout(() => {
          navigateLockRef.current = false
          syncActiveFromScroll()
        }, 120)
      }
      scheduleScrollSpy()
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    scheduleScrollSpy()

    const ro = new ResizeObserver(() => scheduleScrollSpy())
    ro.observe(viewport)

    return () => {
      viewport.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(scrollSpyRafRef.current)
      if (navigateUnlockTimerRef.current != null) {
        window.clearTimeout(navigateUnlockTimerRef.current)
      }
      if (scrollSettleTimerRef.current != null) {
        window.clearTimeout(scrollSettleTimerRef.current)
      }
    }
  }, [scheduleScrollSpy, syncActiveFromScroll])

  const registerSection = useCallback(
    (id: CaseStudySectionId) => (el: HTMLElement | null) => {
      sectionRefs.current.set(id, el)
      if (el) scheduleScrollSpy()
    },
    [scheduleScrollSpy],
  )

  const scrollTo = useCallback(
    (id: CaseStudySectionId) => {
      setActiveId(id)
      navigateLockRef.current = true
      if (navigateUnlockTimerRef.current != null) {
        window.clearTimeout(navigateUnlockTimerRef.current)
      }
      if (scrollSettleTimerRef.current != null) {
        window.clearTimeout(scrollSettleTimerRef.current)
      }

      sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      navigateUnlockTimerRef.current = window.setTimeout(() => {
        navigateLockRef.current = false
        syncActiveFromScroll()
      }, 900)
    },
    [syncActiveFromScroll],
  )

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] text-white">
      <CaseStudyNav activeId={activeId} onNavigate={scrollTo} />

      <OverlayScrollArea
        className="euclid-scroll-overlay-gutter h-full w-full min-h-0"
        viewportRef={scrollViewportRef}
      >
        <main
          className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-10 lg:py-[41px]"
          style={{ zoom: CASE_STUDY_UI_SCALE }}
        >
          <article className="mx-auto flex w-full flex-col gap-7">
            <section
              ref={registerSection('introduction')}
              data-section-id="introduction"
              className="flex scroll-mt-8 flex-col gap-7"
            >
              <div className="overflow-hidden rounded-xl border border-white/25">
                <img
                  src="/case-study/hero.png"
                  alt="Dashboard visualization preview"
                  className="block h-[330px] w-full object-cover object-top"
                />
              </div>

              <h1 className="text-[36px] font-medium leading-none text-white">
                {CASE_STUDY_HERO_TITLE}
              </h1>

              <a
                href="#/"
                className="inline-flex w-fit items-center gap-1 rounded-[23px] border border-white py-1.5 pl-2.5 pr-3 text-sm text-white transition-colors hover:bg-white/10"
              >
                <Compass size={14} weight="regular" aria-hidden />
                Try Euclid yourself
              </a>

              <div className={CASE_STUDY_BODY_TEXT_CLASS}>
                {CASE_STUDY_SECTIONS[0]!.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {CASE_STUDY_SECTIONS.slice(1).map((section) => (
            <section
              key={section.id}
              ref={registerSection(section.id)}
              data-section-id={section.id}
              className="flex scroll-mt-8 flex-col"
            >
              <div className="flex flex-col gap-1">
                {section.title ? (
                  <h2 className="text-xl font-medium leading-snug text-white">
                    {section.title}
                  </h2>
                ) : null}
                <div className={CASE_STUDY_BODY_TEXT_CLASS}>
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
              {DEMO_BY_SECTION[section.id] ? (
                <div className="mt-8" style={{ zoom: CASE_STUDY_DEMO_ZOOM }}>
                  {DEMO_BY_SECTION[section.id]}
                </div>
              ) : null}
            </section>
            ))}
          </article>
        </main>
      </OverlayScrollArea>
    </div>
  )
}
