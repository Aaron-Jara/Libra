"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CRITIC_PROFILES } from "@/lib/critics";
import { fetchCritiqueReply } from "@/lib/critique-reply-client";
import type { CritiqueChatTurn } from "@/lib/critique-reply";
import { playNarration, type NarrationState } from "@/lib/narration";
import { cn } from "@/lib/utils";
import type { NarrationSpeed } from "@/lib/narration-speed";
import type { CriticType } from "@/lib/voices";
import {
  createChatMessage,
  type CritiqueChatMessage,
} from "@/types/critique-chat";

type CritiqueReplyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criticType: CriticType;
  bookTitle: string;
  bookAuthor: string;
  critiqueNarration: string;
  messages: CritiqueChatMessage[];
  onMessagesChange: (messages: CritiqueChatMessage[]) => void;
  narrationSpeed?: NarrationSpeed;
  onNarrationStateChange?: (state: NarrationState) => void;
  onNarrationError?: (message: string) => void;
};

function toChatTurns(messages: CritiqueChatMessage[]): CritiqueChatTurn[] {
  return messages.map(({ role, text }) => ({ role, text }));
}

function getCriticLabel(type: CriticType) {
  return CRITIC_PROFILES.find((c) => c.id === type)?.title ?? "Critic";
}

export function CritiqueReplyModal({
  open,
  onOpenChange,
  criticType,
  bookTitle,
  bookAuthor,
  critiqueNarration,
  messages,
  onMessagesChange,
  narrationSpeed = 1,
  onNarrationStateChange,
  onNarrationError,
}: CritiqueReplyModalProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const criticLabel = getCriticLabel(criticType);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, loading]);

  const handleDismiss = useCallback(() => {
    setError(null);
    setLoading(false);
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage = createChatMessage("user", trimmed);
    const historyBeforeQuestion = toChatTurns(messages);
    const withUserMessage = [...messages, userMessage];

    onMessagesChange(withUserMessage);
    setQuestion("");
    setLoading(true);
    setError(null);

    const result = await fetchCritiqueReply({
      question: trimmed,
      critiqueNarration,
      criticType,
      bookTitle,
      bookAuthor,
      chatHistory: historyBeforeQuestion,
    });

    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const criticMessage = createChatMessage("critic", result.reply);
    onMessagesChange([...withUserMessage, criticMessage]);
    setLoading(false);

    await playNarration(result.reply, criticType, {
      speed: narrationSpeed,
      onStateChange: onNarrationStateChange,
      onError: (message) => onNarrationError?.(message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleDismiss();
      }}
    >
      <DialogContent
        overlayClassName="z-[105]"
        className="z-[110] flex max-h-[min(85dvh,640px)] flex-col overflow-hidden p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-white/6 px-6 pt-6 pb-4 text-left">
          <DialogTitle>Ask your critic</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Follow up on the critique. Replies stay in this chat and play aloud
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          {messages.length === 0 && !loading ? (
            <p className="py-8 text-center text-xs text-muted-foreground/80">
              Ask anything — e.g. &ldquo;Is this good for kids?&rdquo;
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-br-md bg-primary/15 text-foreground"
                        : "rounded-bl-md border border-white/8 bg-white/4 text-foreground/95",
                    )}
                  >
                    {message.role === "critic" ? (
                      <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {criticLabel}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </li>
              ))}
              {loading ? (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/8 bg-white/4 px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    {criticLabel} is thinking…
                  </div>
                </li>
              ) : null}
              <div ref={messagesEndRef} />
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-white/6 px-4 py-4 sm:px-6">
          {error ? (
            <p className="text-xs text-destructive/85">{error}</p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question..."
              rows={2}
              disabled={loading}
              className={cn(
                "flex w-full resize-none rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/60",
                "focus-visible:border-primary/30 focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl gap-2"
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <MessageCircle className="size-4" />
                  Send
                </>
              )}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-xl"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
