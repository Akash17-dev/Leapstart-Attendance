import React, { useState, useEffect } from "react";
import { 
  Star, 
  Github, 
  ExternalLink, 
  MessageSquare, 
  Plus, 
  Search, 
  Award, 
  Terminal, 
  CheckCircle2, 
  X,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, PostedProject, PublicFeedback } from "../types";

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
        // Clear inputs for this project
        setReviewComments(prev => ({ ...prev, [projectId]: "" }));
        setReviewRatings(prev => ({ ...prev, [projectId]: 5 }));
        setSubmitSuccessMsg(prev => ({ ...prev, [projectId]: "Review submitted! Rating synced." }));
        
        fetchProjects(); // Reload feed
        
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

  // Renders beautiful feedback stars
  const renderStars = (rating: number, interactive: boolean = false, onClick?: (stars: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;
          return (
            <Star
              key={star}
              onClick={() => interactive && onClick && onClick(star)}
              className={`h-4 w-4 ${interactive ? "cursor-pointer hover:scale-115 transition-transform" : ""} ${
                filled ? "fill-[#ffcc00] text-[#0a84ff]" : "text-gray-300 dark:text-slate-700"
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-shell px-6 py-6 font-sans md:px-8">
      {/* Showcase header */}
      <div className="mb-8 border-b border-gray-100 dark:border-slate-800/60 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono font-extrabold uppercase text-[#10B981] mb-1.5 bg-[#10B981]/5 px-2.5 py-1 rounded-full max-w-fit">
            <Award className="h-3.5 w-3.5" />
            <span>STUDENT PROJECT REVIEW</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Leap<span className="text-[#007aff]">Start</span> Showcase & Feed
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 max-w-2xl">
            Students share their reverse-engineered tech projects, artificial intelligence frameworks, and active server deployments to request fully open feedback and real-time community ratings.
          </p>
        </div>

        {/* POST PROJECT TRIGGER (Students Only Or Anyone in Demo Context) */}
        {user.role === "student" && (
          <button
            id="btn-showcase-post-propose"
            onClick={() => setIsPostingFormOpen(!isPostingFormOpen)}
            className="apple-primary flex items-center gap-2 px-5 py-3 font-semibold cursor-pointer transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Post Your Project</span>
          </button>
        )}
      </div>

      {/* MODAL / COLLAPSIBLE CONTAINER FOR POSTING NEW PROJECTS */}
      <AnimatePresence>
        {isPostingFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 rounded-xl border border-[#007aff]/20 bg-[#e8f2ff]/35 p-6 dark:border-[#007aff]/12 dark:bg-slate-900/40  relative"
          >
            <button
              onClick={() => setIsPostingFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-5 w-5 text-[#007aff]" />
              <h3 className="font-display font-bold text-slate-800 dark:text-gray-100">
                Publish project
              </h3>
            </div>

            {postSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
                {postSuccess}
              </div>
            )}

            {postError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100">
                {postError}
              </div>
            )}

            <form onSubmit={handlePostProjectSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Distributed Ledger Ledger Proxy"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Tech Stack Tags (Comma separated) *</label>
                  <input
                    type="text"
                    required
                    value={newTagsString}
                    onChange={(e) => setNewTagsString(e.target.value)}
                    placeholder="e.g. React, Express, PostgreSQL, Docker"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400">GitHub Repository Link</label>
                    <input
                      type="url"
                      value={newGithub}
                      onChange={(e) => setNewGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Live Demo URL</label>
                    <input
                      type="url"
                      value={newLive}
                      onChange={(e) => setNewLive(e.target.value)}
                      placeholder="https://my-app.run.app"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Elevator Pitch & Highlights *</label>
                  <textarea
                    rows={5}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe what real-world problem your application solves, its architectural bottlenecks, and your core technical takeaways..."
                    className="w-full flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="apple-primary w-full py-3 font-semibold transition-all text-xs cursor-pointer"
                >
                  Confirm Publication & Seed Feed
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and feed controls */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-[var(--leap-border)] bg-[var(--leap-surface)] p-3 backdrop-blur-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by tech stack, names, tags, or keywords..."
            className="w-full rounded-xl bg-gray-50/40 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-gray-900 dark:text-white outline-none border border-transparent focus:border-[#007aff]/50"
          />
        </div>
        <div className="text-[11px] text-gray-400 font-mono font-medium shrink-0 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800">
          Total Showcase: {filteredProjects.length} Projects
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#007aff] border-t-transparent"></div>
          <span className="text-xs text-gray-400">Synthesizing experiential portfolios index...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredProjects.map((proj) => {
            const currentRating = reviewRatings[proj.id] || 5;
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900  hover: transition-shadow overflow-hidden"
              >
                {/* PROJECT SUMMARY PANEL (TOP) */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-gray-50 dark:border-slate-800/50 pb-5">
                    {/* Student Info & Title */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={proj.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proj.studentName}`}
                        alt={proj.studentName}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-xl bg-[#e8f2ff] border border-[#007aff]/18 object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg">
                            {proj.title}
                          </h2>
                          <span className="rounded-full bg-[#e8f2ff] hover:bg-[#e8f2ff] px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#0066cc] dark:bg-[#0a84ff]/14 dark:text-[#0a84ff] border border-[#007aff]/10 mt-0.5">
                            ★ {proj.averageRating ? proj.averageRating : "No ratings"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>By <strong>{proj.studentName}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-gray-400">
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
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Github className="h-3.5 w-3.5" />
                          <span>Repo</span>
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apple-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Pitch description */}
                  <div className="mt-5">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pre-wrap">
                      {proj.description}
                    </p>

                    {/* Tech tag list */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 text-slate-700 px-2 py-0.5 text-[10px] font-mono font-semibold dark:bg-slate-800 dark:text-slate-300 border border-gray-200/20"
                        >
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FEEDBACK FEED & COMMENT CRITIQUE LIST */}
                <div className="bg-gray-50/70 p-6 border-t border-gray-100 dark:bg-slate-950/20 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-4.5 w-4.5 text-[#007aff]" />
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Public Evaluations & Critique
                    </h3>
                    <span className="rounded bg-[#e8f2ff] text-[#0051d5] text-[10px] font-bold px-1.5 py-0.2 dark:bg-[#0a84ff]/14 dark:text-[#64aaff] ml-1">
                      {proj.feedbacks.length}
                    </span>
                  </div>

                  {/* Feedback grid list */}
                  <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1 mb-5">
                    {proj.feedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-gray-200 p-4 bg-white dark:border-slate-800/80 dark:bg-slate-900 "
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            {fb.authorPfp ? (
                              <img
                                src={fb.authorPfp}
                                alt={fb.authorName}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-lg bg-[#e8f2ff]"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-[#e8f2ff] text-[#0066cc] text-xs font-bold flex items-center justify-center">
                                {fb.authorName[0]}
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {fb.authorName}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-slate-400 capitalize block font-medium mt-0.5">
                                {fb.authorRole}
                              </span>
                            </div>
                          </div>
                          
                          {/* Rating display and date */}
                          <div className="text-right">
                            <div className="flex justify-end">{renderStars(fb.rating)}</div>
                            <span className="text-[9px] text-gray-400 font-mono mt-1 block">
                              {new Date(fb.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 pl-1 leading-relaxed border-l-2 border-[#007aff]/20">
                          {fb.comment}
                        </p>
                      </div>
                    ))}
                    {proj.feedbacks.length === 0 && (
                      <p className="text-center text-xs text-gray-400 italic py-6">
                        No evaluations logged yet. Be the first to share positive feedback and cast a verified rating below!
                      </p>
                    )}
                  </div>

                  {/* INTERACTIVE COMPOSER FORM FOR CRITIQUE */}
                  <div className="border-t border-gray-200/50 dark:border-slate-800 pt-5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 block">
                      Submit Your Critique & Star Rating
                    </h4>

                    {submitSuccessMsg[proj.id] && (
                      <div className="mb-3 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                        {submitSuccessMsg[proj.id]}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-3">
                        {/* Name and Role Override inputs */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Your Name</label>
                          <input
                            type="text"
                            value={reviewersNames[proj.id] !== undefined ? reviewersNames[proj.id] : user.name}
                            onChange={(e) => setReviewersNames(prev => ({ ...prev, [proj.id]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Your Profession / Role</label>
                          <input
                            type="text"
                            value={reviewRoles[proj.id] !== undefined ? reviewRoles[proj.id] : (user.role === "student" ? "Leapstart Student" : user.specialty || user.role)}
                            onChange={(e) => setReviewRoles(prev => ({ ...prev, [proj.id]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Comment body and Star selectors */}
                      <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Rating:</span>
                            {renderStars(currentRating, true, (stars) => {
                              setReviewRatings(prev => ({ ...prev, [proj.id]: stars }));
                            })}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Rating selection: <strong>{currentRating} Stars</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={reviewComments[proj.id] || ""}
                            onChange={(e) => setReviewComments(prev => ({ ...prev, [proj.id]: e.target.value }))}
                            placeholder="Write your public experiential critique feedback on this student project..."
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-950 outline-none focus:border-[#007aff] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 "
                          />
                          <button
                            onClick={() => submitFeedback(proj.id)}
                            className="apple-primary flex h-8 w-8 items-center justify-center cursor-pointer transition-colors"
                            title="Submit feedback"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="py-16 text-center border border-dashed border-[var(--leap-border)] rounded-2xl bg-[var(--leap-surface)] backdrop-blur-xl">
              <span className="text-3xl">📂</span>
              <h3 className="font-display font-medium text-slate-800 dark:text-slate-300 mt-3">No matching showcased projects found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                No active uploads are mapped to your keyword queries. Be the first to publish a project or refine your search input tags.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
