/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  CalendarDays,
  FileCheck2,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Briefcase,
  Layers,
  MapPin,
  RefreshCw,
  Plus,
  Compass,
  ArrowUpRight
} from "lucide-react";
import { UserProfile, AttendanceRecord, LeaveRequest } from "../types";
import AddStudentPanel from "./AddStudentPanel";

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

  useEffect(() => {
    fetchStudents();
    fetchAttendanceRecords();
    fetchLeavePetitions();
  }, [attendanceDate]);

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

  const getStudentStatusForDate = (studentId: string) => {
    const record = attendanceRecords.find((r) => r.userId === studentId && r.date === attendanceDate);
    return record ? record.status : "unmarked";
  };

  // Search list filter
  const filteredStudents = studentsList.filter((std) =>
    std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStudentAdded = (student: UserProfile) => {
    setStudentsList((current) => [student, ...current]);
    setSelectedProfileStd(student);
    fetchAttendanceRecords();
  };

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
            Mentor Workspace
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Manage attendance, student profiles, and leave approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#e8f2ff]/80 px-3.5 py-1.5 dark:bg-[#0a84ff]/14 text-[#0066cc] dark:text-[#0a84ff] border border-[#007aff]/12">
          <Layers className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold">{user.specialty || "Instructor Faculty"}</span>
        </div>
      </header>

      {/* VIEW DECK */}

      {/* NODE: CLASS ROSTER GRID */}
      {currentTab === "student-roster" && (
        <div className="space-y-6">
          <AddStudentPanel compact onStudentAdded={handleStudentAdded} />

          {/* Controls Bar */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between ">
            {/* Search Input */}
            <div className="relative max-w-sm flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="inp-roster-search"
                type="text"
                placeholder="Search students by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {/* Date Picker override */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Logging Date:</span>
              <input
                id="inp-roster-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Grid Layout of students */}
          <div className="rounded-xl border border-gray-200 bg-white  overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider dark:border-slate-800 dark:bg-slate-950/20">
                    <th className="py-3 px-5">Student Avatar</th>
                    <th className="py-3 px-5">LeapStart Mail Address</th>
                    <th className="py-3 px-5 font-mono text-center">Status for {attendanceDate}</th>
                    <th className="py-3 px-5 text-center">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                  {filteredStudents.map((std) => {
                    const status = getStudentStatusForDate(std.id);
                    return (
                      <tr key={std.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/20">
                        {/* Student Info */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={std.pfpUrl}
                              alt={std.name}
                              referrerPolicy="no-referrer"
                              className="h-8.5 w-8.5 rounded-lg bg-[#e8f2ff] border border-[#007aff]/12 shrink-0"
                            />
                            <div>
                              <span className="font-sans text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                                {std.name}
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate max-w-xs">{std.bio}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email Details */}
                        <td className="py-3 px-5 text-gray-500 dark:text-slate-400 font-mono text-[11px] font-medium">
                          {std.email}
                        </td>

                        {/* Dynamic Status badge */}
                        <td className="py-3 px-5 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                              status === "present"
                                ? "bg-emerald-50 text-[#10B981]"
                                : status === "absent"
                                ? "bg-rose-50 text-rose-600"
                                : status === "leave"
                                ? "bg-amber-50 text-[#ff9f0a]"
                                : "bg-gray-100 text-gray-400 dark:bg-slate-800"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Trigger controls button strip */}
                        <td className="py-3 px-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-mark-present-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "present")}
                              className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-[#10B981] hover:bg-[#10B981] hover:text-white cursor-pointer transition-all dark:bg-emerald-950/30"
                            >
                              Present
                            </button>
                            <button
                              id={`btn-mark-absent-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "absent")}
                              className="rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer transition-all dark:bg-rose-950/30"
                            >
                              Absent
                            </button>
                            <button
                              id={`btn-mark-late-${std.id}`}
                              onClick={() => handleUpdateStudentStatus(std.id, "late")}
                              className="rounded bg-yellow-50 px-2 py-1 text-[10px] font-bold text-yellow-600 hover:bg-yellow-600 hover:text-white cursor-pointer transition-all dark:bg-yellow-950/30"
                            >
                              Late
                            </button>
                          </div>
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

      {/* NODE: STAFF TELEMETRY CHECKIN */}
      {currentTab === "staff-logs" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Action Checkin */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#007aff]" />
                <span>Mentor Check-in</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal">
                Instructors are requested to log their presence timestamps to cross-reference school lab hour guidelines.
              </p>

              <div className="my-6 rounded-xl bg-gray-50/50 p-6 text-center dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date stamp</span>
                <div className="my-1.5 font-mono text-lg font-bold text-slate-800 dark:text-white">
                  {new Date().toISOString().split("T")[0]}
                </div>

                {staffCheckedIn ? (
                  <div className="mt-4">
                    <span className="text-xs font-bold text-[#10B981] block">✔ Duty Log Verified</span>
                    <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500 block mt-1">
                      Time logged: {staffCheckinTime} | Location: {staffLocation}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button
                      id="btn-mentor-checkin"
                      onClick={handleStaffCheckin}
                      disabled={staffLoading}
                      className="apple-primary px-5 py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {staffLoading ? "Logging..." : "Log My Lesson Duty"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#e8f2ff]/60 border border-[#007aff]/12 dark:bg-slate-950/20 dark:border-slate-800 p-4 shrink-0 flex items-start gap-3">
              <FileCheck2 className="h-5 w-5 text-[#007aff] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Lesson Guideline Audit</h4>
                <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                  Logged times will establish criteria logs managed securely under Operational Manager Manikanta Mothukuri's office dashboards.
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines and specs card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-gray-100 uppercase tracking-wider">
              Mentor Schedule
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              As LeapStart mentors, experiential instruction demands high interactive engagement. Ensure check-ins represent real laboratory sessions with 1st Year student groups.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800 text-xs text-gray-500">
                <span className="font-semibold text-slate-900 dark:text-slate-300">Suhas Choppala</span>
                <span>Full Stack Web Laboratory (1st Year)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800 text-xs text-gray-500">
                <span className="font-semibold text-slate-900 dark:text-slate-300">Goli Venu Gopal</span>
                <span>DB Schema & API Security Labs</span>
              </div>
              <div className="flex justify-between pb-2 text-xs text-gray-500">
                <span className="font-semibold text-slate-800 dark:text-slate-300">Manoj Karajada</span>
                <span>Enterprise Linux Runtimes Automation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NODE: LEAVE APPLICANTS CRITIQUE */}
      {currentTab === "mentor-leaves" && (
        <div className="space-y-6">
          {leavesMsg && (
            <div className="rounded-xl border border-emerald-100 bg-green-50 p-3.5 text-xs text-emerald-800 dark:bg-slate-950/30 dark:text-[#10B981] dark:border-slate-800/50">
              {leavesMsg}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white  overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 dark:bg-slate-950/40 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Pending Leave Requests
              </h4>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {pendingLeaves.filter((l) => l.status === "pending").map((lv) => {
                const stdName = studentsList.find((u) => u.id === lv.userId)?.name || lv.userId;
                return (
                  <div key={lv.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {stdName} <span className="text-gray-400 font-normal">({lv.userId})</span>
                      </span>
                      <span className="font-mono text-[11px] text-gray-500">
                        Calendar Request: <strong>{lv.startDate} to {lv.endDate}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                      Reason: "{lv.reason}"
                    </p>

                    {actionLeaveId === lv.id ? (
                      <div className="space-y-2.5 rounded-lg bg-gray-50 p-3 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block">
                          Supervisor Official Comments
                        </label>
                        <input
                          id={`inp-leave-remarks-${lv.id}`}
                          type="text"
                          value={leaveRemarks}
                          onChange={(e) => setLeaveRemarks(e.target.value)}
                          placeholder="e.g. Good luck with the Hackathon presentation! Ensure backlog check-ins are logged."
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            id={`btn-approve-confirm-${lv.id}`}
                            onClick={() => handleRespondToLeave(lv.id, "approved")}
                            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Confirm Approve
                          </button>
                          <button
                            id={`btn-reject-confirm-${lv.id}`}
                            onClick={() => handleRespondToLeave(lv.id, "rejected")}
                            className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
                          >
                            Confirm Decline
                          </button>
                          <button
                            id={`btn-cancel-respond-${lv.id}`}
                            onClick={() => setActionLeaveId(null)}
                            className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 cursor-pointer dark:bg-slate-800 dark:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id={`btn-action-leave-${lv.id}`}
                        onClick={() => {
                          setActionLeaveId(lv.id);
                          setLeaveRemarks("");
                        }}
                        className="rounded-lg border border-[#007aff] text-[#007aff] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#e8f2ff] hover:text-[#007aff] cursor-pointer dark:text-[#0a84ff] dark:border-[#007aff] dark:hover:bg-slate-950/40 transition-colors"
                      >
                        Review Request
                      </button>
                    )}
                  </div>
                );
              })}
              {pendingLeaves.filter((l) => l.status === "pending").length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-8">
                  All leave requests cleared. No pending petitions.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NODE: LINKEDIN DIRECTORIES */}
      {currentTab === "mentor-profiles" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Lists */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900  overflow-hidden flex flex-col max-h-[450px]">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 dark:bg-slate-950/40 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Student Directory
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-50 dark:divide-slate-800 no-scrollbar">
              {studentsList.map((std) => {
                const isSelected = selectedProfileStd?.id === std.id;
                return (
                  <button
                    key={std.id}
                    id={`btn-mentor-inspect-${std.id}`}
                    onClick={() => setSelectedProfileStd(std)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#e8f2ff]/82 border-r-3 border-[#007aff] dark:bg-slate-800"
                        : "hover:bg-gray-50 dark:hover:bg-slate-950/60"
                    }`}
                  >
                    <img
                      src={std.pfpUrl}
                      alt={std.name}
                      referrerPolicy="no-referrer"
                      className="h-8.5 w-8.5 rounded-lg bg-[#e8f2ff] border border-[#007aff]/12 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-sans text-xs font-semibold text-slate-900 dark:text-slate-100 block truncate">
                        {std.name}
                      </span>
                      <span className="text-[10px] text-[#007aff] block mt-0.5 truncate dark:text-[#0a84ff] font-mono">
                        View LinkedIn specs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LinkedIn mock Profile Specs Container */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 md:col-span-2  space-y-6 overflow-y-auto max-h-[450px] no-scrollbar">
            {selectedProfileStd ? (
              <div className="space-y-6">
                {/* Intro */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <img
                    src={selectedProfileStd.pfpUrl}
                    alt={selectedProfileStd.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-xl bg-[#e8f2ff] border border-[#007aff]/14"
                  />
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {selectedProfileStd.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{selectedProfileStd.bio}</p>
                    <a
                      href={selectedProfileStd.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a66c2] hover:underline"
                    >
                      <span>Open LinkedIn profile</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-[#007aff]" />
                    <span>Skills</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfileStd.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 text-[10px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-3.5 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-[#10B981]" />
                    <span>Projects</span>
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedProfileStd.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-100 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-950/20 space-y-2"
                      >
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-[#007aff] transition-colors flex items-center gap-1">
                          <span>{proj.title}</span>
                        </h5>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-normal">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {proj.tags.map((tg) => (
                            <span
                              key={tg}
                              className="rounded bg-[#e8f2ff] text-[9px] font-semibold text-[#0066cc] dark:bg-[#0a84ff]/12 dark:text-[#0a84ff] px-1.5 py-0.5"
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
              <p className="text-center text-xs text-gray-400 italic">Select a student directory profile.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
