/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "student" | "mentor" | "admin";

export interface ProjectData {
  title: string;
  description: string;
  tags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  linkedinUrl: string;
  githubUrl?: string;
  portfolioUrl?: string;
  pfpUrl: string; // profile picture placeholder or LinkedIn mockup
  bio: string;
  skills: string[];
  projects: ProjectData[];
  specialty?: string; // e.g. "Full Stack", "DB & backend api's", "Linux", "Founder", "HR"
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "leave" | "late";
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  location?: string; // latitude, longitude style
  verified?: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
  approvedBy?: string;
  remarks?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string; // ISO string
}

export interface PublicFeedback {
  id: string;
  authorName: string;
  authorRole: string;
  authorPfp?: string;
  comment: string;
  rating: number; // 1 to 5
  timestamp: string;
}

export interface PostedProject {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  timestamp: string;
  feedbacks: PublicFeedback[];
  averageRating?: number;
}

export interface ChatbotMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface IncubationIdea {
  id: string;
  title: string;
  problem: string;
  stage: "idea" | "prototype" | "pilot" | "launched";
  ownerId: string;
  ownerName: string;
  ownerRole: UserRole;
  tags: string[];
  attachmentNames: string[];
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}
