/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GroupMessage, UserProfile, Channel, MessageReaction, ChatAttachment, DirectMessage } from "../types";
import { MaterialIcon, Button, Avatar } from "./DesignSystem";

interface AllStudentsGroupProps {
  user: UserProfile;
}

export default function AllStudentsGroup({ user }: AllStudentsGroupProps) {
  // Socket Ref
  const socketRef = useRef<Socket | null>(null);

  // States
  const [servers, setServers] = useState([
    { id: "attendance", name: "Attendance Workspace", initial: "A" },
    { id: "student", name: "Student Cohort server", initial: "S" },
    { id: "projects", name: "Projects & Placements Hub", initial: "P" }
  ]);
  const [activeServer, setActiveServer] = useState("student");
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeDmUser, setActiveDmUser] = useState<UserProfile | null>(null);

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> userName
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set());
  const [isPinnedDrawerOpen, setIsPinnedDrawerOpen] = useState(false);
  
  // Attachment Simulation
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; size: number; base64: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Socket Connection and Initial Fetching
  useEffect(() => {
    fetchUsers();
    fetchChannels();

    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", user.id);
    });

    socket.on("channel-message", (msg: GroupMessage) => {
      if (activeChannel && msg.groupId === activeChannel.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socket.on("dm-message", (msg: DirectMessage) => {
      if (activeDmUser && (msg.senderId === activeDmUser.id || msg.receiverId === activeDmUser.id)) {
        const sender = allUsers.find((u) => u.id === msg.senderId) || user;
        const mapped: GroupMessage = {
          id: msg.id,
          groupId: "dm",
          senderId: msg.senderId,
          senderName: sender.name,
          senderPfp: sender.pfpUrl,
          senderRole: sender.role,
          text: msg.text,
          timestamp: msg.timestamp
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      }
    });

    socket.on("message-reaction-updated", (data: { messageId: string; userId: string; userName: string; emoji: string; action: "add" | "remove" }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;
          const reactions = msg.reactions || [];
          if (data.action === "add") {
            const exists = reactions.some((r) => r.userId === data.userId && r.emoji === data.emoji);
            if (exists) return msg;
            return {
              ...msg,
              reactions: [...reactions, { id: `r-${Date.now()}`, messageId: data.messageId, userId: data.userId, userName: data.userName || "Peer", emoji: data.emoji }]
            };
          } else {
            return {
              ...msg,
              reactions: reactions.filter((r) => !(r.userId === data.userId && r.emoji === data.emoji))
            };
          }
        })
      );
    });

    socket.on("message-attachment-updated", (data: { messageId: string; attachment: ChatAttachment }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;
          const attachments = msg.attachments || [];
          if (attachments.some((a) => a.id === data.attachment.id)) return msg;
          return {
            ...msg,
            attachments: [...attachments, data.attachment]
          };
        })
      );
    });

    socket.on("status-change", (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.status === "online") {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    socket.on("typing-channel", (data: { channelId: string; userName: string }) => {
      if (activeChannel && data.channelId === activeChannel.id) {
        setTypingUsers((prev) => ({ ...prev, [data.userName]: data.userName }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[data.userName];
            return next;
          });
        }, 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChannel, activeDmUser, allUsers]);

  // Fetch all channels
  const fetchChannels = async () => {
    try {
      const resp = await fetch("/api/channels");
      if (resp.ok) {
        const data = await resp.json();
        setChannels(data);
        const filtered = filterChannelsByServer(data, activeServer);
        if (filtered.length > 0) {
          setActiveChannel(filtered[0]);
          setActiveDmUser(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch users for DM list & Right sidebar
  const fetchUsers = async () => {
    try {
      const resp = await fetch("/api/users");
      if (resp.ok) {
        const data = await resp.json();
        setAllUsers(data);
        const mockOnline = new Set<string>();
        data.forEach((u: UserProfile) => {
          if (Math.random() > 0.4 || u.role === "admin" || u.role === "mentor") {
            mockOnline.add(u.id);
          }
        });
        setOnlineUserIds(mockOnline);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter channels based on active server
  const filterChannelsByServer = (list: Channel[], serverId: string) => {
    if (serverId === "attendance") {
      return list.filter((c) => c.id === "announcements" || c.id === "attendance-help");
    } else if (serverId === "student") {
      return list.filter((c) => c.id === "general" || c.id === "random" || c.id.startsWith("year-"));
    } else {
      return list.filter((c) => c.id === "projects" || c.id === "placements" || c.id === "internships");
    }
  };

  // Channel switch
  const handleSelectChannel = (channel: Channel) => {
    setActiveChannel(channel);
    setActiveDmUser(null);
    setMessages([]);
    fetchChannelMessages(channel.id);
  };

  const fetchChannelMessages = async (channelId: string) => {
    try {
      const resp = await fetch(`/api/channels/${channelId}/messages`);
      if (resp.ok) {
        setMessages(await resp.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // DM switch
  const handleSelectDmUser = (dmUser: UserProfile) => {
    setActiveDmUser(dmUser);
    setActiveChannel(null);
    setMessages([]);
    fetchDirectMessages(dmUser.id);
  };

  const fetchDirectMessages = async (targetId: string) => {
    try {
      const resp = await fetch(`/api/messages?userId=${user.id}&targetId=${targetId}`, {
        headers: { "x-user-id": user.id }
      });
      if (resp.ok) {
        const dms: DirectMessage[] = await resp.json();
        const mapped = dms.map((msg) => {
          const sender = msg.senderId === user.id ? user : dmUserForId(msg.senderId);
          return {
            id: msg.id,
            groupId: "dm",
            senderId: msg.senderId,
            senderName: sender.name,
            senderPfp: sender.pfpUrl,
            senderRole: sender.role,
            text: msg.text,
            timestamp: msg.timestamp
          };
        });
        setMessages(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dmUserForId = (id: string): UserProfile => {
    return allUsers.find((u) => u.id === id) || {
      id,
      name: "Student Peer",
      email: "",
      role: "student",
      linkedinUrl: "",
      pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peer",
      bio: "LeapStart developer",
      skills: [],
      projects: []
    };
  };

  // Server switch
  const handleSelectServer = (serverId: string) => {
    setActiveServer(serverId);
    const filtered = filterChannelsByServer(channels, serverId);
    if (filtered.length > 0) {
      handleSelectChannel(filtered[0]);
    } else {
      setActiveChannel(null);
      setMessages([]);
    }
  };

  // Text inputs & Typing emitters
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socketRef.current) {
      if (activeChannel) {
        socketRef.current.emit("typing", { channelId: activeChannel.id, userName: user.name });
      } else if (activeDmUser) {
        socketRef.current.emit("typing", { receiverId: activeDmUser.id, userName: user.name });
      }
    }
  };

  // Handle file uploads (Mock Cloudinary simulation)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Submit Message dispatch
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    try {
      let msgObj: GroupMessage | null = null;

      if (activeChannel) {
        const resp = await fetch(`/api/channels/${activeChannel.id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id
          },
          body: JSON.stringify({
            senderId: user.id,
            text: inputText.trim() || `Dispatched an attachment file: ${attachedFile?.name}`,
            parentId: replyingTo?.id || undefined
          })
        });

        if (resp.ok) {
          msgObj = await resp.json();
          setMessages((prev) => {
            if (prev.some((m) => m.id === msgObj!.id)) return prev;
            return [...prev, msgObj!];
          });
        }
      } else if (activeDmUser) {
        const resp = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id
          },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: activeDmUser.id,
            text: inputText.trim() || `Dispatched a direct attachment file: ${attachedFile?.name}`
          })
        });

        if (resp.ok) {
          const rawDm = await resp.json();
          msgObj = {
            id: rawDm.id,
            groupId: "dm",
            senderId: user.id,
            senderName: user.name,
            senderPfp: user.pfpUrl,
            senderRole: user.role,
            text: rawDm.text,
            timestamp: rawDm.timestamp
          };
          setMessages((prev) => [...prev, msgObj!]);
        }
      }

      if (msgObj && attachedFile) {
        const fileType = attachedFile.type.split("/")[0] || "file";
        await fetch("/api/messages/attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: msgObj.id,
            publicId: `cloudinary-id-${Date.now()}`,
            secureUrl: attachedFile.base64,
            fileName: attachedFile.name,
            fileType: attachedFile.type,
            fileSize: attachedFile.size
          })
        });
      }

      setInputText("");
      setAttachedFile(null);
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Reactions
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const reactions = msg.reactions || [];
    const hasAlready = reactions.some((r) => r.userId === user.id && r.emoji === emoji);

    try {
      const resp = await fetch("/api/messages/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          userId: user.id,
          emoji,
          action: hasAlready ? "remove" : "add"
        })
      });

      if (resp.ok) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const updated = m.reactions || [];
            if (hasAlready) {
              return { ...m, reactions: updated.filter((r) => !(r.userId === user.id && r.emoji === emoji)) };
            } else {
              return {
                ...m,
                reactions: [...updated, { id: `r-temp-${Date.now()}`, messageId, userId: user.id, userName: user.name, emoji }]
              };
            }
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = (messageId: string) => {
    setPinnedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Custom Markdown rendering
  const parseMarkdown = (text: string) => {
    if (!text) return "";
    
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    escaped = escaped.replace(/```([\s\S]+?)```/g, '<pre class="bg-[var(--bg-page)] border border-[var(--border-color)] p-3 rounded-xl font-mono text-[11px] text-[var(--text-primary)] my-2 overflow-x-auto">$1</pre>');
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-elevated)] border border-[var(--border-color)] px-1.5 py-0.5 rounded font-mono text-[10px] text-[#D4AF37]">$1</code>');
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-[var(--text-primary)]">$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="italic text-[var(--text-secondary)]">$1</em>');
    escaped = escaped.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>');

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  // Group messages search locally
  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  const activeChannelsFiltered = filterChannelsByServer(channels, activeServer).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Roster categories
  const mentors = allUsers.filter((u) => u.role === "mentor");
  const admins = allUsers.filter((u) => u.role === "admin");
  const students = allUsers.filter((u) => u.role === "student");

  return (
    <div className="h-[calc(100vh-140px)] mx-6 my-4 bg-[var(--bg-page)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex overflow-hidden text-[var(--text-primary)] font-sans z-20">
      
      {/* 1st COLUMN: Discord Server Icon Stack */}
      <div className="w-18 bg-[var(--bg-elevated)] flex flex-col items-center py-4 gap-3 border-r border-[var(--border-color)] shrink-0">
        <div className="h-10 w-10 bg-[var(--bg-surface)] rounded-2xl flex items-center justify-center border border-[#D4AF37]/20 shadow-md">
          <MaterialIcon name="shield" className="text-xl text-[var(--leap-brand)]" />
        </div>
        <span className="w-8 h-[1px] bg-[var(--border-color)]"></span>

        {servers.map((srv) => {
          const isActive = activeServer === srv.id;
          return (
            <button
              key={srv.id}
              onClick={() => handleSelectServer(srv.id)}
              className={`h-11 w-11 rounded-full text-xs font-black uppercase flex items-center justify-center cursor-pointer transition-all ${
                isActive
                  ? "bg-[#D4AF37] text-black rounded-2xl shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[#D4AF37]/20 hover:text-[var(--text-primary)] hover:rounded-2xl"
              }`}
              title={srv.name}
            >
              {srv.initial}
            </button>
          );
        })}
      </div>

      {/* 2nd COLUMN: Channel / DM Selector Sidebar */}
      <div className="w-60 bg-[var(--bg-page)] flex flex-col border-r border-[var(--border-color)] shrink-0">
        
        <div className="p-3 border-b border-[var(--border-color)] shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[var(--text-secondary)]">
              <MaterialIcon name="search" className="text-sm" />
            </span>
            <input
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs py-1.5 pl-7 pr-3 rounded-lg outline-none text-[var(--text-primary)] focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
          
          {/* TEXT CHANNELS CATEGORY */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider px-2 block mb-1">
              Text Channels
            </span>
            {activeChannelsFiltered.map((ch) => {
              const isActive = activeChannel?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-l-2 border-[#D4AF37]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MaterialIcon name="tag" className="text-base text-[var(--text-secondary)]" />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* DMs LIST */}
          {activeServer === "student" && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider px-2 block mb-1.5">
                Direct Messages
              </span>
              <div className="space-y-0.5">
                {students.filter((s) => s.id !== user.id).map((peer) => {
                  const isActive = activeDmUser?.id === peer.id;
                  const isOnline = onlineUserIds.has(peer.id);
                  return (
                    <button
                      key={peer.id}
                      onClick={() => handleSelectDmUser(peer)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-l-2 border-[#D4AF37]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={peer.pfpUrl}
                          alt={peer.name}
                          className="h-6 w-6 rounded-md bg-[var(--bg-elevated)]"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--bg-page)] ${
                          isOnline ? "bg-[#10B981]" : "bg-gray-500"
                        }`}></span>
                      </div>
                      <span className="truncate">{peer.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3rd COLUMN: Main Chat & Input Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)]">
        
        {/* Chat Area Top Bar */}
        <div className="h-14 border-b border-[var(--border-color)] px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeChannel ? (
              <>
                <MaterialIcon name="tag" className="text-xl text-[var(--text-secondary)] shrink-0" />
                <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{activeChannel.name}</h4>
                {activeChannel.description && (
                  <>
                    <span className="h-3 w-[1px] bg-[var(--border-color)]"></span>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{activeChannel.description}</p>
                  </>
                )}
              </>
            ) : activeDmUser ? (
              <>
                <MaterialIcon name="chat" className="text-base text-[var(--text-secondary)] shrink-0" />
                <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{activeDmUser.name}</h4>
                <span className="h-3 w-[1px] bg-[var(--border-color)]"></span>
                <p className="text-xs text-[var(--text-secondary)] truncate">{activeDmUser.bio}</p>
              </>
            ) : (
              <span className="text-xs text-[var(--text-secondary)] italic">Select channel to talk</span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Pinned Messages Button */}
            <button
              onClick={() => setIsPinnedDrawerOpen(!isPinnedDrawerOpen)}
              className={`p-1.5 rounded-lg border border-[var(--border-color)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer ${
                isPinnedDrawerOpen ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30" : "text-[var(--text-secondary)]"
              }`}
              title="Pinned Messages"
            >
              <MaterialIcon name="push_pin" className="text-base" />
            </button>

            <div className="relative max-w-xs hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[var(--text-secondary)]">
                <MaterialIcon name="search" className="text-sm" />
              </span>
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] py-1 pl-6 pr-2 rounded outline-none text-[var(--text-primary)] focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Message Log viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {filteredMessages.map((msg, index) => {
            const prevMsg = index > 0 ? filteredMessages[index - 1] : undefined;
            const grouped = prevMsg && 
                            msg.senderId === prevMsg.senderId && 
                            !msg.parentId && 
                            !prevMsg.parentId && 
                            (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 5 * 60 * 1000);
            const dateStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const parentMsg = msg.parentId ? messages.find(m => m.id === msg.parentId) : null;
            const isPinned = pinnedMessageIds.has(msg.id);

            return (
              <div 
                key={msg.id} 
                className={`group flex text-xs text-left relative hover:bg-[var(--text-primary)]/5 px-3 py-2 rounded-xl transition-all ${
                  grouped ? "pl-14 pt-0.5 pb-0.5 mt-0.5" : "gap-3.5 mt-2"
                } ${isPinned ? "bg-[var(--leap-brand-soft)] border border-[var(--leap-brand)]/20" : ""}`}
              >
                {!grouped ? (
                  <>
                    <img
                      src={msg.senderPfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`}
                      alt={msg.senderName}
                      className="h-8.5 w-8.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] shrink-0"
                    />

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">{msg.senderName}</span>
                        {msg.senderRole && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase ${
                            msg.senderRole === "admin" 
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                              : msg.senderRole === "mentor" 
                              ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20" 
                              : "bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                          }`}>
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">{dateStr}</span>
                        
                        {isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] text-[var(--leap-brand)] bg-[var(--leap-brand)]/15 px-1 py-0.5 rounded font-mono font-bold border border-[var(--leap-brand)]/35 ml-1">
                            <MaterialIcon name="push_pin" className="text-[10px]" />
                            <span>PINNED</span>
                          </span>
                        )}
                      </div>

                      {parentMsg && (
                        <div className="pl-3 py-1 border-l-2 border-[var(--leap-brand)] text-[10px] text-[var(--text-secondary)] mb-1 flex items-center gap-1.5 opacity-80 select-none">
                          <MaterialIcon name="reply" className="text-xs shrink-0" />
                          <span className="font-bold">@{parentMsg.senderName}:</span>
                          <span className="truncate max-w-md">{parentMsg.text}</span>
                        </div>
                      )}

                      <p className="text-[var(--text-primary)] leading-relaxed font-sans">{parseMarkdown(msg.text)}</p>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {msg.attachments.map((att) => {
                            const isImage = att.fileType.startsWith("image/");
                            return (
                              <div 
                                key={att.id} 
                                className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] flex items-center gap-3 max-w-sm shadow-md"
                              >
                                <MaterialIcon name={isImage ? "image" : "description"} className="text-2xl text-[var(--text-secondary)] shrink-0" />
                                <div className="truncate min-w-0">
                                  <span className="text-xs text-[var(--text-primary)] font-bold block truncate">{att.fileName}</span>
                                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">{(att.fileSize / 1024).toFixed(0)} KB</span>
                                </div>
                                <a
                                  href={att.secureUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-[#D4AF37] hover:underline shrink-0 block ml-auto"
                                >
                                  Open
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {msg.reactions.map((react) => (
                            <button
                              key={react.id}
                              onClick={() => handleToggleReaction(msg.id, react.emoji)}
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[#D4AF37]/15 hover:border-[#D4AF37]/50 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <MaterialIcon name={react.emoji} className="text-xs text-[#D4AF37]" />
                              <span className="text-[9px] text-[#D4AF37]">1</span>
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </>
                ) : (
                  <>
                    {/* Grouped message (no avatar, small hover timestamp on the left) */}
                    <span className="absolute left-2.5 top-2 text-[8px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 font-mono w-8 text-right select-none transition-opacity">
                      {dateStr}
                    </span>

                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-[var(--text-primary)] leading-relaxed font-sans">{parseMarkdown(msg.text)}</p>

                      {/* Grouped attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {msg.attachments.map((att) => {
                            const isImage = att.fileType.startsWith("image/");
                            return (
                              <div 
                                key={att.id} 
                                className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] flex items-center gap-3 max-w-sm shadow-md"
                              >
                                <MaterialIcon name={isImage ? "image" : "description"} className="text-2xl text-[var(--text-secondary)] shrink-0" />
                                <div className="truncate min-w-0">
                                  <span className="text-xs text-[var(--text-primary)] font-bold block truncate">{att.fileName}</span>
                                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">{(att.fileSize / 1024).toFixed(0)} KB</span>
                                </div>
                                <a
                                  href={att.secureUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-[#D4AF37] hover:underline shrink-0 block ml-auto"
                                >
                                  Open
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Grouped reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {msg.reactions.map((react) => (
                            <button
                              key={react.id}
                              onClick={() => handleToggleReaction(msg.id, react.emoji)}
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[#D4AF37]/15 hover:border-[#D4AF37]/50 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <MaterialIcon name={react.emoji} className="text-xs text-[#D4AF37]" />
                              <span className="text-[9px] text-[#D4AF37]">1</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Quick actions popup on Hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute right-4 top-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-1 shadow-lg flex items-center gap-1 transition-all z-20">
                  {[
                    { name: "thumb_up", title: "Like" },
                    { name: "favorite", title: "Favorite" },
                    { name: "star", title: "Star" },
                    { name: "verified", title: "Verify" },
                    { name: "task_alt", title: "Complete" },
                    { name: "bookmark", title: "Bookmark" },
                    { name: "flag", title: "Flag" },
                    { name: "workspace_premium", title: "Premium" },
                    { name: "campaign", title: "Announcement" },
                    { name: "priority_high", title: "Alert" }
                  ].map((action) => (
                    <button
                      key={action.name}
                      onClick={() => handleToggleReaction(msg.id, action.name)}
                      className="p-1 hover:bg-[var(--text-primary)]/5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
                      title={action.title}
                    >
                      <MaterialIcon name={action.name} className="text-sm" />
                    </button>
                  ))}
                  
                  {/* Pin action toggle */}
                  <button
                    onClick={() => handleTogglePin(msg.id)}
                    className={`p-1 hover:bg-[var(--text-primary)]/5 rounded cursor-pointer flex items-center justify-center border-l border-[var(--border-color)] pl-1.5 ${
                      isPinned ? "text-[#D4AF37]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                    title={isPinned ? "Unpin message" : "Pin message"}
                  >
                    <MaterialIcon name="push_pin" className="text-sm" />
                  </button>

                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:bg-[var(--text-primary)]/5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center border-l border-[var(--border-color)] pl-1.5 ml-0.5"
                    title="Reply thread"
                  >
                    <MaterialIcon name="reply" className="text-sm" />
                  </button>
                </div>

              </div>
            );
          })}
          {filteredMessages.length === 0 && (
            <div className="h-full flex items-center justify-center italic text-[var(--text-secondary)]">
              No conversations logged in this channel yet. Send a message to start!
            </div>
          )}
        </div>

        {/* Reply Indicator Panel */}
        {replyingTo && (
          <div className="px-5 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Replying to <strong>@{replyingTo.senderName}</strong></span>
            <button onClick={() => setReplyingTo(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center">
              <MaterialIcon name="close" className="text-base" />
            </button>
          </div>
        )}

        {/* Input box footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)] shrink-0">
          <form onSubmit={handleMessageSubmit} className="space-y-3">
            
            {/* Attachment preview if exists */}
            {attachedFile && (
              <div className="p-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl max-w-sm flex items-center justify-between text-xs text-[var(--text-primary)]">
                <span className="truncate pr-4 font-mono">{attachedFile.name}</span>
                <button 
                  type="button" 
                  onClick={() => setAttachedFile(null)} 
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
                >
                  <MaterialIcon name="close" className="text-base" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* File Attachment Button */}
              <label className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:border-[var(--text-primary)] transition-colors">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <MaterialIcon name="attach_file" className="text-base" />
              </label>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={activeChannel ? `Message #${activeChannel.name}...` : activeDmUser ? `Message @${activeDmUser.name}...` : "Choose channel"}
                className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs px-4 py-2.5 rounded-xl outline-none text-[var(--text-primary)] focus:border-[#D4AF37]"
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!inputText.trim() && !attachedFile}
                className="h-10 w-10 p-0 rounded-xl"
                icon="send"
              />
            </div>

            {/* Typing indicators and details */}
            <div className="h-4 text-[10px] text-[var(--text-secondary)] font-medium px-1 flex justify-between items-center select-none">
              <span>
                {Object.keys(typingUsers).length > 0 && (
                  <span className="italic text-[var(--text-secondary)]">
                    {Object.keys(typingUsers).join(", ")} {Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...
                  </span>
                )}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#D4AF37]">
                Commands: /help, /stats, /attendance, /ping
              </span>
            </div>

          </form>
        </div>

      </div>

      {/* 3.5 COLUMN: Pinned Messages Drawer */}
      {isPinnedDrawerOpen && (
        <div className="w-80 bg-[var(--bg-elevated)] border-l border-[var(--border-color)] overflow-y-auto no-scrollbar shrink-0 p-4 text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <MaterialIcon name="push_pin" className="text-base text-[var(--leap-brand)]" />
                <span>Pinned Messages</span>
              </span>
              <button
                onClick={() => setIsPinnedDrawerOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <MaterialIcon name="close" className="text-lg" />
              </button>
            </div>
            
            <div className="space-y-4">
              {messages.filter(m => pinnedMessageIds.has(m.id)).length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)] italic text-center py-12">
                  No pinned messages in this channel.
                </div>
              ) : (
                messages.filter(m => pinnedMessageIds.has(m.id)).map(msg => (
                  <div key={msg.id} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs relative">
                    <div className="flex items-center gap-2">
                      <img
                        src={msg.senderPfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`}
                        alt={msg.senderName}
                        className="h-6 w-6 rounded bg-[var(--bg-page)] border border-[var(--border-color)]"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[var(--text-primary)] block truncate">{msg.senderName}</span>
                      </div>
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className="text-rose-500 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title="Unpin message"
                      >
                        <MaterialIcon name="close" className="text-sm" />
                      </button>
                    </div>
                    <p className="text-[var(--text-primary)] leading-normal font-sans break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4th COLUMN: Roster list column */}
      <div className="w-60 bg-[var(--bg-elevated)] border-l border-[var(--border-color)] overflow-y-auto no-scrollbar shrink-0 p-4 text-left hidden lg:block">
        <h4 className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-4 flex items-center gap-1.5">
          <MaterialIcon name="monitoring" className="text-base text-[#10B981]" />
          <span>Active presence</span>
        </h4>

        <div className="space-y-4">
          
          {/* MENTORS */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider px-1">
              Mentors — {mentors.length}
            </span>
            <div className="space-y-1">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center gap-2.5 py-1 px-1 text-xs">
                  <div className="relative shrink-0">
                    <img src={mentor.pfpUrl} alt={mentor.name} className="h-6 w-6 rounded bg-[var(--bg-page)]" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-[#10B981]"></span>
                  </div>
                  <span className="text-[var(--text-primary)] font-semibold truncate" title={mentor.name}>{mentor.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ADMINISTRATORS */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider px-1">
              Administrators — {admins.length}
            </span>
            <div className="space-y-1">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-2.5 py-1 px-1 text-xs">
                  <div className="relative shrink-0">
                    <img src={admin.pfpUrl} alt={admin.name} className="h-6 w-6 rounded bg-[var(--bg-page)]" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-[#10B981]"></span>
                  </div>
                  <span className="text-[var(--text-primary)] font-semibold truncate" title={admin.name}>{admin.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STUDENTS */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider px-1">
              Students — {students.length}
            </span>
            <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
              {students.map((std) => {
                const isOnline = onlineUserIds.has(std.id);
                return (
                  <div key={std.id} className="flex items-center gap-2.5 py-1 px-1 text-xs">
                    <div className="relative shrink-0">
                      <img src={std.pfpUrl} alt={std.name} className="h-6 w-6 rounded bg-[var(--bg-page)]" />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--bg-page)] ${
                        isOnline ? "bg-[#10B981]" : "bg-gray-500"
                      }`}></span>
                    </div>
                    <span className="text-[var(--text-secondary)] truncate" title={std.name}>{std.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
