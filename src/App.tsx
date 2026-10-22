import { AppShell } from './components/editor/AppShell'
import { TooltipProvider } from './components/ui/tooltip'

export default function App() {
  return (
    <TooltipProvider>
      <AppShell />
    </TooltipProvider>
  )
}
