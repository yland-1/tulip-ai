import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Check, 
  CircleCheck, 
  Flower2, 
  Plus, 
  ShieldCheck, 
  X,
  Copy,
  RefreshCcw,
  Share,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { Action, Actions } from "../components/ui/actions";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TulipAI — Autonomous Ad Operations" },
      {
        name: "description",
        content:
          "TulipAI autonomously analyzes and orchestrates cross-platform advertising operations.",
      },
      { property: "og:title", content: "TulipAI — Autonomous Ad Operations" },
      {
        property: "og:description",
        content: "Autonomous cross-platform ad operations with human approval built in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TulipAI,
});

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  approval?: boolean;
  clarification?: boolean;
};

type ApprovalStatus = "pending" | "approved" | "rejected";

type LangGraphMessage = {
  type?: string;
  role?: string;
  content?: unknown;
};

function formatAgentState(state: unknown): string {
  if (state && typeof state === "object") {
    const messages = (state as { messages?: LangGraphMessage[] }).messages;
    if (Array.isArray(messages) && messages.length > 0) {
      const last = [...messages]
        .reverse()
        .find(
          (message) =>
            message &&
            (message.type === "ai" || message.type === "assistant" || message.role === "assistant"),
        );
      const source = last ?? messages[messages.length - 1];
      if (!source || typeof source !== "object") {
        return "```json\n" + JSON.stringify(state, null, 2) + "\n```";
      }
      if (typeof source.content === "string" && source.content.trim()) return source.content;
      if (Array.isArray(source.content)) {
        const text = source.content
          .map((part) =>
            part && typeof part === "object" && "text" in part
              ? String((part as { text: unknown }).text)
              : "",
          )
          .filter(Boolean)
          .join("\n");
        if (text.trim()) return text;
      }
    }
    return "```json\n" + JSON.stringify(state, null, 2) + "\n```";
  }
  return String(state);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="TulipAI">
      <span className="flex size-9 items-center justify-center rounded-md border border-border bg-glass text-foreground shadow-lg backdrop-blur-xl">
        <Flower2 className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span
        className={`${compact ? "text-lg" : "text-xl"} font-display font-semibold text-foreground`}
      >
        Tulip<span className="brand-text">AI</span>
      </span>
    </div>
  );
}

function VideoBackdrop({ active }: { active?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (active) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(() => {});
    }
  }, [active]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_040604_b04410ba-c173-4b68-826d-212a24bccdad.mp4"
          type="video/mp4"
        />
      </video>
      <div 
        className={`fixed inset-0 z-0 bg-app-overlay transition-opacity duration-1000 ${active ? 'opacity-0' : 'opacity-100'}`} 
        aria-hidden="true" 
      />
    </>
  );
}

function HitlApprovalCard({
  status,
  onDecision,
}: {
  status: ApprovalStatus;
  onDecision: (value: ApprovalStatus) => void;
}) {
  const isPending = status === "pending";
  return (
    <section
      className="mt-4 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      aria-label="Budget reallocation approval"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Human approval required
            </p>
            <h2 className="mt-1 font-display text-base font-semibold text-zinc-900">
              Pending Action: Budget Reallocation
            </h2>
          </div>
        </div>
        <div className="shrink-0 pt-1">
          {isPending ? (
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              Pending
            </span>
          ) : status === "approved" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <CircleCheck className="size-3.5" aria-hidden="true" />
              Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <X className="size-3.5" aria-hidden="true" />
              Rejected
            </span>
          )}
        </div>
      </div>
      <div className="flex bg-zinc-50/50 text-sm">
        <div className="flex-1 border-r border-zinc-200 px-5 py-3">
          <p className="text-xs text-zinc-500">Platform</p>
          <p className="mt-1 font-medium text-zinc-900">Google Ads / Meta</p>
        </div>
        <div className="flex-1 border-r border-zinc-200 px-5 py-3">
          <p className="text-xs text-zinc-500">Campaign ID</p>
          <p className="mt-1 font-medium text-zinc-900">12345</p>
        </div>
        <div className="flex-1 px-5 py-3">
          <p className="text-xs text-zinc-500">Proposed Change</p>
          <p className="mt-1 font-medium text-zinc-900">-20% / +$500</p>
        </div>
      </div>
      {isPending ? (
        <div className="flex gap-3 border-t border-zinc-200 p-4 bg-white">
          <Button
            onClick={() => onDecision("approved")}
            className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700 rounded-xl"
          >
            <Check aria-hidden="true" className="size-4" /> Approve & Deploy
          </Button>
          <Button
            onClick={() => onDecision("rejected")}
            className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700 rounded-xl"
          >
            <X aria-hidden="true" className="size-4" /> Reject
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-5 py-4 text-sm font-medium text-zinc-900 bg-zinc-50"
          role="status"
        >
          {status === "approved" ? (
            <CircleCheck className="size-5 text-green-600" />
          ) : (
            <X className="size-5 text-red-600" />
          )}
          {status === "approved"
            ? "Approved. Deployment has been queued."
            : "Rejected. No changes were made."}
        </div>
      )}
    </section>
  );
}

import { SilkGradient } from "../components/SilkGradient";

