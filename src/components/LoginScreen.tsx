/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import ProjectShowcase from "./ProjectShowcase";
import { motion, AnimatePresence } from "motion/react";
import { 
  MaterialIcon, 
  Button, 
  Input, 
  Avatar, 
  Badge, 
  Panel 
} from "./DesignSystem";

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const GUEST_USER: UserProfile = {
  id: "guest",
  name: "Anonymous Reviewer",
  email: "guest@leapstart.in",
  role: "student",
  linkedinUrl: "https://www.linkedin.com/company/leapstart-co/",
  pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=GuestPublic",
  bio: "Public Guest Reviewer",
  skills: [],
  projects: []
};

const LOGO_DARK = "https://leapstart.in/icons/logo.webp";
const LOGO_LIGHT = "https://leapstart.in/icons/logo-whitee.webp";

export default function LoginScreen({ onLoginSuccess, theme, onToggleTheme }: LoginScreenProps) {
  // Navigation tabs: "home" | "showcase"
  const [activeTab, setActiveTab] = useState<"home" | "showcase">("home");
  
  // Login states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [viewState, setViewState] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Recovery States
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedInbox, setSimulatedInbox] = useState<{ to: string; otpCode: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Secure token rejected.");
      }

      setSuccessMsg("Authorization established! Launching dashboard...");
      setTimeout(() => {
        setIsLoginModalOpen(false);
        onLoginSuccess(data.user, data.token);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Network gate failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please provide your registered school email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone || undefined })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Email not mapped to any active academic profile.");
      }

      setSuccessMsg("Twilio SMS verification code dispatched.");
      setSimulatedInbox({
        to: data.simulatedInboxDetails.to,
        otpCode: data.simulatedInboxDetails.otpCode
      });
      setTimeout(() => {
        setViewState("reset");
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger recovery flow.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode || !newPassword) {
      setErrorMsg("Please fill in the recovery OTP code and your new password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset. Validate OTP code.");
      }

      setSuccessMsg("Security credentials updated! Proceed to log in.");
      setSimulatedInbox(null);
      setTimeout(() => {
        setViewState("login");
        setPassword("");
        setOtpCode("");
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Reset failed. Verification code might be expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (role: "student" | "mentor" | "hr" | "founder") => {
    const maps = {
      student: { u: "aadhira@leapstart.gmail.com", p: "aadhira@123" },
      mentor: { u: "suhas@leapstart.gmail.com", p: "suhas@123" },
      hr: { u: "yuktha@leapstart.gmail.com", p: "yuktha@123" },
      founder: { u: "saikrishna@leapstart.gmail.com", p: "saikrishna@123" }
    };
    setEmail(maps[role].u);
    setPassword(maps[role].p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans antialiased overflow-hidden selection:bg-[#D4AF37] selection:text-black leap-grid-bg relative flex flex-col justify-between transition-colors duration-250">
      
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,var(--leap-brand-soft)_0%,transparent_70%)] pointer-events-none z-0"></div>

      {/* Top Header navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)]/60 backdrop-blur-xl shrink-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <img
              src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
              alt="LeapStart Logo"
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("home")}
              className={`pb-1 transition-colors cursor-pointer border-b-2 ${
                activeTab === "home" ? "border-[var(--leap-brand)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              System Home
            </button>
            <button
              onClick={() => setActiveTab("showcase")}
              className={`pb-1 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === "showcase" ? "border-[var(--leap-brand)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Student Showcase</span>
              <Badge variant="brand">Active</Badge>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onToggleTheme}
              className="px-3 py-3 rounded-xl border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Switch Theme Mode"
            >
              <MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-base" />
            </Button>
            
            <Button
              variant="brand"
              onClick={() => {
                setViewState("login");
                const el = document.getElementById("auth-panel-container");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
              icon="login"
            >
              Workspace Log In
            </Button>
          </div>

        </div>
      </header>

      {/* Main Tab Render */}
      <main className="flex-1 z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 md:py-12 overflow-y-auto">
        {activeTab === "home" ? (
          <div className="grid gap-8 lg:grid-cols-2 items-stretch min-h-[500px]">
            
            {/* Left Side: Product messaging + Live Dashboard Preview (50% split) */}
            <div className="space-y-8 flex flex-col justify-between text-left">
              
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)]">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span>PostgreSQL Cohort Cluster Synced</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[var(--text-primary)]">
                  Attendance. Verification. <span className="gold-gradient-text">Operations.</span>
                </h1>

                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
                  A high-integrity telemetry check-in, geofence boundary logging, and administrative audit dashboard. Built for experiential student cohorts, mentors reviews, and collaborative secure workspace feeds.
                </p>
              </div>

              {/* Live Preview Dashboard (Apple/Linear Style) */}
              <Panel className="p-6 border-[var(--border-color)] bg-[var(--bg-surface)] space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="monitoring" className="text-[var(--leap-brand)] text-lg" />
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">Live Operations Feed Preview</span>
                  </div>
                  <Badge variant="success">96% Active Presence</Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-12 items-stretch">
                  
                  {/* Left Column: Metrics & Ring */}
                  <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                    <div className="grid gap-3 grid-cols-2">
                      <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-color)] text-left">
                        <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] block">Total Cohort</span>
                        <span className="text-base font-black font-mono text-[var(--text-primary)] mt-0.5 block">24 Students</span>
                      </div>
                      <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-color)] text-left">
                        <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] block">GPS Verified</span>
                        <span className="text-base font-black font-mono text-[#10B981] mt-0.5 block">22 Present</span>
                      </div>
                      <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-color)] text-left">
                        <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] block">Pending Leaves</span>
                        <span className="text-base font-black font-mono text-[#F59E0B] mt-0.5 block">1 Request</span>
                      </div>
                      <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-color)] text-left">
                        <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] block">Verification Audits</span>
                        <span className="text-base font-black font-mono text-sky-500 mt-0.5 block">100% Valid</span>
                      </div>
                    </div>

                    {/* Broadcast Notification bar */}
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-[#F59E0B]/20 text-left flex items-start gap-2">
                      <MaterialIcon name="campaign" className="text-sm text-[#F59E0B] shrink-0 mt-0.5" />
                      <div className="text-[9px] leading-normal text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)] block font-bold uppercase tracking-wider">Cohort Broadcast</strong>
                        <span>Classroom check-in window starts at 09:00 AM. Geofencing radius set to 100m.</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Attendance Ring */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-color)] min-h-[160px]">
                    <span className="text-[8px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2 text-center block">Clearance Threshold</span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="34"
                          stroke="var(--border-color)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="34"
                          stroke="#D4AF37"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="213.6"
                          strokeDashoffset="8.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-base font-mono font-black text-[var(--text-primary)]">96%</span>
                        <span className="text-[8px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">Clearance</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Live Activity Feed / Recent Check-ins */}
                <div className="space-y-2.5 text-left border-t border-[var(--border-color)] pt-4">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Live Telemetry Feed (Recent Check-Ins)</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aadhira" name="Aadhira S" size="sm" />
                        <div>
                          <span className="font-bold text-[var(--text-primary)] text-xs block">Aadhira S</span>
                          <span className="text-[8px] text-[var(--text-secondary)] font-mono">08:52 AM • Hyderabad Campus</span>
                        </div>
                      </div>
                      <Badge variant="success">GPS Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abhishek" name="Abhishek Singh" size="sm" />
                        <div>
                          <span className="font-bold text-[var(--text-primary)] text-xs block">Abhishek Singh</span>
                          <span className="text-[8px] text-[var(--text-secondary)] font-mono">08:54 AM • Hyderabad Campus</span>
                        </div>
                      </div>
                      <Badge variant="success">GPS Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2.5">
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvi" name="Tanvi Rao" size="sm" />
                        <div>
                          <span className="font-bold text-[var(--text-primary)] text-xs block">Tanvi Rao</span>
                          <span className="text-[8px] text-[var(--text-secondary)] font-mono">08:58 AM • Remote Session</span>
                        </div>
                      </div>
                      <Badge variant="brand">Bypassed</Badge>
                    </div>
                  </div>
                </div>
              </Panel>

            </div>

            {/* Right Side: Integrated Authentication Form (50% split) */}
            <div id="auth-panel-container" className="flex flex-col justify-center">
              <Panel className="p-8 border-[var(--border-color)] bg-[var(--bg-surface)] space-y-6 relative overflow-hidden text-left shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,var(--leap-brand-soft)_0%,transparent_70%)]"></div>
                
                {/* Form header switching dynamically based on viewState */}
                <div>
                  <h2 className="font-display font-black text-xl text-[var(--text-primary)]">
                    {viewState === "login" && "System Access Gate"}
                    {viewState === "forgot" && "Credentials Recovery"}
                    {viewState === "reset" && "Verification Gate"}
                  </h2>
                  <p className="text-[var(--text-secondary)] text-xs mt-1">
                    {viewState === "login" && "Provide credentials or select a test role profile below to authorize access."}
                    {viewState === "forgot" && "Provide your LeapStart email and phone number to request a simulated OTP code."}
                    {viewState === "reset" && "Check the Twilio SMS Sandbox interceptor below and submit the OTP."}
                  </p>
                </div>

                {/* Error/Success Feedbacks inline */}
                {errorMsg && (
                  <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-2">
                    <MaterialIcon name="warning" className="text-base shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-2">
                    <MaterialIcon name="task_alt" className="text-base shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* LOGIN FORM */}
                {viewState === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      id="inp-login-email-main"
                      label="Academic Email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@leapstart.gmail.com"
                      icon="mail"
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Password Key
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setViewState("forgot");
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[10px] font-bold text-[#D4AF37] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="inp-login-password-main"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          icon="key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-base" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-[var(--border-color)] bg-[var(--bg-page)] text-[#D4AF37] focus:ring-0"
                        />
                        <span>Keep me logged in</span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="brand"
                      className="w-full py-3.5"
                      icon="login"
                    >
                      <span>Enter Workspace</span>
                    </Button>
                  </form>
                )}

                {/* FORGOT PASSWORD FORM (INLINE) */}
                {viewState === "forgot" && (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <Input
                      id="inp-forgot-email-main"
                      label="Registered Academic Email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@leapstart.gmail.com"
                      icon="mail"
                    />

                    <Input
                      id="inp-forgot-phone-main"
                      label="Phone Number"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      icon="phone"
                    />

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setViewState("login");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="flex-1 py-3"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="brand"
                        className="flex-2 py-3"
                        icon="send"
                      >
                        Send Code
                      </Button>
                    </div>
                  </form>
                )}

                {/* RESET PASSWORD FORM (INLINE) */}
                {viewState === "reset" && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <Input
                      id="inp-reset-otp-main"
                      label="Twilio Verification Code"
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="LS-123456"
                      icon="verified"
                    />

                    <Input
                      id="inp-reset-newpassword-main"
                      label="New Password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      icon="key"
                    />

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setViewState("login");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="flex-1 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="brand"
                        className="flex-2 py-3"
                        icon="lock"
                      >
                        Save Password
                      </Button>
                    </div>
                  </form>
                )}

                {/* Simulated Twilio SMS Sandbox Panel (Renders inline in the right panel when code is generated) */}
                {simulatedInbox && (
                  <div className="mt-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 font-mono text-[11px] text-sky-600 dark:text-sky-300 relative overflow-hidden shadow-inner">
                    <div className="flex items-center gap-2 font-sans font-bold text-[10px] border-b border-sky-500/10 pb-2 mb-2 uppercase tracking-wider text-sky-700 dark:text-sky-400">
                      <MaterialIcon name="chat" className="text-base text-sky-500 animate-pulse" />
                      <span>Twilio Sandbox SMS Interceptor</span>
                    </div>
                    <p><strong>To Device</strong>: {simulatedInbox.to}</p>
                    <p className="mt-1.5 flex items-center gap-2">
                      <strong>Message</strong>: 
                      <span className="rounded bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 text-xs font-bold border border-sky-500/30 text-sky-700 dark:text-white">
                        LeapStart Verification Code: {simulatedInbox.otpCode}
                      </span>
                    </p>
                    <p className="mt-2 text-[9px] text-[var(--text-secondary)] font-sans italic">
                      Sandbox Mode: In a production environment, this dispatches a real SMS payload.
                    </p>
                  </div>
                )}

                {/* Role selection quick fills (Always visible at the bottom of Right Panel for testing ease) */}
                <div className="pt-4 border-t border-[var(--border-color)]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] block text-center mb-3">
                    Fast Check / Presets Logins:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button
                      onClick={() => handleQuickDemoFill("student")}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/60 p-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MaterialIcon name="school" className="text-xs text-[var(--leap-brand)] shrink-0" />
                      <span>Student</span>
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("mentor")}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/60 p-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MaterialIcon name="co_present" className="text-xs text-[var(--leap-brand)] shrink-0" />
                      <span>Mentor</span>
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("hr")}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/60 p-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MaterialIcon name="folder_shared" className="text-xs text-[var(--leap-brand)] shrink-0" />
                      <span>Coordinator</span>
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("founder")}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/60 p-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MaterialIcon name="bolt" className="text-xs text-[var(--leap-brand)] shrink-0" />
                      <span>Founder</span>
                    </button>
                  </div>
                </div>

              </Panel>
            </div>

          </div>
        ) : (
          <div className="pb-12 text-left">
            <Panel className="bg-[var(--bg-surface)] border-[var(--border-color)] px-6 py-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-mono text-[#D4AF37] font-semibold tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 bg-[#D4AF37] rounded-full animate-pulse"></span>
                <span>PUBLIC MODE — PORTFOLIO SANDBOX ACTIVE</span>
              </span>
              <span className="text-[var(--text-secondary)] text-xs">
                Review and rate active student builder implementations live below.
              </span>
            </Panel>
            
            <ProjectShowcase user={GUEST_USER} />
          </div>
        )}
      </main>

      {/* Footer Area */}
      <footer className="w-full border-t border-[var(--border-color)] py-6 bg-[var(--bg-surface)]/60 backdrop-blur-md text-xs text-[var(--text-secondary)] select-none z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] font-bold">LeapStart</span>
            <span>© 2026 LeapStart School of Technology. All Rights Reserved.</span>
          </div>
          <div className="flex gap-4">
            <a href="https://leapstart.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">Official Site</a>
            <span>|</span>
            <span className="text-[var(--leap-brand)]">Enterprise Attendance Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
