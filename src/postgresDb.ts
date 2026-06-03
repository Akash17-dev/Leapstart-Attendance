import "dotenv/config";
import { Pool, types } from "pg";
import { INITIAL_LEAVES, INITIAL_USERS, MOCK_ATTENDANCE } from "./data";
import {
  UserProfile,
  AttendanceRecord,
  AttendanceConfig,
  LeaveRequest,
  DirectMessage,
  Channel,
  MessageReaction,
  ChatAttachment,
  GroupMessage,
  PublicFeedback,
  PostedProject,
  IncubationIdea,
  Notification,
  AuditLog,
  FaceVerificationMetadata
} from "./types";

export type DbUser = UserProfile & { passwordHash: string };

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "Kellampalli@18",
  database: process.env.POSTGRES_DATABASE || "postgres"
});

types.setTypeParser(1082, (value) => value);
types.setTypeParser(1700, (value) => Number(value)); // parse numeric fields as numbers

export const getLocalDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const toDateString = (value: string | Date): string => {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const toIsoString = (value: string | Date | null): string | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const mapUser = (row: any): DbUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  linkedinUrl: row.linkedin_url,
  githubUrl: row.github_url || undefined,
  portfolioUrl: row.portfolio_url || undefined,
  pfpUrl: row.pfp_url,
  bio: row.bio,
  skills: row.skills || [],
  projects: row.projects || [],
  specialty: row.specialty || undefined,
  passwordHash: row.password_hash
});

const mapAttendance = (row: any): AttendanceRecord => ({
  id: row.id,
  userId: row.user_id,
  date: toDateString(row.attendance_date),
  status: row.status,
  checkInTime: toIsoString(row.check_in_time),
  checkOutTime: toIsoString(row.check_out_time),
  location: row.location || undefined,
  latitude: row.latitude ? Number(row.latitude) : undefined,
  longitude: row.longitude ? Number(row.longitude) : undefined,
  accuracy: row.accuracy ? Number(row.accuracy) : undefined,
  deviceId: row.device_id || undefined,
  verificationStatus: row.verification_status || undefined,
  distanceFromCampus: row.distance_from_campus ? Number(row.distance_from_campus) : undefined,
  checkInMode: row.check_in_mode || undefined,
  verified: Boolean(row.verified)
});

const mapLeave = (row: any): LeaveRequest => ({
  id: row.id,
  userId: row.user_id,
  startDate: toDateString(row.start_date),
  endDate: toDateString(row.end_date),
  reason: row.reason,
  status: row.status,
  appliedOn: toDateString(row.applied_on),
  approvedBy: row.approved_by || undefined,
  remarks: row.remarks || undefined
});

const mapMessage = (row: any): DirectMessage => ({
  id: row.id,
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  text: row.text,
  timestamp: toIsoString(row.created_at) || new Date().toISOString()
});

const mapProject = (row: any): PostedProject => ({
  id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  studentEmail: row.student_email,
  avatarUrl: row.avatar_url || undefined,
  title: row.title,
  description: row.description,
  tags: row.tags || [],
  githubUrl: row.github_url || undefined,
  liveUrl: row.live_url || undefined,
  timestamp: toIsoString(row.created_at) || new Date().toISOString(),
  feedbacks: row.feedbacks || [],
  averageRating: Number(row.average_rating || 0)
});

const mapIncubationIdea = (row: any): IncubationIdea => ({
  id: row.id,
  title: row.title,
  problem: row.problem,
  stage: row.stage,
  ownerId: row.owner_id,
  ownerName: row.owner_name,
  ownerRole: row.owner_role,
  tags: row.tags || [],
  attachmentNames: row.attachment_names || [],
  createdAt: toIsoString(row.created_at) || new Date().toISOString()
});

const mapNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: Boolean(row.is_read),
  createdAt: toIsoString(row.created_at) || new Date().toISOString()
});

const mapAuditLog = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id || undefined,
  userName: row.user_name || undefined,
  action: row.action,
  details: row.details || undefined,
  ipAddress: row.ip_address || undefined,
  userAgent: row.user_agent || undefined,
  isFraudAlert: Boolean(row.is_fraud_alert),
  createdAt: toIsoString(row.created_at) || new Date().toISOString()
});

