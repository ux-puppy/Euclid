import { useEffect, useState } from 'react'

export type AppRoute = 'editor' | 'case-study'

function readRoute(): AppRoute {
  const hash = window.location.hash
  if (hash === '#/case-study' || hash.startsWith('#/case-study?')) return 'case-study'
  return 'editor'
}

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => readRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
