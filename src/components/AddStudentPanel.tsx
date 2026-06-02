import React, { useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import { UserProfile } from "../types";

interface AddStudentPanelProps {
  compact?: boolean;
  onStudentAdded: (student: UserProfile) => void;
}

const emptyState = {
  name: "",
  email: "",
  password: "",
  linkedinUrl: "",
  bio: "",
  skills: "React, JavaScript, PostgreSQL",
  specialty: "1st Year Student"
};

export default function AddStudentPanel({ compact = false, onStudentAdded }: AddStudentPanelProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyState);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof typeof emptyState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/users/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to add student.");
      }

      onStudentAdded(data);
      setForm(emptyState);
      setStatus({ type: "success", text: `${data.name} added to the live Postgres roster.` });
      if (compact) {
        setOpen(false);
      }
    } catch (err: any) {
      setStatus({ type: "error", text: err.message || "Student creation failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="premium-panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--leap-border)] px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Add Student
          </h3>
          <p className="mt-0.5 text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
            Create a live student account and attendance record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="leap-brand-focus apple-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Close" : "New Student"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full name</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Student full name"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="student@leapstart.gmail.com"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</span>
            <input
              required
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="student@123"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">LinkedIn URL</span>
            <input
              value={form.linkedinUrl}
              onChange={(event) => updateField("linkedinUrl", event.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Skills</span>
            <input
              value={form.skills}
              onChange={(event) => updateField("skills", event.target.value)}
              placeholder="React, Node.js, SQL"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Program label</span>
            <input
              value={form.specialty}
              onChange={(event) => updateField("specialty", event.target.value)}
              placeholder="1st Year Student"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bio</span>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Short profile note for mentors and admin dashboards."
              className="premium-input resize-none"
            />
          </label>

          {status && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-semibold md:col-span-2 ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
              }`}
            >
              {status.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="leap-brand-focus apple-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 md:col-span-2"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? "Adding student..." : "Add student"}
          </button>
        </form>
      )}
    </section>
  );
}
