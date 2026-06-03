/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, PostedProject, PublicFeedback } from "../types";
import { MaterialIcon, Button, Input, Panel } from "./DesignSystem";

interface ProjectShowcaseProps {
  user: UserProfile;
}

export default function ProjectShowcase({ user }: ProjectShowcaseProps) {
  const [projects, setProjects] = useState<PostedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostingFormOpen, setIsPostingFormOpen] = useState(false);

  // Form states for posting new project
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTagsString, setNewTagsString] = useState("");
  const [newGithub, setNewGithub] = useState("");
  const [newLive, setNewLive] = useState("");
  const [postSuccess, setPostSuccess] = useState("");
  const [postError, setPostError] = useState("");

  // Feedback states mapped by Project ID to avoid global collision
  const [reviewersNames, setReviewersNames] = useState<Record<string, string>>({});
  const [reviewRoles, setReviewRoles] = useState<Record<string, string>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/projects");
      if (resp.ok) {
        const data = await resp.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to load showcase projects", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    setPostSuccess("");

    if (!newTitle.trim() || !newDescription.trim()) {
      setPostError("Please fill in the project title and Elevator Pitch description.");
      return;
    }

    const tagsArray = newTagsString
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      const resp = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          avatarUrl: user.pfpUrl,
          title: newTitle.trim(),
          description: newDescription.trim(),
          tags: tagsArray,
          githubUrl: newGithub.trim(),
          liveUrl: newLive.trim()
        })
      });

      if (resp.ok) {
        setPostSuccess("Your project has been successfully posted to the LeapStart Public Showcase!");
        setNewTitle("");
        setNewDescription("");
        setNewTagsString("");
        setNewGithub("");
        setNewLive("");
        fetchProjects();
        setTimeout(() => {
          setIsPostingFormOpen(false);
          setPostSuccess("");
        }, 3000);
      } else {
        const errData = await resp.json();
        setPostError(errData.error || "Failed to publish project.");
      }
    } catch (err) {
      setPostError("Network error publishing project. Please check backend connection.");
    }
  };

  const submitFeedback = async (projectId: string) => {
    const authorName = reviewersNames[projectId]?.trim() || user.name;
    const authorRole = reviewRoles[projectId]?.trim() || (user.role === "student" ? "Leapstart Student" : user.specialty || user.role);
    const comment = reviewComments[projectId]?.trim() || "";
    const rating = reviewRatings[projectId] || 5;

    if (!comment) {
      alert("Please enter feedback text comment before submitting.");
      return;
    }

    try {
      const resp = await fetch(`/api/projects/${projectId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorRole,
          authorPfp: user.id === "guest" ? undefined : user.pfpUrl,
          comment,
          rating
        })
      });

      if (resp.ok) {
        setReviewComments(prev => ({ ...prev, [projectId]: "" }));
        setReviewRatings(prev => ({ ...prev, [projectId]: 5 }));
        setSubmitSuccessMsg(prev => ({ ...prev, [projectId]: "Review submitted! Rating synced." }));
        
        fetchProjects();
        
        setTimeout(() => {
          setSubmitSuccessMsg(prev => ({ ...prev, [projectId]: "" }));
        }, 4000);
      }
    } catch (e) {
      console.error("Feedback submit error", e);
    }
  };

  const filteredProjects = projects.filter(proj => {
    const query = searchQuery.toLowerCase();
    return (
      proj.title.toLowerCase().includes(query) ||
      proj.description.toLowerCase().includes(query) ||
      proj.studentName.toLowerCase().includes(query) ||
      proj.tags.some(t => t.toLowerCase().includes(query))
    );
  });

  const renderStars = (rating: number, interactive: boolean = false, onClick?: (stars: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onClick && onClick(star)}
              className={`flex items-center justify-center p-0.5 ${interactive ? "cursor-pointer hover:scale-115 transition-transform" : ""}`}
            >
              <MaterialIcon
                name="star"
                fill={filled}
                className={`text-sm ${
                  filled ? "text-[#ffcc00]" : "text-gray-300 dark:text-slate-700"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-shell px-6 py-6 font-sans md:px-8">
      {/* Showcase header */}
      <div className="mb-8 border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="text-left">
          <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono font-extrabold uppercase text-[#10B981] mb-1.5 bg-[#10B981]/5 px-2.5 py-1 rounded-full max-w-fit border border-emerald-500/20">
            <MaterialIcon name="workspace_premium" className="text-sm" />
            <span>STUDENT PROJECT REVIEW</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Leap<span className="text-[#007aff]">Start</span> Showcase & Feed
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl">
            Students share their reverse-engineered tech projects, artificial intelligence frameworks, and active server deployments to request fully open feedback and real-time community ratings.
          </p>
        </div>

        {user.role === "student" && (
          <Button
            id="btn-showcase-post-propose"
            onClick={() => setIsPostingFormOpen(!isPostingFormOpen)}
            variant="brand"
            icon={isPostingFormOpen ? "close" : "add"}
          >
            Post Your Project
          </Button>
        )}
      </div>

      {/* MODAL / COLLAPSIBLE CONTAINER FOR POSTING NEW PROJECTS */}
      <AnimatePresence>
        {isPostingFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 text-left"
          >
            <Panel className="relative">
              <button
                onClick={() => setIsPostingFormOpen(false)}
                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
              >
                <MaterialIcon name="close" className="text-xl" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <MaterialIcon name="terminal" className="text-xl text-[#007aff]" />
                <h3 className="font-display font-bold text-[var(--text-primary)]">
                  Publish project
                </h3>
              </div>

              {postSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-500/10 p-3.5 text-xs text-[#10B981] border border-emerald-500/20 text-left">
                  <MaterialIcon name="check_circle" className="text-base mr-1.5 inline-block align-middle" />
                  <span className="align-middle">{postSuccess}</span>
                </div>
              )}

              {postError && (
                <div className="mb-4 rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-500 border border-rose-500/20 text-left">
                  {postError}
                </div>
              )}

              <form onSubmit={handlePostProjectSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <Input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Distributed Ledger Proxy"
                    label="Project Title *"
                  />

                  <Input
                    type="text"
                    required
                    value={newTagsString}
                    onChange={(e) => setNewTagsString(e.target.value)}
                    placeholder="e.g. React, Express, PostgreSQL, Docker"
                    label="Tech Stack Tags (Comma separated) *"
                  />

                  <div className="grid gap-4 grid-cols-2">
                    <Input
                      type="url"
                      value={newGithub}
                      onChange={(e) => setNewGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      label="GitHub Repository"
                    />
                    <Input
                      type="url"
                      value={newLive}
                      onChange={(e) => setNewLive(e.target.value)}
                      placeholder="https://my-app.run.app"
                      label="Live Demo URL"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <Input
                    isTextArea
                    rows={5}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe what real-world problem your application solves, its architectural bottlenecks, and your core technical takeaways..."
                    label="Elevator Pitch & Highlights *"
                  />

                  <Button
                    type="submit"
                    variant="brand"
                    className="w-full py-3"
                    icon="send"
                  >
                    Confirm Publication & Seed Feed
                  </Button>
                </div>
              </form>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and feed controls */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 backdrop-blur-xl">
        <div className="relative flex-1 w-full text-left">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by tech stack, names, tags, or keywords..."
            icon="search"
          />
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] font-mono font-medium shrink-0 bg-[var(--bg-page)]/80 px-3 py-2 rounded-lg border border-[var(--border-color)]">
          Total Showcase: {filteredProjects.length} Projects
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <MaterialIcon name="sync" className="animate-spin text-3xl text-[#007aff]" />
          <span className="text-xs text-[var(--text-secondary)]">Synthesizing experiential portfolios index...</span>
        </div>
      ) : (
        <div className="space-y-8 text-left">
          {filteredProjects.map((proj) => {
            const currentRating = reviewRatings[proj.id] || 5;
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Panel className="p-0 overflow-hidden">
                  {/* PROJECT SUMMARY PANEL (TOP) */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[var(--border-color)] pb-5">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={proj.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proj.studentName}`}
                          alt={proj.studentName}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-bold text-[var(--text-primary)] text-lg">
                              {proj.title}
                            </h2>
                            <span className="rounded-full bg-[#e8f2ff] hover:bg-[#e8f2ff] px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#0066cc] dark:bg-[#0a84ff]/14 dark:text-[#64aaff] border border-[#007aff]/10 mt-0.5">
                              ★ {proj.averageRating ? proj.averageRating : "No ratings"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                            <span>By <strong>{proj.studentName}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">
                              {new Date(proj.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Meta Controls & URLs */}
                      <div className="flex items-center gap-2 lg:self-start">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <MaterialIcon name="code" className="text-base" />
                            <span>Repo</span>
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors cursor-pointer"
                          >
                            <MaterialIcon name="open_in_new" className="text-base" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans pre-wrap">
                        {proj.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {proj.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[var(--bg-page)] text-[var(--text-secondary)] px-2 py-0.5 text-[10px] font-mono font-semibold border border-[var(--border-color)]"
                          >
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FEEDBACK FEED & COMMENT CRITIQUE LIST */}
                  <div className="bg-[var(--bg-page)]/40 p-6 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2 mb-4">
                      <MaterialIcon name="forum" className="text-base text-[#007aff]" />
                      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Public Evaluations & Critique
                      </h3>
                      <span className="rounded bg-[#e8f2ff] text-[#0051d5] text-[10px] font-bold px-1.5 py-0.2 dark:bg-[#0a84ff]/14 dark:text-[#64aaff] ml-1">
                        {proj.feedbacks.length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1 mb-5">
                      {proj.feedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-surface)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                              {fb.authorPfp ? (
                                <img
                                  src={fb.authorPfp}
                                  alt={fb.authorName}
                                  referrerPolicy="no-referrer"
                                  className="h-7 w-7 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)]"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-lg bg-[#e8f2ff] text-[#0066cc] text-xs font-bold flex items-center justify-center border border-[var(--border-color)] shrink-0">
                                  {fb.authorName[0]}
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                  {fb.authorName}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] capitalize block font-medium mt-0.5">
                                  {fb.authorRole}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex justify-end">{renderStars(fb.rating)}</div>
                              <span className="text-[9px] text-[var(--text-secondary)] font-mono mt-1 block">
                                {new Date(fb.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--text-primary)] mt-3 pl-1 leading-relaxed border-l-2 border-[#007aff]/20">
                            {fb.comment}
                          </p>
                        </div>
                      ))}
                      {proj.feedbacks.length === 0 && (
                        <p className="text-center text-xs text-[var(--text-secondary)] italic py-6">
                          No evaluations logged yet. Be the first to share feedback and cast a rating below!
                        </p>
                      )}
                    </div>

                    {/* INTERACTIVE COMPOSER FORM FOR CRITIQUE */}
                    <div className="border-t border-[var(--border-color)] pt-5">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-3 block">
                        Submit Your Critique & Star Rating
                      </h4>

                      {submitSuccessMsg[proj.id] && (
                        <div className="mb-3 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-[#10B981] border border-emerald-500/25">
                          {submitSuccessMsg[proj.id]}
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-3">
                          <Input
                            label="Your Name"
                            type="text"
                            value={reviewersNames[proj.id] !== undefined ? reviewersNames[proj.id] : user.name}
                            onChange={(e) => setReviewersNames(prev => ({ ...prev, [proj.id]: e.target.value }))}
                          />
                          <Input
                            label="Your Profession / Role"
                            type="text"
                            value={reviewRoles[proj.id] !== undefined ? reviewRoles[proj.id] : (user.role === "student" ? "Leapstart Student" : user.specialty || user.role)}
                            onChange={(e) => setReviewRoles(prev => ({ ...prev, [proj.id]: e.target.value }))}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Rating:</span>
                              {renderStars(currentRating, true, (stars) => {
                                setReviewRatings(prev => ({ ...prev, [proj.id]: stars }));
                              })}
                            </div>
                            <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                              Rating selection: <strong>{currentRating} Stars</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={reviewComments[proj.id] || ""}
                              onChange={(e) => setReviewComments(prev => ({ ...prev, [proj.id]: e.target.value }))}
                              placeholder="Write your public experiential critique feedback on this student project..."
                              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#007aff]"
                            />
                            <Button
                              onClick={() => submitFeedback(proj.id)}
                              className="h-9 w-9 p-0 rounded-xl"
                              icon="send"
                              title="Submit feedback"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="py-16 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] backdrop-blur-xl">
              <span className="text-3xl block mb-2">folder_open</span>
              <h3 className="font-display font-medium text-[var(--text-primary)]">No matching showcased projects found</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                No active uploads are mapped to your queries. Be the first to publish a project.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
