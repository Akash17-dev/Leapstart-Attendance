/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

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
      <Panel className="p-6 text-left flex flex-col justify-between h-fit">
        <div className="flex items-center gap-4">
          <img
            src={form.pfpUrl || user.pfpUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] object-cover shrink-0"
          />
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{user.name}</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{user.email}</p>
            <p className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-[#10B981] border border-emerald-500/25">
              Student profile controls
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
          Keep these links current for mentors, public project reviews, and showcase visitors. GitHub and portfolio are optional.
        </p>
      </Panel>

      <Panel className="p-6 text-left">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={form.linkedinUrl}
              onChange={(event) => updateField("linkedinUrl", event.target.value)}
              placeholder="https://linkedin.com/in/..."
              label="LinkedIn URL"
              icon="link"
            />

            <Input
              value={form.githubUrl}
              onChange={(event) => updateField("githubUrl", event.target.value)}
              placeholder="https://github.com/..."
              label="GitHub URL"
              icon="code"
            />

            <Input
              value={form.portfolioUrl}
              onChange={(event) => updateField("portfolioUrl", event.target.value)}
              placeholder="https://your-portfolio.dev"
              label="Portfolio URL"
              icon="language"
            />

            <Input
              value={form.pfpUrl}
              onChange={(event) => updateField("pfpUrl", event.target.value)}
              placeholder="https://..."
              label="Profile picture URL"
              icon="photo_camera"
            />
          </div>

          {status && (
            <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">
              {status}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            variant="brand"
            className="w-full mt-4 py-3"
            icon="save"
          >
            Save profile
          </Button>
        </form>
      </Panel>
    </div>
  );
}
