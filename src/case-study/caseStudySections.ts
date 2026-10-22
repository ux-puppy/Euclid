export type CaseStudySectionId =
  | 'introduction'
  | 'generated-colors'
  | 'choosing-oklch'
  | 'thematic-equivalence'
  | 'color-ordering'
  | 'accessibility'
  | 'gradient-colors'

export type CaseStudySection = {
  id: CaseStudySectionId
  navLabel: string
  title?: string
  paragraphs: string[]
}

export const CASE_STUDY_SECTIONS: CaseStudySection[] = [
  {
    id: 'introduction',
    navLabel: 'Introduction',
    paragraphs: [
      'In our product, visualizations are everywhere. They take center stage across reports, dashboards, and custom charts. With support for everything from bar charts and pie charts to heatmaps and Sankey diagrams, users can create visualizations in many different contexts, each with its own customization needs.',
      'Color plays a critical role in all of them. I built a dynamic color system to address these challenges, making visualization colors easier to customize, more accessible, and adaptable to different themes and customer brands. Here’s how it works.',
    ],
  },
  {
    id: 'generated-colors',
    navLabel: 'Generated colors',
    title: 'Generated colors',
    paragraphs: [
      'Instead of relying on a static set of manually defined colors, we took a dynamic approach for a few reasons.',
      'First, we needed a system that could evolve with user feedback. With so many possible color variations, changing one color manually could mean updating many others. A generated system makes these adjustments faster and easier to maintain.',
      'Second, it allows visualization colors to align more closely with customer brand colors, which is particularly important for a white-label product.',
    ],
  },
  {
    id: 'choosing-oklch',
    navLabel: 'Choosing OKLCH',
    title: 'Choosing OKLCH',
    paragraphs: [
      'A key challenge with generated colors is that mathematically uniform color changes don’t always look uniform to the human eye. For example, hues can differ significantly in perceived lightness, even when they’re treated equally in a mathematical model.',
      'OKLCH helps solve this by representing color through perceptually meaningful dimensions: lightness, chroma, and hue. This makes it a better foundation for generating, comparing, and adjusting colors in a way that feels visually consistent.',
      'OKLCH is the foundation of the system, with the rest of the color-generation logic built around it.',
    ],
  },
  {
    id: 'thematic-equivalence',
    navLabel: 'Thematic equivalence',
    title: 'Thematic equivalence',
    paragraphs: [
      'In our reporting feature, users can annotate charts with explanations that reference specific colors. For example, a user might describe a data point as red to draw attention to it.',
      'Since users can switch between light and dark themes, these color references need to remain consistent across both. At the same time, each color must remain legible, comfortable to view, and visually appropriate for its background.',
      'The solution is a deterministic color system that preserves the identity of each color across themes while adapting its appearance to maintain contrast and visual clarity.',
    ],
  },
  {
    id: 'color-ordering',
    navLabel: 'Color ordering',
    title: 'Color ordering',
    paragraphs: [
      'Smart color ordering selects hues that are as visually distinct from one another as possible, rather than distributing them evenly around the color wheel.',
      'When enabled, the first color uses the chosen starting hue. Each subsequent color is selected based on its distance from the colors already assigned, prioritizing the most distinct available hues. When those options are exhausted, the algorithm looks for the largest remaining gap in the hue distribution.',
      'When disabled, hues are distributed at equal intervals around the color wheel.',
    ],
  },
  {
    id: 'accessibility',
    navLabel: 'Accessibility',
    title: 'Accessibility',
    paragraphs: [
      'Every color is checked against its background and the content displayed on top of it to evaluate contrast.',
      'The colors can be nudged to adjust colors just enough to meet the required contrast criteria while preserving its visual identity as much as possible. This helps us create color sets that remain legible without having to fine-tune every color manually.',
    ],
  },
  {
    id: 'gradient-colors',
    navLabel: 'Gradient colors',
    title: 'Gradient colors',
    paragraphs: [
      'For heatmaps, users can choose a preset gradient or create a custom one. However, a custom gradient can become difficult to interpret when it’s created in one theme and viewed in another.',
      'To solve this, custom colors are first represented in OKLCH. Similar to categorical colors, the system then generates two theme-specific versions of the gradient, one for light mode and one for dark mode. Each version is adapted to its background while preserving the gradient’s underlying meaning.',
      'This introduces another challenge: adjusting contrast alone can unintentionally reverse the visual emphasis of the data.',
      'Imagine a heatmap in light mode where light gray represents less important data and dark red highlights more important values. When the same gradient is displayed in dark mode, simply adapting the colors can make the gray darker and the red even darker, causing the intended emphasis to become less clear.',
      'To prevent this, the system first inverts the lightness of the gradient’s color stops in OKLCH, then applies further adjustments to lightness and chroma. This helps preserve the intended hierarchy of the data across themes, so important values remain visually prominent.',
    ],
  },
]

export const CASE_STUDY_HERO_TITLE =
  'Building a visualization color system that adapts to changing needs'
