import { useState, useCallback, useEffect, lazy, Suspense } from "react"
import { useMoodEntries, useUserProfile } from "@/hooks/use-safe-harbor-store"
import type { MoodEntry } from "@/hooks/use-safe-harbor-store"
import { LandingScreen } from "@/components/screens/landing-screen"
import { FluidNav } from "@/components/fluid-nav"
import { CrisisOverlay } from "@/components/crisis-overlay"
import { getMoodHistory } from "@/api/mood"
import { AppHeader } from "@/components/app-header"

const DashboardScreen = lazy(() =>
  import("@/components/screens/dashboard-screen").then((m) => ({ default: m.DashboardScreen }))
)
const MoodLoggerScreen = lazy(() =>
  import("@/components/screens/mood-logger-screen").then((m) => ({ default: m.MoodLoggerScreen }))
)
const HistoryScreen = lazy(() =>
  import("@/components/screens/history-screen").then((m) => ({ default: m.HistoryScreen }))
)
const ResourceScreen = lazy(() =>
  import("@/components/screens/resource-screen").then((m) => ({ default: m.ResourceScreen }))
)

type Screen = "landing" | "dashboard" | "mood" | "history" | "resources"

export default function App() {
  const { profile, isLoaded: profileLoaded, login, register, logout, isReturningUser } =
    useUserProfile()
  const { entries, isLoaded: entriesLoaded, addEntry, setEntriesFromServer, removeEntryByDate } =
    useMoodEntries()

  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [landingMode, setLandingMode] = useState<"login" | "register">("login")
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [dbEntry, setDbEntry] = useState<{ id: string; date: string; mood: number; sleep: number; emotions: string[] } | null>(null)
  const [todayStatusLoaded, setTodayStatusLoaded] = useState(false)
  const [checkInPromptOpen, setCheckInPromptOpen] = useState(false)
  const [checkInPromptDismissed, setCheckInPromptDismissed] = useState(false)

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
    setLandingMode("login")
    setCurrentScreen("landing")
    setCheckInPromptOpen(false)
    setCheckInPromptDismissed(false)
    setTodayStatusLoaded(false)
    setDbEntry(null)
  }, [logout])

  const handleGoToLogin = useCallback(() => {
    setLandingMode("login")
    setCurrentScreen("landing")
  }, [])

  const handleGoToRegister = useCallback(() => {
    setLandingMode("register")
    setCurrentScreen("landing")
  }, [])

  const handleSaveEntry = useCallback(
    (entry: Omit<MoodEntry, "id">) => {
      addEntry(entry)
      setDbEntry({
        id: crypto.randomUUID(),
        date: entry.date,
        mood: entry.mood,
        sleep: entry.sleep,
        emotions: entry.emotions,
      })
      setCheckInPromptOpen(false)
    },
    [addEntry]
  )

  const handleDeleteTodayEntry = useCallback(() => {
    const todayKey = new Date().toISOString().split("T")[0]
    setDbEntry(null)
    removeEntryByDate(todayKey)
  }, [removeEntryByDate])

  useEffect(() => {
    if (isReturningUser) {
      setCurrentScreen("dashboard")
    }
  }, [isReturningUser])

  useEffect(() => {
    if (!profile) {
      setEntriesFromServer([])
      setDbEntry(null)
      setTodayStatusLoaded(true)
      return
    }

    async function loadRealData() {
      setTodayStatusLoaded(false)
      const history = await getMoodHistory()
      const mappedHistory: MoodEntry[] = history.map((entry) => ({
        id: entry.id,
        date: entry.date,
        mood: entry.mood,
        sleep: entry.sleep,
        emotions: entry.emotions,
      }))
      setEntriesFromServer(mappedHistory)

      const todayKey = new Date().toISOString().split("T")[0]
      const data = history.find((entry) => entry.date === todayKey)
      if (data) {
        setDbEntry({
          id: data.id,
          date: data.date,
          mood: data.mood,
          sleep: data.sleep,
          emotions: data.emotions,
        })
      } else {
        setDbEntry(null)
      }
      setTodayStatusLoaded(true)
    }
    loadRealData()
  }, [currentScreen, profile, setEntriesFromServer])

  useEffect(() => {
    if (!profile || currentScreen !== "dashboard") {
      setCheckInPromptOpen(false)
      return
    }

    if (!todayStatusLoaded) {
      return
    }

    const hasCheckedInToday = dbEntry !== null
    if (!hasCheckedInToday && !checkInPromptDismissed) {
      setCheckInPromptOpen(true)
      return
    }

    setCheckInPromptOpen(false)
  }, [profile, currentScreen, todayStatusLoaded, dbEntry, checkInPromptDismissed])

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
    <div className="mx-auto min-h-dvh max-w-lg">
      <LandingScreen
        mode={landingMode}
        onModeChange={setLandingMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onCrisis={() => setCrisisOpen(true)}
      />

      <CrisisOverlay
        isOpen={crisisOpen}
        onClose={() => setCrisisOpen(false)}
      />
    </div>
  )
}

  return (
  <div className="mx-auto min-h-dvh max-w-lg" id="main-content">
    <AppHeader
      isLoggedIn={true}
      name={profile?.alias ?? "Friend"}
      onLoginClick={handleGoToLogin}
      onRegisterClick={handleGoToRegister}
      onLogoutClick={() => void handleLogout()}
    />

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
          todayEntry={dbEntry || undefined}
          onNavigate={handleNavigate}
        />
      )}

      {currentScreen === "mood" && (
        <MoodLoggerScreen
          todayEntry={dbEntry || undefined}
          onSave={handleSaveEntry}
          onDeleteToday={handleDeleteTodayEntry}
          onBack={() => setCurrentScreen("dashboard")}
        />
      )}

      {currentScreen === "history" && (
        <HistoryScreen
          entries={entries}
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

    {checkInPromptOpen && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true" aria-labelledby="check-in-title">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg">
          <h2 id="check-in-title" className="text-lg font-semibold text-foreground">
            Do you want to check in?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You have not submitted today&apos;s mood and sleep ratings yet.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setCheckInPromptDismissed(true)
                setCheckInPromptOpen(false)
              }}
              className="safe-harbor-transition flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30"
            >
              Not now
            </button>
            <button
              onClick={() => {
                setCheckInPromptOpen(false)
                setCurrentScreen("mood")
              }}
              className="safe-harbor-transition flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Check in now
            </button>
          </div>
        </div>
      </div>
    )}

    <CrisisOverlay
      isOpen={crisisOpen}
      onClose={() => setCrisisOpen(false)}
    />
  </div>
 )
}
