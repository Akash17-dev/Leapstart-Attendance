import "dotenv/config";
import { Pool, types } from "pg";
import { INITIAL_LEAVES, INITIAL_USERS, MOCK_ATTENDANCE } from "./data";
import {
  AttendanceRecord,
  DirectMessage,
  GroupMessage,
  IncubationIdea,
  LeaveRequest,
  PostedProject,
  PublicFeedback,
  UserProfile
} from "./types";

export type DbUser = UserProfile & { passwordHash: string };

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "",
  database: process.env.POSTGRES_DATABASE || "postgres"
});

types.setTypeParser(1082, (value) => value);

const getLocalDate = () => {
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

const mapGroupMessage = (row: any): GroupMessage => ({
  id: row.id,
  groupId: row.group_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  text: row.text,
  timestamp: toIsoString(row.created_at) || new Date().toISOString()
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

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'late')),
      check_in_time TIMESTAMPTZ,
      check_out_time TIMESTAMPTZ,
      location TEXT,
      verified BOOLEAN NOT NULL DEFAULT false,
      UNIQUE (user_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
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

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS group_messages (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
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

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
    ALTER TABLE group_messages DROP CONSTRAINT IF EXISTS group_messages_group_id_check;
  `);
}

export async function resetAndSeedDatabase() {
  await pool.query(`
    DROP TABLE IF EXISTS attendance CASCADE;
    DROP TABLE IF EXISTS leaves CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS group_messages CASCADE;
    DROP TABLE IF EXISTS otps CASCADE;
    DROP TABLE IF EXISTS posted_projects CASCADE;
    DROP TABLE IF EXISTS incubation_ideas CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  await createTables();
  await seedDatabase();
}

export async function seedDatabase() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) return;

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

  const currentDate = getLocalDate();
  for (const [index, att] of MOCK_ATTENDANCE.entries()) {
    await pool.query(
      `INSERT INTO attendance
        (id, user_id, attendance_date, status, check_in_time, location, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `att-${index + 1}`,
        att.userId,
        currentDate,
        att.status,
        att.checkInTime ? `${currentDate}T${att.checkInTime}+05:30` : null,
        att.checkInTime ? "On-Campus, LeapStart Hyderabad Lab" : null,
        Boolean(att.checkInTime)
      ]
    );
  }

  for (const leave of INITIAL_LEAVES) {
    await pool.query(
      `INSERT INTO leaves
        (id, user_id, start_date, end_date, reason, status, applied_on, approved_by, remarks)
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

  await pool.query(
    `INSERT INTO messages (id, sender_id, receiver_id, text, created_at)
     VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15)`,
    [
      "msg-init-1",
      "aadhira",
      "abhishek",
      "Hey Abhishek, did you complete Goli sir's DB Schema exercise yet?",
      new Date(Date.now() - 3600000).toISOString(),
      "msg-init-2",
      "abhishek",
      "aadhira",
      "Yes! Loaded it using Postgres tables. Direct messaging works too, completely locked from admins!",
      new Date(Date.now() - 3000000).toISOString(),
      "msg-init-3",
      "aadhira",
      "abhishek",
      "That's exactly what I wanted. Privacy compliance is top notch.",
      new Date(Date.now() - 2500000).toISOString()
    ]
  );

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
      },
      {
        id: "f-2",
        authorName: "Abhishek Singh",
        authorRole: "2nd Year Student",
        authorPfp: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhishek",
        comment:
          "Tested this directly inside the Hyderabad lab. The inference frame rate is amazing under minimal hardware constraints!",
        rating: 4,
        timestamp: new Date(Date.now() - 36400000).toISOString()
      }
    ],
    averageRating: 4.5
  });

  await createProject({
    id: "proj-2",
    studentId: "abhishek",
    studentName: "Abhishek Singh",
    studentEmail: "abhishek@leapstart.gmail.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhishek",
    title: "Predictive Churn Multilayer Perceptron",
    description:
      "Custom multi-layer MLP predictive classifier trained on large server log indexes to map student retainability scores in telemetry records.",
    tags: ["Deep Learning", "TensorFlow", "SQL"],
    githubUrl: "https://github.com/abhishek/predictive-analytics",
    liveUrl: "https://leapstart.in/showcase/churn",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    feedbacks: [
      {
        id: "f-3",
        authorName: "Goli Venu Gopal",
        authorRole: "Database & Backend API Mentor",
        authorPfp: "https://api.dicebear.com/7.x/avataaars/svg?seed=M02_Goli",
        comment:
          "Exceptional schema structure. Storing normalized state tokens securely ensures this scales comfortably across servers.",
        rating: 5,
        timestamp: new Date(Date.now() - 144000000).toISOString()
      }
    ],
    averageRating: 5
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
       SET specialty = '1st Year Student',
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         linkedin_url = EXCLUDED.linkedin_url,
         pfp_url = EXCLUDED.pfp_url,
         bio = EXCLUDED.bio,
         skills = EXCLUDED.skills,
         projects = EXCLUDED.projects`,
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
        `${student.name.split(" ")[0].toLowerCase()}@123`
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
    bio:
      input.bio?.trim() ||
      `LeapStart student building attendance-ready projects and experiential portfolio artifacts.`,
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

  await pool.query(
    `INSERT INTO attendance (id, user_id, attendance_date, status, verified)
     VALUES ($1, $2, $3, 'absent', false)
     ON CONFLICT (user_id, attendance_date) DO NOTHING`,
    [`att-${Date.now()}-${Math.floor(Math.random() * 1000)}`, user.id, getLocalDate()]
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
  const values: string[] = [];
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

export async function checkInAttendance(userId: string, status: AttendanceRecord["status"], location?: string) {
  const todayStr = getLocalDate();
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO attendance (id, user_id, attendance_date, status, check_in_time, location, verified)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     ON CONFLICT (user_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status,
       check_in_time = EXCLUDED.check_in_time,
       location = EXCLUDED.location,
       verified = true`,
    [`att-${Date.now()}`, userId, todayStr, status, now, location || "Remote Laboratory Interface"]
  );
  return listAttendance({});
}

