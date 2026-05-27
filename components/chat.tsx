"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";

// AI Elements — Conversation
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

// AI Elements — Message
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";

// AI Elements — Reasoning
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";

// AI Elements — Tool
import {
  Tool,
  ToolHeader,
} from "@/components/ai-elements/tool";

// AI Elements — Prompt Input
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

// App-specific
import { ModelSelector } from "@/components/model-selector";
import { DEFAULT_MODEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import remarkGfm from "remark-gfm";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { parseCitations, extractSourceFooter } from "@/lib/citation-parser";
import { PromptLibrary } from "@/components/prompt-library";
import { remarkCitations } from "@/lib/remark-citations";
import { CitationLink } from "@/components/citation-link";
import { useWakeLock } from "@/lib/hooks/use-wake-lock";
import { Spinner } from "@/components/ui/spinner";

import {
  Copy,
  ClipboardCopy,
  FileText,
  Pencil,
  PlusIcon,
  History,
  BookOpenText,
  X,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Streamdown plugins — code highlighting via Shiki
const streamdownPlugins = { code };

// ============================================
// MessageParts — consolidated reasoning + text + tool rendering
// ============================================
function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}) {
  // Consolidate all reasoning parts into one block (handles models that send multiple chunks)
  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning"
  );
  const reasoningText = reasoningParts.map((part) => part.text).join("\n\n");
  const hasReasoning = reasoningParts.length > 0;

  // Check if reasoning is still streaming
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";

  return (
    <>
      {/* Consolidated Reasoning block */}
      {hasReasoning && (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}

      {/* Text + Tool parts */}
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return message.role === "assistant" ? (
              <Streamdown
                key={`${message.id}-text-${i}`}
                isAnimating={isStreaming && isLastMessage}
                remarkPlugins={[remarkGfm, remarkCitations]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                components={{ a: CitationLink as any }}
                plugins={streamdownPlugins}
              >
                {part.text}
              </Streamdown>
            ) : (
              <div key={`${message.id}-text-${i}`}>{part.text}</div>
            );

          case "reasoning":
            // Already handled above
            return null;

          default: {
            // Tool call parts (tool-lookup_verse, tool-lookup_strongs, etc.)
            if (part.type.startsWith("tool-")) {
              const state = (part as { state?: string }).state;
              return (
                <Tool key={`${message.id}-tool-${i}`}>
                  <ToolHeader
                    type={part.type as `tool-${string}`}
                    state={
                      (state as
                        | "input-streaming"
                        | "input-available"
                        | "output-available"
                        | "output-error") ?? "input-streaming"
                    }
                  />
                </Tool>
              );
            }
            return null;
          }
        }
      })}
    </>
  );
}

