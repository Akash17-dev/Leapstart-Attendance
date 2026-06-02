/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import StudentDashboard from "./components/StudentDashboard";
import MentorDashboard from "./components/MentorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ChatbotWidget from "./components/ChatbotWidget";
import ProjectShowcase from "./components/ProjectShowcase";
import { UserProfile } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("login");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("leap_theme") === "dark" ? "dark" : "light";
  });
  const darkEnabled = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkEnabled);
    localStorage.setItem("leap_theme", theme);
  }, [darkEnabled, theme]);

  // Persist session if user wishes to refresh
  useEffect(() => {
    const cachedUser = localStorage.getItem("leap_user");
    const cachedToken = localStorage.getItem("leap_token");
    if (cachedUser && cachedToken) {
      try {
        const parsed = JSON.parse(cachedUser);
        setCurrentUser(parsed);
        setAuthToken(cachedToken);
        // Default appropriate starter tab based on role
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

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("leap_user", JSON.stringify(user));
    localStorage.setItem("leap_token", token);

    // Default tab based on role
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
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  // Human descriptive screen name mapper passed dynamically to Gemini Chatbot widget context
  const getScreenDisplayName = () => {
    if (!currentUser) return "Sign in";

    const descriptiveMaps: Record<string, string> = {
      "checkin": "Daily check-in",
      "analytics": "Attendance",
      "leaves": "Leave requests",
      "projects-showcase": "Projects",
      "private-chat": "Messages",
      "student-roster": "Class roster",
      "staff-logs": "Mentor check-in",
      "mentor-leaves": "Leave approvals",
      "mentor-profiles": "Student profiles",
      "admin-metrics": "Executive analytics",
      "admin-students": "People directory",
      "admin-leaves": "Leave board",
      "admin-security": "Access audit"
    };

    return descriptiveMaps[currentTab] || "Dashboard";
  };

  return (
    <div className="min-h-screen font-sans">
      {/* CASE A: USER NOT SIGNED IN */}
      {!currentUser ? (
        <div className="relative">
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Persistent Chatbot on login page */}
          <ChatbotWidget currentScreen="Sign in" activeUser={null} />
        </div>
      ) : (
        /* CASE B: COHESIVE SYSTEM DASHBOARD */
        <div className="flex h-screen overflow-hidden bg-[var(--leap-page)] text-[#1d1d1f] transition-colors duration-300 dark:bg-black dark:text-[#f5f5f7]">
          {/* Persistent Navigation sidebar */}
          <Sidebar
            user={currentUser}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Routing Center */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Top Minimal Action header bar */}
            <header className="mx-4 mt-4 h-14 shrink-0 rounded-2xl border border-[var(--leap-border)] bg-[var(--leap-elevated)] px-5 flex items-center justify-between shadow-[var(--leap-shadow)] backdrop-blur-2xl">
              <span className="text-xs font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">
                {getScreenDisplayName()} · {currentUser.role}
              </span>
              <div className="flex items-center gap-3 text-xs font-medium text-[#6e6e73] dark:text-[#a1a1a6]">
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-[#34c759] shadow-[0_0_0_3px_rgba(52,199,89,0.14)]"></span>
                  <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="leap-brand-focus apple-secondary px-3 py-1.5 text-xs font-semibold transition hover:border-[#007aff]/40"
                >
                  {darkEnabled ? "Light" : "Dark"}
                </button>
              </div>
            </header>

            {/* Core screen content container */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {currentTab === "projects-showcase" ? (
                <ProjectShowcase user={currentUser} />
              ) : (
                <>
                  {currentUser.role === "student" && (
                    <StudentDashboard user={currentUser} currentTab={currentTab} />
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

            {/* Persistent Dynamic Chatbot passing current screen details for context-aware Gemini replies */}
            <ChatbotWidget currentScreen={getScreenDisplayName()} activeUser={currentUser} />
          </main>
        </div>
      )}
    </div>
  );
}
