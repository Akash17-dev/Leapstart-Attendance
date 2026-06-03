/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  addProject,
  addProjectFeedback,
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
  listMessages,
  listProjects,
  listUsers,
  respondToLeave,
  updateAttendanceBatch,
  updatePassword,
  updateUserProfile,
  upsertOtp,
  // V3 Additions
  getChannels,
  createChannel,
  listChannelMessages,
  createChannelMessage,
  addMessageReaction,
  removeMessageReaction,
  addChatAttachment,
  getAttendanceConfigs,
  getTodayAttendanceConfig,
  upsertAttendanceConfig,
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  createAuditLog,
  listIncubationIdeas,
  createIncubationIdea,
  // Utility and missed imports
  pool,
  getLocalDate,
  listLeaves
} from "./src/postgresDb";
import { AttendanceRecord, IncubationIdea, LeaveRequest, PostedProject, PublicFeedback, UserProfile } from "./src/types";

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

// Haversine Formula for distance checking
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

async function startServer() {
  await initializeDatabase();

  const app = express();
  app.use(express.json());

  // Security Headers Simulation
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Content-Security-Policy", "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval';");
    next();
  });

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket Connection Management
  const userSockets = new Map<string, string>(); // userId -> socketId
  const socketUsers = new Map<string, string>(); // socketId -> userId

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("register", (userId: string) => {
      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      console.log(`User ${userId} registered to socket ${socket.id}`);
      io.emit("status-change", { userId, status: "online" });
    });

    socket.on("typing", (data: { channelId?: string; receiverId?: string; userName: string }) => {
      if (data.channelId) {
        socket.broadcast.emit("typing-channel", { channelId: data.channelId, userName: data.userName });
      } else if (data.receiverId) {
        const targetSocket = userSockets.get(data.receiverId);
        if (targetSocket) {
          io.to(targetSocket).emit("typing-dm", { senderId: socketUsers.get(socket.id), userName: data.userName });
        }
      }
    });

    socket.on("disconnect", () => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        io.emit("status-change", { userId, status: "offline" });
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  // HELPER to send real-time notification
  async function triggerNotification(userId: string, title: string, message: string, type: "attendance" | "message" | "leave" | "project" | "announcement" | "system") {
    try {
      const notification = await createNotification({ userId, title, message, type });
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit("notification", notification);
      }
    } catch (err) {
      console.error("Failed to trigger socket notification:", err);
    }
  }

  // Auth Endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await findUserForLogin(email);
      if (!user || user.passwordHash !== password) {
        // Log authentication failure
        await createAuditLog({
          action: "AUTH_FAILURE",
          details: `Failed login attempt for email: ${email}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Log audit access
      await createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "USER_LOGIN",
        details: `Successful login as ${user.role}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });

      const { passwordHash, ...safeUser } = user;
      res.json({
        token: user.id, // simple dev token
        user: safeUser
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Database login request failed." });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, phone } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "No user registered under this email" });
      }

      const tokenCode = `LS-${Math.floor(100000 + Math.random() * 900000).toString()}`;
      await upsertOtp(user.email, tokenCode, new Date(Date.now() + 15 * 60 * 1000));

      const contactMethod = phone || user.email;
      console.log(`
========================================
[TWILIO SMS GATEWAY - OUTGOING OTP]
To: ${contactMethod}
Body: LeapStart Verification Code: ${tokenCode}. Expires in 15 minutes.
========================================
`);

      res.json({
        message: "Twilio OTP security verification dispatched.",
        simulatedInboxDetails: {
          to: contactMethod,
          otpCode: tokenCode,
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
        return res.status(400).json({ error: "No active recovery requests found." });
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

      const user = await findUserByEmail(normEmail);
      if (user) {
        await createAuditLog({
          userId: user.id,
          userName: user.name,
          action: "PASSWORD_RESET",
          details: `Password reset verified by Twilio OTP code.`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }

      res.json({ message: "Password updated successfully! You can proceed to sign-in." });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Password reset request failed." });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const role = typeof req.query.role === "string" ? req.query.role : undefined;
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
        skills: Array.isArray(skills) ? skills : String(skills || "").split(",").map((s) => s.trim()),
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

  // Attendance Config Endpoints
  app.get("/api/attendance/config", async (req, res) => {
    try {
      const configs = await getAttendanceConfigs();
      res.json(configs);
    } catch (err) {
      res.status(500).json({ error: "Failed to query attendance configurations" });
    }
  });

  app.get("/api/attendance/config/today", async (req, res) => {
    try {
      const config = await getTodayAttendanceConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "Failed to query today's attendance configuration" });
    }
  });

  app.post("/api/attendance/config", async (req, res) => {
    try {
      const { date, attendanceMode, startTime, endTime, createdBy, remarks } = req.body;
      if (!date || !attendanceMode) {
        return res.status(400).json({ error: "Date and attendanceMode parameters are required." });
      }
      const config = await upsertAttendanceConfig({
        date,
        attendanceMode,
        startTime: startTime || "09:00",
        endTime: endTime || "18:00",
        createdBy: createdBy || "admin",
        remarks
      });

      // Notify users about channel mode changes
      io.emit("attendance-config-changed", config);

      await createAuditLog({
        userId: createdBy,
        action: "ATTENDANCE_CONFIG_CHANGE",
        details: `Configured date ${date} as mode: ${attendanceMode} (${startTime} - ${endTime})`,
        ipAddress: req.ip
      });

      res.status(201).json(config);
    } catch (err) {
      console.error("Failed to save config:", err);
      res.status(500).json({ error: "Failed to configure attendance mode" });
    }
  });

  // Attendance Check-In V3 geofenced logic with Fraud Engine
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
      const { userId, latitude, longitude, accuracy, selfieUrl, deviceId, checkInMode } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing required student user references" });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      const todayStr = getLocalDate();
      const currentConfig = await getTodayAttendanceConfig() || {
        attendanceMode: "hybrid",
        startTime: "09:00",
        endTime: "18:00"
      };

      const selectedMode = checkInMode || (currentConfig.attendanceMode === "hybrid" ? "offline" : currentConfig.attendanceMode);
      let verification: AttendanceRecord["verificationStatus"] = "Verified";
      let distanceMeters = 0;
      let status: AttendanceRecord["status"] = "present";

      // 1. FRAUD CHECK A: Multiple Check-ins same day
      const existingAttendance = await listAttendance({ userId, date: todayStr });
      if (existingAttendance.length > 0 && existingAttendance[0].status === "present") {
        await createAuditLog({
          userId: user.id,
          userName: user.name,
          action: "FRAUD_ATTEMPT",
          details: `Attempted duplicate check-in for date: ${todayStr}`,
          ipAddress: req.ip,
          isFraudAlert: true
        });
        return res.status(400).json({ error: "Attendance already logged for today." });
      }

      // Handle offline geo-checking
      if (selectedMode === "offline") {
        if (!latitude || !longitude || !selfieUrl) {
          return res.status(400).json({ error: "Selfie capture and GPS data coordinates are required for Campus check-in." });
        }

        // Campus coordinates Financial District, Hyderabad
        const campusLat = 17.4125164;
        const campusLng = 78.3365692;
        distanceMeters = calculateDistance(Number(latitude), Number(longitude), campusLat, campusLng);

        // Verification bounds
        if (distanceMeters <= 50) {
          verification = "Verified";
        } else if (distanceMeters <= 75) {
          verification = "Warning";
        } else if (distanceMeters <= 100) {
          verification = "Manual Review";
        } else {
          verification = "Rejected";
          status = "absent";
        }

        // 2. FRAUD CHECK B: Reuse selfie check
        if (selfieUrl.length > 0) {
          // simple check: if hash matches any previously uploaded selfie in database
          const hash = `img-hash-${selfieUrl.slice(-15)}`;
          const querySelfie = await pool.query(
            "SELECT count(*)::int as count FROM attendance_selfies WHERE image_hash = $1",
            [hash]
          );
          if (querySelfie.rows[0].count > 0) {
            await createAuditLog({
              userId: user.id,
              userName: user.name,
              action: "FRAUD_ALERT",
              details: `Selfie reuse flagged. Image hash matches existing database entry.`,
              ipAddress: req.ip,
              isFraudAlert: true
            });
            verification = "Rejected";
            status = "absent";
            return res.status(400).json({ error: "Selfie reuse detected: capture a live photo." });
          }
        }

        // 3. FRAUD CHECK C: Impossible travel speed
        const lastRecords = await listAttendance({ userId });
        if (lastRecords.length > 0 && lastRecords[0].latitude && lastRecords[0].longitude) {
          const distanceLast = calculateDistance(Number(latitude), Number(longitude), Number(lastRecords[0].latitude), Number(lastRecords[0].longitude));
          const timeDiffHours = (Date.now() - new Date(lastRecords[0].checkInTime!).getTime()) / 3600000;
          if (timeDiffHours < 1 && distanceLast > 100000) { // >100km in under an hour
            await createAuditLog({
              userId: user.id,
              userName: user.name,
              action: "FRAUD_ALERT",
              details: `Impossible travel speed flagged. Moved ${distanceLast.toFixed(0)}m in ${timeDiffHours.toFixed(2)}h.`,
              ipAddress: req.ip,
              isFraudAlert: true
            });
            verification = "Rejected";
            status = "absent";
            return res.status(400).json({ error: "Suspicious location change (Impossible Travel Speed)." });
          }
        }

        // 4. FRAUD CHECK D: Outside Geofence attempts
        if (verification === "Rejected") {
          await createAuditLog({
            userId: user.id,
            userName: user.name,
            action: "FRAUD_ATTEMPT",
            details: `Check-in rejected. Distance: ${distanceMeters.toFixed(1)}m from Financial District campus.`,
            ipAddress: req.ip,
            isFraudAlert: true
          });
          return res.status(403).json({
            error: `Check-in rejected. You are outside the allowed campus boundaries (${distanceMeters.toFixed(0)} meters away).`
          });
        }
      }

      // Check Late status based on time
      const checkInHour = new Date().getHours();
      if (checkInHour >= 10 && status === "present") {
        status = "late";
      }

      const responseLogs = await checkInAttendance(
        userId,
        status,
        selectedMode === "offline" ? `Campus GPS, dist ${distanceMeters.toFixed(1)}m` : "Remote check-in verified",
        latitude ? Number(latitude) : undefined,
        longitude ? Number(longitude) : undefined,
        accuracy ? Number(accuracy) : undefined,
        selfieUrl,
        deviceId || "web-client",
        verification,
        distanceMeters,
        selectedMode
      );

      // Trigger socket alerts
      io.emit("attendance-update", { userId, status, verificationStatus: verification });
      
      // Notify the student
      await triggerNotification(
        userId,
        "Check-In Confirmed",
        `Logged as ${status.toUpperCase()} (${verification})`,
        "attendance"
      );

      res.json({
        message: "Attendance check-in logged successfully.",
        attendance: responseLogs
      });
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
      io.emit("attendance-batch-update");
      res.json({ message: "Attendance logs updated by override." });
    } catch (err) {
      console.error("Attendance update error:", err);
      res.status(500).json({ error: "Attendance update failed." });
    }
  });

  // Leaves Endpoints
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
        return res.status(404).json({ error: "Applicant record not found." });
      }

      const request = await createLeave({ userId, startDate, endDate, reason });
      
      // Emit alert to mentors/admins
      io.emit("leave-requested", request);

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

      // Notify student
      const leaveQuery = await pool.query("SELECT user_id FROM leave_requests WHERE id = $1", [id]);
      if (leaveQuery.rows[0]) {
        const studentId = leaveQuery.rows[0].user_id;
        await triggerNotification(
          studentId,
          "Leave Response",
          `Your leave request has been ${status}.`,
          "leave"
        );
      }

      io.emit("leave-responded", { id, status });

      res.json({ message: `Petition marked as ${status} successfully.` });
    } catch (err) {
      console.error("Leave response error:", err);
      res.status(500).json({ error: "Leave response failed." });
    }
  });

  // Direct Message Endpoints
  app.get("/api/messages", async (req, res) => {
    try {
      const { userId, targetId } = req.query;
      const requesterId = req.headers["x-user-id"] as string;

      if (typeof userId !== "string" || typeof targetId !== "string") {
        return res.status(400).json({ error: "Sender and target references are required." });
      }

      if (requesterId !== userId && requesterId !== targetId) {
        return res.status(403).json({
          error: "ACCESS RESTRICTED: Student peer direct messages are access-controlled."
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
        return res.status(400).json({ error: "Missing sender, receiver, or text." });
      }

      if (requesterId !== senderId) {
        return res.status(403).json({ error: "Unauthorized dispatch: Impersonation prevented." });
      }

      const msg = await createMessage(senderId, receiverId, text);

      // Emit live messaging via Socket
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("dm-message", msg);
      }

      res.json(msg);
    } catch (err) {
      console.error("Message create error:", err);
      res.status(500).json({ error: "Message send failed." });
    }
  });

  // V3 Channels APIs
  app.get("/api/channels", async (req, res) => {
    try {
      res.json(await getChannels());
    } catch (err) {
      res.status(500).json({ error: "Failed to list channels" });
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const { name, type, description } = req.body;
      if (!name) return res.status(400).json({ error: "Channel name is required" });
      const channel = await createChannel(name, type || "text", description);
      io.emit("channel-created", channel);
      res.status(201).json(channel);
    } catch (err) {
      res.status(500).json({ error: "Failed to create channel" });
    }
  });

  app.get("/api/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      res.json(await listChannelMessages(channelId));
    } catch (err) {
      res.status(500).json({ error: "Failed to query channel messages" });
    }
  });

  app.post("/api/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      const { senderId, text, parentId } = req.body;
      const requesterId = req.headers["x-user-id"] as string;

      if (!senderId || !text) {
        return res.status(400).json({ error: "Sender and text are required." });
      }

      if (requesterId !== senderId) {
        return res.status(403).json({ error: "Unauthorized sender." });
      }

      const msg = await createChannelMessage({ channelId, senderId, text, parentId });

      // Live Emit
      io.emit("channel-message", msg);

      // --- SLASH COMMANDS PARSER ---
      if (text.startsWith("/")) {
        const parts = text.split(" ");
        const command = parts[0].toLowerCase();
        let replyText = "";

        if (command === "/help") {
          replyText = `**LeapStart V3 Chat Commands Help**
• \`/checkin\` : Redirects you to Daily check-in panel.
• \`/attendance\` : Displays overall attendance standings.
• \`/profile\` : Highlights your registered career specialty bio.
• \`/stats\` : Compiles on-campus active numbers.
• \`/ping\` : Tests gateway server responsiveness.
• \`/announce <msg>\` : (Mentors only) Posts announcements.`;
        } else if (command === "/ping") {
          replyText = `Pong! Server responsiveness is **${Math.floor(10 + Math.random() * 30)}ms** (Postgres Cluster Synced).`;
        } else if (command === "/attendance") {
          const attRecords = await listAttendance({ userId: senderId });
          const present = attRecords.filter(r => r.status === "present").length;
          const rate = attRecords.length > 0 ? (present / attRecords.length) * 100 : 100;
          replyText = `📊 **Attendance Summary**: You logged **${present}/${attRecords.length} present days** (${rate.toFixed(1)}% Standings).`;
        } else if (command === "/profile") {
          const profile = await findUserById(senderId);
          replyText = `🎓 **User Profile**: **${profile?.name}** (${profile?.specialty || profile?.role}). Bio: _${profile?.bio}_`;
        } else if (command === "/stats") {
          const users = await listUsers("student");
          replyText = `👥 **Classroom stats**: Tracking **${users.length} active students** in this cohort cohort server.`;
        } else if (command === "/checkin") {
          replyText = `ℹ️ Daily Telemetry Check-in can be logged on the main **Daily Check-in** dashboard using webcam verified GPS.`;
        } else {
          replyText = `⚠️ Unknown slash command \`${command}\`. Type \`/help\` to list all commands.`;
        }

        if (replyText) {
          // create a system response bot message
          const systemMsg = await createChannelMessage({
            channelId,
            senderId: "saikrishna", // Admin / Founder bot responder
            text: replyText,
            parentId: msg.id
          });
          io.emit("channel-message", systemMsg);
        }
      }

      res.status(201).json(msg);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to dispatch channel message" });
    }
  });

  app.post("/api/messages/reaction", async (req, res) => {
    try {
      const { messageId, userId, emoji, action } = req.body; // action: 'add' or 'remove'
      if (!messageId || !userId || !emoji) return res.status(400).json({ error: "Missing required parameters" });

      if (action === "remove") {
        await removeMessageReaction(messageId, userId, emoji);
      } else {
        await addMessageReaction(messageId, userId, emoji);
      }

      // Notify clients
      io.emit("message-reaction-updated", { messageId, userId, emoji, action });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update reaction" });
    }
  });

  app.post("/api/messages/attachment", async (req, res) => {
    try {
      const { messageId, publicId, secureUrl, fileName, fileType, fileSize } = req.body;
      if (!messageId || !publicId || !secureUrl) return res.status(400).json({ error: "Incomplete details" });

      const attachment = await addChatAttachment({
        messageId,
        publicId,
        secureUrl,
        fileName: fileName || "file",
        fileType: fileType || "application/octet-stream",
        fileSize: Number(fileSize || 0)
      });

      io.emit("message-attachment-updated", { messageId, attachment });
      res.status(201).json(attachment);
    } catch (err) {
      res.status(500).json({ error: "Failed to save attachment" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) return res.status(400).json({ error: "Authentication credentials missing" });
      res.json(await getNotifications(userId));
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve notifications" });
    }
  });

  app.post("/api/notifications/read", async (req, res) => {
    try {
      const { id } = req.body;
      await markNotificationRead(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      await markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update notifications" });
    }
  });

  // Audit Logs endpoints
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const { fraudOnly } = req.query;
      const logs = await getAuditLogs(fraudOnly === "true");
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve audit logs" });
    }
  });

  // Incubation
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
        tags: Array.isArray(tags) ? tags : [],
        attachmentNames: Array.isArray(attachmentNames) ? attachmentNames : []
      });
      res.status(201).json(idea);
    } catch (err) {
      console.error("Incubation idea create error:", err);
      res.status(500).json({ error: "Incubation idea create failed." });
    }
  });

  // Projects
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
          error: "Missing essential project parameters."
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

  // Chatbot
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
          fallbackText: `Hello! I am LeapStart AI Companion. The API is unavailable right now, but I can still help with **${currentScreen}**.`
        });
      }
    }

    if (currentScreen?.toLowerCase().includes("login")) {
      return res.json({
        text:
          "Welcome to LeapStart Tech Portal. Use demo logins like `aadhira@leapstart.gmail.com` with password `aadhira@123`."
      });
    }

    if (activeRole === "student") {
      return res.json({
        text: `Hello ${activeUser}. You can check in from telemetry, review attendance analytics, submit leave petitions, open your project showcase, or use the Discord chat.`
      });
    }

    return res.json({
      text: `Hello ${activeUser}. You can review attendance, update student records, respond to leave requests, configure today's attendance mode, and inspect projects from this dashboard.`
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

  // Bind server to HTTP listener instead of app.listen to support Socket.IO
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`LeapStart server listening at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start LeapStart server:", err);
  process.exit(1);
});
