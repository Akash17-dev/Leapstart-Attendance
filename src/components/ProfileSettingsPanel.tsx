import React, { useState } from "react";
import { Camera, Github, Globe, Linkedin, Save } from "lucide-react";
import { UserProfile } from "../types";

interface ProfileSettingsPanelProps {
  user: UserProfile;
  onUserUpdated: (user: UserProfile) => void;
}

export default function ProfileSettingsPanel({ user, onUserUpdated }: ProfileSettingsPanelProps) {
  const [form, setForm] = useState({
    linkedinUrl: user.linkedinUrl || "",
    githubUrl: user.githubUrl || "",
    portfolioUrl: user.portfolioUrl || "",
    pfpUrl: user.pfpUrl || ""
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Profile update failed.");
      }
      onUserUpdated(data);
      setStatus("Profile links and photo updated.");
    } catch (err: any) {
      setStatus(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="premium-panel p-6">
        <div className="flex items-center gap-4">
          <img
            src={form.pfpUrl || user.pfpUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-3xl border border-[var(--leap-border)] bg-[#e8f2ff] object-cover"
          />
          <div>
            <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">{user.name}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="mt-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider leap-emerald-pill">
              Student profile controls
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Keep these links current for mentors, public project reviews, and showcase visitors. GitHub and portfolio are optional.
        </p>
      </section>

      <form onSubmit={submit} className="premium-panel p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn URL
            </span>
            <input
              value={form.linkedinUrl}
              onChange={(event) => updateField("linkedinUrl", event.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Github className="h-3.5 w-3.5" />
              GitHub URL
            </span>
            <input
              value={form.githubUrl}
              onChange={(event) => updateField("githubUrl", event.target.value)}
              placeholder="https://github.com/..."
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Globe className="h-3.5 w-3.5" />
              Portfolio URL
            </span>
            <input
              value={form.portfolioUrl}
              onChange={(event) => updateField("portfolioUrl", event.target.value)}
              placeholder="https://your-portfolio.dev"
              className="premium-input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Camera className="h-3.5 w-3.5" />
              Profile picture URL
            </span>
            <input
              value={form.pfpUrl}
              onChange={(event) => updateField("pfpUrl", event.target.value)}
              placeholder="https://..."
              className="premium-input"
            />
          </label>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-[var(--leap-border)] bg-white/60 px-4 py-3 text-xs font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="apple-primary mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
