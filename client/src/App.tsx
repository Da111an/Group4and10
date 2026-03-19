import { useState, useCallback, useEffect, lazy, Suspense } from "react"
import { useMoodEntries, useUserProfile } from "@/hooks/use-safe-harbor-store"
import { LandingScreen } from "@/components/screens/landing-screen"
import { FluidNav } from "@/components/fluid-nav"
import { CrisisOverlay } from "@/components/crisis-overlay"
import { getTodayMood } from "@/api/mood"

const DashboardScreen = lazy(() =>
  import("@/components/screens/dashboard-screen").then((m) => ({ default: m.DashboardScreen }))
)
const MoodLoggerScreen = lazy(() =>
  import("@/components/screens/mood-logger-screen").then((m) => ({ default: m.MoodLoggerScreen }))
)
const ResourceScreen = lazy(() =>
  import("@/components/screens/resource-screen").then((m) => ({ default: m.ResourceScreen }))
)

type Screen = "landing" | "dashboard" | "mood" | "resources"

export default function App() {
  const { profile, isLoaded: profileLoaded, login, register, logout, isReturningUser } =
    useUserProfile()
  const { entries, isLoaded: entriesLoaded, addEntry, getTodayEntry } =
    useMoodEntries()

  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [dbEntry, setDbEntry] = useState<{ id: string; date: string; mood: number; sleep: number; emotions: string[] } | null>(null)

  const handleNavigate = useCallback((screen: string) => {
    setCurrentScreen(screen as Screen)
  }, [])

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await login(email, password)
      if (result.success) {
        setCurrentScreen("dashboard")
      }
      return result
    },
    [login]
  )

  const handleRegister = useCallback(
    async (fullName: string, email: string, password: string) => {
      const result = await register(fullName, email, password)
      if (result.success) {
        setCurrentScreen("dashboard")
      }
      return result
    },
    [register]
  )

  const handleLogout = useCallback(async () => {
    await logout()
    setCurrentScreen("landing")
  }, [logout])

  const todayEntry = getTodayEntry()

  useEffect(() => {
    if (isReturningUser) {
      setCurrentScreen("dashboard")
    }
  }, [isReturningUser])

  useEffect(() => {
    async function loadRealData() {
      const data = await getTodayMood()
      if (data) {
        setDbEntry(data)
      }
    }
    loadRealData()
  }, [currentScreen])

  if (!profileLoaded || !entriesLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite" aria-label="Loading SafeHarbor">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading SafeHarbor...</p>
        </div>
      </div>
    )
  }

  if (currentScreen === "landing") {
    return (
      <>
        <LandingScreen
          onLogin={handleLogin}
          onRegister={handleRegister}
          onCrisis={() => setCrisisOpen(true)}
        />
        <CrisisOverlay
          isOpen={crisisOpen}
          onClose={() => setCrisisOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg" id="main-content">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          </div>
        }
      >
      {currentScreen === "dashboard" && (
        <DashboardScreen
          alias={profile?.alias ?? "Friend"}
          entries={entries}
          todayEntry={dbEntry || todayEntry}
          onNavigate={handleNavigate}
          onLogout={() => void handleLogout()}
        />
      )}

      {currentScreen === "mood" && (
        <MoodLoggerScreen
          todayEntry={dbEntry || todayEntry}
          onSave={addEntry}
          onBack={() => setCurrentScreen("dashboard")}
        />
      )}

      {currentScreen === "resources" && (
        <ResourceScreen onBack={() => setCurrentScreen("dashboard")} />
      )}
      </Suspense>

      <FluidNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onCrisis={() => setCrisisOpen(true)}
      />

      <CrisisOverlay
        isOpen={crisisOpen}
        onClose={() => setCrisisOpen(false)}
      />
    </div>
  )
}
