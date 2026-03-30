import { useState, useCallback } from "react"
import { Frown, Meh, Smile, SmilePlus, HeartCrack, Moon, Check, ArrowLeft, Calendar } from "lucide-react"
import type { MoodEntry } from "@/hooks/use-safe-harbor-store"
import { deleteMoodEntry, saveMoodEntry } from "@/api/mood" // RESTORED IMPORT

interface MoodLoggerScreenProps {
  todayEntry: MoodEntry | { mood: number; sleep: number; emotions?: string[] } | undefined
  onSave: (entry: Omit<MoodEntry, "id">) => void
  onDeleteToday: () => void
  onBack: () => void
}

const MOOD_OPTIONS = [
  { value: 1, label: "Struggling", icon: HeartCrack, color: "text-destructive bg-destructive/10 border-destructive/30" },
  { value: 2, label: "Low", icon: Frown, color: "text-chart-4 bg-chart-4/10 border-chart-4/30" },
  { value: 3, label: "Okay", icon: Meh, color: "text-muted-foreground bg-muted border-muted-foreground/20" },
  { value: 4, label: "Good", icon: Smile, color: "text-chart-1 bg-chart-1/10 border-chart-1/30" },
  { value: 5, label: "Thriving", icon: SmilePlus, color: "text-primary bg-primary/10 border-primary/30" },
]

const EMOTION_TAGS = ["Anxious", "Calm", "Grateful", "Lonely", "Hopeful", "Overwhelmed", "Energetic", "Sad", "Focused", "Frustrated", "Content", "Numb"]

export function MoodLoggerScreen({ todayEntry, onSave, onDeleteToday, onBack }: MoodLoggerScreenProps) {
  const [mood, setMood] = useState(todayEntry?.mood ?? 0)
  const [sleep, setSleep] = useState(todayEntry?.sleep ?? 7)
  const [emotions, setEmotions] = useState<string[]>(todayEntry?.emotions ?? [])
  const [saved, setSaved] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [step, setStep] = useState<"mood" | "sleep" | "emotions" | "done">(todayEntry ? "done" : "mood")

  // RESTORED: Demo Date Picker
  const [demoDate, setDemoDate] = useState(new Date().toISOString().split("T")[0])

  const toggleEmotion = useCallback((tag: string) => {
    setEmotions((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev)
  }, [])

  const handleSave = useCallback(async () => {
    const entry: Omit<MoodEntry, "id"> = {
      date: demoDate, // RESTORED
      mood,
      sleep,
      emotions,
    }
    const result = await saveMoodEntry(entry)
    onSave(entry)
    setSaved(true)
    setStep("done")
  }, [demoDate, mood, sleep, emotions, onSave])

  const handleEditToday = useCallback(() => {
    setSaved(false)
    setStep("mood")
  }, [])

  const handleDeleteAndRedo = useCallback(async () => {
    setIsDeleting(true)
    const result = await deleteMoodEntry(demoDate) // RESTORED
    setIsDeleting(false)

    if (!result.success) {
      window.alert("Could not delete this check-in. Please try again.")
      return
    }
    setMood(0); setSleep(7); setEmotions([]); setSaved(false); setStep("mood")
    onDeleteToday()
  }, [demoDate, onDeleteToday])

  if (step === "done" || saved) {
    const displayEntry = todayEntry || { mood, sleep, emotions }
    return (
      <div className="flex flex-col gap-6 pb-28 pt-6 sm:pt-8 sm:pb-32 lg:pb-28">
        <button onClick={onBack} className="flex items-center gap-2 self-start text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</button>
        <div className="flex flex-col items-center gap-4 py-8"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Check className="h-8 w-8 text-primary" /></div><h2 className="text-xl font-bold text-foreground">{saved ? "Check-in Saved" : "Today's Entry"}</h2></div>
        <div className="flex gap-3">
          <button onClick={handleEditToday} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-primary/30">Edit check-in</button>
          <button onClick={() => void handleDeleteAndRedo()} disabled={isDeleting} className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">{isDeleting ? "Deleting..." : "Delete & redo"}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-28 pt-6 sm:pt-8 sm:pb-32 lg:pb-28">
      <button onClick={onBack} className="flex items-center gap-2 self-start text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</button>

      {/* RESTORED: Demo Mode Switcher UI */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Demo Mode:</span>
        </div>
        <input type="date" value={demoDate} onChange={(e) => setDemoDate(e.target.value)} className="bg-transparent text-sm font-semibold text-primary outline-none text-right" />
      </div>

      {step === "mood" && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-xl font-bold text-foreground">How are you feeling?</h2>
          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4">
            {MOOD_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button key={opt.value} onClick={() => { setMood(opt.value); setTimeout(() => setStep("sleep"), 300) }} className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${mood === opt.value ? opt.color + " border-current" : "border-border bg-card"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${opt.color}`}><Icon className="h-5 w-5" /></div>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

{step === "sleep" && (
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">How did you sleep?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Drag to set your hours of sleep last night.</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-secondary/20 bg-secondary/5">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{sleep}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
            </div>

            <input 
              type="range" 
              min={0} 
              max={12} 
              step={0.5} 
              value={sleep} 
              onChange={(e) => setSleep(Number(e.target.value))} 
              className="w-full max-w-xs accent-secondary" 
            />
            
            <div className="flex w-full max-w-xs justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          <button onClick={() => setStep("emotions")} className="safe-harbor-transition rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]">
            Next
          </button>
        </div>
      )}

      {step === "emotions" && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-xl font-bold text-foreground">What emotions stand out?</h2>
          <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
            {EMOTION_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleEmotion(tag)} className={`rounded-full border px-4 py-2 text-sm font-medium ${emotions.includes(tag) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/30"}`}>{tag}</button>
            ))}
          </div>
          <button onClick={handleSave} disabled={mood === 0} className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground disabled:opacity-50">Save Check-in</button>
        </div>
      )}
    </div>
  )
}