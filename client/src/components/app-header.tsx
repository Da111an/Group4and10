type AppHeaderProps = {
  isLoggedIn: boolean
  name?: string
  onLoginClick: () => void
  onRegisterClick: () => void
  onLogoutClick: () => void
}

export function AppHeader({
  isLoggedIn,
  name,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 lg:max-w-4xl xl:max-w-6xl">
        <div>
          <p className="text-lg font-semibold text-foreground">SafeHarbor</p>
          {isLoggedIn ? (
            <p className="text-sm text-muted-foreground">
              Welcome, {name ?? "Friend"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your support journey starts here
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onLogoutClick}
              className="rounded-lg border border-border/90 bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-white/95"
            >
              Log out
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}