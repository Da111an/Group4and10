import { useMemo, useState } from "react"
import {
  TrendingUp,
  Moon,
  BookOpen,
  Smile,
  Frown,
  Meh,
  Sparkles,
  ChevronRight,
  Clock,
  Target, // <-- Added Target Icon for the OKR
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import type { MoodEntry } from "@/hooks/use-safe-harbor-store"

interface DashboardScreenProps {
  alias: string
  entries: MoodEntry[]
  todayEntry: MoodEntry | { mood: number; sleep: number } | undefined
  onNavigate: (screen: string) => void
}
type TrendRange = "week" | "all"

const moodLabels = ["", "Struggling", "Low", "Okay", "Good", "Thriving"]
const moodColors = [
  "",
  "text-destructive",
  "text-chart-4",
  "text-muted-foreground",
  "text-chart-1",
  "text-primary",
]

function getMoodIcon(mood: number) {
  if (mood <= 2) return <Frown className="h-5 w-5" />
  if (mood === 3) return <Meh className="h-5 w-5" />
  return <Smile className="h-5 w-5" />
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function DashboardScreen({
  alias,
  entries,
  todayEntry,
  onNavigate,
}: DashboardScreenProps) {
<<<<<<< HEAD
  const recentEntries = entries.slice(0, 7).reverse()
  
  const chartData = recentEntries.map((e) => {
=======
  const [trendRange, setTrendRange] = useState<TrendRange>("week")

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  )
  const trendEntries = useMemo(
    () => (trendRange === "all" ? sortedEntries : sortedEntries.slice(-7)),
    [sortedEntries, trendRange]
  )
  
  const chartData = trendEntries.map((e) => {
    // FIX: Split the string to avoid timezone shifting bugs (e.g., Tuesday appearing as Monday)
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
    const [year, month, day] = e.date.split("-").map(Number)
    const localDate = new Date(year, month - 1, day)
    
    return {
      day:
        trendRange === "all"
          ? localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : localDate.toLocaleDateString("en-US", { weekday: "short" }),
      mood: e.mood,
      sleep: e.sleep,
    }
  })

  const avgMood =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
      : "--"

  const avgSleep =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.sleep, 0) / entries.length).toFixed(1)
      : "--"

  return (
<<<<<<< HEAD
    <div className="flex flex-col gap-5 px-5 pb-28 pt-6" role="main">
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-foreground">{alias}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("mood")}
          className="safe-harbor-transition col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/30 active:scale-[0.99]"
=======
    <div className="flex flex-col gap-5 px-5 pb-28 pt-6 lg:px-8" role="main">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <button
          onClick={() => onNavigate("mood")}
          className="safe-harbor-transition col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/30 active:scale-[0.99] lg:col-span-2"
          aria-label={todayEntry ? `Today's check-in, ${alias}: You're feeling ${moodLabels[todayEntry.mood]?.toLowerCase()}. Tap to log mood.` : `Daily check-in for ${alias}. Tap to log how you're feeling today.`}
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              todayEntry
                ? "bg-primary/10 text-primary"
                : "bg-chart-4/15 text-chart-4"
            }`}
          >
            {todayEntry ? getMoodIcon(todayEntry.mood) : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {todayEntry ? "Today's Check-in" : "Daily Check-in"}
            </p>
            <p className="text-sm text-muted-foreground">
              {todayEntry
                ? `You're feeling ${moodLabels[todayEntry.mood]?.toLowerCase()}`
                : "How are you feeling today?"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>

<<<<<<< HEAD
        {/* --- NEW OKR PROGRESS WIDGET --- */}
        <section className="col-span-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
=======
        <section className="col-span-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 lg:col-span-2 lg:row-span-2" aria-label="Mood trend chart">
          <div className="flex items-center justify-between gap-3">
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Active Goal (OKR)
              </span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              IN PROGRESS
            </span>
          </div>
          <div className="mt-1">
            <p className="text-sm font-medium text-foreground">
              Build Consistent Habits
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Key Result: Log 7 daily check-ins
            </p>
            
            {/* Animated Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((entries.length / 7) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
              <span>{Math.min(entries.length, 7)} logged</span>
              <span>Target: 7</span>
            </div>
          </div>
        </section>
        {/* ------------------------------- */}

        <section className="col-span-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Mood Trend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {trendRange === "all" ? "All entries" : "Last 7 days"}
              </span>
              <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Mood trend range">
                <button
                  type="button"
                  onClick={() => setTrendRange("week")}
                  className={`safe-harbor-transition rounded-md px-2.5 py-1 text-xs font-medium ${
                    trendRange === "week"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={trendRange === "week"}
                >
                  Last week
                </button>
                <button
                  type="button"
                  onClick={() => setTrendRange("all")}
                  className={`safe-harbor-transition rounded-md px-2.5 py-1 text-xs font-medium ${
                    trendRange === "all"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={trendRange === "all"}
                >
                  All time
                </button>
              </div>
            </div>
          </div>
          {chartData.length > 1 ? (
            <div className="h-28 lg:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
<<<<<<< HEAD
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[1, 5]} hide />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} formatter={(value: number) => [moodLabels[value], "Mood"]} />
                  <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#moodGradient)" />
=======
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    minTickGap={trendRange === "all" ? 22 : 8}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false}
                    tickLine={false}
                    width={18}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      moodLabels[value],
                      "Mood",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#moodGradient)"
                  />
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center lg:h-44">
              <p className="text-center text-sm text-muted-foreground">
                Log at least 2 days to see your trend
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Avg Mood</span>
          </div>
          <p className={`text-2xl font-bold ${entries.length > 0 ? moodColors[Math.round(Number(avgMood))] : "text-foreground"}`}>
            {avgMood}<span className="text-sm font-normal text-muted-foreground"> / 5</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-secondary" />
            <span className="text-xs font-medium text-muted-foreground">Avg Sleep</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {avgSleep}<span className="text-sm font-normal text-muted-foreground"> hrs</span>
          </p>
        </div>

<<<<<<< HEAD
        <button onClick={() => onNavigate("resources")} className="safe-harbor-transition flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 active:scale-[0.98]">
          <BookOpen className="h-5 w-5 text-primary" />
=======
        <button
          onClick={() => onNavigate("resources")}
          className="safe-harbor-transition flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 active:scale-[0.98] lg:col-span-2"
          aria-label="View support resources and guides"
        >
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
          <div>
            <p className="text-sm font-semibold text-foreground">Resources</p>
            <p className="text-xs text-muted-foreground">Support & guides</p>
          </div>
        </button>

<<<<<<< HEAD
        <button onClick={() => onNavigate("mood")} className="safe-harbor-transition flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 active:scale-[0.98]">
          <Clock className="h-5 w-5 text-secondary" />
=======
        <button
          onClick={() => onNavigate("history")}
          className="safe-harbor-transition flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 active:scale-[0.98] lg:col-span-2"
          aria-label={`View mood history. ${entries.length} ${entries.length === 1 ? "entry" : "entries"} logged`}
        >
          <Clock className="h-5 w-5 text-secondary" aria-hidden="true" />
>>>>>>> d6ddd183d82c47b34493a6253f75bd18f7d08ed9
          <div>
            <p className="text-sm font-semibold text-foreground">History</p>
            <p className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
          </div>
        </button>
      </div>
    </div>
  )
}