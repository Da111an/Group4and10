import { useState, useEffect, useCallback } from "react"

export interface MoodEntry {
  id: string
  date: string
  mood: number
  sleep: number
  emotions: string[]
  note?: string
}

export interface UserProfile {
  alias: string
  createdAt: string
  lastVisit: string
}

interface AuthResult {
  success: boolean
  message?: string
}

const STORAGE_KEYS = {
  MOOD_ENTRIES: "safeharbor_mood_entries",
}

// --- NEW: Helper to generate 7 days of dummy data for chart validation ---
const generateHardcodedEntries = (): MoodEntry[] => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i) // 0 is today, 1 is yesterday, etc.
    return {
      id: crypto.randomUUID(),
      date: d.toISOString().split("T")[0],
      mood: Math.floor(Math.random() * 3) + 2, // Random mood between 2 and 4
      sleep: Math.floor(Math.random() * 4) + 5, // Random sleep between 5 and 8
      emotions: ["calm", "focused"],
      note: "Hardcoded sprint validation entry",
    }
  })
}

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES)
      if (stored && JSON.parse(stored).length > 0) {
        setEntries(JSON.parse(stored))
      } else {
        // INJECT HARDCODED DATA IF EMPTY
        const dummyData = generateHardcodedEntries()
        setEntries(dummyData)
        localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(dummyData))
      }
    } catch {
      // silently fail
    }
    setIsLoaded(true)
  }, [])

  const addEntry = useCallback(
    (entry: Omit<MoodEntry, "id">) => {
      const newEntry: MoodEntry = {
        ...entry,
        id: crypto.randomUUID(),
      }
      const updated = [newEntry, ...entries]
      setEntries(updated)
      localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(updated))
      return newEntry
    },
    [entries]
  )

  const getRecentEntries = useCallback(
    (count: number = 7) => {
      return entries.slice(0, count)
    },
    [entries]
  )

  const getTodayEntry = useCallback(() => {
    const today = new Date().toISOString().split("T")[0]
    return entries.find((e) => e.date === today)
  }, [entries])

  return { entries, isLoaded, addEntry, getRecentEntries, getTodayEntry }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        })
        if (!res.ok) {
          return
        }

        const data = await res.json() as { authenticated?: boolean; alias?: string }
        if (!isActive || !data.authenticated || !data.alias) {
          return
        }

        setProfile({
          alias: data.alias,
          createdAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
        })
      } catch {
        // silently fail
      } finally {
        if (isActive) {
          setIsLoaded(true)
        }
      }
    }

    void loadSession()
    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      return { success: false, message: "Email and password are required." }
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: trimmedEmail, password }),
    })

    if (!res.ok) {
      try {
        const data = await res.json() as { message?: string }
        return { success: false, message: data.message ?? "Sign in failed." }
      } catch {
        return { success: false, message: "Sign in failed." }
      }
    }

    const data = await res.json() as { fullName?: string; email?: string; message?: string }
    const newProfile: UserProfile = {
      alias: data.fullName || data.email || trimmedEmail,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    }
    setProfile(newProfile)
    return { success: true, message: data.message }
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string): Promise<AuthResult> => {
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail || !password) {
      return { success: false, message: "Name, email, and password are required." }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fullName: trimmedName, email: trimmedEmail, password }),
    })

    if (!res.ok) {
      try {
        const data = await res.json() as { message?: string }
        return { success: false, message: data.message ?? "Account creation failed." }
      } catch {
        return { success: false, message: "Account creation failed." }
      }
    }

    const data = await res.json() as { fullName?: string; email?: string; message?: string }
    const newProfile: UserProfile = {
      alias: data.fullName || trimmedName || data.email || trimmedEmail,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    }
    setProfile(newProfile)
    return { success: true, message: data.message }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // silently fail
    } finally {
      setProfile(null)
    }
  }, [])

  const isReturningUser = profile !== null

  return { profile, isLoaded, login, register, logout, isReturningUser }
}
