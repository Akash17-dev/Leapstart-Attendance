/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  CalendarDays,
  Rocket,
  FileCheck,
  MessageSquareDiff,
  Users,
  LineChart,
  LogOut,
  Sliders,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  ExternalLink,
  BookOpen,
  UserCog
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  user: UserProfile;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Sidebar({
  user,
  currentTab,
  setCurrentTab,
  onLogout,
  theme,
  onToggleTheme
}: SidebarProps) {
  // Render tabs based on user role-based permissions
  const renderNavItems = () => {
    if (user.role === "student") {
      return [
        { id: "checkin", label: "Daily check-in", icon: Clock },
        { id: "analytics", label: "Attendance", icon: LineChart },
        { id: "leaves", label: "Leave requests", icon: CalendarDays },
        { id: "projects-showcase", label: "Projects", icon: BookOpen },
        { id: "incubation-hub", label: "Incubation Hub", icon: Rocket },
        { id: "private-chat", label: "Messages", icon: MessageSquareDiff },
        { id: "profile-settings", label: "Profile", icon: UserCog }
      ];
    } else if (user.role === "mentor") {
      return [
        { id: "student-roster", label: "Class roster", icon: CustomGridIcon },
        { id: "staff-logs", label: "Mentor check-in", icon: Clock },
        { id: "mentor-leaves", label: "Leave approvals", icon: CalendarDays },
        { id: "projects-showcase", label: "Projects", icon: BookOpen },
        { id: "incubation-hub", label: "Incubation Hub", icon: Rocket },
        { id: "mentor-profiles", label: "Student profiles", icon: Users }
      ];
    } else {
      // admin / HR
      return [
        { id: "admin-metrics", label: "Executive Analytics", icon: LineChart },
        { id: "admin-students", label: "People Directory", icon: Users },
        { id: "admin-leaves", label: "Leave Board", icon: CalendarDays },
        { id: "projects-showcase", label: "Projects", icon: BookOpen },
        { id: "incubation-hub", label: "Incubation Hub", icon: Rocket },
        { id: "admin-security", label: "Access Audit", icon: ShieldCheck }
      ];
    }
  };

  const navItems = renderNavItems();
  const logoSrc = theme === "dark" ? "https://leapstart.in/icons/logo-whitee.webp" : "https://leapstart.in/icons/logo.webp";

  return (
    <aside className="no-scrollbar flex h-screen w-64 shrink-0 flex-col border-r border-[var(--leap-border)] bg-white/70 shadow-[12px_0_38px_rgba(0,0,0,0.05)] backdrop-blur-2xl dark:bg-[#1c1c1e]/72 dark:shadow-[12px_0_44px_rgba(0,0,0,0.36)] transition-colors duration-300">
      {/* Brand logo container */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-[var(--leap-border)]">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logoSrc}
            alt="LeapStart Logo"
            className="h-8 w-auto max-w-[120px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* User profile brief container */}
      <div className="px-3 py-4 border-b border-[var(--leap-border)]">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--leap-border)] bg-white/72 p-3 shadow-[0_10px_26px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:bg-white/8">
          <img
            src={user.pfpUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-xl bg-[#e8f2ff] border border-[#007aff]/10 shrink-0"
          />
          <div className="truncate min-w-0">
            <h4 className="font-sans font-semibold text-xs text-[#1d1d1f] dark:text-[#f5f5f7] truncate flex items-center gap-1">
              <span>{user.name}</span>
            </h4>
            <span className="text-[10px] font-medium text-[#6e6e73] dark:text-[#a1a1a6] capitalize truncate block mt-0.5 max-w-fit">
              {user.specialty || user.role}
            </span>
          </div>
        </div>

        {/* LinkedIn direct redirect shortcut badge */}
        <a
          href={user.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--leap-border)] bg-white/62 py-1.5 text-[10px] font-semibold text-[#6e6e73] hover:border-[#007aff]/30 hover:text-[#007aff] transition-colors cursor-pointer dark:bg-white/6 dark:text-[#a1a1a6]"
        >
          <span>LinkedIn profile</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Nav menus */}
      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer tracking-normal transition-all ${
                isActive
                  ? "bg-[#007aff] text-white shadow-[0_10px_24px_rgba(0,122,255,0.24)]"
                  : "text-[#6e6e73] hover:bg-white/70 hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:bg-white/8 dark:hover:text-[#f5f5f7]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "" : "text-[#8e8e93]"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer controls: logout */}
      <div className="p-3 space-y-2 border-t border-[var(--leap-border)]">
        <button
          type="button"
          onClick={onToggleTheme}
          className="leap-brand-focus apple-secondary flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold cursor-pointer hover:border-[#007aff]/30 hover:text-[#007aff]"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          <span>{theme === "dark" ? "Switch to Light" : "Switch to Dark"}</span>
        </button>
        {/* LOGOUT BUTTON */}
        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#ff3b30] cursor-pointer hover:bg-[#ff3b30]/8 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 text-rose-500" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

// Custom Grid Icon inline
function CustomGridIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
