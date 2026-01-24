import React, { useState, useEffect } from 'react';
import { User, AppFile, TeacherFeedback, Message, UserRole } from '../types';
import FileCard from './FileCard';
import MessageCenter from './MessageCenter';

interface TeacherDashboardProps {
  currentUser: User;
  students: User[];
  teachers: User[];
  allFiles: AppFile[];
  feedbacks: TeacherFeedback[];
  messages: Message[];
  onAddFeedback: (studentId: string, content: string, grade?: string, isPublic?: boolean, attachmentUrl?: string, attachmentName?: string) => void;
  onLogout: () => void;
  onAddStudent: (name: string, username: string, password?: string, email?: string) => void;
  onAddTeacher: (name: string, username: string, password?: string, email?: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onSendMessage: (recipientId: string, recipientName: string, content: string, replyToId?: string, replyToContent?: string) => void;
  onMarkMessageAsRead: (messageId: string) => void;
  unreadMessageCount: number;
  usersForMessaging: User[];
  onUploadAttachment: (file: File) => Promise<{url: string, name: string} | null>;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser, students, teachers, allFiles, feedbacks, messages, onAddFeedback, onLogout, onAddStudent, onAddTeacher, onDeleteStudent,
  onSendMessage, onMarkMessageAsRead, unreadMessageCount, usersForMessaging, onUploadAttachment
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>('ALL');
  const [feedbackText, setFeedbackText] = useState('');
  const [gradeText, setGradeText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  
  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addUserType, setAddUserType] = useState<'student' | 'teacher'>('student');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [glowingUsers, setGlowingUsers] = useState<Set<string>>(new Set());
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [previewFile, setPreviewFile] = useState<AppFile | null>(null);

  const isClassView = selectedStudentId === 'ALL';
  const selectedStudent = (students || []).find(s => s.id === selectedStudentId);

  useEffect(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const newGlowing = new Set<string>();
    (allFiles || []).forEach(f => {
      if (f.timestamp > fiveMinutesAgo) newGlowing.add(f.ownerId);
    });
    (messages || []).forEach(m => {
      if (!m.read && m.recipientId === currentUser.id && m.timestamp > fiveMinutesAgo) {
        newGlowing.add(m.senderId);
      }
    });
    setGlowingUsers(newGlowing);
  }, [allFiles, messages, currentUser.id]);

  const publicFeedbacksByDate = (feedbacks || [])
    .filter(fb => fb.isPublic || fb.studentId === 'all')
    .reduce((acc, fb) => {
      const date = new Date(fb.timestamp).toLocaleDateString('it-IT');
      if (!acc[date]) acc[date] = [];
      acc[date].push(fb);
      return acc;
    }, {} as Record<string, TeacherFeedback[]>);

  let displayedFiles: AppFile[] = [];
  if (selectedStudent) {
    displayedFiles = (allFiles || []).filter(f => f.ownerId === selectedStudent.id).sort((a, b) => b.timestamp - a.timestamp);
  }

  let displayedFeedbacks: TeacherFeedback[] = [];
  if (isClassView) {
    displayedFeedbacks = (feedbacks || []).filter(f => f.isPublic || f.studentId === 'all');
  } else if (selectedStudent) {
    displayedFeedbacks = (feedbacks || []).filter(f => f.studentId === selectedStudent.id || f.isPublic);
  }

