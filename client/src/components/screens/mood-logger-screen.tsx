import { useState, useCallback } from "react"
import {
  Frown,
  Meh,
  Smile,
  SmilePlus,
  HeartCrack,
  Moon,
  Check,
  ArrowLeft,
} from "lucide-react"
import type { MoodEntry } from "@/hooks/use-safe-harbor-store"
import { deleteTodayMood, saveMoodEntry } from "@/api/mood"
import { getLocalDateKey } from "@/lib/date"

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

const EMOTION_TAGS = [
  "Anxious",
  "Calm",
  "Grateful",
  "Lonely",
  "Hopeful",
  "Overwhelmed",
  "Energetic",
  "Sad",
  "Focused",
  "Frustrated",
  "Content",
  "Numb",
]

export function MoodLoggerScreen({
  todayEntry,
  onSave,
  onDeleteToday,
  onBack,
}: MoodLoggerScreenProps) {
  const [mood, setMood] = useState(todayEntry?.mood ?? 0)
  const [sleep, setSleep] = useState(todayEntry?.sleep ?? 7)
  const [emotions, setEmotions] = useState<string[]>(todayEntry?.emotions ?? [])
  const [saved, setSaved] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [step, setStep] = useState<"mood" | "sleep" | "emotions" | "done">(
    todayEntry ? "done" : "mood"
  )

  const toggleEmotion = useCallback((tag: string) => {
    setEmotions((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    )
  }, [])

  const handleSave = useCallback(async () => {
    const entry: Omit<MoodEntry, "id"> = {
      date: getLocalDateKey(),
      mood,
      sleep,
      emotions,
    }

    const result = await saveMoodEntry(entry)

    if (result.success) {
      onSave(entry)
      setSaved(true)
      setStep("done")
    } else {
      onSave(entry)
      setSaved(true)
      setStep("done")
    }
  }, [mood, sleep, emotions, onSave])

  const handleEditToday = useCallback(() => {
    setSaved(false)
    setStep("mood")
  }, [])

  const handleDeleteAndRedo = useCallback(async () => {
    setIsDeleting(true)
    const result = await deleteTodayMood(getLocalDateKey())
    setIsDeleting(false)

    if (!result.success) {
      window.alert("Could not delete today's check-in. Please try again.")
      return
    }

    const resetSleep = 7
    setMood(0)
    setSleep(resetSleep)
    setEmotions([])
    setSaved(false)
    setStep("mood")
    onDeleteToday()
  }, [onDeleteToday])

  if (step === "done" || saved) {
    const displayEntry = todayEntry || { mood, sleep, emotions }
    return (
      <div className="flex flex-col gap-6 px-5 pb-28 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 self-start text-sm text-muted-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </button>

        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {saved ? "Check-in Saved" : "Today's Entry"}
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            {saved
              ? "Great job taking a moment for yourself today."
              : "Here's how you logged your day."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${MOOD_OPTIONS[displayEntry.mood - 1]?.color}`}>
              {(() => {
                const Icon = MOOD_OPTIONS[displayEntry.mood - 1]?.icon ?? Meh
                return <Icon className="h-5 w-5" />
              })()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mood</p>
              <p className="font-semibold text-foreground">
                {MOOD_OPTIONS[displayEntry.mood - 1]?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sleep</p>
              <p className="font-semibold text-foreground">
                {displayEntry.sleep} hours
              </p>
            </div>
          </div>

          {displayEntry.emotions && displayEntry.emotions.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">Emotions</p>
              <div className="flex flex-wrap gap-2">
                {displayEntry.emotions.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleEditToday}
            className="safe-harbor-transition flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30"
          >
            Edit today&apos;s check-in
          </button>
          <button
            onClick={() => void handleDeleteAndRedo()}
            disabled={isDeleting}
            className="safe-harbor-transition flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete & redo"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-5 pb-28 pt-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 self-start text-sm text-muted-foreground"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </button>

      <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={step === "mood" ? 1 : step === "sleep" ? 2 : 3} aria-valuemin={1} aria-valuemax={3} aria-label="Check-in progress">
        {(["mood", "sleep", "emotions"] as const).map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full safe-harbor-transition ${
              s === step ? "w-8 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {step === "mood" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              How are you feeling?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Be honest - this is just for you.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {MOOD_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setMood(opt.value)
                    setTimeout(() => setStep("sleep"), 300)
                  }}
                  className={`safe-harbor-transition flex items-center gap-4 rounded-2xl border p-4 text-left active:scale-[0.98] ${
                    mood === opt.value
                      ? opt.color + " border-current"
                      : "border-border bg-card hover:border-primary/20"
                  }`}
                  aria-label={`Select ${opt.label} as your mood`}
                  aria-pressed={mood === opt.value}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${opt.color}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === "sleep" && (
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              How did you sleep?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag to set your hours of sleep last night.
            </p>
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
              aria-label="Hours of sleep"
            />
            <div className="flex w-full max-w-xs justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          <button
            onClick={() => setStep("emotions")}
            className="safe-harbor-transition rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          >
            Next
          </button>
        </div>
      )}

      {step === "emotions" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              What emotions stand out?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select up to 5 that resonate with you.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {EMOTION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleEmotion(tag)}
                className={`safe-harbor-transition rounded-full border px-4 py-2 text-sm font-medium active:scale-[0.96] ${
                  emotions.includes(tag)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={mood === 0}
            className="safe-harbor-transition rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            Save Check-in
          </button>
        </div>
      )}
    </div>
  )
}
