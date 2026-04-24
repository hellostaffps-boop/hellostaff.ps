import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { subscribeToApplicationMessages, sendApplicationMessage } from "@/lib/supabaseService";

export default function MessageThread({ applicationId, currentUser, senderRole }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);

    const unsubscribe = subscribeToApplicationMessages(applicationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await sendApplicationMessage(applicationId, {
        sender_uid: currentUser?.email,
        sender_name: currentUser?.user_metadata?.full_name || currentUser?.email,
        sender_role: senderRole,
        message: trimmed,
      });
    } catch (err) {
      console.error("[MessageThread] send error", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const senderEmail = currentUser?.email;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {t("messaging", "noMessages")}
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_email === senderEmail;
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {msg.message}
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {isOwn ? t("messaging", "you") : msg.sender_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border mt-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("messaging", "inputPlaceholder")}
          className="flex-1 h-9 text-sm"
          disabled={sending}
        />
        <Button
          size="icon"
          className="h-9 w-9 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}