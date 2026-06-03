/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import StudentDashboard from "./components/StudentDashboard";
import MentorDashboard from "./components/MentorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ChatbotWidget from "./components/ChatbotWidget";
import ProjectShowcase from "./components/ProjectShowcase";
import IncubationHub from "./components/IncubationHub";
import { UserProfile, Notification } from "./types";
import { MaterialIcon, Avatar, Badge, Portal, Button } from "./components/DesignSystem";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("login");
  
  // Theme settings: "light" | "dark" | "system"
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">((() => {
    if (typeof window === "undefined") return "system";
    const cached = localStorage.getItem("leap_theme_mode");
    return (cached as any) || "system";
  }));

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Socket and presence V3 states
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Listen to themeMode change and system preference changes
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      let activeTheme: "light" | "dark" = "dark";
      if (themeMode === "system") {
        activeTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        activeTheme = themeMode;
      }
      setResolvedTheme(activeTheme);
      root.classList.toggle("dark", activeTheme === "dark");
      localStorage.setItem("leap_theme_mode", themeMode);
    };

    updateTheme();

    if (themeMode === "system") {
      mediaQuery.addEventListener("change", updateTheme);
    }
    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, [themeMode]);

  // Persist session
  useEffect(() => {
    const cachedUser = localStorage.getItem("leap_user");
    const cachedToken = localStorage.getItem("leap_token");
    if (cachedUser && cachedToken) {
      try {
        const parsed = JSON.parse(cachedUser);
        setCurrentUser(parsed);
        setAuthToken(cachedToken);
        
        if (parsed.role === "student") {
          setCurrentTab("checkin");
        } else if (parsed.role === "mentor") {
          setCurrentTab("student-roster");
        } else {
          setCurrentTab("admin-metrics");
        }
      } catch (err) {
        localStorage.removeItem("leap_user");
        localStorage.removeItem("leap_token");
      }
    }
  }, []);

  // Socket.IO lifecycle
  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      return;
    }

    const socket = io(window.location.origin, {
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("register", currentUser.id);
      fetchNotifications();
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("notification", (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    socket.on("status-change", (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === "online") {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    // Request active online users upon connect
    fetch("/api/users")
      .then((res) => res.json())
      .then(() => {
        // Mock socket presence
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add("suhas");
          next.add("saikrishna");
          next.add("yuktha");
          return next;
        });
      });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { "x-user-id": currentUser.id }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "x-user-id": currentUser.id }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("leap_user", JSON.stringify(user));
    localStorage.setItem("leap_token", token);

    if (user.role === "student") {
      setCurrentTab("checkin");
    } else if (user.role === "mentor") {
      setCurrentTab("student-roster");
    } else {
      setCurrentTab("admin-metrics");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentTab("login");
    localStorage.removeItem("leap_user");
    localStorage.removeItem("leap_token");
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : prev === "light" ? "system" : "dark"));
  };

  const handleUserUpdated = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("leap_user", JSON.stringify(user));
  };

  const getScreenDisplayName = () => {
    if (!currentUser) return "Sign in";

    const descriptiveMaps: Record<string, string> = {
      "checkin": "Daily check-in",
      "analytics": "Attendance metrics",
      "leaves": "Leave requests",
      "projects-showcase": "Projects showcase",
      "incubation-hub": "Incubation hub",
      "private-chat": "Discord channels",
      "profile-settings": "Profile settings",
      "student-roster": "Class roster",
      "staff-logs": "Mentor check-in",
      "mentor-leaves": "Leave approvals",
      "mentor-profiles": "Student profiles",
      "admin-metrics": "Executive dashboard",
      "admin-students": "People directory",
      "admin-leaves": "Leave board",
      "admin-security": "Access audits"
    };

    return descriptiveMaps[currentTab] || "Dashboard";
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
      
      {/* CASE A: USER NOT SIGNED IN */}
      {!currentUser ? (
        <div className="relative">
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            theme={resolvedTheme}
            onToggleTheme={toggleTheme}
          />
          <ChatbotWidget currentScreen="Sign in" activeUser={null} />
        </div>
      ) : (
        /* CASE B: COHESIVE SYSTEM DASHBOARD */
        <div className="flex h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
          
          {/* Collapsible Sidebar */}
          <Sidebar
            user={currentUser}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onLogout={handleLogout}
            theme={resolvedTheme}
            onToggleTheme={toggleTheme}
            socketConnected={socketConnected}
          />

          {/* Router main container */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* Minimal SaaS Header bar */}
            <header className="mx-6 mt-6 h-16 shrink-0 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-xl px-6 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {getScreenDisplayName()}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--border-color)]"></span>
                <Badge variant="brand">{currentUser.role} portal</Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
                {/* Live server indicator */}
                <div className="hidden items-center gap-2 sm:flex">
                  <span className={`h-2 w-2 rounded-full ${socketConnected ? "bg-[#10B981] animate-pulse" : "bg-rose-500"}`}></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">{socketConnected ? "live link" : "connecting"}</span>
                </div>

                <span className="hidden sm:inline text-[var(--border-color)]">|</span>

                {/* Notification Hub Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[#D4AF37]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-colors relative flex items-center justify-center cursor-pointer"
                  >
                    <MaterialIcon name="notifications" className="text-lg" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Center sliding tray via Portal */}
                  {isNotifOpen && (
                    <Portal>
                      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                        <div className="w-80 h-full border-l border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col justify-between text-left">
                          <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">System Alerts</span>
                            <button
                              onClick={() => setIsNotifOpen(false)}
                              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <MaterialIcon name="close" className="text-lg" />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto py-2 divide-y divide-[var(--border-color)]">
                            {notifications.length === 0 ? (
                              <div className="px-5 py-12 text-center text-xs text-[var(--text-secondary)] italic">No notifications logged.</div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => handleMarkNotifRead(n.id)}
                                  className={`px-5 py-3 transition-colors cursor-pointer ${
                                    !n.isRead ? "bg-[#D4AF37]/5 border-l-2 border-[#D4AF37]" : "hover:bg-[var(--text-primary)]/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[var(--text-primary)]">{n.title}</span>
                                    <span className="text-[8px] font-mono text-[var(--text-secondary)]">
                                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-normal">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                          {unreadNotifCount > 0 && (
                            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50">
                              <Button
                                onClick={handleMarkAllRead}
                                className="w-full text-xs"
                                variant="secondary"
                              >
                                Mark All as Read
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Portal>
                  )}
                </div>

                <span className="text-[var(--border-color)]">|</span>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[#D4AF37]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-colors flex items-center justify-center cursor-pointer"
                  title={`Active Theme Mode: ${themeMode}`}
                >
                  <MaterialIcon name={themeMode === "light" ? "light_mode" : themeMode === "dark" ? "dark_mode" : "hdr_auto"} className="text-lg" />
                </button>
              </div>
            </header>

            {/* Core screen content router */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {currentTab === "projects-showcase" ? (
                <ProjectShowcase user={currentUser} />
              ) : currentTab === "incubation-hub" ? (
                <IncubationHub user={currentUser} />
              ) : (
                <>
                  {currentUser.role === "student" && (
                    <StudentDashboard user={currentUser} currentTab={currentTab} onUserUpdated={handleUserUpdated} />
                  )}
                  {currentUser.role === "mentor" && (
                    <MentorDashboard user={currentUser} currentTab={currentTab} />
                  )}
                  {currentUser.role === "admin" && (
                    <AdminDashboard user={currentUser} currentTab={currentTab} />
                  )}
                </>
              )}
            </div>

            {/* Persistent chat widget passing screen variables */}
            <ChatbotWidget currentScreen={getScreenDisplayName()} activeUser={currentUser} />
          </main>
        </div>
      )}
    </div>
  );
}
