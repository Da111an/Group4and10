/**
 * API client for mood entries.
 * Proxies to backend at /api (configured in vite.config.ts).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface MoodEntryPayload {
  date: string
  mood: number
  sleep: number
  emotions: string[]
}

export interface MoodEntryResponse {
  id: string
  date: string
  mood: number
  sleep: number
  emotions: string[]
}

export async function saveMoodEntry(entry: MoodEntryPayload): Promise<{ success: boolean }> {
  try {
    const base = API_BASE || ''
    const res = await fetch(`${base}/api/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new Error('Save failed')
    return { success: true }
  } catch (err) {
    console.error('API save error:', err)
    return { success: false }
  }
}

export async function getTodayMood(): Promise<MoodEntryResponse | null> {
  try {
    const base = API_BASE || ''
    const res = await fetch(`${base}/api/mood/today`)
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch (err) {
    console.error('API fetch error:', err)
    return null
  }
}
