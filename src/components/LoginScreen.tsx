import React, { useState } from "react";
import { 
  LogIn, 
  KeyRound, 
  Mail, 
  ShieldAlert, 
  ArrowLeft, 
  Send, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Award,
  BookOpen,
  Terminal,
  ChevronRight,
  Users,
  CheckCircle2,
  X,
  ExternalLink,
  Star,
  Menu,
  HelpCircle,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import { UserProfile } from "../types";
import ProjectShowcase from "./ProjectShowcase";
import { motion, AnimatePresence } from "motion/react";

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
  
  // Login flow states inside the portal modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [viewState, setViewState] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      setSuccessMsg("Authorization established! Launching student dashboard...");
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
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Email not mapped to any active academic profile.");
      }

      setSuccessMsg("Reset code generated for local testing.");
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
        throw new Error(data.error || "Failed to reset. Validate OTP code credentials.");
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
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-500 dark:bg-[#070A11] dark:text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white">
      
      {/* 1. BRAND-ALIGNED REPLICA HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0B0F17]/95 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
          
          {/* LOGO BLOCK REPLICA */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <img
              src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
              alt="LeapStart Logo"
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="hidden text-[8px] font-mono font-bold tracking-widest text-[#10B981] uppercase sm:block">
              Attendance Platform
            </span>
          </div>

          {/* NAV TABS (DESKTOP OR COMPACT) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("home")}
              className={`pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === "home" 
                  ? "border-orange-500 text-slate-900 dark:text-white" 
                  : "border-transparent text-gray-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("showcase")}
              className={`pb-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "showcase" 
                  ? "border-orange-500 text-slate-900 dark:text-white" 
                  : "border-transparent text-gray-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Student Portfolios</span>
              <span className="rounded bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[9px] px-1 font-extrabold animate-pulse">
                Live
              </span>
            </button>
            <a 
              href="#framework" 
              onClick={() => { setActiveTab("home"); setTimeout(() => document.getElementById("framework")?.scrollIntoView({ behavior: 'smooth' }), 100); }}
              className="text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              4-Year Grid
            </a>
            <a 
              href="#faq" 
              onClick={() => { setActiveTab("home"); setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: 'smooth' }), 100); }}
              className="text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              FAQs
            </a>
          </nav>

          {/* ACTION BUTTONS (Portal triggering) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="leap-brand-focus flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-600 transition-colors hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-orange-400"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            
            {/* Portal trigger button */}
            <button
              onClick={() => {
                setViewState("login");
                setIsLoginModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#2E1065] px-4 py-2 text-xs font-semibold text-white  hover:bg-indigo-950  cursor-pointer transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Student & Staff Portal</span>
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE SECONDRY TAB BUTTONS */}
      <div className="flex md:hidden border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] px-4 py-2.5 gap-2.5 transition-colors">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl ${
            activeTab === "home" 
              ? "bg-slate-900 text-white dark:bg-slate-800" 
              : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab("showcase")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 ${
            activeTab === "showcase" 
              ? "bg-orange-600 text-white" 
              : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-900"
          }`}
        >
          <span>Student Portfolios</span>
          <span className="rounded-full bg-orange-100 text-orange-700 text-[8px] px-1 font-bold animate-ping">●</span>
        </button>
      </div>

      {/* 2. TAB A: EXPERIENTIAL CLASSROOM HOMEPAGE REPLICA */}
      {activeTab === "home" && (
        <div className="pb-24">
          
          {/* HERO BANNER BLOCK CONTAINER */}
          <section className="relative overflow-hidden leap-grid-bg py-16 px-4 md:py-28 dark:bg-[#080B12] dark:from-[#0B1222] dark:to-[#070A11]">
            {/* Subtle floating dot pattern wrapper */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] pointer-events-none"></div>

            <div className="relative mx-auto max-w-5xl text-center">
              
              {/* Badge label */}
              <div className="mx-auto mb-4 flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[10px] sm:text-xs font-semibold tracking-widest text-zinc-700 uppercase max-w-fit dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Operations platform for AI & data science cohorts</span>
              </div>

              {/* Title Heading */}
              <h1 className="font-display text-4xl font-black tracking-tight text-[#1E1B4B] sm:text-5xl md:text-7xl dark:text-white leading-tight">
                Attendance, leave, and student projects in one place
              </h1>

              {/* Subtitle Description */}
              <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-gray-500 sm:text-lg dark:text-slate-400">
                Exposure to Industry Tools Used by Leading Tech Giants + LeapStart's Pedagogy to Skill Building. We solve the absolute core issue in engineering education: reverse-engineered curriculum designed Backward from actual enterprise production architectures.
              </p>

              {/* Action Buttons inside Hero */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setActiveTab("showcase")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white text-white font-bold px-8 py-3.5 text-xs tracking-wider uppercase transition-all  cursor-pointer "
                >
                  <BookOpen className="h-4.5 w-4.5" />
                  <span>View Public Student Projects & Feed</span>
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white/90 hover:bg-slate-50 text-slate-900 font-bold px-8 py-3.5 text-xs tracking-wider uppercase dark:border-slate-800 dark:bg-slate-900/60 dark:text-white transition-all cursor-pointer"
                >
                  <Users className="h-4.5 w-4.5" />
                  <span>Log Into Student Desk</span>
                </button>
              </div>

              {/* Stat Brief Section */}
              <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-200/60 pt-10 dark:border-slate-800">
                <div className="text-center">
                  <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#2E1065] dark:text-orange-400">100%</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Portfolio Driven</p>
                </div>
                <div className="text-center">
                  <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#2E1065] dark:text-orange-400">1-on-1</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">CXO Mentoring</p>
                </div>
                <div className="text-center">
                  <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#2E1065] dark:text-orange-400">4 Years</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Structured Grid</p>
                </div>
                <div className="text-center">
                  <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#2E1065] dark:text-orange-400">Open</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Reviewer Critique</p>
                </div>
              </div>

            </div>
          </section>

          {/* LEAPSTART'S PEDAGOGY SECTION */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-12">
            <div className="text-center mb-10">
              <span className="text-[11px] tracking-widest font-mono font-bold text-orange-500 uppercase">THE CORE PLATFORM SHIFT</span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white mt-1">
                LeapStart's Pedagogy for Tech Skill Building
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Agile Learning Environment",
                  desc: "Students work in project pods with practical standups, code reviews, and structured delivery checkpoints.",
                  icon: Terminal,
                  color: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                },
                {
                  title: "Reverse Engineered Curriculum",
                  desc: "We look at what products enterprise tech giants are actively deploying, then work backward to teach the algorithms and math structures underneath.",
                  icon: RefreshCw,
                  color: "border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400"
                },
                {
                  title: "One-on-One Mentoring",
                  desc: "Industry practitioners and tech veterans check your student coding portfolios, grading you directly on code quality, performance matrices, and clean design.",
                  icon: Users,
                  color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-650 dark:text-emerald-400"
                },
                {
                  title: "Master by Building Real-World Applications",
                  desc: "Durable cloud micro-databases, convolutional vision processors, and custom server APIs are constructed and publicly hosted by first-year squads.",
                  icon: BookOpen,
                  color: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                },
                {
                  title: "Internship Driven Learning",
                  desc: "Academic programs that require constant, validated integration inside physical production lines and digital tech teams throughout your engineering path.",
                  icon: Globe,
                  color: "border-amber-500/20 bg-amber-500/5 text-amber-650 dark:text-amber-400"
                },
                {
                  title: "Learn from CEOs & CXOs",
                  desc: "Get structural insight, tech vector breakdowns, and corporate leadership tutorials delivered directly by tech startup founders and senior executives.",
                  icon: Award,
                  color: "border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400"
                }
              ].map((ped, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl border p-6 hover: transition-shadow bg-white dark:bg-[#0B0F17] transition-colors`}
                  style={{ borderColor: "rgba(226, 232, 240, 0.8)" }}
                >
                  <div className={`p-3 rounded-xl w-fit ${ped.color}`}>
                    <ped.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-4">{ped.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mt-2.5">{ped.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* THE 4-YEAR FRAMEWORK */}
          <section id="framework" className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-24">
            <div className="rounded-2xl bg-slate-900 px-6 py-12 text-white dark:bg-[#090D16] dark:border dark:border-slate-800 md:p-16">
              <div className="max-w-3xl">
                <span className="text-[10px] tracking-widest font-mono font-bold text-[#10B981] uppercase">CAREER ACCELERATION TRACK</span>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
                  A Tailored 4-Year Framework To Accelerate Your Career
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed">
                  Every year at LeapStart is custom engineered to transition you from core syntax into high-performance system engineering and paid full-time industry deployments.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
                {[
                  {
                    year: "Year 1",
                    title: "Building a Strong Foundation",
                    desc: "Mastering fundamental coding paradigms, terminal operations, computer science foundations, and relative path sandboxing structures."
                  },
                  {
                    year: "Year 2",
                    title: "Mastering Emerging Tech Trends",
                    desc: "Deep diving into full-stack web architectures, deep learning classifiers, robust relational databases, and data science telemetry."
                  },
                  {
                    year: "Year 3",
                    title: "Developing Real-Time Applications",
                    desc: "Authoring high-throughput server backends, autonomous OpenCV machine vision loops, and multi-user communication channels."
                  },
                  {
                    year: "Year 4",
                    title: "Be Industry-Ready & Future-Driven",
                    desc: "Securing full-time professional corporate internships while carrying out your final public showcase evaluations under expert reviewers."
                  }
                ].map((frame, index) => (
                  <div key={index} className="rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xs font-mono font-bold text-orange-400 block">{frame.year}</span>
                    <h3 className="font-display font-bold text-sm text-white mt-1.5 leading-snug">{frame.title}</h3>
                    <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed">{frame.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQS SECTION */}
          <section id="faq" className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 mt-24">
            <div className="text-center mb-10">
              <span className="text-[11px] tracking-widest font-mono font-bold text-orange-500 uppercase">HELP CENTER</span>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] dark:text-white mt-1">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "What kind of projects will I work on at LeapStart?",
                  a: "Students build fully responsive full-stack applications, autonomous computer vision inspector loops (like the Autonomous Factory Vision Agent), predictive neural network classification systems, and securely persistent dual-role administrative portals synced with live databases."
                },
                {
                  q: "How does the public feedback critique system function?",
                  a: "We believe in authentic public accountability. Once a student posts their reverse-engineered tech framework to the showcase feed, the portfolio is open-sourced to everyone. Mentors, corporate visitors, peer students, and guests can cast live rating metrics and log custom text comments."
                },
                {
                  q: "Is there real-time persistence for student check-ins and project submissions?",
                  a: "Yes. The platform is backed by your local PostgreSQL database, making sure student clock-ins, leave petitions, and portfolio ratings persist cleanly across app restarts."
                }
              ].map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0B0F17] transition-colors">
                  <h4 className="font-display font-extrabold text-sm text-[#1E1B4B] dark:text-white flex items-center gap-2">
                    <span className="text-orange-500">Q.</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mt-2.5 pl-4 border-l border-orange-500/20">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CALL TO ACTION ACCENTS */}
          <section className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 mt-24 text-center">
            <div className="rounded-2xl border border-[#e6e8ee] bg-white p-10 text-slate-950 dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-50 md:p-14 transition-colors">
              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight leading-none">Take The Leap. Lead The Future.</h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-4 max-w-xl mx-auto leading-relaxed">
                Empower your industrial software-engineering capability. Review public repositories, test demo user permissions, or login into the student dashboard.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setActiveTab("showcase")}
                  className="rounded-lg bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white text-white font-bold px-7 py-3 text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Enter Project Showcase Feed
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-7 py-3 text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Access Student Portal
                </button>
              </div>
            </div>
          </section>

          {/* REPLICA FOOTER */}
          <footer className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-24 border-t border-gray-200 dark:border-slate-800 pt-8 text-center text-xs text-gray-400 select-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
                  alt="LeapStart Logo"
                  className="h-7 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold text-slate-800 dark:text-white">© 2026</span>
                <span>• Attendance and student operations platform</span>
              </div>
              <div className="flex gap-4">
                <a href="https://leapstart.in" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Official Website</a>
                <span className="text-zinc-600">|</span>
                <span className="text-emerald-500">Local Postgres app</span>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* 3. TAB B: PUBLIC STUDENT PORTFOLIOS SHOWCASE & RATINGS FEED */}
      {activeTab === "showcase" && (
        <div className="mx-auto max-w-5xl pb-24">
          <div className="bg-emerald-50/45 dark:bg-emerald-950/10 border-b border-slate-200 dark:border-slate-800 py-4 px-6 mb-2 rounded-b-2xl flex items-center justify-between gap-4">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold leading-none flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 animate-pulse" />
              <span>PUBLIC MODE - GUEST ACCESS VALIDATED</span>
            </span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">
              Anyone visitor can submit reviews & star ratings directly below.
            </span>
          </div>

          {/* Embbeding our beautiful projects listing but injecting guestUser profile context */}
          <ProjectShowcase user={GUEST_USER} />
        </div>
      )}

      {/* 4. MODAL BACKDROP CONTAINER: SYSTEM ACCESS GATEWAY & LOGIN PORTAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md">
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6  dark:border-slate-800 dark:bg-[#0B0F17] overflow-hidden transition-colors"
            >
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setSimulatedInbox(null);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="absolute top-5 right-5 text-gray-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5.5 w-5.5" />
              </button>

              {/* Branding and Subhead */}
              <div className="mb-6 flex flex-col items-center text-center">
                <img
                  src={theme === "dark" ? LOGO_LIGHT : LOGO_DARK}
                  alt="LeapStart Logo"
                  className="mb-3 h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  LeapStart Portal
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Enter student credentials or select a test role profile below.
                </p>
              </div>

              {/* Success / Error Banners */}
              {errorMsg && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* VIEW A: SIGN IN FORM */}
              {viewState === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Academic Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="inp-login-email-modal"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aadhira@leapstart.gmail.com"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                        Password Key
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setViewState("forgot");
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[10px] font-bold text-orange-600 hover:underline dark:text-orange-400 cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <input
                        id="inp-login-password-modal"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-login-submit-modal"
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E1065] py-3.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-indigo-950 cursor-pointer  disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    <span>Portal Authentication</span>
                  </button>
                </form>
              )}

              {/* VIEW B: FORGOT PASSWORD */}
              {viewState === "forgot" && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Provide your LeapStart email, and our security system will generate an OTP code, intercepted in the simulation outbox for fast resetting.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Leapstart School Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="inp-forgot-email-modal"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aadhira@leapstart.gmail.com"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewState("login");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-2 flex items-center justify-center gap-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:hover:bg-white cursor-pointer transition-colors"
                    >
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Send reset code</span>
                    </button>
                  </div>
                </form>
              )}

              {/* VIEW C: PASSWORD VERIFICATION */}
              {viewState === "reset" && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Check the Simulated Outbox logs at the bottom to fetch your verification OTP credentials.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-gray-500">OTP Security Token</label>
                    <input
                      id="inp-reset-otp-modal"
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="LS-849201"
                      className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2.5 text-xs font-mono font-bold tracking-widest text-emerald-600 outline-none dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-gray-500">New Password Key</label>
                    <input
                      id="inp-reset-new-password-modal"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewState("login");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-2 flex items-center justify-center gap-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
                    >
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      <span>Save Password</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SIMULATED SMTP SYSTEM FEED */}
              {simulatedInbox && (
                <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-4 font-mono text-[10px] text-sky-800 dark:border-emerald-950/20 dark:bg-emerald-950/15 dark:text-emerald-350">
                  <div className="flex items-center gap-1.5 font-sans font-extrabold text-[10px] border-b border-sky-200/40 pb-2 mb-2 uppercase tracking-wider text-sky-900 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-ping bg-emerald-400 rounded-full"></span>
                    <span>Sandbox Interceptor Mail Outbox</span>
                  </div>
                  <p><strong>To Recipient</strong>: {simulatedInbox.to}</p>
                  <p className="mt-1 flex items-center gap-2">
                    <strong>OTP Token</strong>: 
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 font-bold text-sky-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                      {simulatedInbox.otpCode}
                    </span>
                  </p>
                  <p className="mt-2 text-[9px] text-gray-400 font-sans italic">
                    Local testing mode shows the reset code immediately.
                  </p>
                </div>
              )}

              {/* QUICK FILL COHORT ACCELERATION LINKS */}
              {viewState === "login" && (
                <div className="mt-6 border-t border-gray-200 pt-5 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block text-center mb-3">
                    Demo logins:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button
                      onClick={() => handleQuickDemoFill("student")}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] font-medium text-slate-800 hover:bg-orange-50 hover:border-orange-400/30 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      🎓 Student Demo
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("mentor")}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] font-medium text-slate-800 hover:bg-orange-50 hover:border-orange-400/30 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      🏫 Mentor Demo
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("hr")}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] font-medium text-slate-800 hover:bg-orange-50 hover:border-orange-400/30 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      📁 HR Coordinator
                    </button>
                    <button
                      onClick={() => handleQuickDemoFill("founder")}
                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-[11px] font-medium text-slate-800 hover:bg-orange-50 hover:border-orange-400/30 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      ⚡ Founder Demo
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
