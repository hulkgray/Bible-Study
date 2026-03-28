"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SendIcon,
  PlusIcon,
  ChevronDown,
  ChevronRight,
  Brain,
  FileText,
  Loader2,
  History,
  Trash2,
  X,
  Copy,
  Check,
  Pencil,
  ClipboardCopy,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_MODEL } from "@/lib/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================
// Reasoning Block — collapsible thinking animation
// ============================================
function ReasoningBlock({
  reasoningText,
  isStreaming,
}: {
  reasoningText: string;
  isStreaming: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all",
          isStreaming
            ? "bg-gold/10 text-gold border border-gold/20"
            : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
        )}
      >
        {isStreaming ? (
          <div className="flex items-center gap-1.5">
            <Brain className="h-3 w-3 animate-pulse" />
            <span className="font-medium">Thinking</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        ) : (
          <>
            <Brain className="h-3 w-3" />
            <span>View Reasoning</span>
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </>
        )}
      </button>

      {(isOpen || isStreaming) && (
        <div
          className={cn(
            "mt-1.5 px-3 py-2.5 rounded-lg text-xs leading-relaxed max-h-[300px] overflow-y-auto hide-scrollbar",
            "bg-muted/30 border border-border/50 text-muted-foreground",
            "animate-slide-down"
          )}
        >
          <pre className="whitespace-pre-wrap font-sans">{reasoningText}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================
// Copy Button — with check feedback
// ============================================
function CopyButton({
  text,
  label,
  icon,
}: {
  text: string;
  label: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-gold px-2 py-1 rounded-md hover:bg-gold/5 transition-colors"
      title={label}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : icon}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ============================================
// Model Selector with URL sync
// ============================================
function ModelSelectorHandler({
  modelId,
  onModelIdChange,
}: {
  modelId: string;
  onModelIdChange: (newModelId: string) => void;
}) {
  const router = useRouter();

  const handleSelectChange = (newModelId: string) => {
    onModelIdChange(newModelId);
    const params = new URLSearchParams();
    params.set("modelId", newModelId);
    router.push(`?${params.toString()}`);
  };

  return <ModelSelector modelId={modelId} onModelChange={handleSelectChange} />;
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
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={cn(
                  "group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs",
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
              </button>
            )
          )
        )}
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleModelIdChange = (newModelId: string) => {
    setCurrentModelId(newModelId);
  };

  const { messages, error, sendMessage, regenerate, setMessages, stop, status } = useChat();

  const hasMessages = messages.length > 0;
  const isStreaming = status === "streaming";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Save last 2 messages (the latest user + assistant pair)
      const lastTwo = messages.slice(-2);
      const payload = lastTwo.map((m) => {
        const textPart = m.parts.find((p) => p.type === "text");
        const reasoningPart = m.parts.find((p) => p.type === "reasoning");
        return {
          role: m.role,
          content: textPart && "text" in textPart ? textPart.text : "",
          reasoning: reasoningPart && "text" in reasoningPart ? reasoningPart.text : null,
        };
      });

      await fetch(`/api/chat/sessions/${sid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });

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
      const title = text.substring(0, 60).replace(/[#*_]/g, "").trim() + "...";
      // Store raw markdown so the Notes page can render with react-markdown
      const tiptapContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text }],
          },
        ],
        // Store the raw markdown separately for react-markdown rendering
        markdown: text,
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `AI Study: ${title}`,
          content: tiptapContent,
        }),
      });

      if (res.ok) {
        alert("Exported to Notes ✓");
      }
    } catch (err) {
      console.error("[Chat] Export to note failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={async (id) => {
          // Load session messages
          const res = await fetch(`/api/chat/sessions/${id}`);
          const data = await res.json();
          if (data.data?.messages) {
            const uiMessages = data.data.messages.map((m: { id: string; role: string; content: string; reasoning: string | null }) => ({
              id: m.id,
              role: m.role,
              parts: [
                ...(m.reasoning ? [{ type: "reasoning" as const, reasoning: m.reasoning }] : []),
                { type: "text" as const, text: m.content },
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
      </div>

      {/* Empty state */}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(
                    { text: input },
                    { body: { modelId: currentModelId } }
                  );
                  setInput("");
                }}
              >
                <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-2xl glass-effect shadow-border-medium transition-all duration-200 ease-out">
                  <ModelSelectorHandler
                    modelId={modelId}
                    onModelIdChange={handleModelIdChange}
                  />
                  <div className="flex flex-1 items-center">
                    <Input
                      name="prompt"
                      placeholder="What does Genesis 1:1 mean in the original Hebrew?"
                      onChange={(e) => setInput(e.target.value)}
                      value={input}
                      autoFocus
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
                      onKeyDown={(e) => {
                        if (e.metaKey && e.key === "Enter") {
                          sendMessage(
                            { text: input },
                            { body: { modelId: currentModelId } }
                          );
                          setInput("");
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl hover:bg-muted/50"
                      disabled={!input.trim()}
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {hasMessages && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-fade-in overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 hide-scrollbar">
            <div className="flex flex-col gap-4 md:gap-6 pb-4">
              {messages.map((m, msgIdx) => (
                <div
                  key={m.id}
                  className={cn(
                    m.role === "user" &&
                      "bg-foreground text-background rounded-2xl p-3 md:p-4 ml-auto max-w-[90%] md:max-w-[75%] shadow-border-small font-medium text-sm md:text-base",
                    m.role === "assistant" &&
                      "max-w-[95%] md:max-w-[85%] text-foreground/90 leading-relaxed text-sm md:text-base"
                  )}
                >
                  {m.parts.map((part, i) => {
                    switch (part.type) {
                      case "reasoning":
                        return (
                          <ReasoningBlock
                            key={`${m.id}-reasoning-${i}`}
                            reasoningText={part.text}
                            isStreaming={
                              isStreaming &&
                              msgIdx === messages.length - 1
                            }
                          />
                        );
                      case "text":
                        return m.role === "assistant" ? (
                          <Streamdown
                            key={`${m.id}-${i}`}
                            isAnimating={
                              isStreaming &&
                              m.id === messages[messages.length - 1]?.id
                            }
                          >
                            {part.text}
                          </Streamdown>
                        ) : (
                          <div key={`${m.id}-${i}`}>{part.text}</div>
                        );
                      default:
                        return null;
                    }
                  })}

                  {/* Assistant action bar — copy, copy as markdown, export to note */}
                  {m.role === "assistant" && !isStreaming && (
                    <div className="flex items-center gap-0.5 mt-3 pt-2 border-t border-border/30">
                      <CopyButton
                        text={(() => {
                          const tp = m.parts.find((p) => p.type === "text");
                          return tp && "text" in tp ? tp.text.replace(/[#*_`]/g, "") : "";
                        })()}
                        label="Copy"
                        icon={<Copy className="h-3 w-3" />}
                      />
                      <CopyButton
                        text={(() => {
                          const tp = m.parts.find((p) => p.type === "text");
                          return tp && "text" in tp ? tp.text : "";
                        })()}
                        label="Copy Markdown"
                        icon={<ClipboardCopy className="h-3 w-3" />}
                      />
                      <button
                        onClick={() => {
                          const textPart = m.parts.find(
                            (p) => p.type === "text"
                          );
                          if (textPart && "text" in textPart) {
                            exportToNote(textPart.text);
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-gold px-2 py-1 rounded-md hover:bg-gold/5 transition-colors"
                        title="Save this response as a Study Note"
                      >
                        <FileText className="h-3 w-3" />
                        Export to Note
                      </button>
                    </div>
                  )}

                  {/* User message — edit button */}
                  {m.role === "user" && !isStreaming && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        onClick={() => {
                          const tp = m.parts.find((p) => p.type === "text");
                          if (tp && "text" in tp) {
                            setInput(tp.text);
                            // Remove this message and everything after it
                            setMessages(messages.slice(0, msgIdx));
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] text-background/50 hover:text-background/80 px-1.5 py-0.5 rounded transition-colors"
                        title="Edit and resend"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming indicator */}
              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  <span className="text-xs">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pb-4 animate-slide-down">
          <Alert variant="destructive" className="flex flex-col items-end">
            <div className="flex flex-row gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <AlertDescription className="dark:text-red-400 text-red-600">
                An error occurred while generating the response. Please try a
                different model or check your connection.
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto transition-all duration-150 ease-out hover:scale-105"
              onClick={() => regenerate()}
            >
              Retry
            </Button>
          </Alert>
        </div>
      )}

      {/* Input bar (when messages exist) */}
      {hasMessages && (
        <div className="w-full max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(
                { text: input },
                { body: { modelId: currentModelId } }
              );
              setInput("");
            }}
            className="px-4 md:px-8 pb-6 md:pb-8"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl glass-effect shadow-border-medium transition-all duration-200 ease-out">
              <ModelSelectorHandler
                modelId={modelId}
                onModelIdChange={handleModelIdChange}
              />
              <div className="flex flex-1 items-center">
                <Input
                  name="prompt"
                  placeholder="Ask a follow-up question..."
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60 font-medium"
                  onKeyDown={(e) => {
                    if (e.metaKey && e.key === "Enter") {
                      sendMessage(
                        { text: input },
                        { body: { modelId: currentModelId } }
                      );
                      setInput("");
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-xl hover:bg-accent hover:text-accent-foreground hover:scale-110 transition-all duration-150 ease disabled:opacity-50 disabled:hover:scale-100"
                  disabled={!input.trim()}
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
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
