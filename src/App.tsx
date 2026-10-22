import { AppShell } from './components/editor/AppShell'
import { TooltipProvider } from './components/ui/tooltip'
import { CaseStudyPage } from './case-study/CaseStudyPage'
import { useAppRoute } from './useAppRoute'

export default function App() {
  const route = useAppRoute()

  return (
    <TooltipProvider>
      {route === 'case-study' ? <CaseStudyPage /> : <AppShell />}
    </TooltipProvider>
  )
}
