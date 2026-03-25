import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { MessageCircle, Send, X } from "lucide-react"
import { sendChatMessage } from "@/api/chat"

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const initialMessage =
  "Hi, I'm here to listen and help you find support. I'm not a crisis counselor, but I care about what you're going through."

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: "assistant", text: initialMessage },
  ])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  async function handleSend(event?: FormEvent) {
    event?.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const data = await sendChatMessage(trimmed)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "I'm having trouble replying right now. If you need urgent support, call or text 988 or reach out to someone you trust.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          id="support-chat-panel"
          aria-label="Support chat"
          className="animate-in slide-in-from-bottom-4 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Support chat</h2>
              <p className="text-xs text-muted-foreground">A calm space for short check-ins</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="safe-harbor-transition rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-border bg-destructive/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
              Get Help Now
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <a className="block font-medium text-foreground underline-offset-2 hover:underline" href="tel:988">
                Call or Text 988
              </a>
              <a
                className="block font-medium text-foreground underline-offset-2 hover:underline"
                href="https://988lifeline.org"
                target="_blank"
                rel="noreferrer"
              >
                Chat with 988
              </a>
              <p className="font-medium text-foreground">Call 911 if in immediate danger</p>
            </div>
          </div>

          <div className="max-h-80 min-h-72 space-y-3 overflow-y-auto bg-background/60 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-border bg-card px-4 py-4">
            <div className="flex items-end gap-2">
              <label htmlFor="support-chat-input" className="sr-only">
                Type your message
              </label>
              <textarea
                id="support-chat-input"
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Share what is on your mind..."
                className="max-h-28 min-h-[3rem] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="safe-harbor-transition inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="safe-harbor-transition inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:-translate-y-0.5 hover:bg-primary/90"
        aria-expanded={isOpen}
        aria-controls="support-chat-panel"
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  )
}
