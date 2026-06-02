/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  addProject,
  addProjectFeedback,
  createGroupMessage,
  createIncubationIdea,
  createStudent,
  checkInAttendance,
  createLeave,
  createMessage,
  deleteOtp,
  findUserByEmail,
  findUserById,
  findUserForLogin,
  getOtp,
  initializeDatabase,
  listAttendance,
  listGroupMessages,
  listIncubationIdeas,
  listLeaves,
  listMessages,
  listProjects,
  listUsers,
  respondToLeave,
  updateAttendanceBatch,
  updatePassword,
  updateUserProfile,
  upsertOtp
} from "./src/postgresDb";
import { AttendanceRecord, IncubationIdea, LeaveRequest, PostedProject, PublicFeedback } from "./src/types";

const PORT = Number(process.env.PORT || 3000);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("Warning: GEMINI_API_KEY is not defined. Chatbot will use local fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  await initializeDatabase();

  const app = express();
  app.use(express.json());

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await findUserForLogin(email);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: "Invalid authentication credentials" });
      }

      const { passwordHash, ...safeUser } = user;
      res.json({
        token: user.id,
        user: safeUser
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Database login request failed." });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "No school record registered under this email" });
      }

      const tokenCode = `LS-${Math.floor(100000 + Math.random() * 90000).toString()}`;
      await upsertOtp(user.email, tokenCode, new Date(Date.now() + 15 * 60 * 1000));

      console.log(`
========================================
[EMAIL NOTIFICATION OUTGOING PROXY]
To: ${user.email}
Subject: Password Recovery Verification - LeapStart School of Technology
Body:
Dear ${user.name},
Your verification passcode is [ ${tokenCode} ].
This code expires in 15 minutes. Use this code to reset your password.
========================================
`);

      res.json({
        message: "Security passcode dispatched successfully to verified address.",
        simulatedInboxDetails: {
          to: user.email,
          otpCode: tokenCode,
          subject: "Security Reset Code",
          expiresIn: "15 minutes"
        }
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ error: "Password recovery request failed." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Please complete all resetting fields." });
      }

      const normEmail = email.trim().toLowerCase();
      const otpEntry = await getOtp(normEmail);
      if (!otpEntry) {
        return res.status(400).json({ error: "No active recovery requests found for this school account." });
      }

      if (otpEntry.code !== code.trim()) {
        return res.status(400).json({ error: "Invalid verification code." });
      }

      if (Date.now() > otpEntry.expires) {
        await deleteOtp(normEmail);
        return res.status(400).json({ error: "Verification code has expired." });
      }

      await updatePassword(normEmail, newPassword);
      await deleteOtp(normEmail);
      res.json({ message: "Password updated successfully! You can proceed to sign-in." });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Password reset request failed." });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const role = typeof req.query.role === "string" ? req.query.role : undefined;
      if (role && !["student", "mentor", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid user role filter." });
      }
      const users = await listUsers(role as any);
      res.json(users.map(({ passwordHash, ...safeUser }) => safeUser));
    } catch (err) {
      console.error("Users list error:", err);
      res.status(500).json({ error: "User directory query failed." });
    }
  });

  app.post("/api/users/students", async (req, res) => {
    try {
      const { id, name, email, password, linkedinUrl, githubUrl, portfolioUrl, pfpUrl, bio, skills, specialty } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Student name, email, and password are required." });
      }
      const created = await createStudent({
        id,
        name,
        email,
        password,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        pfpUrl,
        bio,
        skills: Array.isArray(skills) ? skills : String(skills || "").split(",").map((skill) => skill.trim()),
        specialty
      });
      const { passwordHash, ...safeUser } = created;
      res.status(201).json(safeUser);
    } catch (err: any) {
      console.error("Student create error:", err);
      if (err?.code === "23505") {
        return res.status(409).json({ error: "A student with this ID or email already exists." });
      }
      res.status(500).json({ error: "Student creation failed." });
    }
  });

  app.patch("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const requesterId = req.headers["x-user-id"] as string;
      if (requesterId !== id) {
        return res.status(403).json({ error: "Only the signed-in student can update this profile." });
      }

      const user = await findUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }
      if (user.role !== "student") {
        return res.status(403).json({ error: "Only student profiles can be self-edited here." });
      }

      const updated = await updateUserProfile(id, {
        linkedinUrl: req.body.linkedinUrl,
        githubUrl: req.body.githubUrl,
        portfolioUrl: req.body.portfolioUrl,
        pfpUrl: req.body.pfpUrl
      });
      if (!updated) {
        return res.status(404).json({ error: "Profile update target not found." });
      }
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Profile update failed." });
    }
  });

  app.get("/api/attendance", async (req, res) => {
    try {
      const { userId, date } = req.query;
      const attendance = await listAttendance({
        userId: typeof userId === "string" ? userId : undefined,
        date: typeof date === "string" ? date : undefined
      });
      res.json(attendance);
    } catch (err) {
      console.error("Attendance list error:", err);
      res.status(500).json({ error: "Attendance query failed." });
    }
  });

  app.post("/api/attendance/checkin", async (req, res) => {
    try {
      const { userId, status, location } = req.body;
      if (!userId || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const attendance = await checkInAttendance(userId, status as AttendanceRecord["status"], location);
      res.json({ message: "Attendance check-in logged successfully.", attendance });
    } catch (err) {
      console.error("Attendance check-in error:", err);
      res.status(500).json({ error: "Attendance check-in failed." });
    }
  });

  app.post("/api/attendance/update-batch", async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: "Invalid records input structure" });
      }

      await updateAttendanceBatch(records);
      res.json({ message: "Attendance logs updated by authorized instructor override." });
    } catch (err) {
      console.error("Attendance update error:", err);
      res.status(500).json({ error: "Attendance update failed." });
    }
  });

  app.get("/api/leaves", async (req, res) => {
    try {
      const { userId } = req.query;
      const leaves = await listLeaves(typeof userId === "string" ? userId : undefined);
      res.json(leaves);
    } catch (err) {
      console.error("Leaves list error:", err);
      res.status(500).json({ error: "Leave query failed." });
    }
  });

  app.post("/api/leaves", async (req, res) => {
    try {
      const { userId, startDate, endDate, reason } = req.body;
      if (!userId || !startDate || !endDate || !reason) {
        return res.status(400).json({ error: "Incomplete leave request parameters." });
      }

      const targetUser = await findUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "Applicant school record not discovered." });
      }

      const request = await createLeave({ userId, startDate, endDate, reason });
      res.json({ message: "Leave petition submitted successfully.", request });
    } catch (err) {
      console.error("Leave create error:", err);
      res.status(500).json({ error: "Leave request failed." });
    }
  });

  app.post("/api/leaves/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks, approvedBy } = req.body;
      if (!status || !approvedBy) {
        return res.status(400).json({ error: "Action and supervisor references are vital." });
      }

      const updated = await respondToLeave(id, status as LeaveRequest["status"], remarks, approvedBy);
      if (!updated) {
        return res.status(404).json({ error: "Leave document reference invalid." });
      }

      res.json({ message: `Petition marked as ${status} successfully.` });
    } catch (err) {
      console.error("Leave response error:", err);
      res.status(500).json({ error: "Leave response failed." });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const { userId, targetId } = req.query;
      const requesterId = req.headers["x-user-id"] as string;

      if (typeof userId !== "string" || typeof targetId !== "string") {
        return res.status(400).json({ error: "Sender and target references are vital to initiate sync." });
      }

      if (requesterId !== userId && requesterId !== targetId) {
        return res.status(403).json({
          error:
            "ACCESS RESTRICTED: Student peer direct messages are access-controlled. Admin/Mentor authorization lacks visibility rights due to strict academic privacy policy regulations (Confidentiality Code SC-109)."
        });
      }

      res.json(await listMessages(userId, targetId));
    } catch (err) {
      console.error("Messages list error:", err);
      res.status(500).json({ error: "Message query failed." });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, text } = req.body;
      const requesterId = req.headers["x-user-id"] as string;

      if (!senderId || !receiverId || !text) {
        return res.status(400).json({ error: "Missing sender, dispatch receiver, or message text body." });
      }

      if (requesterId !== senderId) {
        return res.status(403).json({ error: "Unauthorized dispatch: Impersonation prevented at routing gates." });
      }

      res.json(await createMessage(senderId, receiverId, text));
    } catch (err) {
      console.error("Message create error:", err);
      res.status(500).json({ error: "Message send failed." });
    }
  });

  app.get("/api/groups/all-students/messages", async (req, res) => {
    try {
      const requesterId = req.headers["x-user-id"] as string;
      const user = requesterId ? await findUserById(requesterId) : null;
      if (!user || user.role !== "student") {
        return res.status(403).json({ error: "All-students group is limited to student accounts." });
      }
      res.json(await listGroupMessages("all-students"));
    } catch (err) {
      console.error("All-students group list error:", err);
      res.status(500).json({ error: "Group message query failed." });
    }
  });

  app.post("/api/groups/all-students/messages", async (req, res) => {
    try {
      const requesterId = req.headers["x-user-id"] as string;
      const user = requesterId ? await findUserById(requesterId) : null;
      const { text } = req.body;
      if (!user || user.role !== "student") {
        return res.status(403).json({ error: "Only students can post in the all-students group." });
      }
      if (!text?.trim()) {
        return res.status(400).json({ error: "Message text is required." });
      }
      res.status(201).json(
        await createGroupMessage({
          groupId: "all-students",
          senderId: user.id,
          senderName: user.name,
          text: text.trim()
        })
      );
    } catch (err) {
      console.error("All-students group create error:", err);
      res.status(500).json({ error: "Group message create failed." });
    }
  });

  app.get("/api/incubation/ideas", async (_req, res) => {
    try {
      res.json(await listIncubationIdeas());
    } catch (err) {
      console.error("Incubation ideas list error:", err);
      res.status(500).json({ error: "Incubation hub query failed." });
    }
  });

  app.post("/api/incubation/ideas", async (req, res) => {
    try {
      const { title, problem, stage, ownerId, tags, attachmentNames } = req.body;
      if (!title?.trim() || !problem?.trim() || !ownerId) {
        return res.status(400).json({ error: "Idea title, problem, and owner are required." });
      }
      const owner = await findUserById(ownerId);
      if (!owner) {
        return res.status(404).json({ error: "Idea owner not found." });
      }
      const idea = await createIncubationIdea({
        title: title.trim(),
        problem: problem.trim(),
        stage: (stage || "idea") as IncubationIdea["stage"],
        ownerId: owner.id,
        ownerName: owner.name,
        ownerRole: owner.role,
        tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        attachmentNames: Array.isArray(attachmentNames) ? attachmentNames : []
      });
      res.status(201).json(idea);
    } catch (err) {
      console.error("Incubation idea create error:", err);
      res.status(500).json({ error: "Incubation idea create failed." });
    }
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      res.json(await listProjects());
    } catch (err) {
      console.error("Project list error:", err);
      res.status(500).json({ error: "Project query failed." });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { studentId, studentName, studentEmail, avatarUrl, title, description, tags, githubUrl, liveUrl } = req.body;
      if (!studentId || !studentName || !title || !description) {
        return res.status(400).json({
          error: "Missing essential project parameters (title, description, student identifiers)."
        });
      }

      const newProject = await addProject({
        studentId,
        studentName,
        studentEmail: studentEmail || `${studentId}@leapstart.gmail.com`,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`,
        title,
        description,
        tags: Array.isArray(tags) ? tags : [],
        githubUrl: githubUrl || "",
        liveUrl: liveUrl || ""
      } as Omit<PostedProject, "id" | "timestamp" | "feedbacks" | "averageRating">);
      res.status(201).json(newProject);
    } catch (err) {
      console.error("Project create error:", err);
      res.status(500).json({ error: "Project create failed." });
    }
  });

  app.post("/api/projects/:id/feedback", async (req, res) => {
    try {
      const { id } = req.params;
      const { authorName, authorRole, authorPfp, comment, rating } = req.body;

      if (!authorName || !comment || rating === undefined) {
        return res.status(400).json({
          error: "Feedback requires commenter name, comment message, and positive numeric star rating."
        });
      }

      const updated = await addProjectFeedback(id, {
        authorName,
        authorRole: authorRole || "Public Reviewer",
        authorPfp: authorPfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`,
        comment,
        rating: Number(rating)
      } as Omit<PublicFeedback, "id" | "timestamp">);
      if (!updated) {
        return res.status(404).json({ error: "Project publication not found." });
      }
      res.status(201).json(updated);
    } catch (err) {
      console.error("Project feedback error:", err);
      res.status(500).json({ error: "Project feedback failed." });
    }
  });

  app.post("/api/chatbot", async (req, res) => {
    const { message, currentScreen, chatHistory, userContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Request payload is empty" });
    }

    const activeUser = userContext ? userContext.name : "Guest Visitor";
    const activeRole = userContext ? userContext.role : "Anonymity Interface";

    const systemPrompt = `You are LeapStart AI Companion, an intelligent counselor and course-concierge for the LeapStart School of Technology (https://leapstart.in).
Your current screen context: ${currentScreen || "Gateway Portal Login Screen"}.
Authorized User logged-in: ${activeUser} (Role: ${activeRole}).
Current Date: ${new Date().toISOString().slice(0, 10)}.

LeapStart Overview:
- India's primary powerhouse for experiential, builder-first AI and web engineering.
- Foundational core: Reverse-engineered industry curriculum, experiential learning.
- Leadership: SAIKRISHNA JAVVAJI (Founder), Manikanta Mothukuri (Operational Director), Yuktha Pemmireddy (HR Manager).
- Instructors: Suhas Choppala (Full Stack Web), Goli Venu Gopal (Databases & Scalable APIs), Manoj Karajada (Linux Automation & Cloud Architecture).

Guidelines:
1. Give concise, context-sensitive support for login, attendance, leaves, project showcase, and role dashboards.
2. Keep formatting clean and scannable.
3. Do not claim real encryption or absolute privacy. Say direct messages are access-controlled in this local demo.
4. If Gemini is unavailable, use local fallback instructions.`;

    const modelToUse = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const client = getGeminiClient();

    if (client) {
      try {
        const contents: any[] = [];
        if (chatHistory && Array.isArray(chatHistory)) {
          chatHistory.forEach((item: any) => {
            contents.push({
              role: item.role === "user" ? "user" : "model",
              parts: [{ text: item.text }]
            });
          });
        }
        contents.push({ role: "user", parts: [{ text: message }] });

        const responseObj = await client.models.generateContent({
          model: modelToUse,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7
          }
        });

        return res.json({ text: responseObj.text });
      } catch (err: any) {
        console.error("Gemini API invocation error:", err);
        return res.status(500).json({
          error: "Gemini server dispatch interrupted.",
          fallbackText: `Hello! I am LeapStart AI Companion. The cloud API is unavailable right now, but I can still help with **${currentScreen}**. Use firstname login credentials such as \`aadhira@leapstart.gmail.com\` / \`aadhira@123\`.`
        });
      }
    }

    if (currentScreen?.toLowerCase().includes("login")) {
      return res.json({
        text:
          "Welcome to LeapStart Tech Portal. Use firstname credentials like `aadhira@leapstart.gmail.com` with password `aadhira@123`, or use password recovery to generate a local verification code."
      });
    }

    if (activeRole === "student") {
      return res.json({
        text: `Hello ${activeUser}. You can check in from telemetry, review attendance analytics, submit leave petitions, open your project showcase, or use the peer messaging area.`
      });
    }

    return res.json({
      text: `Hello ${activeUser}. You can review attendance, update student records, respond to leave requests, and inspect project profiles from this dashboard.`
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeapStart server listening at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start LeapStart server:", err);
  process.exit(1);
});
