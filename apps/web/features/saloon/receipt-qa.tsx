"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { answerFromReceipt, receipt, suggestedQuestions } from "./run-fixture"

type Exchange = {
  id: number
  question: string
  answer: string
  cites: string | null
}

/**
 * A question resolves from decision receipt SR-042 only. There is no chat
 * history to answer from, and a question the receipt does not cover is refused.
 */
export function ReceiptQuestions({ enabled }: { enabled: boolean }) {
  const [exchanges, setExchanges] = React.useState<Exchange[]>([])
  const [draft, setDraft] = React.useState("")
  const nextId = React.useRef(1)

  const ask = React.useCallback((question: string) => {
    const match = answerFromReceipt(question)
    setExchanges((previous) => [
      ...previous,
      {
        id: nextId.current++,
        question,
        answer:
          match?.text ??
          "The receipt does not cover that. It records the accepted thesis, the evidence path, the deterministic checks, and the rejected alternative.",
        cites: match?.cites ?? null,
      },
    ])
  }, [])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return
    ask(question)
    setDraft("")
  }

  return (
    <div className="space-y-3">
      {enabled && exchanges.length > 0 ? (
        <ol className="space-y-3">
          {exchanges.map((exchange) => (
            <li key={exchange.id} className="space-y-1.5">
              <Bubble align="end">
                <BubbleContent>{exchange.question}</BubbleContent>
              </Bubble>
              <Bubble variant="muted">
                <BubbleContent>{exchange.answer}</BubbleContent>
              </Bubble>
              <p className="font-mono text-[10px] text-muted-foreground">
                {exchange.cites
                  ? `receipt ${receipt.id} · ${exchange.cites}`
                  : `receipt ${receipt.id} · no matching record`}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {enabled && exchanges.length === 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => ask(question)}
              className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={submit} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!enabled}
          aria-label="Ask the decision receipt a question"
          placeholder={enabled ? "Ask about the decision…" : "Receipt written at the end of the run"}
        />
        <Button type="submit" size="icon" disabled={!enabled || !draft.trim()}>
          <Send aria-hidden="true" />
          <span className="sr-only">Ask</span>
        </Button>
      </form>
      <p className="text-[11px] leading-4 text-muted-foreground">
        Answers come from receipt {receipt.id}, not from chat history.
      </p>
    </div>
  )
}
