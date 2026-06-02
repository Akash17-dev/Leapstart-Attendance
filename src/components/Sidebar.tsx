/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  CalendarDays,
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
  BookOpen
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
        { id: "private-chat", label: "Messages", icon: MessageSquareDiff }
      ];
    } else if (user.role === "mentor") {
      return [
        { id: "student-roster", label: "Class roster", icon: CustomGridIcon },
        { id: "staff-logs", label: "Mentor check-in", icon: Clock },
        { id: "mentor-leaves", label: "Leave approvals", icon: CalendarDays },
        { id: "projects-showcase", label: "Projects", icon: BookOpen },
        { id: "mentor-profiles", label: "Student profiles", icon: Users }
      ];
    } else {
      // admin / HR
      return [
        { id: "admin-metrics", label: "Executive Analytics", icon: LineChart },
        { id: "admin-students", label: "People Directory", icon: Users },
        { id: "admin-leaves", label: "Leave Board", icon: CalendarDays },
        { id: "projects-showcase", label: "Projects", icon: BookOpen },
        { id: "admin-security", label: "Access Audit", icon: ShieldCheck }
      ];
    }
  };

  const navItems = renderNavItems();
  const logoSrc = theme === "dark" ? "https://leapstart.in/icons/logo-whitee.webp" : "https://leapstart.in/icons/logo.webp";

  return (
    <aside className="no-scrollbar flex h-screen w-64 shrink-0 flex-col border-r border-[#e6e8ee] bg-white dark:border-zinc-800 dark:bg-[#111113] transition-colors duration-300">
      {/* Brand logo container */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-[#e6e8ee] dark:border-zinc-800">
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
      <div className="px-3 py-4 border-b border-[#e6e8ee] dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-xl border border-[#e6e8ee] bg-[#f7f8fa] p-3 dark:border-zinc-800 dark:bg-[#0a0a0b]">
          <img
            src={user.pfpUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-lg bg-orange-100 border border-orange-500/10 shrink-0"
          />
          <div className="truncate min-w-0">
            <h4 className="font-sans font-semibold text-xs text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
              <span>{user.name}</span>
            </h4>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 capitalize truncate block mt-0.5 max-w-fit">
              {user.specialty || user.role}
            </span>
          </div>
        </div>

        {/* LinkedIn direct redirect shortcut badge */}
        <a
          href={user.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg border border-[#e6e8ee] bg-white py-1.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-colors cursor-pointer dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-400 dark:hover:text-zinc-100"
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
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer tracking-normal transition-colors ${
                isActive
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "" : "text-zinc-400 dark:text-zinc-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer controls: logout */}
      <div className="p-3 space-y-2 border-t border-[#e6e8ee] dark:border-zinc-800">
        <button
          type="button"
          onClick={onToggleTheme}
          className="leap-brand-focus flex w-full items-center gap-3 rounded-lg border border-[#e6e8ee] bg-white px-3 py-2.5 text-sm font-medium text-zinc-600 cursor-pointer hover:border-zinc-300 hover:text-zinc-950 transition-colors dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          <span>{theme === "dark" ? "Switch to Light" : "Switch to Dark"}</span>
        </button>
        {/* LOGOUT BUTTON */}
        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 cursor-pointer hover:bg-rose-50 transition-colors dark:hover:bg-rose-950/20"
        >
          <LogOut className="h-4.5 w-4.5 text-rose-500" />
          <span>Exit Portal</span>
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
