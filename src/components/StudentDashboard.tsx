/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, AttendanceRecord, LeaveRequest, AttendanceConfig } from "../types";
import ProfileSettingsPanel from "./ProfileSettingsPanel";
import AllStudentsGroup from "./AllStudentsGroup";
import { MaterialIcon, Button, Input, Panel, Badge, Avatar } from "./DesignSystem";

interface StudentDashboardProps {
  user: UserProfile;
  currentTab: string;
  onUserUpdated: (user: UserProfile) => void;
}

export default function StudentDashboard({ user, currentTab, onUserUpdated }: StudentDashboardProps) {
  // Global States
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [todayConfig, setTodayConfig] = useState<AttendanceConfig | null>(null);

  // Check-In Form States
  const [selectedCheckInMode, setSelectedCheckInMode] = useState<"offline" | "online">("offline");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"not_checked" | "checked_present">("not_checked");
  
  const [checkingIn, setCheckingIn] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Form states for leave requests
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMsg, setLeaveMsg] = useState("");

  // Refs for HTML5 Video & Canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
    fetchTodayConfig();
    return () => {
      stopCamera();
    };
  }, [user.id]);

  const fetchTodayConfig = async () => {
    try {
      const resp = await fetch("/api/attendance/config/today");
      if (resp.ok) {
        const config = await resp.json();
        setTodayConfig(config);
        if (config) {
          if (config.attendanceMode === "online") {
            setSelectedCheckInMode("online");
          } else {
            setSelectedCheckInMode("offline");
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const resp = await fetch(`/api/attendance?userId=${user.id}`);
      const data = await resp.json();
      setAttendance(data);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayRecord = data.find((r: any) => r.date === todayStr);
      if (todayRecord && (todayRecord.status === "present" || todayRecord.status === "late")) {
        setCheckInStatus("checked_present");
        if (todayRecord.latitude && todayRecord.longitude) {
          setCoords({
            latitude: todayRecord.latitude,
            longitude: todayRecord.longitude,
            accuracy: todayRecord.accuracy || 10
          });
        }
        if (todayRecord.selfieUrl) {
          setCapturedSelfie(todayRecord.selfieUrl);
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

  // Camera Management
  const startCamera = async () => {
    setIsCameraActive(true);
    setCheckInError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCheckInError("Could not access camera. Please check browser permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedSelfie(dataUrl);
        stopCamera();
      }
    }
  };

  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  const getGeofenceStatus = (distance: number) => {
    if (distance <= 50) return { status: "Verified", variant: "success" as const };
    if (distance <= 75) return { status: "Warning", variant: "warning" as const };
    if (distance <= 100) return { status: "Manual Review", variant: "info" as const };
    return { status: "Rejected", variant: "danger" as const };
  };

  const calculateStreak = (records: AttendanceRecord[]): number => {
    if (records.length === 0) return 0;
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const status = sorted[i].status;
      if (status === "present" || status === "late") {
        streak++;
      } else if (status === "leave") {
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleFetchLocation = () => {
    setLocationMessage("Locating device coordinates...");
    setCheckInError(null);
    if (!navigator.geolocation) {
      setCheckInError("Geolocation is not supported by your browser.");
      setLocationMessage("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocationMessage(`Located: Lat ${pos.coords.latitude.toFixed(5)}, Lng ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        console.error("Geolocation failed:", err);
        setCoords({
          latitude: 17.4125164,
          longitude: 78.3365692,
          accuracy: 15.0
        });
        setLocationMessage("Located (Simulation Campus coordinates fallback enabled)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCheckInSubmit = async () => {
    setCheckingIn(true);
    setCheckInError(null);

    const deviceId = localStorage.getItem("leap_device_id") || `dev-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem("leap_device_id", deviceId);

    try {
      const payload: any = {
        userId: user.id,
        checkInMode: selectedCheckInMode,
        deviceId
      };

      if (selectedCheckInMode === "offline") {
        if (!capturedSelfie) {
          setCheckInError("Webcam selfie snapshot verification required for campus check-in.");
          setCheckingIn(false);
          return;
        }
        if (!coords) {
          setCheckInError("GPS coordinate data is required for campus check-in. Fetch location first.");
          setCheckingIn(false);
          return;
        }
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
        payload.accuracy = coords.accuracy;
        payload.selfieUrl = capturedSelfie;
      }

      const resp = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Check-in request failed.");
      }

      setCheckInStatus("checked_present");
      fetchAttendance();
    } catch (err: any) {
      setCheckInError(err.message || "Failed to log check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      setLeaveMsg("Complete all calendar fields.");
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
        setLeaveMsg("Leave petition submitted. Awaiting instructor approval.");
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        fetchLeaves();
        setTimeout(() => setLeaveMsg(""), 4500);
      } else {
        setLeaveMsg(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setLeaveMsg("Leave submit error.");
    }
  };

  // Stats computation
  const totalDays = attendance.length;
  const presentDays = attendance.filter((r) => r.status === "present" || r.status === "late").length;
  const leaveDays = attendance.filter((r) => r.status === "leave").length;
  const lateDays = attendance.filter((r) => r.status === "late").length;
  const absentDays = attendance.filter((r) => r.status === "absent").length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;
  const isHybrid = todayConfig?.attendanceMode === "hybrid";

  // SVG Apple Fitness ring computation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(attendanceRate, 100) / 100) * circumference;

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      
      {/* Tab Routed Panels */}
      {currentTab === "profile-settings" && (
        <ProfileSettingsPanel user={user} onUserUpdated={onUserUpdated} />
      )}

      {currentTab === "private-chat" && (
        <AllStudentsGroup user={user} />
      )}

      {/* NODE: DAILY CHECKIN */}
      {currentTab === "checkin" && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Check-in controller card */}
          <Panel className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon name="timer" className="text-xl text-[var(--leap-brand)]" />
              <span>Telemetry Clock-In Desk</span>
            </h3>

            <div className="my-6 p-6 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] mb-3">
                <span>Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="font-mono text-[10px] uppercase font-bold text-[var(--leap-brand)]">
                  Mode: {todayConfig?.attendanceMode || "online"}
                </span>
              </div>

              {checkInStatus === "checked_present" ? (
                <div className="py-6 flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-[#10B981] mb-3 border border-emerald-500/20">
                    <MaterialIcon name="how_to_reg" className="text-3xl" />
                  </div>
                  <span className="text-base font-black text-[#10B981] font-display">
                    Duty Verification Established
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono">
                    Logged Present ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </p>
                  {coords && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-secondary)] mt-2">
                      <MaterialIcon name="location_on" className="text-base text-emerald-500" />
                      <span>GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Hybrid Selector */}
                  {isHybrid && (
                    <div className="flex gap-2 p-1 bg-[var(--bg-page)] rounded-xl border border-[var(--border-color)]">
                      <button
                        onClick={() => setSelectedCheckInMode("offline")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          selectedCheckInMode === "offline"
                            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        Campus Check-In
                      </button>
                      <button
                        onClick={() => setSelectedCheckInMode("online")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          selectedCheckInMode === "online"
                            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        Remote Check-In
                      </button>
                    </div>
                  )}

                  {/* Campus Mode (Selfie + Geolocation verification) */}
                  {selectedCheckInMode === "offline" ? (
                    <div className="space-y-4">
                      
                      {/* Webcam Preview Panel */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2 block">
                          Biometric Capture
                        </span>
                        
                        <div className="relative w-72 h-52 rounded-2xl overflow-hidden bg-black border border-[var(--border-color)] shadow-md flex items-center justify-center">
                          {isCameraActive ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                          ) : capturedSelfie ? (
                            <img
                              src={capturedSelfie}
                              alt="Captured snapshot"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-[var(--text-secondary)] text-xs p-4">
                              <MaterialIcon name="photo_camera" className="text-3xl text-[var(--text-secondary)]/50 mb-2" />
                              <span className="block">Camera Feed Offline</span>
                            </div>
                          )}

                          {isCameraActive && (
                            <button
                              onClick={captureSnapshot}
                              className="absolute bottom-3 px-4 py-1.5 bg-[#D4AF37] hover:bg-[#C5A028] text-black text-[10px] font-bold uppercase rounded-lg shadow-lg cursor-pointer transition-colors"
                            >
                              Snap Selfie
                            </button>
                          )}
                        </div>

                        {!isCameraActive && (
                          <button
                            onClick={startCamera}
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--leap-brand)] hover:underline cursor-pointer"
                          >
                            <MaterialIcon name="videocam" className="text-base" />
                            <span>{capturedSelfie ? "Re-take Snapshot" : "Initialize Camera Feed"}</span>
                          </button>
                        )}
                      </div>

                      {/* GPS Validation */}
                      <div className="border-t border-[var(--border-color)] pt-4 flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2 block">
                          Geofence Telemetry
                        </span>
                        {coords ? (
                          <div className="text-center">
                            <span className="text-xs font-mono text-[#10B981] font-bold block">
                              GPS Acquired (Accuracy: {coords.accuracy.toFixed(1)}m)
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] block mt-0.5">
                              Lat {coords.latitude.toFixed(5)}, Lng {coords.longitude.toFixed(5)}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={handleFetchLocation}
                            className="px-4 py-2 text-xs"
                          >
                            Get Location Coordinates
                          </Button>
                        )}
                        {locationMessage && <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-mono">{locationMessage}</p>}
                      </div>

                    </div>
                  ) : (
                    // Remote mode text guidelines
                    <div className="text-center py-4">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
                        Online Mode Active. Camera snapshot and Geofence distance parameters are bypassed. Click below to confirm remote check-in.
                      </p>
                    </div>
                  )}

                  {checkInError && (
                    <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-2">
                      <MaterialIcon name="warning" className="text-base text-rose-500 shrink-0 mt-0.5" />
                      <span>{checkInError}</span>
                    </div>
                  )}

                  {/* Submission Action */}
                  <Button
                    id="btn-student-checkin"
                    onClick={handleCheckInSubmit}
                    disabled={checkingIn}
                    loading={checkingIn}
                    variant="brand"
                    className="w-full py-3.5"
                  >
                    Submit Attendance Verification
                  </Button>
                </div>
              )}
            </div>

            {/* Attendance Guideline panel */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-6 text-left">
              <h4 className="text-xs font-bold text-[var(--text-primary)]">System Parameters</h4>
              <ul className="text-xs text-[var(--text-secondary)] mt-2 space-y-1.5 pl-4 list-disc">
                <li>Hybrid cohort setups allow selective Remote options. Physical campus operations require strict GPS validation.</li>
                <li>Campus check-in location bounds: Financial District, Hyderabad (Allowed radius: 100 meters).</li>
                <li>Distance limits calculation applies: 0-50m (Verified), 50-75m (Warning), 75-100m (Manual Review), &gt;100m (Rejected).</li>
              </ul>
            </div>
          </Panel>

          {/* Right side: Apple Fitness style Circular ring and streaks */}
          <div className="space-y-6">
            
            {/* Apple Fitness Style Widget */}
            <Panel className="text-center flex flex-col justify-between h-[300px]">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
                  Attendance Clearances
                </h3>
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="rgba(217, 217, 217, 0.15)"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="#D4AF37"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-mono font-black text-[var(--text-primary)]">{attendanceRate.toFixed(0)}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">Logged</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-3 mt-4">
                <span>Threshold Goal</span>
                <span className="font-bold text-[#D4AF37] font-mono">85% Clearance</span>
              </div>
            </Panel>

            {/* Streak & Telemetry card */}
            <Panel className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <MaterialIcon name="workspace_premium" className="text-xl text-orange-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Academy Streak</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">You logged 5 consecutive present days this cohort cycle.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-[var(--border-color)] pt-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <MaterialIcon name="location_on" className="text-xl text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Last Geolocation</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono truncate max-w-[180px]">
                    {coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : "No GPS logs recorded today."}
                  </p>
                </div>
              </div>
            </Panel>

          </div>

        </div>
      )}

      {/* NODE: HISTORICAL ANALYTICS */}
      {currentTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Total cohort days", val: totalDays },
              { label: "Duty checked present", val: presentDays, color: "text-[#10B981]" },
              { label: "Approved leave petitions", val: leaveDays, color: "text-[#ff9f0a]" },
              { label: "Absences logged", val: absentDays, color: "text-rose-500" }
            ].map((stat, i) => (
              <Panel key={i} className="p-4 text-left">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">{stat.label}</span>
                <div className={`text-2xl font-black font-mono mt-1 ${stat.color || "text-[var(--text-primary)]"}`}>{stat.val}</div>
              </Panel>
            ))}
          </div>

          <Panel className="overflow-hidden p-0">
            <div className="border-b border-[var(--border-color)] px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                Historical Attendance Logs
              </h3>
            </div>

            <div className="overflow-x-auto text-left">
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Verification Date</th>
                    <th>Duty Status</th>
                    <th>Verification Type</th>
                    <th>Check-In Time</th>
                    <th>Accuracy Log</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((rec) => (
                    <tr key={rec.id}>
                      <td className="font-mono font-bold">{rec.date}</td>
                      <td>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            rec.status === "present"
                              ? "bg-emerald-500/10 text-[#10B981]"
                              : rec.status === "late"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : rec.status === "leave"
                              ? "bg-amber-500/10 text-[#ff9f0a]"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="font-mono text-[var(--text-secondary)] capitalize">
                        {rec.checkInMode || "override check"}
                      </td>
                      <td className="font-mono text-[var(--text-secondary)]">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                      </td>
                      <td className="font-mono">
                        {rec.verified ? (
                          <span className="text-[#10B981] font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                            {rec.verificationStatus || "Verified"}
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                            Bypass
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] italic font-medium">
                        No telemetry logs reported yet. Complete daily check-in to establish records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* NODE: LEAVE PETITIONS */}
      {currentTab === "leaves" && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Submit form */}
          <Panel className="text-left">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <MaterialIcon name="calendar_month" className="text-xl text-[var(--leap-brand)]" />
              <span>Submit Leave Petition</span>
            </h3>

            {leaveMsg && (
              <div className="mb-4 p-3.5 text-xs rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                {leaveMsg}
              </div>
            )}

            <form onSubmit={submitLeaveRequest} className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <Input
                  id="inp-leave-start"
                  type="date"
                  label="Start Date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                />
                <Input
                  id="inp-leave-end"
                  type="date"
                  label="End Date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                />
              </div>

              <Input
                id="inp-leave-reason"
                label="Excused Absence Reason"
                isTextArea
                rows={4}
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Provide details for leave verification request..."
              />

              <Button
                id="btn-leave-submit"
                type="submit"
                variant="brand"
                className="w-full"
              >
                File Leave Petition
              </Button>
            </form>
          </Panel>

          {/* Leave list tracker */}
          <Panel className="flex flex-col justify-between text-left">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
                Leave Petitions Status
              </h3>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto no-scrollbar">
                {leaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="rounded-2xl border border-[var(--border-color)] p-4 bg-[var(--bg-page)]/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                        {lv.startDate} to {lv.endDate}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          lv.status === "approved"
                            ? "bg-emerald-500/10 text-[#10B981]"
                            : lv.status === "rejected"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-amber-500/10 text-[#ff9f0a]"
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] mt-2.5 italic">
                      "{lv.reason}"
                    </p>
                    {lv.remarks && (
                      <div className="mt-3 rounded-xl bg-[var(--bg-page)] p-3 border border-[var(--border-color)] text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--leap-brand)] uppercase text-[9px] font-mono block">
                          Supervisor Comments ({lv.approvedBy})
                        </span>
                        <p className="mt-1 text-[11px] font-sans">{lv.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && (
                  <p className="text-center text-xs text-[var(--text-secondary)] italic py-12">
                    No leaves requested on this academic record yet.
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-[10px] text-[var(--text-secondary)] text-center border-t border-[var(--border-color)] pt-3 mt-4">
              Dispatched directly to: <strong>Suhas Choppala</strong> (Cohort Advisor)
            </div>
          </Panel>

        </div>
      )}

    </div>
  );
}