  const handleSendFeedback = async () => {
    if ((selectedStudentId || isClassView) && feedbackText) {
      setIsUploading(true);
      
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      
      // Upload attachment if present
      if (attachmentFile && onUploadAttachment) {
        const result = await onUploadAttachment(attachmentFile);
        if (result) {
          attachmentUrl = result.url;
          attachmentName = result.name;
        }
      }
      
      const targetId = isClassView ? 'all' : selectedStudentId!;
      const publicFlag = isClassView ? true : isPublic;
      onAddFeedback(targetId, feedbackText, gradeText, publicFlag, attachmentUrl, attachmentName);
      
      setFeedbackText('');
      setGradeText('');
      setAttachmentFile(null);
      if (!isClassView) setIsPublic(false);
      setIsUploading(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName && newUserUsername && newUserPassword) {
      try {
        if (addUserType === 'student') {
          await onAddStudent(newUserName, newUserUsername, newUserPassword, newUserEmail);
        } else {
          await onAddTeacher(newUserName, newUserUsername, newUserPassword, newUserEmail);
        }
        setIsAddModalOpen(false);
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserEmail('');
      } catch (error) {
        console.error('Errore creazione utente:', error);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, studentId: string, studentName: string) => {
    e.stopPropagation();
    if (window.confirm(`Sei sicuro di voler eliminare ${studentName}?`)) {
      onDeleteStudent(studentId);
      if (selectedStudentId === studentId) setSelectedStudentId(null);
    }
  };

  const downloadFile = async (file: AppFile) => {
    try {
      // Fetch the file as blob to force download
      const response = await fetch(file.content, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      // Fallback: try with no-cors or direct link
      console.error('Download error:', error);
      
      // Create a temporary link with target blank to download
      const link = document.createElement('a');
      link.href = file.content;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getSenderName = (fb: TeacherFeedback) => {
    if (fb.senderName) return fb.senderName;
    if (fb.senderRole === UserRole.STUDENT) {
      const student = (students || []).find(s => s.id === fb.teacherId);
      return student?.name || 'Studente';
    }
    const teacher = (teachers || []).find(t => t.id === fb.teacherId);
    if (teacher) return teacher.name;
    if (currentUser.id === fb.teacherId) return currentUser.name;
    return 'Docente';
  };

  const getSenderRole = (fb: TeacherFeedback) => {
    if (fb.senderRole) return fb.senderRole;
    return UserRole.TEACHER;
  };

  const handleReplyToFeedback = async (originalFeedback: TeacherFeedback) => {
    if (!replyText.trim()) return;
    
    // Create a reply as a public feedback
    const replyContent = `↩️ In risposta a ${getSenderName(originalFeedback)}:\n"${originalFeedback.content.substring(0, 50)}${originalFeedback.content.length > 50 ? '...' : ''}"\n\n${replyText}`;
    
    await onAddFeedback('all', replyContent, '', true);
    
    setReplyText('');
    setReplyingToId(null);
  };

  const postItColors = [
    'from-yellow-400 to-amber-400',
    'from-pink-400 to-rose-400',
    'from-cyan-400 to-blue-400',
    'from-green-400 to-emerald-400',
    'from-purple-400 to-violet-400',
    'from-orange-400 to-red-400',
  ];

  const getPostItColor = (index: number) => postItColors[index % postItColors.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative p-4 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
                <div className="relative flex justify-between items-center">
                  <h3 className="text-white font-bold">Aggiungi Nuovo Utente</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  <button type="button" onClick={() => setAddUserType('student')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${addUserType === 'student' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                    👨‍🎓 Alunno
                  </button>
                  <button type="button" onClick={() => setAddUserType('teacher')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${addUserType === 'teacher' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                    👨‍🏫 Docente
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">Nome e Cognome *</label>
                  <input type="text" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="Es. Mario Rossi" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">Username *</label>
                  <input type="text" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="Es. mrossi" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">Password *</label>
                  <input type="text" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">Email (per invio credenziali)</label>
                  <input type="email" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50" placeholder="email@esempio.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                  <p className="text-xs text-white/40 mt-1">Le credenziali verranno inviate a questa email</p>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-3 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all">
                  ✅ Crea {addUserType === 'student' ? 'Alunno' : 'Docente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Large Close Button - Top Right Corner */}
          <button 
            onClick={() => setPreviewFile(null)} 
            className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Chiudi
          </button>

          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setPreviewFile(null)}></div>
          
          <div className="relative w-full max-w-4xl max-h-[85vh] z-10" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="relative p-4 border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-bold truncate">{previewFile.name}</h3>
                      <p className="text-white/50 text-xs">{new Date(previewFile.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => downloadFile(previewFile)} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white text-sm font-bold transition-all shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Scarica File
                    </button>
                    <button 
                      onClick={() => setPreviewFile(null)} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-500/80 hover:bg-red-500 rounded-xl text-white text-sm font-bold transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/20">
                {previewFile.type?.startsWith('image') || previewFile.content?.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) ? (
                  <img 
                    src={previewFile.content} 
                    alt={previewFile.name} 
                    className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl"
                  />
                ) : previewFile.type?.includes('pdf') || previewFile.content?.match(/\.pdf(\?|$)/i) ? (
                  <iframe 
                    src={previewFile.content} 
                    className="w-full h-[65vh] rounded-lg bg-white"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-white/50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-white text-lg font-medium mb-2">Anteprima non disponibile</p>
                    <p className="text-white/50 mb-6">Questo tipo di file non può essere visualizzato nel browser</p>
                    <button 
                      onClick={() => downloadFile(previewFile)} 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold transition-all shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Scarica per visualizzare
                    </button>
                  </div>
                )}
              </div>
              
              {/* Footer with hint */}
              <div className="p-3 border-t border-white/10 bg-white/5 text-center">
                <p className="text-white/40 text-xs">Clicca fuori dal riquadro o premi "Chiudi" per tornare</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Messages Modal */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[80vh]">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="relative p-4 border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">📅</div>
                    <div>
                      <h3 className="text-white font-bold">Avvisi del {selectedDateModal}</h3>
                      <p className="text-white/50 text-xs">{publicFeedbacksByDate[selectedDateModal]?.length || 0} messaggi</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDateModal(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(publicFeedbacksByDate[selectedDateModal] || []).map((fb, idx) => (
                    <div key={fb.id} className={`bg-gradient-to-br ${getPostItColor(idx)} p-4 rounded-xl shadow-lg`} style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * 2}deg)` }}>
                      <p className="text-slate-900 font-medium text-sm mb-3">{fb.content}</p>
                      
                      {/* Attachment */}
                      {fb.attachmentUrl && (
                        <a href={fb.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-white/30 hover:bg-white/50 text-slate-800 px-2 py-1.5 rounded-lg mb-2 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          📎 {fb.attachmentName || 'Allegato'}
                        </a>
                      )}
                      
                      {/* Reply Section */}
                      {replyingToId === fb.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Scrivi la tua risposta..."
                            className="w-full p-2 text-xs bg-white/50 border border-black/10 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:border-black/30 resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplyToFeedback(fb)}
                              disabled={!replyText.trim()}
                              className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-1.5 px-3 rounded-lg transition-all"
                            >
                              ✉️ Invia
                            </button>
                            <button
                              onClick={() => { setReplyingToId(null); setReplyText(''); }}
                              className="text-xs bg-white/50 hover:bg-white/70 text-slate-700 py-1.5 px-3 rounded-lg transition-all"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToId(fb.id)}
                          className="mt-2 w-full text-xs bg-white/30 hover:bg-white/50 text-slate-700 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                          Rispondi
                        </button>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-slate-700/80 pt-2 mt-2 border-t border-black/10">
                        <span className="font-bold">
                          {getSenderRole(fb) === UserRole.STUDENT ? '👨‍🎓' : '👨‍🏫'} {getSenderName(fb)}
                        </span>
                        <span>{new Date(fb.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 sticky top-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Leonardo 1.0" className="w-10 h-10 rounded-xl shadow-lg object-contain" />
            <div className="flex items-center gap-3">
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20" />
              <div>
                <h1 className="font-bold text-white leading-tight">{currentUser.name}</h1>
                <p className="text-xs text-white/50">Dashboard Docente</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMessageCenterOpen(true)} className="relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/70 group-hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5 animate-pulse">{unreadMessageCount}</span>
              )}
            </button>
            <button onClick={onLogout} className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/70 group-hover:text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white">Utenti</h2>
              <button onClick={() => setIsAddModalOpen(true)} className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all" title="Aggiungi">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <button onClick={() => setSelectedStudentId('ALL')} className={`w-full text-left p-3 rounded-xl transition-all ${isClassView ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">📢</div>
                <div>
                  <span className="font-semibold text-white text-sm">Bacheca Classe</span>
                  <p className="text-xs text-white/50">{(students || []).length} studenti</p>
                </div>
              </div>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(students || []).map(student => {
              const studentFiles = (allFiles || []).filter(f => f.ownerId === student.id);
              const isGlowing = glowingUsers.has(student.id);
              
              return (
                <div key={student.id} onClick={() => setSelectedStudentId(student.id)} className={`relative p-3 rounded-xl transition-all cursor-pointer group ${selectedStudentId === student.id ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`} style={isGlowing ? { animation: 'glowYellow 2s infinite', boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)' } : {}}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={student.avatarUrl} alt={student.name} className={`w-10 h-10 rounded-xl ${isGlowing ? 'ring-2 ring-yellow-400' : ''}`} />
                      {isGlowing && <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-medium text-sm block truncate ${isGlowing ? 'text-yellow-400' : 'text-white'}`}>{student.name}</span>
                      <span className="text-xs text-white/40">{studentFiles.length} file</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleDeleteClick(e, student.id, student.name)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {(students || []).length === 0 && <p className="text-center text-white/40 text-sm p-4">Nessun alunno registrato.</p>}
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 overflow-y-auto p-6">
          {(selectedStudent || isClassView) ? (
            <>
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                {isClassView ? (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">📢</div>
                ) : (
                  <img src={selectedStudent?.avatarUrl} alt={selectedStudent?.name} className="w-14 h-14 rounded-xl ring-2 ring-white/20" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{isClassView ? "Bacheca Classe" : selectedStudent?.name}</h2>
                  <p className="text-sm text-white/50">{isClassView ? `${(students || []).length} studenti` : `@${selectedStudent?.username}`}</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 min-h-[500px]">
                  {isClassView ? (
                    <div className="space-y-6">
                      {Object.keys(publicFeedbacksByDate).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.entries(publicFeedbacksByDate)
                            .sort((a, b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime())
                            .map(([date, dateFeedbacks], idx) => (
                              <button key={date} onClick={() => setSelectedDateModal(date)} className={`bg-gradient-to-br ${getPostItColor(idx)} p-4 rounded-xl shadow-lg hover:scale-105 transition-all text-left`} style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * 1}deg)` }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">📅</span>
                                  <span className="font-bold text-slate-900">{date}</span>
                                </div>
                                <p className="text-xs text-slate-700">{dateFeedbacks.length} messaggi</p>
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-4xl">📋</div>
                          <p className="text-white/50">La bacheca è vuota</p>
                          <p className="text-white/30 text-sm mt-1">Invia il primo avviso</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📁 Materiale Caricato</h3>
                      {displayedFiles.length === 0 ? (
                        <p className="text-white/40 text-center py-10">Nessun materiale presente.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {displayedFiles.map(file => <FileCard key={file.id} file={file} onDownload={downloadFile} onPreview={setPreviewFile} />)}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Right Panel - New Message Form */}
                <div className="w-80 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col shrink-0">
                  <h3 className="text-lg font-bold text-white mb-4">{isClassView ? "📝 Nuovo Avviso" : "Valutazione"}</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase mb-2">{isClassView ? "Messaggio" : "Osservazione"}</label>
                      <textarea className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none h-24" placeholder={isClassView ? "Scrivi un avviso..." : "Scrivi un commento..."} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                    </div>
                    
                    {!isClassView && (
                      <div>
                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">Voto (Opzionale)</label>
                        <input type="text" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" placeholder="es. 8.5" value={gradeText} onChange={(e) => setGradeText(e.target.value)} />
                      </div>
                    )}
                    
                    {/* File Attachment */}
                    {isClassView && (
                      <div>
                        <label className="block text-xs font-bold text-white/50 uppercase mb-2">📎 Allega File (Opzionale)</label>
                        <label className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                          {attachmentFile ? (
                            <span className="text-sm text-green-400 truncate">✅ {attachmentFile.name}</span>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                              </svg>
                              <span className="text-sm text-white/50">Seleziona file</span>
                            </>
                          )}
                          <input type="file" className="hidden" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
                        </label>
                        {attachmentFile && (
                          <button onClick={() => setAttachmentFile(null)} className="mt-2 text-xs text-red-400 hover:text-red-300">❌ Rimuovi allegato</button>
                        )}
                      </div>
                    )}
                    
                    <button onClick={handleSendFeedback} disabled={isUploading || !feedbackText} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      {isUploading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Invio in corso...
                        </>
                      ) : (
                        <>📤 {isClassView ? "Pubblica Avviso" : "Invia Valutazione"}</>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex-1 overflow-y-auto">
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-3">Storico</h4>
                    <div className="space-y-3">
                      {displayedFeedbacks.slice(0, 5).map(fb => (
                        <div key={fb.id} className="bg-white/5 p-3 rounded-xl text-sm border border-white/5">
                          <p className="text-white/70 mb-2">{fb.content}</p>
                          {fb.attachmentUrl && (
                            <a href={fb.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">📎 {fb.attachmentName}</a>
                          )}
                          <div className="flex justify-between items-center text-xs text-white/40 mt-2">
                            <span>{getSenderRole(fb) === UserRole.STUDENT ? '👨‍🎓' : '👨‍🏫'} {getSenderName(fb)}</span>
                            <span>{new Date(fb.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">👈</div>
                <p className="text-white/50 font-medium">Seleziona uno studente</p>
                <p className="text-white/30 text-sm mt-1">o la bacheca classe</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <MessageCenter isOpen={isMessageCenterOpen} onClose={() => setIsMessageCenterOpen(false)} currentUser={currentUser} messages={messages} users={usersForMessaging} onSendMessage={onSendMessage} onMarkAsRead={onMarkMessageAsRead} />

      <style>{`
        @keyframes glowYellow {
          0%, 100% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.3); }
          50% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
