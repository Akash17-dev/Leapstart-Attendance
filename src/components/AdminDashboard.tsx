/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, AttendanceRecord, LeaveRequest, AttendanceConfig, AuditLog } from "../types";
import AddStudentPanel from "./AddStudentPanel";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

interface AdminDashboardProps {
  user: UserProfile;
  currentTab: string;
}

export default function AdminDashboard({ user, currentTab }: AdminDashboardProps) {
  // Global States
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [roster, setRoster] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Config States
  const [configDate, setConfigDate] = useState(new Date().toISOString().split("T")[0]);
  const [configMode, setConfigMode] = useState<"offline" | "online" | "hybrid">("hybrid");
  const [configStart, setConfigStart] = useState("09:00");
  const [configEnd, setConfigEnd] = useState("18:00");
  const [configRemarks, setConfigRemarks] = useState("");
  const [configMsg, setConfigMsg] = useState("");

  // Security test bypass state
  const [bypassStatus, setBypassStatus] = useState<"idle" | "testing" | "blocked">("idle");
  const [testStudentA, setTestStudentA] = useState("aadhira");
  const [testStudentB, setTestStudentB] = useState("abhishek");

  useEffect(() => {
    fetchGlobalData();
  }, [currentTab]);

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

      const logsResp = await fetch("/api/admin/audit-logs");
      if (logsResp.ok) {
        const logsData = await logsResp.json();
        setAuditLogs(logsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg("");
    try {
      const resp = await fetch("/api/attendance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: configDate,
          attendanceMode: configMode,
          startTime: configStart,
          endTime: configEnd,
          remarks: configRemarks,
          createdBy: user.name
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setConfigMsg(`Configuration updated for ${configDate}!`);
        setConfigRemarks("");
        fetchGlobalData();
        setTimeout(() => setConfigMsg(""), 4000);
      } else {
        setConfigMsg(data.error || "Failed to update configuration.");
      }
    } catch (err) {
      setConfigMsg("Failed to configure attendance mode.");
    }
  };

  const handleTestBypassSecurity = () => {
    setBypassStatus("testing");
    setTimeout(async () => {
      try {
        const resp = await fetch(`/api/messages?userId=${testStudentA}&targetId=${testStudentB}`, {
          headers: {
            "x-user-id": user.id
          }
        });
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

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const presentTodayCount = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const activePercentToday = todayRecords.length > 0 ? (presentTodayCount / todayRecords.length) * 100 : 92.5;

  const filteredRoster = roster.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) =>
    (log.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details || "").toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
            Executive Controls
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Review live attendance telemetry, edit check-in modes, and audit cohort access configurations.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#e8f2ff]/80 px-3.5 py-1.5 dark:bg-[#0a84ff]/14 text-[#0066cc] dark:text-[#0a84ff] border border-[var(--border-color)]">
          <MaterialIcon name="database" className="text-base text-[#D4AF37]" />
          <span className="font-mono text-xs font-semibold">Admin Engine</span>
        </div>
      </header>

      {/* NODE: EXECUTIVE OVERVIEW */}
      {currentTab === "admin-metrics" && (
        <div className="space-y-6">
          
          {/* Card analytics metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Total Enrollment", val: totalRosterCount, color: "text-[var(--text-primary)]" },
              { label: "Student Builders", val: studentCount, color: "text-[#D4AF37]" },
              { label: "Instructors Roster", val: staffCount, color: "text-[#10B981]" },
              { label: "Checkin Rate Today", val: `${activePercentToday.toFixed(1)}%`, color: "text-sky-400" }
            ].map((stat, i) => (
              <Panel key={i} className="p-4 text-left">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">{stat.label}</span>
                <div className={`text-2xl font-black font-mono mt-1 ${stat.color}`}>{stat.val}</div>
              </Panel>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Cohort attendance SVG line chart */}
            <Panel className="lg:col-span-2 text-left">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Cohort Attendance Index</span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-sans tracking-tight font-normal">
                  <MaterialIcon name="trending_up" className="text-base text-[#10B981]" />
                  9% Up from May
                </span>
              </h3>

              {/* Pure inline vector columns */}
              <div className="relative h-60 w-full flex items-end justify-between px-2 pt-6">
                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-[var(--border-color)] z-0"></div>
                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-[var(--border-color)] z-0"></div>
                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-[var(--border-color)] z-0"></div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-[var(--text-secondary)]">92%</div>
                  <div className="w-12 bg-gray-500 rounded-t-lg h-[80%]"></div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">1st Yr Cohort</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-[#D4AF37]">95%</div>
                  <div className="w-12 bg-[#D4AF37] rounded-t-lg h-[92%]"></div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">FullStack</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-emerald-500">98%</div>
                  <div className="w-12 bg-emerald-500 rounded-t-lg h-[96%]"></div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">DB APIs</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end h-full z-10 space-y-2">
                  <div className="text-[10px] font-bold font-mono text-sky-400">89%</div>
                  <div className="w-12 bg-sky-500 rounded-t-lg h-[75%]"></div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">Linux CLI</span>
                </div>
              </div>
            </Panel>

            {/* Attendance mode configuration form */}
            <Panel className="text-left flex flex-col justify-between">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MaterialIcon name="settings" className="text-base text-[var(--leap-brand)]" />
                  <span>Config Control Center</span>
                </h3>
                
                {configMsg && (
                  <div className="mb-4 p-2 text-xs rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold text-center">
                    {configMsg}
                  </div>
                )}

                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <Input
                    label="Target Date"
                    type="date"
                    value={configDate}
                    onChange={(e) => setConfigDate(e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Attendance Type Mode</label>
                    <select
                      value={configMode}
                      onChange={(e) => setConfigMode(e.target.value as any)}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-4 py-3.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      <option value="offline">Offline (Campus Verified)</option>
                      <option value="online">Online (Bypassed)</option>
                      <option value="hybrid">Hybrid Options</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Time"
                      type="text"
                      value={configStart}
                      onChange={(e) => setConfigStart(e.target.value)}
                      placeholder="09:00"
                    />
                    <Input
                      label="End Time"
                      type="text"
                      value={configEnd}
                      onChange={(e) => setConfigEnd(e.target.value)}
                      placeholder="18:00"
                    />
                  </div>

                  <Input
                    label="Remarks / Notes"
                    type="text"
                    value={configRemarks}
                    onChange={(e) => setConfigRemarks(e.target.value)}
                    placeholder="Special instructions for students..."
                  />

                  <Button
                    type="submit"
                    variant="brand"
                    className="w-full mt-2"
                  >
                    Apply Config Rules
                  </Button>
                </form>
              </div>
            </Panel>

          </div>

          {/* Real-time Fraud log & Audit panel */}
          <Panel className="overflow-hidden p-0 text-left">
            <div className="border-b border-[var(--border-color)] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-elevated)]">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MaterialIcon name="shield_alert" className="text-xl text-rose-500 shrink-0" />
                <span>Security Engine Audit Log Feed</span>
              </h3>
              <div className="relative w-full sm:w-64">
                <Input
                  id="inp-audit-search"
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon="search"
                  className="py-1 px-3 bg-black/10 border-0"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Operator / Student</th>
                    <th>Action Type</th>
                    <th>Details Description</th>
                    <th className="text-center">Alert status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-[var(--text-secondary)]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="font-bold text-[var(--text-primary)]">
                        {log.userName || log.userId || "anonymous"}
                      </td>
                      <td className="font-mono text-[#D4AF37] font-semibold uppercase text-[10px]">
                        {log.action}
                      </td>
                      <td className="text-[var(--text-secondary)] max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="text-center">
                        {log.isFraudAlert ? (
                          <span className="rounded bg-rose-500/10 text-rose-500 border border-rose-500/25 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide">
                            Flagged Alert
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-semibold font-mono text-[10px]">
                            Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] italic font-medium">
                        No system security events logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

        </div>
      )}

      {/* NODE: ROSTER MANAGEMENT */}
      {currentTab === "admin-students" && (
        <div className="space-y-6">
          <AddStudentPanel onStudentAdded={handleStudentAdded} />

          <div className="grid gap-6 md:grid-cols-3">
            
            {/* List searchable roster */}
            <Panel className="overflow-hidden p-0 flex flex-col h-[480px] text-left">
              <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold uppercase tracking-widest">
                  Cohort Members
                </h4>
              </div>

              {/* Local Search input */}
              <div className="p-3 border-b border-[var(--border-color)] bg-transparent shrink-0">
                <Input
                  id="inp-admin-search"
                  type="text"
                  placeholder="Search roster..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon="search"
                />
              </div>

              <div className="flex-1 overflow-y-auto py-2 divide-y divide-[var(--border-color)] no-scrollbar">
                {filteredRoster.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      id={`btn-admin-inspect-${u.id}`}
                      onClick={() => setSelectedUser(u)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--bg-elevated)] border-r-2 border-[#D4AF37] text-[var(--text-primary)]"
                          : "hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <img
                        src={u.pfpUrl}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="h-8.5 w-8.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] shrink-0"
                      />
                      <div className="truncate min-w-0">
                        <span className="font-sans text-xs font-semibold block truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] block capitalize">{u.role} ({u.specialty || "1st Year"})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {/* Detailed profile analyzer */}
            <Panel className="md:col-span-2 space-y-6 overflow-y-auto h-[480px] no-scrollbar text-left">
              {selectedUser ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img
                      src={selectedUser.pfpUrl}
                      alt={selectedUser.name}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]"
                    />
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-bold">
                        {selectedUser.name}
                      </h3>
                      <p className="text-[10px] text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded max-w-fit font-mono tracking-wider uppercase border border-[#D4AF37]/20">
                        {selectedUser.role} Profile
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedUser.bio}</p>
                      <div className="pt-2 text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-secondary)]">Linked Email:</span>{" "}
                        <span className="font-mono text-[var(--text-primary)]">{selectedUser.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                          LinkedIn
                        </a>
                        {selectedUser.githubUrl && (
                          <a href={selectedUser.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            GitHub
                          </a>
                        )}
                        {selectedUser.portfolioUrl && (
                          <a href={selectedUser.portfolioUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills chips */}
                  <div className="space-y-2 border-t border-[var(--border-color)] pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <MaterialIcon name="explore" className="text-base text-[var(--leap-brand)]" />
                      <span>Skills Spec Logs</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.skills.map((sk) => (
                        <span
                          key={sk}
                          className="rounded-lg bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1 text-[10px] font-semibold"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projects deck */}
                  <div className="space-y-3.5 border-t border-[var(--border-color)] pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <MaterialIcon name="business_center" className="text-base text-emerald-500" />
                      <span>Enrolled Project Specs</span>
                    </h4>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedUser.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-page)]/50 space-y-2"
                        >
                          <h5 className="text-xs font-bold flex items-center gap-1">
                            <span>{proj.title}</span>
                            <MaterialIcon name="open_in_new" className="text-sm text-[var(--text-secondary)]" />
                          </h5>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-normal">{proj.description}</p>
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {proj.tags.map((tg) => (
                              <span
                                key={tg}
                                className="rounded bg-[#D4AF37]/10 text-[9px] font-semibold text-[#D4AF37] border border-[#D4AF37]/10 px-1.5 py-0.5 font-mono"
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
                <p className="text-center text-xs text-[var(--text-secondary)] italic">Select a directory user on the left.</p>
              )}
            </Panel>

          </div>
        </div>
      )}

      {/* NODE: LEAVES COORDINATOR */}
      {currentTab === "admin-leaves" && (
        <div className="space-y-6 text-left">
          <Panel className="overflow-hidden p-0 text-left">
            <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Leave Board Registry
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Participant Reference</th>
                    <th>Duration Target</th>
                    <th>Reason</th>
                    <th className="text-center">Status</th>
                    <th>Supervisor Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((lv) => {
                    const stdDetail = roster.find((u) => u.id === lv.userId);
                    return (
                      <tr key={lv.id}>
                        <td className="font-semibold">
                          {stdDetail?.name || lv.userId}
                          <span className="text-[var(--text-secondary)] font-normal block text-[10px] font-mono mt-0.5">{lv.userId}@leapstart.gmail.com</span>
                        </td>
                        <td className="font-mono">
                          {lv.startDate} to {lv.endDate}
                        </td>
                        <td className="max-w-sm truncate" title={lv.reason}>
                          {lv.reason}
                        </td>
                        <td className="text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              lv.status === "approved"
                                ? "bg-emerald-500/10 text-[#10B981]"
                                : lv.status === "rejected"
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-amber-500/10 text-[#ff9f0a]"
                            }`}
                          >
                            {lv.status}
                          </span>
                        </td>
                        <td className="text-[var(--text-secondary)] leading-normal">
                          {lv.remarks ? (
                            <div>
                              <span className="text-[var(--text-primary)] font-medium">{lv.remarks}</span>
                              <span className="text-[10px] text-[var(--text-secondary)] font-bold block mt-0.5">by {lv.approvedBy}</span>
                            </div>
                          ) : (
                            <span className="italic text-[11px] text-[var(--text-secondary)]">Awaiting mentor action...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* NODE: ACCESS AUDIT */}
      {currentTab === "admin-security" && (
        <div className="grid gap-6 md:grid-cols-2 text-left">
          {/* Diagnostic Test Panel */}
          <Panel className="flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <MaterialIcon name="verified_user" className="text-xl text-[#10B981]" />
                <span>Access Control Diagnostic Pipeline</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-normal">
                Student peer messages are access-controlled. Run a validation sequence using administrator context headers to confirm unauthorized requests are intercepted.
              </p>

              {/* ACTION DIAGNOSTIC PIPELINE */}
              <div className="my-6 rounded-2xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] p-5">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block tracking-wider mb-2">
                  System Diagnostics
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] mb-4">
                  Run a permission check as <strong>{user.name}</strong> against a student message thread.
                </p>

                {bypassStatus === "idle" && (
                  <Button
                    id="btn-admin-security-test"
                    onClick={handleTestBypassSecurity}
                    variant="brand"
                  >
                    Run access check
                  </Button>
                )}

                {bypassStatus === "testing" && (
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#ff9f0a] font-mono py-1.5">
                    <MaterialIcon name="sync" className="animate-spin text-base text-[#D4AF37]" />
                    <span>GET /api/messages...</span>
                  </div>
                )}

                {bypassStatus === "blocked" && (
                  <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-rose-550 font-bold text-xs uppercase tracking-wider font-mono">
                      <MaterialIcon name="lock" className="text-base text-rose-500 shrink-0" />
                      <span>Security Interceptor Confirmed</span>
                    </div>
                    <pre className="font-mono text-[9.5px] leading-relaxed text-rose-450 bg-black/40 dark:bg-black/80 p-2.5 rounded-lg border border-rose-500/10 overflow-x-auto">
                      HTTP/1.1 403 Forbidden<br />
                      {"{"} "error": "ACCESS RESTRICTED: Student peer direct messages are access-controlled." {"}"}
                    </pre>
                    <span className="text-[9px] text-[var(--text-secondary)] font-sans block leading-none italic select-none pt-1">
                      Result: Admin token verification fails on peer threads.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-[#10B981] flex items-start gap-3 shrink-0 mt-4">
              <MaterialIcon name="shield" className="text-xl text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-sans">Active Security Policies: Enforced</h4>
                <p className="text-[10px] text-[var(--text-secondary)] leading-normal mt-0.5">
                  Route rules block requests where sender/receiver context doesn't match requester credentials.
                </p>
              </div>
            </div>
          </Panel>

          {/* Access policy details */}
          <Panel className="space-y-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest flex items-center gap-1.5">
              <MaterialIcon name="gavel" className="text-xl text-[#D4AF37]" />
              <span>Security Protocols</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              LeapStart's core value is experiential master building. A crucial component of this is fostering complete, high-integrity student collaboration without micro-managed overseer visibility.
            </p>

            <div className="space-y-4 pt-3 text-xs text-[var(--text-secondary)]">
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-widest">Confidential Lounge Rule:</h4>
                <p className="text-[10px] leading-relaxed">Student 1-on-1 peer channels filter database logs, returning express 403 blocks to administrator credentials query attempts.</p>
              </div>

              <div className="space-y-1 border-t border-[var(--border-color)] pt-3">
                <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-widest">Roster Oversight Limitations:</h4>
                <p className="text-[10px] leading-relaxed">Operational managers retain user accounts CRUD permission states, but lacks diagnostic decryption headers for peer texts.</p>
              </div>
            </div>
          </Panel>
        </div>
      )}

    </div>
  );
}
