"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpIcon,
  CircleUserRound,
  Figma,
  FileUp,
  ImageIcon,
  MonitorIcon,
  Paperclip,
  PlusIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = `${minHeight}px`;
      if (reset) return;

      textarea.style.height = `${Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      )}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    adjustHeight(true);
  }, [adjustHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface VercelV0ChatProps {
  onSubmit?: (message: string) => void;
  initialValue?: string;
  className?: string;
}

const actions = [
  {
    icon: ImageIcon,
    label: "Clone a Screenshot",
    prompt: "Analyze this screenshot and recreate the campaign.",
  },
  { icon: Figma, label: "Import from Figma", prompt: "Import a campaign concept from Figma." },
  { icon: FileUp, label: "Upload a Project", prompt: "Review an existing campaign project." },
  {
    icon: MonitorIcon,
    label: "Landing Page",
    prompt: "Create and optimize a landing page campaign.",
  },
  { icon: CircleUserRound, label: "Sign Up Form", prompt: "Optimize a sign-up form campaign." },
];

export function VercelV0Chat({ onSubmit, initialValue = "", className }: VercelV0ChatProps) {
  const [value, setValue] = useState(initialValue);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });

  useEffect(() => {
    setValue(initialValue);
    requestAnimationFrame(() => adjustHeight());
  }, [adjustHeight, initialValue]);

  const submit = () => {
    const message = value.trim();
    if (!message) return;
    onSubmit?.(message);
    setValue("");
    adjustHeight(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const chooseAction = (prompt: string) => {
    setValue(prompt);
    requestAnimationFrame(() => {
      adjustHeight();
      textareaRef.current?.focus();
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <h2 className="mb-5 text-center font-display text-xl font-semibold text-foreground sm:text-2xl">
        What can I help you ship?
      </h2>

      <div className="glass-surface overflow-hidden rounded-xl bg-glass shadow-2xl">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask TulipAI a question..."
          aria-label="Ask TulipAI a question"
          className="min-h-[60px] w-full resize-none rounded-none border-none bg-transparent px-4 py-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          style={{ overflow: "hidden" }}
        />

        <div className="flex items-center justify-between gap-3 p-3">
          <div>
            <input ref={fileInputRef} type="file" className="sr-only" aria-label="Attach a file" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a file"
              title="Attach"
              className="text-foreground hover:bg-accent"
            >
              <Paperclip aria-hidden="true" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => chooseAction("Create a new cross-platform advertising project.")}
              className="border-dashed border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <PlusIcon aria-hidden="true" /> Project
            </Button>
            <Button
              type="button"
              size="icon-sm"
              onClick={submit}
              disabled={!value.trim()}
              aria-label="Send message"
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto pb-2 sm:flex-wrap">
        {actions.map(({ icon: Icon, label, prompt }) => (
          <ActionButton
            key={label}
            icon={Icon}
            label={label}
            onClick={() => chooseAction(prompt)}
          />
        ))}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="shrink-0 rounded-full border-border bg-glass text-muted-foreground backdrop-blur-md hover:bg-accent hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
