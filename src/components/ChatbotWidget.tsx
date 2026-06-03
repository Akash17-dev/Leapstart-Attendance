/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ChatbotMessage, UserProfile } from "../types";
import { MaterialIcon, Button, Input } from "./DesignSystem";

interface ChatbotWidgetProps {
  currentScreen: string;
  activeUser: UserProfile | null;
}

export default function ChatbotWidget({ currentScreen, activeUser }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set initial welcome message
  useEffect(() => {
    const welcomeText = activeUser
      ? `Hello **${activeUser.name}**! I see you are currently visiting the **${currentScreen}** section of the LeapStart portal. How can I assist you with your attendance, profile projects, or leave requests today?`
      : `Welcome back to the LeapStart School of Technology! You are currently on the **${currentScreen}** screen. Contact me here anytime if you need assistance logging in (demo bypass: firstname@leapstart.gmail.com), recovery passcodes, or general questions.`;

    setMessages([
      {
        id: "welcome",
        role: "model",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentScreen, activeUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText) return;

    if (!textToSend) setInputValue("");

    const userMsg: ChatbotMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          currentScreen,
          chatHistory: messages.slice(-10),
          userContext: activeUser
            ? { name: activeUser.name, role: activeUser.role, email: activeUser.email }
            : null
        })
      });

      const data = await response.json();
      const botReply = data.text || data.fallbackText || "Apologies, I encountered a brief synchronization lag. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "model",
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "model",
          text: `I'm currently working in offline mode. For demo login: use \`${activeUser ? activeUser.id : "aadhira"}@leapstart.gmail.com\` with standard network passcode \`${activeUser ? activeUser.id : "aadhira"}@123\`. Let me know when you've signed in!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = activeUser
    ? activeUser.role === "student"
      ? ["How confidential is my direct chat?", "How do I check in?", "Request a calendar leave"]
      : activeUser.role === "mentor"
      ? ["How to mark classroom absentees?", "Review student leave lists", "Check my LinkedIn stats"]
      : ["Show overall school attendance rate", "How to manage user rosters?", "Auditing private safety locks"]
    : ["What are login credentials?", "How do I trigger forgot password?", "About LeapStart program"];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* TRIGGER BUBBLE */}
      {!isOpen && (
        <button
          id="btn-chatbot-float"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--text-primary)] text-[var(--bg-page)] cursor-pointer transition-all duration-300 relative hover:-translate-y-0.5 shadow-lg border border-[var(--border-color)]"
        >
          <MaterialIcon name="smart_toy" className="text-xl" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white/30"></span>
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="flex h-[550px] w-96 flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden text-[var(--text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/50 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#007aff]/10 p-1.5 text-[#007aff] flex items-center justify-center">
                <MaterialIcon name="smart_toy" className="text-xl" />
              </div>
              <div className="text-left">
                <h4 className="font-display font-semibold tracking-tight text-sm">LeapStart Assistant</h4>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>Attendance support</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)] cursor-pointer transition-colors flex items-center justify-center"
            >
              <MaterialIcon name="close" className="text-xl" />
            </button>
          </div>

          {/* Context Monitor Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-page)]/80 px-4 py-2 text-xs text-[var(--text-secondary)]">
            <span className="truncate">
              Current page: <strong>{currentScreen}</strong>
            </span>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#007aff]">
              <span className="h-1.5 w-1.5 bg-[#34c759] rounded-full"></span>
              Online
            </span>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 bg-[var(--bg-page)]/20 space-y-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm text-left ${
                    msg.role === "user"
                      ? "bg-[#007aff] text-white rounded-tr-none"
                      : "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-none"
                  }`}
                >
                  {msg.text.split("\n\n").map((para, pIdx) => {
                    const lines = para.split("\n");
                    return (
                      <div key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
                        {lines.map((ln, lIdx) => {
                          const isBullet = ln.startsWith("* ") || ln.startsWith("- ");
                          const cleanedLine = isBullet ? ln.substring(2) : ln;

                          return (
                            <div key={lIdx} className={`my-0.5 ${isBullet ? "flex items-start gap-1.5 pl-2" : ""}`}>
                              {isBullet && <span className="text-[#ff9f0a] font-bold">•</span>}
                              <span>
                                {cleanedLine.split("**").map((part, index) => {
                                  if (index % 2 === 1) {
                                    return <strong key={index} className="font-semibold text-[#007aff] dark:text-[#0a84ff]">{part}</strong>;
                                  }
                                  return part.split("`").map((subPart, sIndex) => {
                                    if (sIndex % 2 === 1) {
                                      return <code key={sIndex} className="bg-[var(--bg-page)] font-mono text-xs px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[#007aff] dark:text-[#0a84ff]">{subPart}</code>;
                                    }
                                    return subPart;
                                  });
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 max-w-[60%] mr-auto bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl rounded-tl-none px-4 py-3">
                <MaterialIcon name="sync" className="h-4 w-4 animate-spin text-[#007aff]" />
                <span className="text-xs text-[var(--text-secondary)]">Formulating suggestions...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[var(--bg-page)]/40">
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  id={`btn-quick-prompt-${i}`}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full bg-[var(--bg-surface)] hover:bg-[#e8f2ff] dark:hover:bg-[var(--text-primary)]/5 hover:text-[#007aff] dark:hover:text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] cursor-pointer transition-all truncate"
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2 border-t border-[var(--border-color)] bg-[var(--bg-page)]/40 px-3 py-3">
            <input
              id="inp-chatbot-message"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask LeapStart Assistant..."
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs px-4 py-2.5 rounded-xl outline-none text-[var(--text-primary)] focus:border-[#D4AF37]"
            />
            <Button
              id="btn-chatbot-send"
              disabled={!inputValue.trim() || isLoading}
              onClick={() => handleSend()}
              className="h-9 w-9 p-0 rounded-xl"
              icon="send"
            />
          </div>
        </div>
      )}
    </div>
  );
}