export async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
      linkedin_url TEXT NOT NULL,
      github_url TEXT,
      portfolio_url TEXT,
      pfp_url TEXT NOT NULL,
      bio TEXT NOT NULL,
      skills JSONB NOT NULL DEFAULT '[]'::jsonb,
      projects JSONB NOT NULL DEFAULT '[]'::jsonb,
      specialty TEXT,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
      permission TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_config (
      id TEXT PRIMARY KEY,
      attendance_date DATE NOT NULL UNIQUE,
      attendance_mode TEXT NOT NULL CHECK (attendance_mode IN ('offline', 'online', 'hybrid')),
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '18:00',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      remarks TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'late')),
      check_in_time TIMESTAMPTZ,
      check_out_time TIMESTAMPTZ,
      location TEXT,
      latitude NUMERIC(9, 6),
      longitude NUMERIC(9, 6),
      accuracy NUMERIC(6, 2),
      device_id TEXT,
      verification_status TEXT CHECK (verification_status IN ('Verified', 'Warning', 'Manual Review', 'Rejected')),
      distance_from_campus NUMERIC(10, 2),
      check_in_mode TEXT CHECK (check_in_mode IN ('offline', 'online')),
      verified BOOLEAN NOT NULL DEFAULT false,
      UNIQUE (user_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS attendance_selfies (
      id TEXT PRIMARY KEY,
      attendance_id TEXT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
      selfie_url TEXT NOT NULL,
      image_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS face_verification (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      face_verification_status TEXT CHECK (face_verification_status IN ('verified', 'failed', 'unconfigured')),
      face_provider TEXT,
      face_confidence NUMERIC(5, 2),
      face_match_score NUMERIC(5, 2),
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'text',
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS channel_members (
      channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (channel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      parent_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (message_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS chat_attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      public_id TEXT NOT NULL,
      secure_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      applied_on DATE NOT NULL,
      approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS posted_projects (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      avatar_url TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      github_url TEXT,
      live_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      feedbacks JSONB NOT NULL DEFAULT '[]'::jsonb,
      average_rating NUMERIC(3, 1) NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('attendance', 'message', 'leave', 'project', 'announcement', 'system')),
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      is_fraud_alert BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS incubation_ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      problem TEXT NOT NULL,
      stage TEXT NOT NULL CHECK (stage IN ('idea', 'prototype', 'pilot', 'launched')),
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner_name TEXT NOT NULL,
      owner_role TEXT NOT NULL CHECK (owner_role IN ('student', 'mentor', 'admin')),
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      attachment_names JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function resetAndSeedDatabase() {
  await pool.query(`
    DROP TABLE IF EXISTS incubation_ideas CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS otps CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS posted_projects CASCADE;
    DROP TABLE IF EXISTS leave_requests CASCADE;
    DROP TABLE IF EXISTS chat_attachments CASCADE;
    DROP TABLE IF EXISTS message_reactions CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS channel_members CASCADE;
    DROP TABLE IF EXISTS channels CASCADE;
    DROP TABLE IF EXISTS face_verification CASCADE;
    DROP TABLE IF EXISTS attendance_selfies CASCADE;
    DROP TABLE IF EXISTS attendance CASCADE;
    DROP TABLE IF EXISTS attendance_config CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  await createTables();
  await seedDatabase();
}

export async function seedDatabase() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) return;

  // 1. Roles
  const roles = [
    { id: "student", name: "Student" },
    { id: "mentor", name: "Mentor" },
    { id: "admin", name: "Administrator" }
  ];
  for (const r of roles) {
    await pool.query("INSERT INTO roles (id, name) VALUES ($1, $2)", [r.id, r.name]);
  }

  // 2. Users
  for (const user of INITIAL_USERS) {
    const firstName = user.name.split(" ")[0].toLowerCase();
    await pool.query(
      `INSERT INTO users
        (id, name, email, role, linkedin_url, github_url, portfolio_url, pfp_url, bio, skills, projects, specialty, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)`,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.linkedinUrl,
        user.githubUrl || null,
        user.portfolioUrl || null,
        user.pfpUrl,
        user.bio,
        JSON.stringify(user.skills),
        JSON.stringify(user.projects),
        user.specialty || null,
        `${firstName}@123`
      ]
    );
  }

  // 3. Attendance Config Presets (Set today's mode as Hybrid)
  const currentDate = getLocalDate();
  await pool.query(
    `INSERT INTO attendance_config (id, attendance_date, attendance_mode, start_time, end_time, created_by, remarks)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      `cfg-${Date.now()}`,
      currentDate,
      "hybrid",
      "09:00",
      "18:00",
      "saikrishna",
      "Standard Hybrid Check-in desk for experiential build work."
    ]
  );

  // 4. Seeding Attendance Logs
  for (const [index, att] of MOCK_ATTENDANCE.entries()) {
    const id = `att-${index + 1}`;
    const distance = att.checkInTime ? 15 : null; // 15m away (Verified)
    const verification = att.checkInTime ? "Verified" : null;
    const mode = att.checkInTime ? "offline" : null;
    
    await pool.query(
      `INSERT INTO attendance
        (id, user_id, attendance_date, status, check_in_time, location, latitude, longitude, accuracy, device_id, verification_status, distance_from_campus, check_in_mode, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        att.userId,
        currentDate,
        att.status,
        att.checkInTime ? `${currentDate}T${att.checkInTime}+05:30` : null,
        att.checkInTime ? "On-Campus, LeapStart Hyderabad Lab" : null,
        att.checkInTime ? 17.4125164 : null,
        att.checkInTime ? 78.3365692 : null,
        att.checkInTime ? 10.00 : null,
        att.checkInTime ? "desktop-auth-hash" : null,
        verification,
        distance,
        mode,
        Boolean(att.checkInTime)
      ]
    );

    if (att.checkInTime) {
      await pool.query(
        `INSERT INTO attendance_selfies (id, attendance_id, selfie_url, image_hash)
         VALUES ($1, $2, $3, $4)`,
        [`selfie-${index + 1}`, id, `https://api.dicebear.com/7.x/avataaars/svg?seed=${att.userId}`, `hash-${att.userId}`]
      );
    }
  }

  // 5. Leave requests
  for (const leave of INITIAL_LEAVES) {
    await pool.query(
      `INSERT INTO leave_requests (id, user_id, start_date, end_date, reason, status, applied_on, approved_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        leave.id,
        leave.userId,
        leave.startDate,
        leave.endDate,
        leave.reason,
        leave.status,
        leave.appliedOn,
        leave.approvedBy || null,
        leave.remarks || null
      ]
    );
  }

  // 6. Channels
  const channels = [
    { id: "announcements", name: "announcements", type: "announcement", desc: "Official announcements from mentors and founders." },
    { id: "general", name: "general", type: "text", desc: "General chat area for everyone." },
    { id: "attendance-help", name: "attendance-help", type: "text", desc: "Report GPS or Camera errors for manual reviews." },
    { id: "placements", name: "placements", type: "text", desc: "Placement calls and interview details." },
    { id: "projects", name: "projects", type: "text", desc: "Discuss portfolios, showcase, and peer critiques." },
    { id: "internships", name: "internships", type: "text", desc: "Paid internship postings and requirements." },
    { id: "random", name: "random", type: "text", desc: "Off-topic chats." },
    { id: "year-1", name: "year-1", type: "text", desc: "1st year student lounge." },
    { id: "year-2", name: "year-2", type: "text", desc: "2nd year student lounge." },
    { id: "year-3", name: "year-3", type: "text", desc: "3rd year student lounge." },
    { id: "year-4", name: "year-4", type: "text", desc: "4th year student lounge." }
  ];
  for (const c of channels) {
    await pool.query(
      "INSERT INTO channels (id, name, type, description) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING",
      [c.id, c.name, c.type, c.desc]
    );
  }

  // 7. Seed Messages
  await pool.query(
    `INSERT INTO messages (id, channel_id, sender_id, text, created_at)
     VALUES
      ($1, 'general', 'aadhira', 'Hey everyone! Welcome to V3 Discord-style Lounge! Test out markdown here! **bold** or \`code\`.', $2),
      ($3, 'general', 'suhas', 'Looking outstanding! Ready to review your Geofenced selfies on the Mentor deck.', $4),
      ($5, 'announcements', 'saikrishna', 'V3 Verification Paradigm is now fully live. Phone SMS OTPs and facial confidence parameters are now online.', $6)`,
    [
      "msg-ch-1",
      new Date(Date.now() - 7200000).toISOString(),
      "msg-ch-2",
      new Date(Date.now() - 3600000).toISOString(),
      "msg-ch-3",
      new Date(Date.now() - 1800000).toISOString()
    ]
  );

  // 8. Projects Seeding
  await createProject({
    id: "proj-1",
    studentId: "aadhira",
    studentName: "Aadhira S",
    studentEmail: "aadhira@leapstart.gmail.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aadhira",
    title: "Autonomous Factory Vision Agent",
    description:
      "An end-to-end automated machine vision inspector prototype deployed for high-speed conveyor belt anomaly tracking using custom neural weights and OpenCV matrices.",
    tags: ["Computer Vision", "Python", "OpenCV"],
    githubUrl: "https://github.com/aadhira/defect-detector",
    liveUrl: "https://leapstart.in/showcase/defect-detector",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    feedbacks: [
      {
        id: "f-1",
        authorName: "Suhas Choppala",
        authorRole: "Full Stack Engineering Mentor",
        authorPfp: "https://api.dicebear.com/7.x/avataaars/svg?seed=S01_Suhas",
        comment:
          "Outstanding implementation of local image matrices! Let's ensure thread pooling works efficiently for high fps streams.",
        rating: 5,
        timestamp: new Date(Date.now() - 72000000).toISOString()
      }
    ],
    averageRating: 5.0
  });
}

export async function ensureCohortYears() {
  const firstYearIds = ["riyah", "neel", "tanvi"];
  await pool.query(
    `UPDATE users
     SET specialty = '2nd Year Student'
     WHERE role = 'student' AND id <> ALL($1::text[])`,
    [firstYearIds]
  );

  for (const student of INITIAL_USERS.filter((user) => firstYearIds.includes(user.id))) {
    await pool.query(
      `INSERT INTO users
        (id, name, email, role, linkedin_url, github_url, portfolio_url, pfp_url, bio, skills, projects, specialty, password_hash)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, '1st Year Student', $11)
       ON CONFLICT (id) DO UPDATE
       SET specialty = '1st Year Student'`,
      [
        student.id,
        student.name,
        student.email,
        student.linkedinUrl,
        student.githubUrl || null,
        student.portfolioUrl || null,
        student.pfpUrl,
        student.bio,
        JSON.stringify(student.skills),
        JSON.stringify(student.projects),
        `${student.id}@123`
      ]
    );
  }
}

export async function initializeDatabase() {
  await createTables();
  await seedDatabase();
  await ensureCohortYears();
}

export async function findUserForLogin(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    `SELECT * FROM users
     WHERE lower(email) = $1 OR lower(email) LIKE $2 OR $1 LIKE id || '%'
     LIMIT 1`,
    [normalizedEmail, `%${normalizedEmail}%`]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserByEmail(email: string) {
  const result = await pool.query("SELECT * FROM users WHERE lower(email) = $1 LIMIT 1", [
    email.trim().toLowerCase()
  ]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserById(userId: string) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function listUsers(role?: UserProfile["role"]) {
  const result = role
    ? await pool.query("SELECT * FROM users WHERE role = $1 ORDER BY name ASC", [role])
    : await pool.query("SELECT * FROM users ORDER BY role ASC, name ASC");
  return result.rows.map(mapUser);
}

export async function createStudent(input: {
  id?: string;
  name: string;
  email: string;
  password: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  pfpUrl?: string;
  bio?: string;
  skills?: string[];
  specialty?: string;
}) {
  const normalizedName = input.name.trim();
  const normalizedEmail = input.email.trim().toLowerCase();
  const generatedId = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  const id = (input.id || generatedId || normalizedEmail.split("@")[0]).toLowerCase();
  const firstName = normalizedName.split(" ")[0] || id;
  
  const user: DbUser = {
    id,
    name: normalizedName,
    email: normalizedEmail,
    role: "student",
    linkedinUrl: input.linkedinUrl?.trim() || "https://www.linkedin.com/company/leapstart-co/",
    githubUrl: input.githubUrl?.trim() || undefined,
    portfolioUrl: input.portfolioUrl?.trim() || undefined,
    pfpUrl: input.pfpUrl?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedName)}`,
    bio: input.bio?.trim() || `LeapStart student building attendance-ready projects and experiential portfolio artifacts.`,
    skills: input.skills?.filter(Boolean) || ["JavaScript", "React", "PostgreSQL"],
    projects: [],
    specialty: input.specialty?.trim() || "1st Year Student",
    passwordHash: input.password || `${firstName.toLowerCase()}@123`
  };

  const result = await pool.query(
    `INSERT INTO users
      (id, name, email, role, linkedin_url, github_url, portfolio_url, pfp_url, bio, skills, projects, specialty, password_hash)
     VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8, $9::jsonb, '[]'::jsonb, $10, $11)
     RETURNING *`,
    [
      user.id,
      user.name,
      user.email,
      user.linkedinUrl,
      user.githubUrl || null,
      user.portfolioUrl || null,
      user.pfpUrl,
      user.bio,
      JSON.stringify(user.skills),
      user.specialty || null,
      user.passwordHash
    ]
  );

  return mapUser(result.rows[0]);
}

export async function upsertOtp(email: string, code: string, expires: Date) {
  await pool.query(
    `INSERT INTO otps (email, code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`,
    [email.toLowerCase(), code, expires.toISOString()]
  );
}

export async function getOtp(email: string) {
  const result = await pool.query("SELECT code, expires_at FROM otps WHERE email = $1", [email.toLowerCase()]);
  if (!result.rows[0]) return null;
  return {
    code: result.rows[0].code as string,
    expires: new Date(result.rows[0].expires_at).getTime()
  };
}

export async function deleteOtp(email: string) {
  await pool.query("DELETE FROM otps WHERE email = $1", [email.toLowerCase()]);
}

export async function updatePassword(email: string, newPassword: string) {
  await pool.query("UPDATE users SET password_hash = $1 WHERE lower(email) = $2", [
    newPassword,
    email.toLowerCase()
  ]);
}

export async function updateUserProfile(
  userId: string,
  input: {
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    pfpUrl?: string;
  }
) {
  const result = await pool.query(
    `UPDATE users
     SET linkedin_url = COALESCE($2, linkedin_url),
       github_url = $3,
       portfolio_url = $4,
       pfp_url = COALESCE($5, pfp_url)
     WHERE id = $1
     RETURNING *`,
    [
      userId,
      input.linkedinUrl?.trim() || null,
      input.githubUrl?.trim() || null,
      input.portfolioUrl?.trim() || null,
      input.pfpUrl?.trim() || null
    ]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function listAttendance(filters: { userId?: string; date?: string }) {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filters.userId) {
    values.push(filters.userId);
    conditions.push(`user_id = $${values.length}`);
  }
  if (filters.date) {
    values.push(filters.date);
    conditions.push(`attendance_date = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM attendance ${where} ORDER BY attendance_date DESC, user_id ASC`, values);
  return result.rows.map(mapAttendance);
}

export async function checkInAttendance(
  userId: string,
  status: AttendanceRecord["status"],
  location?: string,
  lat?: number,
  lng?: number,
  accuracy?: number,
  selfieUrl?: string,
  deviceId?: string,
  verificationStatus?: AttendanceRecord["verificationStatus"],
  distance?: number,
  mode?: AttendanceRecord["checkInMode"]
) {
  const todayStr = getLocalDate();
  const now = new Date().toISOString();
  const id = `att-${Date.now()}`;
  
  await pool.query(
    `INSERT INTO attendance
      (id, user_id, attendance_date, status, check_in_time, location, latitude, longitude, accuracy, device_id, verification_status, distance_from_campus, check_in_mode, verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
     ON CONFLICT (user_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status,
       check_in_time = EXCLUDED.check_in_time,
       location = EXCLUDED.location,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       accuracy = EXCLUDED.accuracy,
       device_id = EXCLUDED.device_id,
       verification_status = EXCLUDED.verification_status,
       distance_from_campus = EXCLUDED.distance_from_campus,
       check_in_mode = EXCLUDED.check_in_mode,
       verified = true`,
    [
      id,
      userId,
      todayStr,
      status,
      now,
      location || "Hybrid telemetry",
      lat || null,
      lng || null,
      accuracy || null,
      deviceId || "web-client",
      verificationStatus || "Verified",
      distance || null,
      mode || "online"
    ]
  );

  const finalRecordResult = await pool.query(
    "SELECT id FROM attendance WHERE user_id = $1 AND attendance_date = $2",
    [userId, todayStr]
  );
  const finalId = finalRecordResult.rows[0].id;

  if (selfieUrl) {
    // Generate simple content hash representing duplicate selfie detection checks
    const hash = `img-hash-${selfieUrl.slice(-15)}`;
    await pool.query(
      `INSERT INTO attendance_selfies (id, attendance_id, selfie_url, image_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [`selfie-${Date.now()}`, finalId, selfieUrl, hash]
    );
  }

  return listAttendance({ userId });
}

export async function updateAttendanceBatch(records: Pick<AttendanceRecord, "userId" | "date" | "status">[]) {
  for (const rec of records) {
    const id = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `INSERT INTO attendance (id, user_id, attendance_date, status, verified)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, verified = true`,
      [id, rec.userId, rec.date, rec.status]
    );
  }
}

export async function listLeaves(userId?: string) {
  const result = userId
    ? await pool.query("SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY applied_on DESC", [userId])
    : await pool.query("SELECT * FROM leave_requests ORDER BY applied_on DESC");
  return result.rows.map(mapLeave);
}

export async function createLeave(input: {
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  const newRequest: LeaveRequest = {
    id: `lv-${Date.now()}`,
    userId: input.userId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    status: "pending",
    appliedOn: getLocalDate()
  };
  await pool.query(
    `INSERT INTO leave_requests (id, user_id, start_date, end_date, reason, status, applied_on)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      newRequest.id,
      newRequest.userId,
      newRequest.startDate,
      newRequest.endDate,
      newRequest.reason,
      newRequest.status,
      newRequest.appliedOn
    ]
  );
  return newRequest;
}

export async function respondToLeave(id: string, status: LeaveRequest["status"], remarks: string, approvedBy: string) {
  const result = await pool.query("SELECT * FROM leave_requests WHERE id = $1", [id]);
  if (!result.rows[0]) return false;
  const leave = mapLeave(result.rows[0]);

  await pool.query("UPDATE leave_requests SET status = $1, remarks = $2, approved_by = $3 WHERE id = $4", [
    status,
    remarks || null,
    approvedBy,
    id
  ]);

  if (status === "approved") {
    const current = new Date(`${leave.startDate}T00:00:00Z`);
    const end = new Date(`${leave.endDate}T00:00:00Z`);
    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10);
      const attId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await pool.query(
        `INSERT INTO attendance (id, user_id, attendance_date, status, verified)
         VALUES ($1, $2, $3, 'leave', true)
         ON CONFLICT (user_id, attendance_date)
         DO UPDATE SET status = 'leave', verified = true`,
        [attId, leave.userId, dateStr]
      );
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return true;
}

// 7. Channels & Messages
export async function getChannels(): Promise<Channel[]> {
  const result = await pool.query("SELECT * FROM channels ORDER BY name ASC");
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as any,
    description: row.description || undefined,
    createdAt: row.created_at.toISOString()
  }));
}

export async function createChannel(name: string, type: string, description?: string): Promise<Channel> {
  const id = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const result = await pool.query(
    "INSERT INTO channels (id, name, type, description) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, name.trim(), type, description || null]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description || undefined,
    createdAt: row.created_at.toISOString()
  };
}

export async function listChannelMessages(channelId: string): Promise<GroupMessage[]> {
  const result = await pool.query(
    `SELECT m.*, u.name as sender_name, u.role as sender_role, u.pfp_url as sender_pfp
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.channel_id = $1
     ORDER BY m.created_at ASC`,
    [channelId]
  );
  
  const messages: GroupMessage[] = [];
  for (const row of result.rows) {
    const reactionsRes = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM message_reactions r
       JOIN users u ON r.user_id = u.id
       WHERE r.message_id = $1`,
      [row.id]
    );

    const attachmentsRes = await pool.query(
      `SELECT * FROM chat_attachments WHERE message_id = $1`,
      [row.id]
    );

    messages.push({
      id: row.id,
      groupId: row.channel_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderRole: row.sender_role,
      senderPfp: row.sender_pfp,
      text: row.text,
      timestamp: row.created_at.toISOString(),
      isPinned: Boolean(row.is_pinned),
      parentId: row.parent_id || undefined,
      reactions: reactionsRes.rows.map((r) => ({
        id: r.id,
        messageId: r.message_id,
        userId: r.user_id,
        userName: r.user_name,
        emoji: r.emoji
      })),
      attachments: attachmentsRes.rows.map((a) => ({
        id: a.id,
        messageId: a.message_id,
        publicId: a.public_id,
        secureUrl: a.secure_url,
        fileName: a.file_name,
        fileType: a.file_type,
        fileSize: Number(a.file_size),
        createdAt: a.created_at.toISOString()
      }))
    });
  }
  return messages;
}

export async function createChannelMessage(input: {
  channelId: string;
  senderId: string;
  text: string;
  parentId?: string;
}): Promise<GroupMessage> {
  const id = `msg-${Date.now()}`;
  await pool.query(
    "INSERT INTO messages (id, channel_id, sender_id, text, parent_id) VALUES ($1, $2, $3, $4, $5)",
    [id, input.channelId, input.senderId, input.text, input.parentId || null]
  );

  const msgQuery = await pool.query(
    `SELECT m.*, u.name as sender_name, u.role as sender_role, u.pfp_url as sender_pfp
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = $1`,
    [id]
  );
  
  const row = msgQuery.rows[0];
  return {
    id: row.id,
    groupId: row.channel_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    senderPfp: row.sender_pfp,
    text: row.text,
    timestamp: row.created_at.toISOString(),
    isPinned: false,
    parentId: row.parent_id || undefined,
    reactions: [],
    attachments: []
  };
}

export async function addMessageReaction(messageId: string, userId: string, emoji: string) {
  const id = `re-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await pool.query(
    `INSERT INTO message_reactions (id, message_id, user_id, emoji)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
    [id, messageId, userId, emoji]
  );
}

export async function removeMessageReaction(messageId: string, userId: string, emoji: string) {
  await pool.query(
    "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
    [messageId, userId, emoji]
  );
}

export async function addChatAttachment(input: {
  messageId: string;
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<ChatAttachment> {
  const id = `att-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO chat_attachments (id, message_id, public_id, secure_url, file_name, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, input.messageId, input.publicId, input.secureUrl, input.fileName, input.fileType, input.fileSize]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    messageId: row.message_id,
    publicId: row.public_id,
    secureUrl: row.secure_url,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: Number(row.file_size),
    createdAt: row.created_at.toISOString()
  };
}

export async function listMessages(userId: string, targetId: string) {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE channel_id IS NULL AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
     ORDER BY created_at ASC`,
    [userId, targetId]
  );
  return result.rows.map(mapMessage);
}

export async function createMessage(senderId: string, receiverId: string, text: string) {
  const message: DirectMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    receiverId,
    text,
    timestamp: new Date().toISOString()
  };
  await pool.query(
    "INSERT INTO messages (id, sender_id, receiver_id, text) VALUES ($1, $2, $3, $4)",
    [message.id, message.senderId, message.receiverId, message.text]
  );
  return message;
}

// 8. Attendance config
export async function getAttendanceConfigs(): Promise<AttendanceConfig[]> {
  const result = await pool.query("SELECT * FROM attendance_config ORDER BY attendance_date DESC");
  return result.rows.map((row) => ({
    id: row.id,
    date: toDateString(row.attendance_date),
    attendanceMode: row.attendance_mode as any,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
    remarks: row.remarks || undefined,
    createdAt: row.created_at.toISOString()
  }));
}

export async function getTodayAttendanceConfig(): Promise<AttendanceConfig | null> {
  const todayStr = getLocalDate();
  const result = await pool.query("SELECT * FROM attendance_config WHERE attendance_date = $1 LIMIT 1", [todayStr]);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    date: toDateString(row.attendance_date),
    attendanceMode: row.attendance_mode as any,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
    remarks: row.remarks || undefined,
    createdAt: row.created_at.toISOString()
  };
}

export async function upsertAttendanceConfig(input: {
  date: string;
  attendanceMode: "offline" | "online" | "hybrid";
  startTime: string;
  endTime: string;
  createdBy: string;
  remarks?: string;
}): Promise<AttendanceConfig> {
  const id = `cfg-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO attendance_config (id, attendance_date, attendance_mode, start_time, end_time, created_by, remarks)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (attendance_date)
     DO UPDATE SET attendance_mode = EXCLUDED.attendance_mode,
       start_time = EXCLUDED.start_time,
       end_time = EXCLUDED.end_time,
       created_by = EXCLUDED.created_by,
       remarks = EXCLUDED.remarks
     RETURNING *`,
    [id, input.date, input.attendanceMode, input.startTime, input.endTime, input.createdBy, input.remarks || null]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    date: toDateString(row.attendance_date),
    attendanceMode: row.attendance_mode as any,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
    remarks: row.remarks || undefined,
    createdAt: row.created_at.toISOString()
  };
}

// 9. Notifications
export async function getNotifications(userId: string): Promise<Notification[]> {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
  return result.rows.map(mapNotification);
}

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: Notification["type"];
}): Promise<Notification> {
  const id = `nt-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO notifications (id, user_id, title, message, type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, input.userId, input.title, input.message, input.type]
  );
  return mapNotification(result.rows[0]);
}

export async function markNotificationRead(id: string) {
  await pool.query("UPDATE notifications SET is_read = true WHERE id = $1", [id]);
}

export async function markAllNotificationsRead(userId: string) {
  await pool.query("UPDATE notifications SET is_read = true WHERE user_id = $1", [userId]);
}

// 10. Audit Logs & Fraud Alerts
export async function getAuditLogs(isFraudOnly = false): Promise<AuditLog[]> {
  const query = isFraudOnly
    ? "SELECT * FROM audit_logs WHERE is_fraud_alert = true ORDER BY created_at DESC"
    : "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100";
  const result = await pool.query(query);
  return result.rows.map(mapAuditLog);
}

export async function createAuditLog(input: {
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  isFraudAlert?: boolean;
}): Promise<AuditLog> {
  const id = `log-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO audit_logs (id, user_id, user_name, action, details, ip_address, user_agent, is_fraud_alert)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      id,
      input.userId || null,
      input.userName || null,
      input.action,
      input.details || null,
      input.ipAddress || null,
      input.userAgent || null,
      Boolean(input.isFraudAlert)
    ]
  );
  return mapAuditLog(result.rows[0]);
}

export async function listIncubationIdeas() {
  const result = await pool.query("SELECT * FROM incubation_ideas ORDER BY created_at DESC");
  return result.rows.map(mapIncubationIdea);
}

export async function createIncubationIdea(input: Omit<IncubationIdea, "id" | "createdAt">) {
  const idea: IncubationIdea = {
    ...input,
    id: `idea-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  await pool.query(
    `INSERT INTO incubation_ideas
      (id, title, problem, stage, owner_id, owner_name, owner_role, tags, attachment_names, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)`,
    [
      idea.id,
      idea.title,
      idea.problem,
      idea.stage,
      idea.ownerId,
      idea.ownerName,
      idea.ownerRole,
      JSON.stringify(idea.tags),
      JSON.stringify(idea.attachmentNames),
      idea.createdAt
    ]
  );
  return idea;
}

export async function listProjects() {
  const result = await pool.query("SELECT * FROM posted_projects ORDER BY created_at DESC");
  return result.rows.map(mapProject);
}

export async function createProject(project: PostedProject) {
  await pool.query(
    `INSERT INTO posted_projects
      (id, student_id, student_name, student_email, avatar_url, title, description, tags, github_url, live_url, created_at, feedbacks, average_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12::jsonb, $13)
     ON CONFLICT (id) DO NOTHING`,
    [
      project.id,
      project.studentId,
      project.studentName,
      project.studentEmail,
      project.avatarUrl || null,
      project.title,
      project.description,
      JSON.stringify(project.tags),
      project.githubUrl || null,
      project.liveUrl || null,
      project.timestamp,
      JSON.stringify(project.feedbacks),
      project.averageRating || 0
    ]
  );
}

export async function addProject(project: Omit<PostedProject, "id" | "timestamp" | "feedbacks" | "averageRating">) {
  const newProject: PostedProject = {
    ...project,
    id: `proj-${Date.now()}`,
    timestamp: new Date().toISOString(),
    feedbacks: [],
    averageRating: 0
  };
  await createProject(newProject);
  return newProject;
}

export async function addProjectFeedback(projectId: string, feedback: Omit<PublicFeedback, "id" | "timestamp">) {
  const projectResult = await pool.query("SELECT * FROM posted_projects WHERE id = $1", [projectId]);
  if (!projectResult.rows[0]) return null;

  const project = mapProject(projectResult.rows[0]);
  const newFeedback: PublicFeedback = {
    ...feedback,
    id: `fb-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  const feedbacks = [...project.feedbacks, newFeedback];
  const sum = feedbacks.reduce((acc, current) => acc + current.rating, 0);
  const averageRating = Number((sum / feedbacks.length).toFixed(1));

  const result = await pool.query(
    `UPDATE posted_projects
     SET feedbacks = $1::jsonb, average_rating = $2
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(feedbacks), averageRating, projectId]
  );
  return mapProject(result.rows[0]);
}

export async function closeDatabase() {
  await pool.end();
}
