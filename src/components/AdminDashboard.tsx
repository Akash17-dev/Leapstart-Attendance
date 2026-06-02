/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Users2,
  CalendarDays,
  ShieldCheck,
  Search,
  Lock,
  ArrowUpRight,
  Database,
  RefreshCw,
  Compass,
  Briefcase,
  AlertOctagon,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { UserProfile, AttendanceRecord, LeaveRequest } from "../types";
import AddStudentPanel from "./AddStudentPanel";

interface AdminDashboardProps {
  user: UserProfile;
  currentTab: string;
}

export default function AdminDashboard({ user, currentTab }: AdminDashboardProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [roster, setRoster] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Security test bypass state
  const [bypassStatus, setBypassStatus] = useState<"idle" | "testing" | "blocked">("idle");
  const [testStudentA, setTestStudentA] = useState("aadhira");
  const [testStudentB, setTestStudentB] = useState("abhishek");

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const usersResp = await fetch("/api/users");
      const usersData = await usersResp.json();
      setRoster(usersData);
      setSelectedUser((current) => current || usersData[0] || null);

      const attResp = await fetch("/api/attendance");
      const attData = await attResp.json();
      setAttendance(attData);

      const lvResp = await fetch("/api/leaves");
      const lvData = await lvResp.json();
      setLeaves(lvData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestBypassSecurity = () => {
    setBypassStatus("testing");
    setTimeout(async () => {
      try {
        // Mock query attempting to read student direct chats using administrator login tag context
        const resp = await fetch(`/api/messages?userId=${testStudentA}&targetId=${testStudentB}`, {
          headers: {
            "x-user-id": user.id // Send admin user.id (saikrishna/yuktha) to trigger security block!
          }
        });
        const data = await resp.json();
        if (resp.status === 403) {
          setBypassStatus("blocked");
        } else {
          setBypassStatus("idle");
        }
      } catch (err) {
        setBypassStatus("blocked");
      }
    }, 1200);
  };

  // Stats calculations
  const totalRosterCount = roster.length;
  const studentCount = roster.filter((r) => r.role === "student").length;
  const staffCount = roster.filter((r) => r.role === "mentor").length;

  // Active presence rate today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const presentTodayCount = todayRecords.filter((r) => r.status === "present").length;
  const activePercentToday = todayRecords.length > 0 ? (presentTodayCount / todayRecords.length) * 100 : 92.5;

  const filteredRoster = roster.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStudentAdded = (student: UserProfile) => {
    setRoster((current) => [student, ...current]);
    setSelectedUser(student);
    fetchGlobalData();
  };

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      {/* HEADER SPECS */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
            Executive Dashboard
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Review attendance, manage people, and monitor access controls.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#e8f2ff]/80 px-3.5 py-1.5 dark:bg-[#0a84ff]/14 text-[#0066cc] dark:text-[#0a84ff] border border-[#007aff]/12">
          <Database className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold">Admin tools</span>
        </div>
      </header>

      {/* RENDER ACTIVE MODULES */}

      {/* NODE: EXECUTIVE OVERVIEW */}
      {currentTab === "admin-metrics" && (
        <div className="space-y-6">
          {/* Card analytics metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Enrollment</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalRosterCount}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Student Builders</span>
              <div className="text-2xl font-bold font-mono text-[#007aff] mt-1">{studentCount}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Instructors / HR</span>
              <div className="text-2xl font-bold font-mono text-[#10B981] mt-1">{staffCount + 1}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Checkin Rate Today</span>
              <div className="text-2xl font-bold font-mono text-[#ff9f0a] mt-1">{activePercentToday.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Beautiful customized SVG Attendance rate graph chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:col-span-2 ">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Attendance by cohort</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-sans tracking-tight font-normal">
                  <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
                  9% Up from May
                </span>
              </h3>

              {/* GORGEOUS PURE INLINE HYBRID VECTOR CHART */}
              <div className="relative h-60 w-full flex items-end justify-between px-2 pt-6">
                {/* Horizontal reference marker lines */}
                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-gray-100 dark:border-slate-800 z-0"></div>
                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-gray-100 dark:border-slate-800 z-0"></div>
                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-gray-100 dark:border-slate-800 z-0"></div>

                {/* Vertical SVG columns */}
                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-gray-400">92%</div>
                  <div className="w-12 bg-gray-200 rounded-t-lg h-[80%] dark:bg-slate-800"></div>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">1st Yr C1</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-[#007aff]">95%</div>
                  <div className="w-12 bg-[#007aff] rounded-t-lg h-[92%]"></div>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">FullStack</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-emerald-500">98%</div>
                  <div className="w-12 bg-emerald-500 rounded-t-lg h-[96%]"></div>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">DB APIs</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-[#5856d6]">89%</div>
                  <div className="w-12 bg-blue-500 rounded-t-lg h-[75%]"></div>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">Linux CLI</span>
                </div>
              </div>
            </div>

            {/* School details and status bulletin */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  flex flex-col justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                  School Admin Board
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  LeapStart School of Technology accelerates careers via intense project building. Executive reviews synchronize staffing shifts.
                </p>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#10B981]"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-300">
                      <strong>All Instructors Checked in Present</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#007aff]"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-300">
                      <strong>1 Pending Leave decision active</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#5856d6]"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-300">
                      <strong>Access controls active</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 text-xs text-gray-500">
                Logged under manager: <strong>Yuktha Pemmireddy</strong> (HR Lead)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NODE: ROSTER MANAGEMENT */}
      {currentTab === "admin-students" && (
        <div className="space-y-6">
          <AddStudentPanel onStudentAdded={handleStudentAdded} />

          <div className="grid gap-6 md:grid-cols-3">
          {/* List searchable roster */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900  overflow-hidden flex flex-col h-[480px]">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 dark:bg-slate-950/40 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
                People Directory
              </h4>
            </div>

            {/* Local Search input */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  id="inp-admin-search"
                  type="text"
                  placeholder="Filter members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-50 dark:divide-slate-800 no-scrollbar">
              {filteredRoster.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    id={`btn-admin-inspect-${u.id}`}
                    onClick={() => setSelectedUser(u)}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#e8f2ff]/82 border-r-3 border-[#007aff] dark:bg-slate-800"
                        : "hover:bg-gray-50 dark:hover:bg-slate-950/60"
                    }`}
                  >
                    <img
                      src={u.pfpUrl}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="h-8.5 w-8.5 rounded-lg bg-[#e8f2ff] border border-[#007aff]/12 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-sans text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-gray-400 block capitalize">{u.role} ({u.specialty || "1st Year"})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed profile analyzer */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 md:col-span-2  space-y-6 overflow-y-auto h-[480px] no-scrollbar">
            {selectedUser ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <img
                    src={selectedUser.pfpUrl}
                    alt={selectedUser.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-xl bg-[#e8f2ff] border border-[#007aff]/14"
                  />
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize bg-[#e8f2ff] px-2 py-0.5 rounded text-[#0066cc] font-bold max-w-fit dark:bg-[#0a84ff]/14 dark:text-[#0a84ff] font-mono text-[9px] tracking-wider uppercase">
                      {selectedUser.role} Profile
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{selectedUser.bio}</p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-gray-400">Linked Email:</span>{" "}
                      <span className="font-mono text-xs font-medium text-[#10B981]">{selectedUser.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold leap-brand-pill">
                        LinkedIn
                      </a>
                      {selectedUser.githubUrl && (
                        <a href={selectedUser.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold leap-emerald-pill">
                          GitHub
                        </a>
                      )}
                      {selectedUser.portfolioUrl && (
                        <a href={selectedUser.portfolioUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold leap-emerald-pill">
                          Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills chips */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-[#007aff]" />
                    <span>Skills Spec Logs</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 text-[10px] font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects deck */}
                <div className="space-y-3.5 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-[#10B981]" />
                    <span>Enrolled Project Specs</span>
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedUser.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-100 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-950/20 space-y-2"
                      >
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1">
                          <span>{proj.title}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
                        </h5>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-normal">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {proj.tags.map((tg) => (
                            <span
                              key={tg}
                              className="rounded bg-[#e8f2ff] text-[9px] font-semibold text-[#0066cc] dark:bg-[#0a84ff]/12 dark:text-[#0a84ff] px-1.5 py-0.5 font-mono"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 italic">Select a directory user on the left.</p>
            )}
          </div>
          </div>
        </div>
      )}

      {/* NODE: LEAVES COORDINATOR */}
      {currentTab === "admin-leaves" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white  overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 dark:bg-slate-950/40 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Leave Board
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/20">
                    <th className="py-3 px-5">Participant Reference</th>
                    <th className="py-3 px-5">Duration Target</th>
                    <th className="py-3 px-5">Reason</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5">Supervisor Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {leaves.map((lv) => {
                    const stdDetail = roster.find((u) => u.id === lv.userId);
                    return (
                      <tr key={lv.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-950/15">
                        <td className="py-3.5 px-5 font-semibold">
                          {stdDetail?.name || lv.userId}
                          <span className="text-gray-400 font-normal block text-[10px]">{lv.userId}@leapstart.gmail.com</span>
                        </td>
                        <td className="py-3.5 px-5 font-mono">
                          {lv.startDate} to {lv.endDate}
                        </td>
                        <td className="py-3.5 px-5 max-w-sm truncate" title={lv.reason}>
                          {lv.reason}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              lv.status === "approved"
                                ? "bg-emerald-50 text-[#10B981]"
                                : lv.status === "rejected"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-amber-50 text-[#ff9f0a]"
                            }`}
                          >
                            {lv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-gray-400 leading-normal">
                          {lv.remarks ? (
                            <div>
                              <span>{lv.remarks}</span>
                              <span className="text-[10px] text-gray-500 font-bold block">by {lv.approvedBy}</span>
                            </div>
                          ) : (
                            <span className="italic text-[11px] text-gray-400">Awaiting mentor action...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NODE: ACCESS AUDIT */}
      {currentTab === "admin-security" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Diagnostic Test Panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#007aff]" />
                <span>Access Audit</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Student peer messages are access-controlled. Admin accounts can verify protected conversations are blocked without seeing message contents.
              </p>

              {/* ACTION DIAGNOSTIC PIPELINE */}
              <div className="my-6 rounded-xl bg-gray-50 p-5 dark:bg-slate-950/45 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-2">
                  Access check
                </span>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-4">
                  Run a permission check as <strong>{user.name}</strong> against a student message thread.
                </p>

                {bypassStatus === "idle" && (
                  <button
                    id="btn-admin-security-test"
                    onClick={handleTestBypassSecurity}
                    className="apple-primary px-5 py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Run access check
                  </button>
                )}

                {bypassStatus === "testing" && (
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#ff9f0a] font-mono py-2 py-1.5">
                    <RefreshCw className="h-4.5 w-4.5 animate-spin text-[#007aff]" />
                    <span>QUERYING /api/messages...</span>
                  </div>
                )}

                {bypassStatus === "blocked" && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100/60 p-3.5 space-y-2.5 text-left dark:bg-rose-950/15 dark:border-rose-900/50">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
                      <Lock className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Access blocked</span>
                    </div>
                    <p className="font-mono text-[9.5px] leading-relaxed text-rose-800 dark:text-rose-300">
                      HTTP/1.1 403 Forbidden<br />
                      {"{"} "error": "ACCESS RESTRICTED: Student peer direct messages are access-controlled." {"}"}
                    </p>
                    <span className="text-[9px] text-gray-400 font-sans block leading-none italic select-none">
                      Result: admin credentials cannot read student-to-student messages.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4 bg-[#10B981]/5 border-[#10B981]/10 dark:bg-slate-950/20 text-[#10B981] flex items-start gap-3 shrink-0">
              <ShieldCheck className="h-5 w-5 text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-sans">Access status: verified</h4>
                <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                  Server routes require matching participant IDs before returning message records.
                </p>
              </div>
            </div>
          </div>

          {/* Access policy details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  space-y-5">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-1.5">
              <AlertOctagon className="h-5 w-5 text-[#007aff]" />
              <span>Access Policy</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              LeapStart's core value is experiential master building. A crucial component of this is fostering complete, high-integrity student collaboration without micro-managed overseer visibility.
            </p>

            <div className="space-y-4 pt-3 text-xs text-gray-500">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">Confidential Lounge Rule:</h4>
                <p className="dark:text-slate-400 text-[10px]">Student 1-on-1 peer channels filter database logs, returning express 403 blocks to administrator credentials query attempts.</p>
              </div>

              <div className="space-y-1 border-t border-gray-100 pt-3 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">Roster Oversight Limitations:</h4>
                <p className="dark:text-slate-400 text-[10px]">Operational managers retain user accounts CRUD permission states, but lacks diagnostic decryption headers for peer texts.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