export async function updateAttendanceBatch(records: Pick<AttendanceRecord, "userId" | "date" | "status">[]) {
  for (const rec of records) {
    await pool.query(
      `INSERT INTO attendance (id, user_id, attendance_date, status, verified)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, verified = true`,
      [`att-${Date.now()}-${Math.floor(Math.random() * 1000)}`, rec.userId, rec.date, rec.status]
    );
  }
}

export async function listLeaves(userId?: string) {
  const result = userId
    ? await pool.query("SELECT * FROM leaves WHERE user_id = $1 ORDER BY applied_on DESC", [userId])
    : await pool.query("SELECT * FROM leaves ORDER BY applied_on DESC");
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
    `INSERT INTO leaves (id, user_id, start_date, end_date, reason, status, applied_on)
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
  const result = await pool.query("SELECT * FROM leaves WHERE id = $1", [id]);
  if (!result.rows[0]) return false;
  const leave = mapLeave(result.rows[0]);

  await pool.query("UPDATE leaves SET status = $1, remarks = $2, approved_by = $3 WHERE id = $4", [
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
      await pool.query(
        `INSERT INTO attendance (id, user_id, attendance_date, status, verified)
         VALUES ($1, $2, $3, 'leave', true)
         ON CONFLICT (user_id, attendance_date)
         DO UPDATE SET status = 'leave', verified = true`,
        [`att-${Date.now()}-${Math.floor(Math.random() * 1000)}`, leave.userId, dateStr]
      );
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return true;
}

export async function listMessages(userId: string, targetId: string) {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
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
    "INSERT INTO messages (id, sender_id, receiver_id, text, created_at) VALUES ($1, $2, $3, $4, $5)",
    [message.id, message.senderId, message.receiverId, message.text, message.timestamp]
  );
  return message;
}

export async function listGroupMessages(groupId: string) {
  const result = await pool.query(
    `SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC`,
    [groupId]
  );
  return result.rows.map(mapGroupMessage);
}

export async function createGroupMessage(input: { groupId: string; senderId: string; senderName: string; text: string }) {
  const message: GroupMessage = {
    id: `grp-${Date.now()}`,
    groupId: input.groupId,
    senderId: input.senderId,
    senderName: input.senderName,
    text: input.text,
    timestamp: new Date().toISOString()
  };
  await pool.query(
    `INSERT INTO group_messages (id, group_id, sender_id, sender_name, text, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [message.id, message.groupId, message.senderId, message.senderName, message.text, message.timestamp]
  );
  return message;
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
