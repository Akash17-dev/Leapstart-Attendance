/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { MaterialIcon, Avatar, Badge } from "./DesignSystem";

interface SidebarProps {
  user: UserProfile;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  socketConnected?: boolean;
}

const LOGO_DARK = "https://leapstart.in/icons/logo.webp";
const LOGO_LIGHT = "https://leapstart.in/icons/logo-whitee.webp";

export default function Sidebar({
  user,
  currentTab,
  setCurrentTab,
  onLogout,
  theme,
  onToggleTheme,
  socketConnected = false
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Render tabs based on user role-based permissions
  const renderNavItems = () => {
    if (user.role === "student") {
      return [
        { id: "checkin", label: "Daily Check-In", icon: "timer" },
        { id: "analytics", label: "Analytics Trend", icon: "analytics" },
        { id: "leaves", label: "Leave Requests", icon: "event_busy" },
        { id: "projects-showcase", label: "Portfolios", icon: "menu_book" },
        { id: "incubation-hub", label: "Incubation Hub", icon: "rocket_launch" },
        { id: "private-chat", label: "Chat Server", icon: "forum", badge: true },
        { id: "profile-settings", label: "My Profile", icon: "person" }
      ];
    } else if (user.role === "mentor") {
      return [
        { id: "student-roster", label: "Cohort Roster", icon: "group" },
        { id: "staff-logs", label: "Lesson Check-In", icon: "timer" },
        { id: "mentor-leaves", label: "Leave Approvals", icon: "event_note" },
        { id: "projects-showcase", label: "Portfolios", icon: "menu_book" },
        { id: "incubation-hub", label: "Incubation Hub", icon: "rocket_launch" },
        { id: "mentor-profiles", label: "Student Profiles", icon: "contact_page" }
      ];
    } else {
      // admin / HR
      return [
        { id: "admin-metrics", label: "Analytics metrics", icon: "monitoring" },
        { id: "admin-students", label: "Roster Manager", icon: "manage_accounts" },
        { id: "admin-leaves", label: "Leaves Desk", icon: "event_busy" },
        { id: "projects-showcase", label: "Portfolios", icon: "menu_book" },
        { id: "incubation-hub", label: "Incubation Hub", icon: "rocket_launch" },
        { id: "admin-security", label: "Security Auditing", icon: "gavel" }
      ];
    }
  };

  const navItems = renderNavItems();

  return (
    <>
      {/* CASE A: DESKTOP SIDEBAR (Collapsible, Theme-Aware) */}
      <aside className={`no-scrollbar hidden md:flex h-screen shrink-0 flex-col bg-[var(--bg-surface)] border-r border-[var(--border-color)] text-[var(--text-secondary)] font-sans transition-all duration-300 relative z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}>
        
        {/* Arc Browser Header Workspace Switcher */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-[var(--border-color)] shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <img
                src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
                alt="LeapStart Logo"
                className="h-6 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img
                src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
                alt="LeapStart Logo"
                className="h-6 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 hover:bg-[var(--text-primary)]/5 rounded-lg cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MaterialIcon name={collapsed ? "menu_open" : "menu"} className="text-lg" />
          </button>
        </div>

        {/* Workspace select dropdown */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-page)]/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <MaterialIcon name="workspaces" className="text-sm text-[var(--leap-brand)]" />
              <span>Workspace</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              Cohort-2026
            </span>
          </div>
        )}

        {/* User Card */}
        <div className="px-4 py-4 border-b border-[var(--border-color)] bg-[var(--bg-page)]/10">
          <div className={`flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 shadow-lg ${collapsed ? "justify-center" : ""}`}>
            <Avatar src={user.pfpUrl} name={user.name} size="sm" status={socketConnected ? "online" : "offline"} />
            {!collapsed && (
              <div className="truncate min-w-0 text-left">
                <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate">
                  {user.name}
                </h4>
                <span className="text-[9px] text-[var(--text-secondary)] capitalize truncate block mt-0.5 font-mono">
                  {user.specialty || user.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold tracking-wide cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--text-primary)]/5 text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)]"
                } ${collapsed ? "justify-center" : ""}`}
                title={item.label}
              >
                <div className="flex items-center gap-3.5">
                  <MaterialIcon name={item.icon} className={`text-base ${isActive ? "text-[var(--leap-brand)]" : "text-[var(--text-secondary)]"}`} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                
                {/* Notification unread Badge dot */}
                {item.badge && !isActive && (
                  <span className="h-2 w-2 rounded-full bg-[var(--leap-brand)] shadow-[0_0_8px_var(--leap-brand)] animate-pulse shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 space-y-2 border-t border-[var(--border-color)] bg-[var(--bg-page)]/10 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex w-full items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-secondary)] cursor-pointer hover:border-[#D4AF37]/30 hover:text-[var(--text-primary)] transition-all ${collapsed ? "justify-center" : ""}`}
            title="Switch Theme"
          >
            <MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-base" />
            {!collapsed && <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>}
          </button>
          
          <button
            id="btn-sidebar-logout"
            onClick={onLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-500 cursor-pointer hover:bg-rose-500/10 transition-colors ${collapsed ? "justify-center" : ""}`}
            title="Leave Workspace"
          >
            <MaterialIcon name="logout" className="text-base text-rose-500" />
            {!collapsed && <span>Leave workspace</span>}
          </button>
        </div>
      </aside>

      {/* CASE B: MOBILE NAVIGATION BAR (Sticky Bottom Layout) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-surface)] border-t border-[var(--border-color)] z-40 flex items-center justify-around px-4">
        {navItems.slice(0, 5).map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 text-[9px] font-bold gap-1 cursor-pointer transition-colors ${
                isActive ? "text-[var(--leap-brand)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <MaterialIcon name={item.icon} className="text-base" />
              <span className="truncate max-w-[50px]">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center py-2 text-[9px] font-bold gap-1 cursor-pointer text-rose-500"
        >
          <MaterialIcon name="logout" className="text-base text-rose-500" />
          <span>Leave</span>
        </button>
      </div>
    </>
  );
}
