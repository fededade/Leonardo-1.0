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

// ============================================
// NUOVI TIPI PER COMPITI E VALUTAZIONI
// ============================================

export type AssignmentType = 'collective' | 'single';
export type AssignmentStatus = 'active' | 'closed';

// Compito creato dal docente
export interface Assignment {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  type: AssignmentType;       // 'collective' = tutti i docenti, 'single' = solo creatore
  dueDate?: number;           // Data consegna (opzionale, timestamp)
  createdAt: number;
  status: AssignmentStatus;   // 'active' o 'closed'
  subject?: string;           // Materia (opzionale)
}

// Consegna elaborato da parte dello studente
export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  fileName: string;
  submittedAt: number;
  notes?: string;             // Note dello studente (opzionale)
  targetTeacherId?: string;   // Docente a cui è indirizzato (per compiti collettivi)
  targetTeacherName?: string;
}

// Voto assegnato da un docente
export interface Grade {
  id: string;
  assignmentId: string;
  submissionId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  value: number;              // Voto numerico (es: 7.5)
  comment?: string;           // Commento del docente (opzionale)
  timestamp: number;
}

// Voto finale (per compiti collettivi con media)
export interface FinalGrade {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  averageValue: number;       // Media aritmetica
  finalValue: number;         // Voto finale (può essere rettificato)
  isRectified: boolean;       // Se il docente ha rettificato
  rectifiedBy?: string;       // ID docente che ha rettificato
  rectifiedByName?: string;
  timestamp: number;
}

// Notifica per il riepilogo attività al login
export interface ActivityNotification {
  type: 'message' | 'bulletin' | 'assignment' | 'grade';
  title: string;
  description: string;
  timestamp: number;
  fromId?: string;
  fromName?: string;
  relatedId?: string;         // ID del messaggio/compito/voto correlato
}
