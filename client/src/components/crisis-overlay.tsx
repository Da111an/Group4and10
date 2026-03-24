import { useEffect, useRef } from "react"
import { X, Phone, MessageCircle, Heart } from "lucide-react"

interface CrisisOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function CrisisOverlay({ isOpen, onClose }: CrisisOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus()
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 px-3 pb-0 pt-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-dialog-title"
      aria-describedby="crisis-dialog-desc"
    >
      <div
        className="w-full max-w-lg animate-in slide-in-from-bottom-4 rounded-t-3xl bg-card px-6 pb-10 pt-6 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:pb-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 lg:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10" aria-hidden="true">
              <Heart className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 id="crisis-dialog-title" className="text-lg font-bold text-foreground">
                You Are Not Alone
              </h2>
              <p id="crisis-dialog-desc" className="text-xs text-muted-foreground">
                Help is available right now.
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            aria-label="Close crisis help"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="tel:988"
            className="safe-harbor-transition flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 hover:bg-destructive/10"
            aria-label="Call 988 Suicide and Crisis Lifeline - Free and confidential, 24/7"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                988 Suicide & Crisis Lifeline
              </p>
              <p className="text-sm text-muted-foreground">
                Call or text 988 - Free & confidential, 24/7
              </p>
            </div>
          </a>

          <a
            href="sms:741741&body=HOME"
            className="safe-harbor-transition flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted"
            aria-label="Text HOME to 741741 for Crisis Text Line - Free and confidential, 24/7"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Crisis Text Line</p>
              <p className="text-sm text-muted-foreground">
                Text HOME to 741741 - Free & confidential, 24/7
              </p>
            </div>
          </a>

          <a
            href="tel:911"
            className="safe-harbor-transition flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted"
            aria-label="Call 911 for emergency services - For immediate danger"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                Emergency Services
              </p>
              <p className="text-sm text-muted-foreground">
                Call 911 for immediate danger
              </p>
            </div>
          </a>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Reaching out takes courage. These services are free, confidential, and
          staffed by trained professionals who care about you.
        </p>
      </div>
    </div>
  )
}
