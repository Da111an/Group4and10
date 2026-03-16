import { useState } from "react"
import {
  Shield,
  Heart,
  Eye,
  EyeOff,
  ArrowRight,
  Waves,
} from "lucide-react"

interface LandingScreenProps {
  isReturningUser: boolean
  userAlias?: string
  onContinue: () => void
  onCreateProfile: (alias: string) => void
}

export function LandingScreen({
  isReturningUser,
  userAlias,
  onContinue,
  onCreateProfile,
}: LandingScreenProps) {
  const [alias, setAlias] = useState("")
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleStart = () => {
    if (!isReturningUser && alias.trim()) {
      onCreateProfile(alias.trim())
    }
    onContinue()
  }

  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5" />
        <div className="absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/30" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground">
            SafeHarbor
          </h1>
          <p className="text-center text-lg leading-relaxed text-muted-foreground">
            Your anonymous mental health companion. No judgment, no account required.
          </p>
        </div>

        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="safe-harbor-transition flex w-full items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-left hover:border-primary/30"
          aria-expanded={showPrivacy}
          aria-controls="privacy-panel"
          aria-label={showPrivacy ? "Hide privacy promise" : "Show privacy promise"}
        >
          <Shield className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex-1 text-sm font-medium text-foreground">
            Our Privacy Promise
          </span>
          {showPrivacy ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showPrivacy && (
          <div id="privacy-panel" className="w-full rounded-xl bg-accent/50 px-5 py-4" role="region" aria-label="Privacy promise details">
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-accent-foreground">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>All data stays on your device, always.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>No accounts, no emails, no tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Clear your data anytime from your browser.</span>
              </li>
            </ul>
          </div>
        )}

        <div className="flex w-full flex-col gap-4">
          {isReturningUser ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {userAlias}
                </p>
              </div>
              <button
                onClick={handleStart}
                className="safe-harbor-transition flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                aria-label="Continue to Dashboard"
              >
                Continue to Dashboard
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="alias-input"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Pick a nickname (only stored on your device)
                </label>
                <input
                  id="alias-input"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && alias.trim() && handleStart()}
                  placeholder="e.g. Peaceful Panda"
                  className="safe-harbor-transition w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
                  maxLength={24}
                  autoComplete="off"
                />
              </div>
              <button
                onClick={handleStart}
                disabled={!alias.trim()}
                className="safe-harbor-transition flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Begin your journey with your chosen nickname"
              >
                <Heart className="h-5 w-5" aria-hidden="true" />
                Begin Your Journey
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-muted-foreground/60">
          SafeHarbor is not a crisis service. If you are in danger, please use
          the Crisis Help button available on every screen.
        </p>
      </div>
    </main>
  )
}
