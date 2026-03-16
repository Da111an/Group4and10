"use client"

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

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES)
      if (stored) {
        setEntries(JSON.parse(stored))
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