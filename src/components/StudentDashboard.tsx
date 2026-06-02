/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  CalendarDays,
  FileCheck2,
  Lock,
  Send,
  MessageCircle,
  AlertTriangle,
  UserCheck,
  Award,
  BookOpen,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { UserProfile, AttendanceRecord, LeaveRequest, DirectMessage } from "../types";

interface StudentDashboardProps {
  user: UserProfile;
  currentTab: string;
}

export default function StudentDashboard({ user, currentTab }: StudentDashboardProps) {
  // Global States
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Check-In Geolocation Simulation States
  const [locationCoords, setLocationCoords] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"not_checked" | "checked_present">("not_checked");
  const [gpsLoading, setGpsLoading] = useState(false);

  // Chatroom states
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  // Form states for leave requests
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMsg, setLeaveMsg] = useState("");

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
    fetchStudents();
  }, [user.id]);

  const fetchStudents = async () => {
    try {
      const resp = await fetch("/api/users?role=student");
      const data = await resp.json();
      const otherStudents = data.filter((u: UserProfile) => u.id !== user.id);
      setStudents(otherStudents);
      setSelectedStudent((current) => current || otherStudents[0] || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedStudent && currentTab === "private-chat") {
      fetchDirectMessages(selectedStudent.id);
    }
  }, [selectedStudent, currentTab]);

  const fetchAttendance = async () => {
    try {
      const resp = await fetch(`/api/attendance?userId=${user.id}`);
      const data = await resp.json();
      setAttendance(data);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayRecord = data.find((r: any) => r.date === todayStr);
      if (todayRecord && todayRecord.status === "present") {
        setCheckInStatus("checked_present");
        if (todayRecord.location) {
          setLocationCoords(todayRecord.location);
        }
      } else {
        setCheckInStatus("not_checked");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    try {
      const resp = await fetch(`/api/leaves?userId=${user.id}`);
      const data = await resp.json();
      setLeaves(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDirectMessages = async (targetId: string) => {
    setChatError(null);
    try {
      const resp = await fetch(`/api/messages?userId=${user.id}&targetId=${targetId}`, {
        headers: {
          "x-user-id": user.id // pass simulation credentials
        }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setChatError(data.error);
        setChatMessages([]);
      } else {
        setChatMessages(data);
      }
    } catch (e) {
      setChatError("Secure gateway socket lag.");
    }
  };

  const triggerMockGpsCheckIn = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          const coordsText = `Lat ${lat}, Lng ${lng} (LeapStart Checked)`;
          setLocationCoords(coordsText);
          submitCheckin(coordsText);
        },
        () => {
          // fallback mock lab coordinates (Hyderabad LeapStart School center)
          const mockCoords = "Lat 17.4483, Lng 78.3741 (Hyderabad Experiential Lab)";
          setLocationCoords(mockCoords);
          submitCheckin(mockCoords);
        }
      );
    } else {
      const mockCoords = "Lat 17.4483, Lng 78.3741 (Hyderabad Experiential Lab)";
      setLocationCoords(mockCoords);
      submitCheckin(mockCoords);
    }
  };

  const submitCheckin = async (locTxt: string) => {
    try {
      const resp = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: "present",
          location: locTxt
        })
      });
      if (resp.ok) {
        setCheckInStatus("checked_present");
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePostDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedStudent) return;

    try {
      const resp = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedStudent.id,
          text: newMessageText.trim()
        })
      });
      if (resp.ok) {
        setNewMessageText("");
        fetchDirectMessages(selectedStudent.id);
      } else {
        const errData = await resp.json();
        setChatError(errData.error || "Message post blocked.");
      }
    } catch (e) {
      setChatError("Secure gateway dispatch failed.");
    }
  };

  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      setLeaveMsg("Complete all calendar query parameters.");
      return;
    }

    try {
      const resp = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setLeaveMsg("Leave petition lodged. Awaiting instructor approval.");
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        fetchLeaves();
        setTimeout(() => setLeaveMsg(""), 4000);
      } else {
        setLeaveMsg(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setLeaveMsg("Leave submit error.");
    }
  };

  // Stats computation
  const totalDays = attendance.length;
  const presentDays = attendance.filter((r) => r.status === "present").length;
  const leaveDays = attendance.filter((r) => r.status === "leave").length;
  const lateDays = attendance.filter((r) => r.status === "late").length;
  const absentDays = attendance.filter((r) => r.status === "absent").length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      {/* HEADER SPECS */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
            Student Attendance
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Track attendance, request leave, and coordinate with classmates.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#e8f2ff]/80 px-3.5 py-1.5 dark:bg-[#0a84ff]/14 text-[#0066cc] dark:text-[#0a84ff] border border-[#007aff]/12">
          <BookOpen className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold">1st Year Program Lab</span>
        </div>
      </header>

      {/* VIEW PANEL ROUTING */}

      {/* NODE: TELEMETRY CHECKIN */}
      {currentTab === "checkin" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Action Checkin block */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:col-span-2 ">
            <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#007aff]" />
              <span>Daily Check-in</span>
            </h3>

            <div className="my-6 rounded-xl bg-gray-50 p-6 text-center dark:bg-slate-950/30 border border-gray-100 dark:border-slate-800">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">Today</span>
              <div className="my-2 font-mono text-xl font-bold text-slate-800 dark:text-white">
                {new Date().toISOString().split("T")[0]}
              </div>

              {checkInStatus === "checked_present" ? (
                <div className="mt-4 flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-[#10B981] mb-2 border border-emerald-500/10">
                    <UserCheck className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-[#10B981]">
                    Checked in Present
                  </span>
                  {locationCoords && (
                    <span className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-400 mt-1 dark:text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-sm">{locationCoords}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center">
                  <button
                    id="btn-student-checkin"
                    disabled={gpsLoading}
                    onClick={triggerMockGpsCheckIn}
                    className="apple-primary flex items-center gap-2 px-6 py-3 font-semibold cursor-pointer transition-transform disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    <span>Check in for today</span>
                  </button>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2">
                    Uses browser location when available; otherwise records the approved campus fallback.
                  </p>
                </div>
              )}
            </div>

            {/* Attendance guidelines info block */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-6">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Attendance Policy</h4>
              <ul className="text-xs text-gray-500 dark:text-slate-400 mt-2 space-y-1 pl-4 list-disc">
                <li>Check-ins must occur before 18:00 Local Hours to reflect standard On-Campus presence.</li>
                <li>Geographical fence limits allow telemetry from both school campus laboratories or authorized hybrid nodes.</li>
                <li>Falsified GPS tracking offsets are monitored by Admin Ops Manikanta Mothukuri.</li>
              </ul>
            </div>
          </div>

          {/* Side Info card details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-gray-100 uppercase tracking-wider mb-3">
                Current Standings
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                LeapStart measures experiential hours logged. Your overall attendance directly impacts your project presentation clearances.
              </p>

              <div className="my-6 space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-slate-400">Clearance Threshold</span>
                    <span className="font-bold font-mono text-[#007aff]">85% Minimum</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#007aff] w-[85%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-slate-400">Your Current Index</span>
                    <span className={`font-bold font-mono ${attendanceRate >= 85 ? "text-[#10B981]" : "text-rose-500"}`}>
                      {attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${attendanceRate >= 85 ? "bg-[#10B981]" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#e8f2ff]/70 p-4 border border-[#007aff]/12 dark:bg-slate-950/20 dark:border-slate-800/60 flex items-start gap-3">
              <Award className="h-5 w-5 text-[#007aff] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Academy Streak</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-normal">
                  You logged <strong>5 consecutive</strong> present days on-campus, unlocking standard builder certificates credits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NODE: ANALYTICS OUTLINE */}
      {currentTab === "analytics" && (
        <div className="space-y-6">
          {/* Numerical counters bento grids */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs text-gray-500 dark:text-slate-400">Total days recorded</span>
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white mt-1">{totalDays}</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs text-[#10B981]">Days Checked Present</span>
              <div className="text-2xl font-bold font-mono text-[#10B981] mt-1">{presentDays}</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs text-[#ff9f0a]">Excused Leaves approved</span>
              <div className="text-2xl font-bold font-mono text-[#ff9f0a] mt-1">{leaveDays}</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs text-rose-500">Absences logged</span>
              <div className="text-2xl font-bold font-mono text-rose-500 mt-1">{absentDays}</div>
            </div>
          </div>

          {/* Historical attendance calendar grid */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ">
            <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-gray-100 uppercase tracking-wider mb-4">
              Attendance History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Daily Status</th>
                    <th className="py-3 px-4">Check-in timestamp</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Audited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {attendance.map((rec) => (
                    <tr key={rec.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 px-4 font-mono font-medium">{rec.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            rec.status === "present"
                              ? "bg-emerald-50 text-[#10B981] dark:bg-emerald-950/20"
                              : rec.status === "leave"
                              ? "bg-amber-50 text-[#ff9f0a] dark:bg-amber-950/20"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : "--:--:--"}
                      </td>
                      <td className="py-3 px-4 text-gray-400 max-w-xs truncate" title={rec.location}>
                        {rec.location || "Manual Backfill Override"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold font-mono text-[10px]">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                          Pass
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                        No attendance records exist for this account yet. Use Daily check-in to log today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NODE: LEAVE PETITIONS */}
      {currentTab === "leaves" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Submit form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ">
            <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#007aff]" />
              <span>Request Leave</span>
            </h3>

            {leaveMsg && (
              <div className="mb-4 rounded-xl bg-[#e8f2ff] p-3.5 text-xs text-[#0051d5] dark:bg-slate-950/40 dark:text-[#0a84ff] border border-[#007aff]/12">
                {leaveMsg}
              </div>
            )}

            <form onSubmit={submitLeaveRequest} className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-slate-400">Start Date</label>
                  <input
                    id="inp-leave-start"
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-slate-400">End Date</label>
                  <input
                    id="inp-leave-end"
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-slate-400">Excused Absence Reason</label>
                <textarea
                  id="inp-leave-reason"
                  rows={4}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain why you wish to petition for calendar leaves..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <button
                id="btn-leave-submit"
                type="submit"
                className="apple-primary w-full py-3 font-semibold transition-colors cursor-pointer"
              >
                File Leave Petition
              </button>
            </form>
          </div>

          {/* Submitted list tracking */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900  flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-gray-100 uppercase tracking-wider mb-4">
                Leave Requests
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                {leaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="rounded-xl border border-gray-100 p-4 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-950/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-gray-400">
                        {lv.startDate} to {lv.endDate}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          lv.status === "approved"
                            ? "bg-emerald-50 text-[#10B981]"
                            : lv.status === "rejected"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-[#ff9f0a]"
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic font-serif">
                      "{lv.reason}"
                    </p>
                    {lv.remarks && (
                      <div className="mt-3 rounded-lg bg-white p-2 text-[11px] border border-gray-100 dark:bg-slate-900 dark:border-slate-800 text-gray-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[9px] block">
                          Mentor Remarks ({lv.approvedBy})
                        </span>
                        <p className="mt-0.5 text-gray-400">{lv.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && (
                  <p className="text-center text-xs text-gray-400 italic py-10">
                    No leaves requested on this academic record yet.
                  </p>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 dark:text-slate-500 text-center border-t border-gray-50 dark:border-slate-800 pt-3">
              Requests are automatically directed to <strong>Suhas Choppala</strong> or <strong>Goli Venu Gopal</strong>.
            </div>
          </div>
        </div>
      )}

      {/* NODE: CONFIDENTIAL STUDENT CHAT LOUNGE */}
      {currentTab === "private-chat" && (
        <div className="grid gap-6 md:grid-cols-3 h-[480px]">
          {/* Peer Roster list */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900  overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-950/40 border-b border-gray-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Classmates
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {students.map((std) => {
                const isSelected = selectedStudent?.id === std.id;
                return (
                  <button
                    key={std.id}
                    id={`btn-chat-peer-${std.id}`}
                    onClick={() => setSelectedStudent(std)}
                    className={`flex items-center gap-3.5 w-full px-4 py-2.5 text-left transition-colors cursor-pointer ${
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
                    <div className="truncate min-w-0">
                      <span className="font-sans text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        {std.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate block">{std.bio}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Private Chat Conversation Vault */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900  md:col-span-2 overflow-hidden flex flex-col justify-between">
            {/* Header with Privacy Shield Badge */}
            <div className="px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-950 shrink-0">
              {selectedStudent ? (
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.pfpUrl}
                    alt={selectedStudent.name}
                    referrerPolicy="no-referrer"
                    className="h-8.5 w-8.5 rounded-lg bg-white/10 border border-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold font-sans">{selectedStudent.name}</h4>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Direct Channel Active
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-300">Select peer to message</span>
              )}

              {/* SECURITY SHIELD */}
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-1 text-[9px] text-[#10B981] font-bold tracking-wider font-mono uppercase border border-[#10B981]/15">
                <Lock className="h-3 w-3" />
                <span>CONFIDENTIAL LOUNGE</span>
              </div>
            </div>

            {/* Shield warning alert block */}
            <div className="bg-amber-50/50 border-b border-amber-100 px-4 py-2 text-[10px] text-amber-800 flex items-start gap-2 select-none dark:bg-slate-950/20 dark:border-slate-800 dark:text-[#ffd60a]">
              <AlertTriangle className="h-3.5 w-3.5 text-[#ff9f0a] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Privacy note:</strong> Messages are visible only to the two participating students in this local app.
              </p>
            </div>

            {/* Conversation Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 no-scrollbar">
              {chatError ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <Lock className="h-8 w-8 text-rose-500" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 max-w-sm">{chatError}</p>
                </div>
              ) : chatMessages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex max-w-[75%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                    <div
                      className={`rounded-xl px-3.5 py-2 text-xs leading-normal  ${
                        isMe
                          ? "bg-slate-800 text-white rounded-tr-none dark:bg-slate-100 dark:text-slate-900 font-medium"
                          : "bg-gray-100 text-gray-800 rounded-tl-none dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-[8px] opacity-40 float-right mt-1 ml-2 select-none font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!chatError && chatMessages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center italic text-gray-400 text-xs">
                  Start a conversation with this classmate.
                </div>
              )}
            </div>

            {/* Conversation message input footer */}
            <form
              onSubmit={handlePostDirectMessage}
              className="flex items-center gap-2 px-3 py-3 bg-gray-50 border-t border-gray-100 dark:bg-slate-950 dark:border-slate-800 shrink-0"
            >
              <input
                id="inp-peer-message"
                disabled={!!chatError || !selectedStudent}
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={selectedStudent ? `Direct message to ${selectedStudent.name}...` : "Locked."}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#007aff] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 "
              />
              <button
                id="btn-peer-message-send"
                disabled={!!chatError || !selectedStudent || !newMessageText.trim()}
                type="submit"
                className="apple-primary flex h-8.5 w-8.5 items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
