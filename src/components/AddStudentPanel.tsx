/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

interface AddStudentPanelProps {
  compact?: boolean;
  onStudentAdded: (student: UserProfile) => void;
}

const emptyState = {
  name: "",
  email: "",
  password: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  pfpUrl: "",
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
    <Panel className="overflow-hidden p-0 mb-6">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3">
        <div className="min-w-0 text-left">
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Add Student
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Create a live student account and attendance record.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setOpen((current) => !current)}
          variant="secondary"
          className="px-3 py-2 text-xs"
          icon={open ? "close" : "add"}
        >
          {open ? "Close" : "New Student"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2">
          <Input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Student full name"
            label="Full name"
          />

          <Input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="student@leapstart.gmail.com"
            label="Email"
          />

          <Input
            required
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="student@123"
            label="Password"
          />

          <Input
            value={form.linkedinUrl}
            onChange={(event) => updateField("linkedinUrl", event.target.value)}
            placeholder="https://linkedin.com/in/..."
            label="LinkedIn URL"
          />

          <Input
            value={form.skills}
            onChange={(event) => updateField("skills", event.target.value)}
            placeholder="React, Node.js, SQL"
            label="Skills"
          />

          <Input
            value={form.githubUrl}
            onChange={(event) => updateField("githubUrl", event.target.value)}
            placeholder="https://github.com/..."
            label="GitHub URL"
          />

          <Input
            value={form.portfolioUrl}
            onChange={(event) => updateField("portfolioUrl", event.target.value)}
            placeholder="https://your-portfolio.dev"
            label="Portfolio URL"
          />

          <Input
            value={form.pfpUrl}
            onChange={(event) => updateField("pfpUrl", event.target.value)}
            placeholder="https://..."
            label="Profile picture URL"
            className="md:col-span-2"
          />

          <Input
            value={form.specialty}
            onChange={(event) => updateField("specialty", event.target.value)}
            placeholder="1st Year Student"
            label="Program label"
          />

          <Input
            isTextArea
            rows={3}
            value={form.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            placeholder="Short profile note for mentors and admin dashboards."
            label="Bio"
            className="md:col-span-2"
          />

          {status && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-semibold md:col-span-2 text-left ${
                status.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-[#10B981]"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-500"
              }`}
            >
              {status.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            variant="brand"
            className="md:col-span-2 py-3"
          >
            Add student
          </Button>
        </form>
      )}
    </Panel>
  );
}
