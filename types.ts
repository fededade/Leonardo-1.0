export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  avatarUrl: string;
  email?: string;
}

export interface AppFile {
  id: string;
  name: string;
  content: string;
  type: string;
  ownerId: string;
  timestamp: number;
}

export interface TeacherFeedback {
  id: string;
  studentId: string;
  teacherId: string;
  content: string;
  grade?: string;
  timestamp: number;
  readBy: string[];
  isPublic?: boolean;
  senderName?: string;
  senderRole?: UserRole;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: number;
  read: boolean;
  replyToId?: string;
  replyToContent?: string;
}

export enum Discipline {
  GENERAL = 'Generale',
  MATH = 'Matematica',
  PHYSICS = 'Fisica',
  SCIENCE = 'Scienze',
  PHILOSOPHY = 'Filosofia',
  HISTORY = 'Storia',
  LITERATURE = 'Letteratura',
  ENGLISH = 'Inglese'
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: number;
  attachments?: { base64: string; mimeType: string }[];
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  fileName: string;
  status: 'uploading' | 'success' | 'error';
}
