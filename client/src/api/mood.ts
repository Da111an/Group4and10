/**
 * API client for mood entries.
 * Uses same-host backend at /api by default.
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
      credentials: 'include',
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
    const res = await fetch(`${base}/api/mood/today`, {
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch (err) {
    console.error('API fetch error:', err)
    return null
  }
}

export async function getMoodHistory(): Promise<MoodEntryResponse[]> {
  try {
    const base = API_BASE || ''
    const res = await fetch(`${base}/api/mood/history`, {
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('API history fetch error:', err)
    return []
  }
}

export async function deleteTodayMood(): Promise<{ success: boolean }> {
  try {
    const base = API_BASE || ''
    const res = await fetch(`${base}/api/mood/today`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) return { success: false }
    return { success: true }
  } catch (err) {
    console.error('API delete error:', err)
    return { success: false }
  }
}
