"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/app/markdown";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";


interface Turn {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "What did the team work on last week?",
  "Which projects had the most blockers?",
  "Who has the highest workload?",
  "What are the recurring blockers?",
];


export function AssistantPanel() {
  const { isManager } = useAuth();

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  const ask = useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ answer: string }>("/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ question: text, weeks: 4 }),
      }),
    onSuccess: (data) =>
      setTurns((current) => [
        ...current,
        { role: "assistant", text: data.answer },
      ]),
    onError: (error: Error) =>
      setTurns((current) => [
        ...current,
        { role: "assistant", text: error.message },
      ]),
  });

  if (!isManager) {
    return null;
  }

  function send(text: string) {
    const trimmed = text.trim();

    if (!trimmed || ask.isPending) {
      return;
    }

    setTurns((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    ask.mutate(trimmed);
  }

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open the team assistant"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 flex h-[32rem] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl">

      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-heading">
          Team Assistant
        </h2>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Close the assistant"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-subtle">
              Ask about the last four weeks of team reports.
            </p>

            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="block w-full rounded-md border px-3 py-2 text-left text-sm text-body hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {turns.map((turn, index) => (
          <div
            key={index}
            className={
              turn.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[90%] rounded-lg bg-muted px-3 py-2 text-sm text-body"
            }
          >
            {turn.role === "user" ? turn.text : <Markdown>{turn.text}</Markdown>}
          </div>
        ))}

        {ask.isPending && (
          <p className="text-sm text-subtle">Thinking...</p>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(question);
        }}
        className="flex gap-2 border-t p-3"
      >
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask something..."
          aria-label="Your question"
        />

        <Button
          type="submit"
          size="icon"
          disabled={ask.isPending || !question.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

    </div>
  );
}