function TulipAI() {
  const [active, setActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [approval, setApproval] = useState<ApprovalStatus>("pending");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const respond = (text: string, firstMessage: boolean) => {
    setThinking(true);
    const pushAssistant = (reply: string, approval: boolean, clarification: boolean = false) => {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", text: reply, approval, clarification },
      ]);
      setThinking(false);
    };
    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("http://localhost:3001/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text }),
          });
          if (!response.ok) throw new Error(`Backend responded ${response.status}`);
          const state: any = await response.json();
          
          const needsClarification = state.clarificationNeeded === true;
          const replyText = needsClarification && state.clarificationQuestion 
            ? state.clarificationQuestion 
            : formatAgentState(state);
            
          const needsApproval = Boolean(state.proposedBudgetShift);
          pushAssistant(replyText, needsApproval, needsClarification);
        } catch {
          pushAssistant(
            firstMessage
              ? "I analyzed current pacing and conversion efficiency across both platforms. Google Search is outperforming Meta on marginal ROAS, so I’ve prepared a controlled reallocation for your approval."
              : `I’ve added “${text}” to the analysis queue. I’ll surface any material change for approval before deployment.`,
            firstMessage,
          );
        }
      })();
    }, 650);
  };

  const startChat = (message: string) => {
    const text = message.trim();
    if (!text) return;
    setActive(true);
    setMessages([{ id: Date.now(), role: "user", text }]);
    respond(text, true);
  };

  const continueChat = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || thinking) return;
    setMessages((current) => [...current, { id: Date.now(), role: "user", text }]);
    respond(text, false);
  };

  const resetChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(false);
    setMessages([]);
    setThinking(false);
    setApproval("pending");
  };

  return (
    <main className={`relative isolate h-svh overflow-hidden ${active ? "bg-[#FAFAFA] text-zinc-900" : "text-foreground"}`}>
      <VideoBackdrop active={active} />
      {!active ? (
        <section className="view-enter relative z-10 flex h-full items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl text-center">
            <h1 className="brand-text font-display text-6xl font-bold sm:text-7xl">TulipAI</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Autonomous cross-platform ad operations.
            </p>
            <div className="mx-auto mt-10 max-w-3xl text-left">
              <VercelV0Chat onSubmit={startChat} />
            </div>
          </div>
        </section>
      ) : (
        <section className="view-enter relative z-10 flex h-full flex-col">
          <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
            <Brand compact />
            <Button
              variant="outline"
              size="sm"
              onClick={resetChat}
              className="border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
            >
              <Plus aria-hidden="true" /> <span className="hidden sm:inline">New Chat</span>
            </Button>
          </header>
          <Conversation className="mt-16 mb-32 px-4 sm:px-6">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 py-8">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  from={message.role}
                  className="view-enter w-full"
                >
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-2xl bg-black px-4 py-3 text-white shadow-sm w-full"
                        : "w-full max-w-full overflow-x-auto rounded-2xl border border-zinc-100 bg-[#F4F4F5] px-5 py-4 text-zinc-900 shadow-sm sm:px-6"
                    }
                  >
                    <MessageResponse className="overflow-x-auto break-words">{message.text}</MessageResponse>
                    {message.clarification && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 border-zinc-200 bg-white hover:bg-zinc-100"
                          onClick={() => continueChat({ text: "Analyze Google Ads" } as PromptInputMessage)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-4"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                          Google Ads
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 border-zinc-200 bg-white hover:bg-zinc-100"
                          onClick={() => continueChat({ text: "Analyze Meta Ads" } as PromptInputMessage)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" className="size-4"><path fill="#0080ff" d="M25,2C12.318,2,2,12.317,2,25c0,11.534,8.473,21.077,19.645,22.784V31.674H15.73V25h5.915v-5.087c0-5.84,3.484-9.062,8.802-9.062c2.545,0,5.208,0.455,5.208,0.455v5.727h-2.934c-2.89,0-3.791,1.794-3.791,3.635V25h6.44l-1.03,6.674h-5.41v16.11C41.527,46.077,50,36.534,50,25C50,12.317,39.682,2,25,2z"/></svg>
                          Meta Ads
                        </Button>
                      </div>
                    )}
                    {message.approval && (
                      <HitlApprovalCard status={approval} onDecision={setApproval} />
                    )}
                    {message.role === "assistant" && !message.clarification && (
                      <Actions className="mt-4 pt-4 border-t border-zinc-200 text-zinc-500">
                        <Action label="Retry">
                          <RefreshCcw className="size-4" />
                        </Action>
                        <Action label="Like">
                          <ThumbsUp className="size-4" />
                        </Action>
                        <Action label="Dislike">
                          <ThumbsDown className="size-4" />
                        </Action>
                        <Action label="Copy">
                          <Copy className="size-4" />
                        </Action>
                        <Action label="Share">
                          <Share className="size-4" />
                        </Action>
                      </Actions>
                    )}
                  </MessageContent>
                </Message>
              ))}
              {thinking && (
                <Message from="assistant" className="view-enter">
                  <MessageContent className="rounded-2xl border border-zinc-100 bg-[#F4F4F5] px-5 py-4">
                    <Shimmer className="text-sm text-zinc-600">Analyzing live campaign signals…</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton className="border-zinc-200 bg-white text-zinc-900 shadow-sm" />
          </Conversation>
          <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-[#FAFAFA]/80 px-4 py-3 backdrop-blur-md sm:px-6">
            <PromptInput
              onSubmit={continueChat}
              className="mx-auto max-w-3xl rounded-2xl bg-white border border-zinc-200 shadow-sm"
            >
              <PromptInputTextarea
                aria-label="Continue conversation"
                className="max-h-28 min-h-12 px-4 text-sm text-zinc-900 placeholder:text-zinc-400"
                placeholder="Message TulipAI…"
              />
              <PromptInputFooter className="justify-end px-2 pb-2">
                <PromptInputSubmit
                  status={thinking ? "submitted" : "ready"}
                  disabled={thinking}
                  aria-label="Send message"
                  className="size-9 rounded-xl bg-black text-white hover:bg-zinc-800"
                />
              </PromptInputFooter>
            </PromptInput>
          </footer>
        </section>
      )}
    </main>
  );
}
