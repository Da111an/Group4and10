"use client"

import { useState, useCallback } from "react"
import { useMoodEntries, useUserProfile } from "./hooks/use-safe-harbor-store"
import { LandingScreen } from "./components/screens/LandingScreen"

type Screen = "landing" | "dashboard" | "mood" | "resources"

export default function SafeHarborApp() {
  const { profile, isLoaded: profileLoaded, createProfile, isReturningUser } =
    useUserProfile()
  const { isLoaded: entriesLoaded } = useMoodEntries()

  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")



  const handleContinue = useCallback(() => {
    setCurrentScreen("dashboard")
  }, [])

  const handleCreateProfile = useCallback(
    (alias: string) => {
      createProfile(alias)
    },
    [createProfile]
  )

  if (!profileLoaded || !entriesLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading SafeHarbor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {currentScreen === "landing" && (
        <LandingScreen
          isReturningUser={isReturningUser}
          userAlias={profile?.alias}
          onContinue={handleContinue}
          onCreateProfile={handleCreateProfile}
        />
      )}
      {/* TODO: Add other screens */}
    </div>
  )
}
