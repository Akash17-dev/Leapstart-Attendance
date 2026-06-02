import React, { useEffect, useState } from "react";
import { Lightbulb, Paperclip, Rocket, UploadCloud } from "lucide-react";
import { IncubationIdea, UserProfile } from "../types";

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
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Incubation Hub
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            A shared place where startup ideas, prototypes, and mentor notes can grow.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-1.5 leap-brand-pill">
          <Rocket className="h-4 w-4" />
          <span className="font-mono text-xs font-semibold">Founder pipeline</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitIdea} className="premium-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[var(--leap-brand)]" />
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Add startup idea</h3>
          </div>

          <div className="space-y-4">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              placeholder="Idea title"
              className="premium-input"
            />
            <textarea
              value={form.problem}
              onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))}
              required
              rows={4}
              placeholder="What problem are you solving?"
              className="premium-input resize-none"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={form.stage}
                onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value as IncubationIdea["stage"] }))}
                className="premium-input"
              >
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="Tags, comma separated"
                className="premium-input"
              />
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="rounded-3xl border border-dashed border-[var(--leap-border)] bg-white/54 p-6 text-center dark:bg-white/6"
            >
              <UploadCloud className="mx-auto h-8 w-8 text-[var(--leap-brand)]" />
              <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Drop pitch decks, wireframes, or notes here</p>
              <p className="mt-1 text-[10px] text-slate-400">This local demo stores file names as idea attachments.</p>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {files.map((file) => (
                    <span key={file} className="rounded-full px-2.5 py-1 text-[10px] font-semibold leap-emerald-pill">{file}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {status && <p className="mt-3 text-xs font-semibold text-slate-500">{status}</p>}
          <button type="submit" className="apple-primary mt-5 w-full px-4 py-3 text-sm font-bold">
            Add to incubation hub
          </button>
        </form>

        <section className="space-y-4">
          {ideas.map((idea) => (
            <article key={idea.id} className="premium-panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider leap-brand-pill">
                    {idea.stage}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-slate-950 dark:text-white">{idea.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{idea.problem}</p>
                </div>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {idea.ownerName}<br />{idea.ownerRole}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              {idea.attachmentNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--leap-border)] pt-4">
                  {idea.attachmentNames.map((file) => (
                    <span key={file} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold leap-emerald-pill">
                      <Paperclip className="h-3 w-3" />
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
          {ideas.length === 0 && (
            <div className="premium-panel p-10 text-center text-sm text-slate-500">No startup ideas yet. Add the first one.</div>
          )}
        </section>
      </div>
    </div>
  );
}
