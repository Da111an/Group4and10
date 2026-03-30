import { ArrowLeft } from "lucide-react"
import type { MoodEntry } from "@/hooks/use-safe-harbor-store"

interface HistoryScreenProps {
  entries: MoodEntry[]
  onBack: () => void
}

const moodLabels = ["", "Struggling", "Low", "Okay", "Good", "Thriving"]

export function HistoryScreen({ entries, onBack }: HistoryScreenProps) {
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-6 px-5 pb-28 pt-6 lg:px-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 self-start text-sm text-muted-foreground"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </button>

      <div>
        <h2 className="text-xl font-bold text-foreground">Check-in History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your past mood and sleep check-ins.
        </p>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">No check-ins yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
          {sortedEntries.map((entry) => {
            const [year, month, day] = entry.date.split("-").map(Number)
            const entryDate = new Date(year, month - 1, day)
            const moodLabel = moodLabels[entry.mood] ?? "Unknown"

            return (
              <div key={entry.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {entryDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <span className="text-xs text-muted-foreground">{moodLabel}</span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Sleep: {entry.sleep} hours
                </p>

                {entry.emotions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.emotions.map((tag) => (
                      <span
                        key={`${entry.id}-${tag}`}
                        className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
