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
  pfpUrl: string;
  bio: string;
  skills: string[];
  projects: ProjectData[];
  specialty?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "leave" | "late";
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  location?: string; // e.g. "Lat 17.4125, Lng 78.3365"
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  selfieUrl?: string;
  deviceId?: string;
  verificationStatus?: "Verified" | "Warning" | "Manual Review" | "Rejected";
  distanceFromCampus?: number; // in meters
  checkInMode?: "offline" | "online";
  verified?: boolean;
}

export interface AttendanceConfig {
  id: string;
  date: string; // YYYY-MM-DD
  attendanceMode: "offline" | "online" | "hybrid";
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  createdBy: string;
  remarks?: string;
  createdAt: string;
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

export interface Channel {
  id: string;
  name: string; // e.g. "announcements", "general"
  type: "text" | "announcement";
  description?: string;
  createdAt: string;
}

export interface ChannelMember {
  channelId: string;
  userId: string;
  joinedAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string; // references channelId
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  senderPfp?: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
  parentId?: string; // for thread replies
  reactions?: MessageReaction[];
  attachments?: ChatAttachment[];
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "attendance" | "message" | "leave" | "project" | "announcement" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  isFraudAlert?: boolean;
  createdAt: string;
}

export interface FaceVerificationMetadata {
  id: string;
  userId: string;
  faceVerificationStatus: "verified" | "failed" | "unconfigured";
  faceProvider: string;
  faceConfidence?: number;
  faceMatchScore?: number;
  verifiedAt?: string;
}
