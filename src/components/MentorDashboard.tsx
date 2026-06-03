/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, AttendanceRecord, LeaveRequest, AttendanceConfig } from "../types";
import AddStudentPanel from "./AddStudentPanel";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

interface MentorDashboardProps {
  user: UserProfile;
  currentTab: string;
}

export default function MentorDashboard({ user, currentTab }: MentorDashboardProps) {
  // Roster states
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Staff own attendance check-in states
  const [staffCheckedIn, setStaffCheckedIn] = useState(false);
  const [staffCheckinTime, setStaffCheckinTime] = useState<string | null>(null);
  const [staffLocation, setStaffLocation] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  // Leave petitions states
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [actionLeaveId, setActionLeaveId] = useState<string | null>(null);
  const [leaveRemarks, setLeaveRemarks] = useState("");
  const [leavesMsg, setLeavesMsg] = useState("");

  // Selected student profile inspect state
  const [selectedProfileStd, setSelectedProfileStd] = useState<UserProfile | null>(null);
  const [announcementYear, setAnnouncementYear] = useState("2");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");

  // Config States for Override
  const [configMode, setConfigMode] = useState<"offline" | "online" | "hybrid">("hybrid");
  const [configStart, setConfigStart] = useState("09:00");
  const [configEnd, setConfigEnd] = useState("18:00");
  const [configRemarks, setConfigRemarks] = useState("");
  const [configMsg, setConfigMsg] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchAttendanceRecords();
    fetchLeavePetitions();
    fetchTodayConfig();
  }, [attendanceDate, currentTab]);

  const fetchTodayConfig = async () => {
    try {
      const resp = await fetch("/api/attendance/config/today");
      if (resp.ok) {
        const config = await resp.json();
        if (config) {
          setConfigMode(config.attendanceMode);
          setConfigStart(config.startTime);
          setConfigEnd(config.endTime);
          setConfigRemarks(config.remarks || "");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const resp = await fetch("/api/users?role=student");
      const data = await resp.json();
      setStudentsList(data);
      setSelectedProfileStd((current) => current || data[0] || null);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const resp = await fetch("/api/attendance");
      const data = await resp.json();
      setAttendanceRecords(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeavePetitions = async () => {
    try {
      const resp = await fetch("/api/leaves");
      const data = await resp.json();
      setPendingLeaves(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Quick inline status override toggle
  const handleUpdateStudentStatus = async (studentId: string, status: "present" | "absent" | "late" | "leave") => {
    try {
      const resp = await fetch("/api/attendance/update-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: [
            {
              userId: studentId,
              date: attendanceDate,
              status
            }
          ]
        })
      });
      if (resp.ok) {
        fetchAttendanceRecords();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Staff instructor own check-in
  const handleStaffCheckin = async () => {
    setStaffLoading(true);
    const mockLoc = "Lat 17.4483, Lng 78.3741 (Hyderabad Mentor Desk)";
    try {
      const resp = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: "present",
          location: mockLoc
        })
      });
      if (resp.ok) {
        setStaffCheckedIn(true);
        setStaffCheckinTime(new Date().toLocaleTimeString());
        setStaffLocation(mockLoc);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStaffLoading(false);
    }
  };

  // Respond to student leave requests
  const handleRespondToLeave = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      const resp = await fetch(`/api/leaves/${leaveId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          remarks: leaveRemarks || "Processed by Mentor.",
          approvedBy: user.name
        })
      });
      if (resp.ok) {
        setLeavesMsg(`Leave petition response categorized successfully!`);
        setActionLeaveId(null);
        setLeaveRemarks("");
        fetchLeavePetitions();
        fetchAttendanceRecords();
        setTimeout(() => setLeavesMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save config override
  const handleSaveConfigOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg("");
    try {
      const resp = await fetch("/api/attendance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: attendanceDate,
          attendanceMode: configMode,
          startTime: configStart,
          endTime: configEnd,
          remarks: configRemarks,
          createdBy: user.name
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setConfigMsg(`Daily configuration overrides updated successfully.`);
        setTimeout(() => setConfigMsg(""), 4000);
      } else {
        setConfigMsg(data.error || "Failed to update configuration.");
      }
    } catch (err) {
      setConfigMsg("Failed to configure attendance mode override.");
    }
  };

  const getStudentStatusForDate = (studentId: string) => {
    const record = attendanceRecords.find((r) => r.userId === studentId && r.date === attendanceDate);
    return record ? record.status : "unmarked";
  };

  // Search list filter
  const filteredStudents = studentsList.filter((std) =>
    std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStudentAdded = (student: UserProfile) => {
    setStudentsList((current) => [student, ...current]);
    setSelectedProfileStd(student);
    fetchAttendanceRecords();
  };

  const handlePostYearAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!announcementText.trim()) {
      setAnnouncementMsg("Write an announcement before posting.");
      return;
    }
    try {
      const response = await fetch(`/api/channels/year-${announcementYear}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({ text: announcementText.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Announcement blocked.");
      }
      setAnnouncementText("");
      setAnnouncementMsg(`Announcement posted to #year-${announcementYear} channel!`);
      setTimeout(() => setAnnouncementMsg(""), 4000);
    } catch (err: any) {
      setAnnouncementMsg(err.message || "Unable to post announcement.");
    }
  };

  // EXPORTERS
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Student ID,Date,Status,Check-In Time,Verification,Distance (m),Mode\n";
    
    attendanceRecords.forEach((rec) => {
      const row = [
        rec.id,
        rec.userId,
        rec.date,
        rec.status,
        rec.checkInTime || "",
        rec.verificationStatus || "",
        rec.distanceFromCampus || "",
        rec.checkInMode || ""
      ].map(val => `"${val}"`).join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${attendanceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
            Mentor Workspace
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Overrule student presence indexes, respond to leave applications, and post announcements.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#e8f2ff]/80 px-3.5 py-1.5 dark:bg-[#0a84ff]/14 text-[#0066cc] dark:text-[#0a84ff] border border-[var(--border-color)]">
          <MaterialIcon name="layers" className="text-base text-[#D4AF37]" />
          <span className="font-mono text-xs font-semibold">{user.specialty || "Faculty"}</span>
        </div>
      </header>

      {/* NODE: CLASS ROSTER GRID */}
      {currentTab === "student-roster" && (
        <div className="space-y-6">
          <AddStudentPanel compact onStudentAdded={handleStudentAdded} />

          {/* Controls Bar */}
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative max-w-sm flex-1">
              <Input
                id="inp-roster-search"
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon="search"
              />
            </div>

            {/* Manual attendance entry */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Cohort Date:</span>
              <input
                id="inp-roster-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[#D4AF37] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Override instructions */}
            <Panel className="lg:col-span-2 text-left flex flex-col justify-between">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-2">
                  Roster Overrides Dashboard
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Mentors hold total authority to Backfill or Correct student presence. Toggling status below immediately registers changes in the Postgres database layer.
                </p>

                <div className="flex flex-wrap gap-3 pt-6">
                  <Button 
                    variant="secondary"
                    onClick={handleExportCSV}
                    icon="download"
                  >
                    Download CSV Logs
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={handleExportPDF}
                    icon="description"
                  >
                    Print PDF Sheet
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[var(--bg-page)]/50 p-3.5 text-xs text-[var(--text-secondary)] border border-[var(--border-color)]">
                Cohort Date target: <strong>{attendanceDate}</strong>
              </div>
            </Panel>

            {/* Override configuration */}
            <Panel className="text-left">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MaterialIcon name="sliders" className="text-base text-[var(--leap-brand)]" />
                <span>Today's Mode Override</span>
              </h3>
              
              {configMsg && (
                <div className="mb-3 p-2 text-[10px] font-mono text-center rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold">
                  {configMsg}
                </div>
              )}

              <form onSubmit={handleSaveConfigOverride} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Override Mode</label>
                  <select
                    value={configMode}
                    onChange={(e) => setConfigMode(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-4 py-3.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="offline">Offline (GPS/Webcam Required)</option>
                    <option value="online">Online (Bypassed)</option>
                    <option value="hybrid">Hybrid Choice</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Time"
                    type="text"
                    value={configStart}
                    onChange={(e) => setConfigStart(e.target.value)}
                  />
                  <Input
                    label="End Time"
                    type="text"
                    value={configEnd}
                    onChange={(e) => setConfigEnd(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  className="w-full mt-2"
                >
                  Save Daily Override
                </Button>
              </form>
            </Panel>

          </div>

          {/* Announcement poster */}
          <Panel className="text-left">
            <form onSubmit={handlePostYearAnnouncement} className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider">Post Classroom Announcement</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                    Dispatches announcements straight to the student Discord server channels.
                  </p>
                  <Input
                    isTextArea
                    rows={2}
                    value={announcementText}
                    onChange={(event) => setAnnouncementText(event.target.value)}
                    placeholder="Type announcements here..."
                    className="mt-3"
                  />
                </div>
                <div className="flex gap-3 shrink-0 items-end">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Year Level</label>
                    <select
                      value={announcementYear}
                      onChange={(event) => setAnnouncementYear(event.target.value)}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-4 py-3.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#D4AF37] font-semibold cursor-pointer"
                    >
                      <option value="1">1st Year Lounge</option>
                      <option value="2">2nd Year Lounge</option>
                      <option value="3">3rd Year Lounge</option>
                      <option value="4">4th Year Lounge</option>
                    </select>
                  </div>
                  <Button type="submit" variant="brand" className="h-[46px]" icon="send">
                    Dispatch
                  </Button>
                </div>
              </div>
              {announcementMsg && <p className="text-xs font-mono text-[var(--leap-brand)] font-semibold">{announcementMsg}</p>}
            </form>
          </Panel>

          {/* Students Grid List */}
          <Panel className="overflow-hidden p-0 text-left">
            <div className="overflow-x-auto">
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Student Avatar</th>
                    <th>LeapStart Mail Address</th>
                    <th className="text-center font-mono">Status for {attendanceDate}</th>
                    <th className="text-center">Override status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((std) => {
                    const status = getStudentStatusForDate(std.id);
                    return (
                      <tr key={std.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img
                              src={std.pfpUrl}
                              alt={std.name}
                              referrerPolicy="no-referrer"
                              className="h-8.5 w-8.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] shrink-0"
                            />
                            <div>
                              <span className="font-sans text-xs font-semibold block text-[var(--text-primary)]">
                                {std.name}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)] block truncate max-w-xs">{std.bio}</span>
                            </div>
                          </div>
                        </td>

                        <td className="text-[var(--text-secondary)] font-mono text-[11px] font-medium">
                          {std.email}
                        </td>

                        <td className="text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              status === "present"
                                ? "bg-emerald-500/10 text-[#10B981]"
                                : status === "late"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : status === "leave"
                                ? "bg-amber-500/10 text-[#ff9f0a]"
                                : status === "absent"
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-gray-800/40 text-gray-500"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              id={`btn-mark-present-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "present")}
                              className="rounded-lg px-2.5 py-1.5 text-[9px] uppercase font-bold"
                              variant="secondary"
                              style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.2)" }}
                            >
                              Present
                            </Button>
                            <Button
                              id={`btn-mark-absent-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "absent")}
                              className="rounded-lg px-2.5 py-1.5 text-[9px] uppercase font-bold"
                              variant="secondary"
                              style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.2)" }}
                            >
                              Absent
                            </Button>
                            <Button
                              id={`btn-mark-late-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "late")}
                              className="rounded-lg px-2.5 py-1.5 text-[9px] uppercase font-bold"
                              variant="secondary"
                              style={{ color: "#F59E0B", borderColor: "rgba(245,158,11,0.2)" }}
                            >
                              Late
                            </Button>
                          </div>
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

      {/* NODE: STAFF TELEMETRY CHECKIN */}
      {currentTab === "staff-logs" && (
        <div className="grid gap-6 md:grid-cols-2 text-left">
          
          {/* Action Checkin */}
          <Panel className="flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MaterialIcon name="timer" className="text-xl text-[var(--leap-brand)]" />
                <span>Mentor Check-in Duty Log</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-normal">
                Instructors are requested to log their presence timestamps to cross-reference school lab hour guidelines.
              </p>

              <div className="my-6 rounded-2xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Duty date stamp</span>
                <div className="my-1.5 font-mono text-lg font-bold">
                  {new Date().toISOString().split("T")[0]}
                </div>

                {staffCheckedIn ? (
                  <div className="mt-4">
                    <span className="text-xs font-bold text-[#10B981] block">✔ Lesson Duty Verified</span>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] block mt-1">
                      Time logged: {staffCheckinTime} | Location: {staffLocation}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button
                      id="btn-mentor-checkin"
                      onClick={handleStaffCheckin}
                      loading={staffLoading}
                      variant="brand"
                      className="px-5 py-2.5"
                    >
                      Log My Lesson Duty
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-[#10B981] flex items-start gap-3 shrink-0">
              <MaterialIcon name="fact_check" className="text-xl text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-sans">Lesson Guideline Audit</h4>
                <p className="text-[10px] text-[var(--text-secondary)] leading-normal mt-0.5">
                  Logged times will establish criteria logs managed securely under Operational Manager Manikanta Mothukuri's office dashboards.
                </p>
              </div>
            </div>
          </Panel>

          {/* Guidelines and specs card */}
          <Panel className="space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
              Mentor Cohorts Assignment
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              As LeapStart mentors, experiential instruction demands high interactive engagement. Ensure check-ins represent real laboratory sessions with student groups.
            </p>

            <div className="space-y-3 pt-2 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                <span className="font-semibold text-[var(--text-primary)]">Suhas Choppala</span>
                <span>Full Stack Web Laboratory (1st Year)</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                <span className="font-semibold text-[var(--text-primary)]">Goli Venu Gopal</span>
                <span>DB Schema & API Security Labs</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="font-semibold text-[var(--text-primary)]">Manoj Karajada</span>
                <span>Enterprise Linux Runtimes Automation</span>
              </div>
            </div>
          </Panel>

        </div>
      )}

      {/* NODE: LEAVE APPLICANTS CRITIQUE */}
      {currentTab === "mentor-leaves" && (
        <div className="space-y-6 text-left">
          {leavesMsg && (
            <div className="rounded-xl border border-emerald-500/25 bg-green-500/10 p-3.5 text-xs text-emerald-400">
              {leavesMsg}
            </div>
          )}

          <Panel className="overflow-hidden p-0">
            <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Pending Leave Petitions
              </h4>
            </div>

            <div className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
              {pendingLeaves.filter((l) => l.status === "pending").map((lv) => {
                const stdName = studentsList.find((u) => u.id === lv.userId)?.name || lv.userId;
                return (
                  <div key={lv.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-xs font-bold">
                        {stdName} <span className="text-[var(--text-secondary)] font-normal">({lv.userId})</span>
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                        Requested Dates: <strong>{lv.startDate} to {lv.endDate}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] italic">
                      Reason: "{lv.reason}"
                    </p>

                    {actionLeaveId === lv.id ? (
                      <div className="space-y-3 rounded-2xl bg-[var(--bg-page)]/50 p-4 border border-[var(--border-color)] max-w-xl">
                        <Input
                          id={`inp-leave-remarks-${lv.id}`}
                          type="text"
                          value={leaveRemarks}
                          onChange={(e) => setLeaveRemarks(e.target.value)}
                          placeholder="Provide approval comments or remarks..."
                          label="Official Supervisor Comments"
                        />
                        <div className="flex gap-2">
                          <Button
                            id={`btn-approve-confirm-${lv.id}`}
                            onClick={() => handleRespondToLeave(lv.id, "approved")}
                            variant="brand"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none px-4 py-2"
                          >
                            Approve Petition
                          </Button>
                          <Button
                            id={`btn-reject-confirm-${lv.id}`}
                            onClick={() => handleRespondToLeave(lv.id, "rejected")}
                            variant="danger"
                            className="px-4 py-2 text-xs font-bold"
                          >
                            Decline Petition
                          </Button>
                          <Button
                            id={`btn-cancel-respond-${lv.id}`}
                            onClick={() => setActionLeaveId(null)}
                            variant="secondary"
                            className="px-4 py-2 text-xs font-bold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        id={`btn-action-leave-${lv.id}`}
                        onClick={() => {
                          setActionLeaveId(lv.id);
                          setLeaveRemarks("");
                        }}
                        variant="secondary"
                        className="text-[#D4AF37] border-[#D4AF37]/50 hover:bg-[#D4AF37]/10"
                      >
                        Review Request
                      </Button>
                    )}
                  </div>
                );
              })}
              {pendingLeaves.filter((l) => l.status === "pending").length === 0 && (
                <p className="text-center text-xs text-[var(--text-secondary)] italic py-12 font-medium">
                  All student leave petitions processed.
                </p>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* NODE: STUDENT PROFILES */}
      {currentTab === "mentor-profiles" && (
        <div className="grid gap-6 md:grid-cols-3 text-left">
          
          {/* Lists */}
          <Panel className="overflow-hidden p-0 flex flex-col max-h-[450px]">
            <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Student Portfolios Directory
              </h4>
              <Input
                id="inp-profile-search"
                type="text"
                placeholder="Search portfolios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon="search"
                className="py-1 px-3 bg-black/10 border-0"
              />
            </div>

            <div className="flex-1 overflow-y-auto py-2 divide-y divide-[var(--border-color)] no-scrollbar">
              {filteredStudents.map((std) => {
                const isSelected = selectedProfileStd?.id === std.id;
                return (
                  <button
                    key={std.id}
                    id={`btn-mentor-inspect-${std.id}`}
                    onClick={() => setSelectedProfileStd(std)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--bg-elevated)] border-r-2 border-[#D4AF37] text-[var(--text-primary)]"
                        : "hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <img
                      src={std.pfpUrl}
                      alt={std.name}
                      referrerPolicy="no-referrer"
                      className="h-8.5 w-8.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] shrink-0"
                    />
                    <div className="truncate min-w-0">
                      <span className="font-sans text-xs font-semibold block text-[var(--text-primary)]">
                        {std.name}
                      </span>
                      <span className="text-[10px] text-[#D4AF37] block mt-0.5 font-mono">
                        View spec sheet
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredStudents.length === 0 && (
                <p className="p-4 text-center text-xs text-[var(--text-secondary)] italic">
                  No matching student profiles.
                </p>
              )}
            </div>
          </Panel>

          {/* Profile Specs Container */}
          <Panel className="md:col-span-2 space-y-6 overflow-y-auto max-h-[450px] no-scrollbar">
            {selectedProfileStd ? (
              <div className="space-y-6">
                
                {/* Intro */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <img
                    src={selectedProfileStd.pfpUrl}
                    alt={selectedProfileStd.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]"
                  />
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold">
                      {selectedProfileStd.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">{selectedProfileStd.bio}</p>
                    <a
                      href={selectedProfileStd.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] hover:underline"
                    >
                      <span>Open LinkedIn profile</span>
                      <MaterialIcon name="arrow_outward" className="text-sm" />
                    </a>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedProfileStd.githubUrl && (
                        <a href={selectedProfileStd.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                          GitHub
                        </a>
                      )}
                      {selectedProfileStd.portfolioUrl && (
                        <a href={selectedProfileStd.portfolioUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-[var(--bg-page)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                          Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-2 border-t border-[var(--border-color)] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <MaterialIcon name="explore" className="text-base text-[#D4AF37]" />
                    <span>Skills</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfileStd.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1 text-[10px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-3.5 border-t border-[var(--border-color)] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <MaterialIcon name="business_center" className="text-base text-emerald-500" />
                    <span>Projects</span>
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedProfileStd.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-page)]/50 space-y-2"
                      >
                        <h5 className="text-xs font-bold flex items-center gap-1">
                          <span>{proj.title}</span>
                        </h5>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-normal">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {proj.tags.map((tg) => (
                            <span
                              key={tg}
                              className="rounded bg-[#D4AF37]/10 text-[9px] font-semibold text-[#D4AF37] border border-[#D4AF37]/10 px-1.5 py-0.5"
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
              <p className="text-center text-xs text-[var(--text-secondary)] italic">Select a student directory profile.</p>
            )}
          </Panel>
        </div>
      )}

    </div>
  );
}
