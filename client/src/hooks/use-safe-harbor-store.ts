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

const STORAGE_KEYS = {
  MOOD_ENTRIES: "safeharbor_mood_entries",
  USER_PROFILE: "safeharbor_user_profile",
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
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.lastVisit = new Date().toISOString()
        setProfile(parsed)
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(parsed))
      }
    } catch {
      // silently fail
    }
    setIsLoaded(true)
  }, [])

  const createProfile = useCallback((alias: string) => {
    const newProfile: UserProfile = {
      alias,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    }
    setProfile(newProfile)
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile))
    return newProfile
  }, [])

  const isReturningUser = profile !== null

  return { profile, isLoaded, createProfile, isReturningUser }
}
