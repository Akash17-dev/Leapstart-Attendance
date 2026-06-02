/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Send, RefreshCw } from "lucide-react";
import { ChatbotMessage, UserProfile } from "../types";

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
          chatHistory: messages.slice(-10), // Send last 10 messages for context
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
      ? ["How confidenial is my direct chat?", "How do I check in?", "Request a calendar leave"]
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
          className="flex h-14 w-14 items-center justify-center rounded-2xl apple-primary cursor-pointer transition-all duration-300 relative hover:-translate-y-0.5"
        >
          <Bot className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white/30"></span>
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="flex h-[550px] w-96 flex-col rounded-3xl border border-[var(--leap-border)] bg-[var(--leap-elevated)] shadow-[var(--leap-shadow)] backdrop-blur-2xl transition-all duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--leap-border)] bg-white/48 px-4 py-4 text-[#1d1d1f] dark:bg-white/6 dark:text-[#f5f5f7]">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#007aff]/10 p-1.5 text-[#007aff]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold tracking-tight text-sm">LeapStart Assistant</h4>
                <div className="flex items-center gap-1.5 text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>Attendance support</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-[#6e6e73] hover:bg-black/5 hover:text-[#1d1d1f] cursor-pointer transition-colors dark:text-[#a1a1a6] dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Context Monitor Bar */}
          <div className="flex items-center justify-between border-b border-[var(--leap-border)] bg-white/36 px-4 py-2 text-xs text-[#6e6e73] dark:bg-white/4 dark:text-[#a1a1a6]">
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
            className="flex-1 overflow-y-auto px-4 py-4 bg-white/24 dark:bg-black/10 space-y-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-[#007aff] text-white rounded-tr-none "
                      : "bg-white/78 text-gray-800 border border-[var(--leap-border)] rounded-tl-none dark:bg-white/8 dark:text-slate-100 "
                  }`}
                >
                  {/* Parse markdown bold values simple mock renderer */}
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
                                      return <code key={sIndex} className="bg-[#e8f2ff] dark:bg-white/10 font-mono text-xs px-1.5 py-0.5 rounded border border-[#007aff]/12 text-[#007aff] dark:text-[#0a84ff]">{subPart}</code>;
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
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 max-w-[60%] mr-auto bg-white/78 border border-[var(--leap-border)] dark:bg-white/8 rounded-xl rounded-tl-none px-4 py-3 ">
                <RefreshCw className="h-4 w-4 animate-spin text-[#007aff]" />
                <span className="text-xs text-gray-500 dark:text-slate-300">Formulating suggestions...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-[var(--leap-border)] bg-white/42 dark:bg-white/4">
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  id={`btn-quick-prompt-${i}`}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full bg-white/70 hover:bg-[#e8f2ff] hover:text-[#007aff] border border-[var(--leap-border)] px-2.5 py-1 text-[11px] font-medium text-gray-600 cursor-pointer dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12 transition-all truncate"
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2 border-t border-[var(--leap-border)] bg-white/46 px-3 py-3 dark:bg-white/4">
            <input
              id="inp-chatbot-message"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask LeapStart Assistant..."
              className="premium-input flex-1"
            />
            <button
              id="btn-chatbot-send"
              disabled={!inputValue.trim() || isLoading}
              onClick={() => handleSend()}
              className="flex h-9 w-9 items-center justify-center apple-primary cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