// ============================================
// Chat History Sidebar
// ============================================
function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectSession,
  activeSessionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  activeSessionId: string | null;
}) {
  const { data } = useSWR("/api/chat/sessions", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const sessions = data?.data ?? [];

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    mutate("/api/chat/sessions");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-72 bg-background/95 backdrop-blur-xl border-r border-border z-20 animate-slide-right flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Chat History</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 hide-scrollbar">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No conversations yet
          </p>
        ) : (
          sessions.map(
            (s: { id: string; title: string; updatedAt: string; messageCount: number }) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={cn(
                  "group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs cursor-pointer",
                  activeSessionId === s.id
                    ? "bg-gold/10 text-gold"
                    : "hover:bg-muted text-foreground/80"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.messageCount} msgs · {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                </button>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// Citation Sources Footer
// ============================================
function CitationSourcesFooter({ message }: { message: UIMessage }) {
  const tp = message.parts.find((p) => p.type === "text");
  if (!tp || !("text" in tp)) return null;
  const citations = parseCitations(tp.text);
  if (citations.length === 0) return null;
  const sources = extractSourceFooter(citations);
  return (
    <div className="mt-2 pt-2 border-t border-border/20">
      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">
        Sources Referenced
      </span>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {sources.map((s, si) => (
          <Link
            key={si}
            href={s.href}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gold/5 text-gold/80 hover:bg-gold/10 hover:text-gold border border-gold/10 transition-colors"
          >
            <span>{s.type}</span>
            <span>{s.display}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Chat Component
// ============================================
export function Chat({ modelId = DEFAULT_MODEL }: { modelId: string }) {
  const [input, setInput] = useState("");
  const [currentModelId, setCurrentModelId] = useState(modelId);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSentRef = useRef(false);

  const handleModelIdChange = (newModelId: string) => {
    setCurrentModelId(newModelId);
    const params = new URLSearchParams();
    params.set("modelId", newModelId);
    router.push(`?${params.toString()}`);
  };

  const { messages, error, sendMessage, regenerate, setMessages, stop, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const hasMessages = messages.length > 0;
  const isStreaming = status === "streaming";

  // Keep screen awake while AI is streaming
  useWakeLock(isStreaming);

  // Auto-send prompt from URL (?prompt=...) — used by devotional "Study with AI"
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !autoSentRef.current && status === "ready" && messages.length === 0) {
      autoSentRef.current = true;
      sendMessage(
        { text: promptParam },
        { body: { modelId: currentModelId } }
      );
    }
  }, [searchParams, status, messages.length, sendMessage, currentModelId]);

  // Auto-save chat when a response finishes
  useEffect(() => {
    if (status === "ready" && messages.length >= 2) {
      saveChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const saveChatHistory = useCallback(async () => {
    if (messages.length < 2) return;

    try {
      // Create session if needed
      let sid = sessionId;
      if (!sid) {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: currentModelId }),
        });
        const data = await res.json();
        sid = data.data?.id;
        if (sid) setSessionId(sid);
      }
      if (!sid) return;

      // Save ALL messages — concatenate multi-part text and reasoning
      const payload = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
          const textContent = m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof (p as { text?: string }).text === "string")
            .map((p) => p.text)
            .filter((t) => t.length > 0)
            .join("\n");

          const reasoningContent = m.parts
            .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning" && typeof (p as { text?: string }).text === "string")
            .map((p) => p.text)
            .filter((t) => t.length > 0)
            .join("\n");

          return {
            role: m.role,
            content: textContent,
            reasoning: reasoningContent || null,
          };
        });

      const putRes = await fetch(`/api/chat/sessions/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });

      if (!putRes.ok) {
        console.error("[Chat] PUT failed:", putRes.status, await putRes.text());
      }

      mutate("/api/chat/sessions");
    } catch (err) {
      console.error("[Chat] Failed to save history:", err);
    }
  }, [messages, sessionId, currentModelId]);

  const handleNewChat = () => {
    stop();
    setMessages([]);
    setInput("");
    setSessionId(null);
  };

  // Export assistant response to a new note
  const exportToNote = async (text: string) => {
    try {
      const headingMatch = text.match(/^#{1,3}\s+(.+)$/m);
      const title = headingMatch
        ? headingMatch[1].replace(/[#*_\[\]]/g, "").trim()
        : text.substring(0, 60).replace(/[#*_]/g, "").trim() + "...";

      const citations = parseCitations(text);
      const links = extractSourceFooter(citations).map((s) => ({
        type: s.type === "📖" ? "verse" : s.type === "🔤" ? "strongs" : "dictionary",
        ref: s.display,
        href: s.href,
      }));

      const tiptapContent = { markdown: text };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: tiptapContent,
          links,
        }),
      });

      if (res.ok) {
        alert("Exported to Notes ✓");
      }
    } catch (err) {
      console.error("[Chat] Export to note failed:", err);
    }
  };

  // Helper to get all text from a message
  const getMessageText = (m: UIMessage) =>
    m.parts
      .filter((p) => p.type === "text" && "text" in p)
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("\n\n");

  // PromptInput submit handler
  const handlePromptSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) return;
    sendMessage({ text }, { body: { modelId: currentModelId } });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={async (id) => {
          const res = await fetch(`/api/chat/sessions/${id}`);
          const data = await res.json();
          if (data.data?.messages) {
            const uiMessages = data.data.messages
              .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
              .map((m: { id: string; role: string; content: string; reasoning: string | null }) => ({
                id: m.id,
                role: m.role,
                parts: [
                  ...(m.reasoning ? [{ type: "reasoning" as const, text: m.reasoning }] : []),
                  { type: "text" as const, text: m.content || "" },
                ],
              }));
            setMessages(uiMessages);
            setSessionId(id);
            setCurrentModelId(data.data.modelId);
          }
          setShowHistory(false);
        }}
        activeSessionId={sessionId}
      />

      {/* Top bar */}
      <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex gap-2 animate-fade-in">
        <Button
          onClick={handleNewChat}
          variant="outline"
          size="icon"
          className="h-9 w-9 shadow-border-small hover:shadow-border-medium bg-background/80 backdrop-blur-sm border-0 hover:bg-background hover:scale-[1.02] transition-all duration-150 ease"
          title="New Chat"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
          size="icon"
          className="h-9 w-9 shadow-border-small hover:shadow-border-medium bg-background/80 backdrop-blur-sm border-0 hover:bg-background hover:scale-[1.02] transition-all duration-150 ease"
          title="Chat History"
        >
          <History className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setShowPromptLibrary(true)}
          variant="outline"
          size="icon"
          className="h-9 w-9 shadow-border-small hover:shadow-border-medium bg-background/80 backdrop-blur-sm border-0 hover:bg-background hover:scale-[1.02] transition-all duration-150 ease"
          title="Prompt Library"
        >
          <BookOpenText className="h-4 w-4" />
        </Button>
      </div>

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        onSelectPrompt={(template) => setInput(template)}
      />

      {/* Empty state — shown when no messages */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 animate-fade-in">
          <div className="w-full max-w-2xl text-center space-y-8 md:space-y-12">
            <div className="animate-slide-up space-y-3">
              <h1 className="text-3xl md:text-5xl font-scripture font-semibold tracking-tight text-foreground">
                <span className="text-gold">✦</span> AI Study
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Ask questions about Scripture, theology, and the original languages
              </p>
            </div>
            <div
              className="w-full animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <PromptInput
                onSubmit={handlePromptSubmit}
                className="w-full"
              >
                <PromptInputTextarea
                  value={input}
                  placeholder="What does Genesis 1:1 mean in the original Hebrew?"
                  onChange={(e) => setInput(e.currentTarget.value)}
                  autoFocus
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <ModelSelector
                      modelId={currentModelId}
                      onModelChange={handleModelIdChange}
                    />
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={status}
                    onStop={stop}
                    disabled={!input.trim() && status === "ready"}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      )}

      {/* Messages — uses Conversation for smart auto-scroll */}
      {hasMessages && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-fade-in overflow-hidden">
          <Conversation className="flex-1">
            <ConversationContent className="gap-4 md:gap-6 px-4 md:px-8 py-4">
              {messages.map((m, msgIdx) => (
                <Fragment key={m.id}>
                  <Message
                    from={m.role}
                    className={cn(
                      m.role === "user" &&
                        "ml-auto max-w-[90%] md:max-w-[75%]",
                      m.role === "assistant" &&
                        "max-w-full md:max-w-[85%] min-w-0"
                    )}
                  >
                    <MessageContent>
                      <MessageParts
                        message={m}
                        isLastMessage={msgIdx === messages.length - 1}
                        isStreaming={isStreaming}
                      />
                    </MessageContent>
                  </Message>

                  {/* Assistant action bar — copy, markdown, export, regenerate */}
                  {m.role === "assistant" && !isStreaming && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => {
                          const plainText = getMessageText(m).replace(/[#*_`]/g, "");
                          navigator.clipboard.writeText(plainText);
                        }}
                        label="Copy"
                      >
                        <Copy className="size-3" />
                      </MessageAction>
                      <MessageAction
                        onClick={() => {
                          navigator.clipboard.writeText(getMessageText(m));
                        }}
                        label="Copy Markdown"
                      >
                        <ClipboardCopy className="size-3" />
                      </MessageAction>
                      <MessageAction
                        onClick={() => {
                          const text = getMessageText(m);
                          if (text) exportToNote(text);
                        }}
                        label="Export to Note"
                      >
                        <FileText className="size-3" />
                      </MessageAction>
                      {msgIdx === messages.length - 1 && (
                        <MessageAction
                          onClick={() => regenerate()}
                          label="Retry"
                        >
                          <RefreshCcw className="size-3" />
                        </MessageAction>
                      )}
                    </MessageActions>
                  )}

                  {/* Citation sources footer */}
                  {m.role === "assistant" && !isStreaming && (
                    <CitationSourcesFooter message={m} />
                  )}

                  {/* User message — edit button */}
                  {m.role === "user" && !isStreaming && (
                    <MessageActions className="justify-end">
                      <MessageAction
                        onClick={() => {
                          const tp = m.parts.find((p) => p.type === "text");
                          if (tp && "text" in tp) {
                            setInput(tp.text);
                            setMessages(messages.slice(0, msgIdx));
                          }
                        }}
                        label="Edit and resend"
                      >
                        <Pencil className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Fragment>
              ))}

              {/* Submitted indicator (before streaming starts) */}
              {status === "submitted" && <Spinner />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pb-4 animate-slide-down">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <span className="text-destructive">
              The response was interrupted — tap <strong>Retry</strong> to try again.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto transition-all duration-150 ease-out hover:scale-105"
              onClick={() => regenerate()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input bar (when messages exist) */}
      {hasMessages && (
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-6 md:pb-8">
          <PromptInput
            onSubmit={handlePromptSubmit}
            className="w-full"
          >
            <PromptInputTextarea
              value={input}
              placeholder="Ask a follow-up question..."
              onChange={(e) => setInput(e.currentTarget.value)}
            />
            <PromptInputFooter>
              <PromptInputTools>
                <ModelSelector
                  modelId={currentModelId}
                  onModelChange={handleModelIdChange}
                />
              </PromptInputTools>
              <PromptInputSubmit
                status={status}
                onStop={stop}
                disabled={!input.trim() && status === "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      )}

      {/* Footer */}
      <footer
        className="pb-8 text-center animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <p className="text-xs text-muted-foreground/50">
          Powered by 5 top AI providers · Responses may contain errors — always
          verify with Scripture
        </p>
      </footer>
    </div>
  );
}
