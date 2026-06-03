/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { IncubationIdea, UserProfile } from "../types";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

interface IncubationHubProps {
  user: UserProfile;
}

const stages: IncubationIdea["stage"][] = ["idea", "prototype", "pilot", "launched"];

export default function IncubationHub({ user }: IncubationHubProps) {
  const [ideas, setIdeas] = useState<IncubationIdea[]>([]);
  const [form, setForm] = useState({
    title: "",
    problem: "",
    stage: "idea" as IncubationIdea["stage"],
    tags: "AI, EdTech"
  });
  const [files, setFiles] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const response = await fetch("/api/incubation/ideas");
    const data = await response.json();
    setIdeas(data);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const names = Array.from(event.dataTransfer.files as FileList).map((file) => file.name);
    setFiles((current) => Array.from(new Set([...current, ...names])));
  };

  const submitIdea = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/incubation/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ownerId: user.id,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        attachmentNames: files
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Unable to add idea.");
      return;
    }
    setIdeas((current) => [data, ...current]);
    setForm({ title: "", problem: "", stage: "idea", tags: "AI, EdTech" });
    setFiles([]);
    setStatus("Idea added to the incubation hub.");
  };

  return (
    <div className="dashboard-shell flex-1 overflow-y-auto px-6 py-6 font-sans md:px-8">
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="text-left">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Incubation Hub
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            A shared place where startup ideas, prototypes, and mentor notes can grow.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37]">
          <MaterialIcon name="rocket_launch" className="text-base" />
          <span className="font-mono text-xs font-semibold">Founder pipeline</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel className="p-5 text-left h-fit">
          <div className="mb-4 flex items-center gap-2">
            <MaterialIcon name="lightbulb" className="text-xl text-[var(--leap-brand)]" />
            <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">Add startup idea</h3>
          </div>

          <form onSubmit={submitIdea} className="space-y-4">
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              placeholder="Idea title"
              label="Idea title"
            />
            
            <Input
              isTextArea
              rows={4}
              value={form.problem}
              onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))}
              required
              placeholder="What problem are you solving?"
              label="Problem"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Stage</label>
                <select
                  value={form.stage}
                  onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value as IncubationIdea["stage"] }))}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 px-4 py-3 text-xs text-[var(--text-primary)] outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <Input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="Tags, comma separated"
                label="Tags"
              />
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-page)]/30 p-6 text-center"
            >
              <MaterialIcon name="upload_file" className="mx-auto text-3xl text-[var(--leap-brand)]" />
              <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">Drop pitch decks, wireframes, or notes here</p>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">This local demo stores file names as idea attachments.</p>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {files.map((file) => (
                    <span key={file} className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">{file}</span>
                  ))}
                </div>
              )}
            </div>

            {status && <p className="text-xs font-semibold text-[var(--text-secondary)]">{status}</p>}

            <Button type="submit" variant="brand" className="w-full py-3">
              Add to incubation hub
            </Button>
          </form>
        </Panel>

        <section className="space-y-4 text-left">
          {ideas.map((idea) => (
            <Panel key={idea.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25">
                    {idea.stage}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-[var(--text-primary)]">{idea.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{idea.problem}</p>
                </div>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {idea.ownerName}<br />{idea.ownerRole}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-[var(--bg-page)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {tag}
                  </span>
                ))}
              </div>
              {idea.attachmentNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-color)] pt-4">
                  {idea.attachmentNames.map((file) => (
                    <span key={file} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <MaterialIcon name="attach_file" className="text-xs" />
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </Panel>
          ))}
          {ideas.length === 0 && (
            <Panel className="p-10 text-center text-sm text-[var(--text-secondary)]">No startup ideas yet. Add the first one.</Panel>
          )}
        </section>
      </div>
    </div>
  );
}
