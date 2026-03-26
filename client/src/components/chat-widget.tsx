import { useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { sendChatMessage } from "@/api/chat"

type Role = "assistant" | "user"

interface ChatItem {
  id: string
  role: Role
  text: string
}

const STARTER_MESSAGE =
  "Hi, I am here to listen. Share what is on your mind, and I can offer supportive guidance."

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatItem[]>([
    { id: crypto.randomUUID(), role: "assistant", text: STARTER_MESSAGE },
  ])

  const listRef = useRef<HTMLDivElement>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const userText = input.trim()
    if (!userText || isSending) return

    const userMessage: ChatItem = {
      id: crypto.randomUUID(),
      role: "user",
      text: userText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const reply = await sendChatMessage(userText)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat failed."
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: message },
      ])
    } finally {
      setIsSending(false)
      queueMicrotask(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      })
    }
  }

  return (
    <div className="fixed bottom-28 right-4 z-30 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          role="dialog"
          aria-label="Support chat"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Support Chat</h2>
              <p className="text-xs text-muted-foreground">Private and anonymous</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted text-foreground"
                }`}
              >
                {message.text}
              </div>
            ))}

            {isSending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Type a message"
                className="min-h-16 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="safe-harbor-transition inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="safe-harbor-transition inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label={isOpen ? "Hide support chat" : "Open support chat"}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {isOpen ? "Close chat" : "Chat"}
      </button>
    </div>
  )
}
