import { useState } from "react"
import {
  ArrowLeft,
  Phone,
  Globe,
  Clock,
  BadgeCheck,
  ExternalLink,
  Heart,
  GraduationCap,
  MessageCircle,
  Brain,
  Search,
} from "lucide-react"

interface ResourceScreenProps {
  onBack: () => void
}

interface Resource {
  id: string
  name: string
  description: string
  phone?: string
  url?: string
  isFree: boolean
  is24_7: boolean
  iconKey: string
  category: string
}

const ICON_MAP = {
  Phone,
  Globe,
  Heart,
  GraduationCap,
  MessageCircle,
  Brain,
} as const

const RESOURCES: Resource[] = [
  {
    id: "1",
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support for people in distress. Call or text 988.",
    phone: "988",
    isFree: true,
    is24_7: true,
    iconKey: "Phone",
    category: "Crisis",
  },
  {
    id: "2",
    name: "Crisis Text Line",
    description: "Text HOME to 741741 to connect with a trained crisis counselor.",
    phone: "741741",
    isFree: true,
    is24_7: true,
    iconKey: "MessageCircle",
    category: "Crisis",
  },
  {
    id: "3",
    name: "Student Counseling Center (CAPS)",
    description: "On-campus mental health services for enrolled students. Typically free with student health fees.",
    url: "https://caps.byu.edu",
    isFree: true,
    is24_7: false,
    iconKey: "GraduationCap",
    category: "Counseling",
  },
  {
    id: "4",
    name: "BetterHelp for Students",
    description: "Online therapy platform with student discounts. Licensed therapists available via chat, phone, or video.",
    url: "https://www.betterhelp.com",
    isFree: false,
    is24_7: false,
    iconKey: "Heart",
    category: "Therapy",
  },
  {
    id: "5",
    name: "SafeUT",
    description: "Real-time crisis intervention and tip line. Connects you with licensed counselors.",
    url: "https://safeut.org",
    phone: "833-372-3388",
    isFree: true,
    is24_7: true,
    iconKey: "MessageCircle",
    category: "Crisis",
  },
  {
    id: "6",
    name: "Headspace for Students",
    description: "Free meditation and mindfulness app for students at participating universities.",
    url: "https://www.headspace.com/studentplan",
    isFree: true,
    is24_7: true,
    iconKey: "Globe",
    category: "Self-Help",
  },
]

type FilterType = "all" | "free" | "24_7"

export function ResourceScreen({ onBack }: ResourceScreenProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = RESOURCES.filter((r) => {
    // Check toggle filters
    const matchesCategory =
      filter === "all" ||
      (filter === "free" && r.isFree) ||
      (filter === "24_7" && r.is24_7)

    // Check search query
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <main className="flex flex-col gap-5 px-5 pb-28 pt-6" role="main">
      <button
        onClick={onBack}
        className="flex items-center gap-2 self-start text-sm text-muted-foreground"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </button>

      <div>
        <h1 className="text-xl font-bold text-foreground">Support Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified help is always available.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          aria-label="Search resources"
        />
      </div>

      <div
        className="flex gap-2 rounded-xl bg-muted p-1"
        role="radiogroup"
        aria-label="Filter resources"
      >
        {(
          [
            { key: "all", label: "All" },
            { key: "free", label: "Free" },
            { key: "24_7", label: "24/7" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            role="radio"
            aria-checked={filter === f.key}
            aria-label={`Filter ${f.label} resources`}
            className={`safe-harbor-transition flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
              filter === f.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length > 0 ? (
          filtered.map((resource) => {
            const Icon = ICON_MAP[resource.iconKey as keyof typeof ICON_MAP] ?? Phone
            return (
              <div
                key={resource.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {resource.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {resource.isFree && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <BadgeCheck className="h-3 w-3" />
                      Free
                    </span>
                  )}
                  {resource.is24_7 && (
                    <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                      <Clock className="h-3 w-3" />
                      24/7
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {resource.phone && (
                    <a
                      href={`tel:${resource.phone}`}
                      className="safe-harbor-transition flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {resource.phone}
                    </a>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="safe-harbor-transition flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                      aria-label={`Visit ${resource.name} website`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      Visit
                    </a>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No resources found matching your search.
          </div>
        )}
      </div>
    </main>
  )
}