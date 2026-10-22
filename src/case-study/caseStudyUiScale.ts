/** Uniform UI scale for case study chrome (nav, prose, hero — not demo interiors). */
export const CASE_STUDY_UI_SCALE = 1.25

/** Counter-scale so demo widgets match the main editor at 100%. */
export const CASE_STUDY_DEMO_ZOOM = 1 / CASE_STUDY_UI_SCALE

export function caseStudyPx(designPx: number): number {
  return Math.round(designPx * CASE_STUDY_UI_SCALE)
}
