import { useState } from "react"
import {
  Shield,
  Waves,
  Heart,
} from "lucide-react"

interface LandingScreenProps {
  mode: "login" | "register"
  onModeChange: (mode: "login" | "register") => void
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  onRegister: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  onCrisis: () => void
}

export function LandingScreen({
  mode,
  onModeChange,
  onLogin,
  onRegister,
  onCrisis,
}: LandingScreenProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setMessage("")
    const result = mode === "login"
      ? await onLogin(email, password)
      : await onRegister(fullName, email, password)
    setSubmitting(false)

    if (!result.success && result.message) {
      setMessage(result.message)
    }
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
            Sign in securely to continue your support journey.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-2">
          <button
            onClick={() => onModeChange("login")}
            className={`safe-harbor-transition rounded-lg px-4 py-2 text-sm font-medium ${mode === "login" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => onModeChange("register")}
            className={`safe-harbor-transition rounded-lg px-4 py-2 text-sm font-medium ${mode === "register" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            type="button"
          >
            Create Account
          </button>
        </div>

        <div className="flex w-full flex-col gap-4">
          {mode === "register" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="full-name-input" className="text-sm font-medium text-muted-foreground">
                Full Name
              </label>
              <input
                id="full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="safe-harbor-transition w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
                maxLength={120}
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email-input" className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="safe-harbor-transition w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
              maxLength={200}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password-input" className="text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmit()
                }
              }}
              className="safe-harbor-transition w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {message && (
            <p className="text-sm text-destructive" role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="safe-harbor-transition flex items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={mode === "login" ? "Sign in" : "Create account"}
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <div className="w-full rounded-xl bg-accent/50 px-5 py-4" role="region" aria-label="Privacy statement">
          <p className="mb-3 text-sm font-semibold text-accent-foreground">Privacy Statement</p>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-accent-foreground">
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Your data stays on this app and is not sold.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>We only use account details to let you sign in securely.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>You can log out anytime from the top-right dashboard button.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>All information regarding your mood, sleep, and history is entirely confidential.</span>
            </li>
          </ul>
        </div>

        <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-muted-foreground/60">
          SafeHarbor is not a crisis service. If you are in danger, please use
          the Crisis Help button available on every screen.
        </p>
      </div>

      <button
        onClick={onCrisis}
        className="safe-harbor-transition fixed right-4 top-4 z-30 inline-flex items-center gap-3 rounded-2xl border-2 border-destructive-foreground/20 bg-destructive px-8 py-5 text-xl font-extrabold tracking-wide text-destructive-foreground shadow-2xl ring-4 ring-destructive/25 hover:bg-destructive/90 active:scale-[0.97]"
        aria-label="Crisis help - 988 lifeline, Crisis Text Line, emergency services"
      >
        <Heart className="h-7 w-7" aria-hidden="true" />
        SOS
      </button>
    </main>
  )
}
