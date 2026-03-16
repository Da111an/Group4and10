import { LayoutDashboard, PenLine, BookOpen, Heart } from "lucide-react"

interface FluidNavProps {
  currentScreen: string
  onNavigate: (screen: string) => void
  onCrisis: () => void
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "mood", label: "Log", icon: PenLine },
  { key: "resources", label: "Help", icon: BookOpen },
]

export function FluidNav({
  currentScreen,
  onNavigate,
  onCrisis,
}: FluidNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-center px-4 pb-4"
      aria-label="Main navigation"
    >
      <div className="flex w-full max-w-sm items-center justify-between rounded-2xl border border-border/60 bg-card/90 px-2 py-2 shadow-lg backdrop-blur-md">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentScreen === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`safe-harbor-transition flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}

        <div className="mx-1 h-8 w-px bg-border" />

        <button
          onClick={onCrisis}
          className="safe-harbor-transition flex flex-col items-center gap-1 rounded-xl bg-destructive/10 px-4 py-2 text-destructive hover:bg-destructive/15 active:scale-[0.96]"
          aria-label="Crisis help"
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-bold">SOS</span>
        </button>
      </div>
    </nav>
  )
}
