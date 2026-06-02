import React, { useEffect, useState } from "react";
import { Send, Users } from "lucide-react";
import { GroupMessage, UserProfile } from "../types";

interface AllStudentsGroupProps {
  user: UserProfile;
}

export default function AllStudentsGroup({ user }: AllStudentsGroupProps) {
  const cohortYear = (user.specialty || "").toLowerCase().includes("1st") ? "1" : "2";
  const groupId = `year-${cohortYear}`;
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const response = await fetch(`/api/groups/${groupId}/messages`, {
      headers: { "x-user-id": user.id }
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load group.");
      return;
    }
    setMessages(data);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const response = await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to send message.");
      return;
    }
    setMessages((current) => [...current, data]);
    setText("");
  };

  return (
    <div className="space-y-6">
      <section className="premium-panel overflow-hidden">
        <div className="border-b border-[var(--leap-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--leap-brand)]" />
            <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white">
              {cohortYear === "1" ? "1st Year" : "2nd Year"} Class Group
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Group chat for classmates in your year. Mentors can post announcements here, but cannot read classmate messages.
          </p>
        </div>

        <div className="h-[360px] space-y-3 overflow-y-auto p-5">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">{error}</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No group messages yet.</div>
          ) : (
            messages.map((message) => {
              const isMe = message.senderId === user.id;
              return (
                <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${isMe ? "bg-[var(--leap-brand)] text-white" : "bg-white/70 text-slate-700 dark:bg-white/8 dark:text-slate-200"}`}>
                    <div className="mb-1 text-[10px] font-bold opacity-70">{message.senderName}</div>
                    <p>{message.text}</p>
                    <div className="mt-1 text-[9px] opacity-55">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-[var(--leap-border)] p-3">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Message ${cohortYear === "1" ? "1st year" : "2nd year"} classmates...`}
            className="premium-input flex-1"
          />
          <button type="submit" className="apple-primary flex h-10 w-10 items-center justify-center">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
