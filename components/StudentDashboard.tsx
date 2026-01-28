import React, { useState } from 'react';
import { User, AppFile, Discipline, TeacherFeedback, Message, UserRole, Assignment, Submission, Grade } from '../types';
import FileCard from './FileCard';
import ChatInterface from './ChatInterface';
import MessageCenter from './MessageCenter';

interface StudentDashboardProps {
  user: User;
  files: AppFile[];
  feedbacks: TeacherFeedback[];
  messages: Message[];
  assignments: Assignment[];
  submissions: Submission[];
  grades: Grade[];
  onUpload: (file: File) => void;
  onSaveAiContent: (content: string, title: string) => void;
  onLogout: () => void;
  onMarkAsRead: (feedbackId: string) => void;
  onSendMessage: (recipientId: string, recipientName: string, content: string, replyToId?: string, replyToContent?: string) => void;
  onMarkMessageAsRead: (messageId: string) => void;
  unreadMessageCount: number;
  usersForMessaging: User[];
  teachers: User[];
  onStudentPost: (content: string) => void;
  onSubmitAssignment: (assignmentId: string, assignmentTitle: string, file: File, notes?: string) => Promise<boolean>;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, files, feedbacks, messages, assignments, submissions, grades, 
  onUpload, onSaveAiContent, onLogout, onMarkAsRead,
  onSendMessage, onMarkMessageAsRead, unreadMessageCount, usersForMessaging, teachers, onStudentPost,
  onSubmitAssignment
}) => {
  const [discipline, setDiscipline] = useState<Discipline>(Discipline.GENERAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string, recipientId: string, recipientName: string, content: string} | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  
  // New post state
  const [newPostText, setNewPostText] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  // Assignment and grades state
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);
  const [isGradesTableOpen, setIsGradesTableOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Disclaimer state
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isDisclaimerLocked, setIsDisclaimerLocked] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    // Check localStorage for previous acceptance
    return localStorage.getItem(`disclaimer_accepted_${user.id}`) === 'true';
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDisclaimerAccept = async (checked: boolean) => {
    if (checked && !disclaimerAccepted) {
      setIsSendingEmail(true);
      
      try {
        // Send confirmation email via EmailJS
        const templateParams = {
          to_email: 'davide.federico@effetre-properties.com',
          to_name: 'Prof. Federico Davide',
          student_name: user.name,
          name: user.name,  // Alias for template compatibility
          email: user.email || 'noreply@leonardo.edu',  // For Reply To field
          subject: 'Accettazione Condizioni - Leonardo 1.0',
          message: `CONDIZIONI ACCETTATE

Studente: ${user.name}
Username: ${user.username}
Data e ora: ${new Date().toLocaleString('it-IT')}

DISCLAIMER ACCETTATO:

Il caricamento di qualsiasi file o contenuto su questa piattaforma implica la garanzia, da parte dell'utente, della piena e legittima titolarità dello stesso.

Con l'atto del caricamento, l'utente riconosce e conferma che la successiva pubblicazione del materiale da parte dei gestori del sito avviene sulla base di una specifica autorizzazione – concessa in forma scritta o verbale – tra l'utente (proprietario) e i gestori del sito.

L'utente accetta che il caricamento stesso valga come ratifica di tale accordo di pubblicazione.

---
Questo messaggio è stato generato automaticamente dalla piattaforma Leonardo 1.0`
        };

        console.log('Invio email disclaimer...', templateParams);
        
        // @ts-ignore - emailjs is loaded globally
        const response = await window.emailjs.send('service_leonardo', 'template_disclaimer', templateParams);
        console.log('Email inviata con successo:', response);
        
        setDisclaimerAccepted(true);
        localStorage.setItem(`disclaimer_accepted_${user.id}`, 'true');
        
      } catch (error) {
        console.error('Errore invio email disclaimer:', error);
        // Accept anyway but log error
        setDisclaimerAccepted(true);
        localStorage.setItem(`disclaimer_accepted_${user.id}`, 'true');
      } finally {
        setIsSendingEmail(false);
        // Close after acceptance
        setTimeout(() => {
          setIsDisclaimerLocked(false);
          setIsDisclaimerOpen(false);
        }, 2000);
      }
    } else if (!checked) {
      setDisclaimerAccepted(false);
      localStorage.setItem(`disclaimer_accepted_${user.id}`, 'false');
    }
  };

  const handleDisclaimerMouseEnter = () => {
    if (!isDisclaimerLocked) {
      setIsDisclaimerOpen(true);
    }
  };

  const handleDisclaimerMouseLeave = () => {
    if (!isDisclaimerLocked) {
      setIsDisclaimerOpen(false);
    }
  };

  const handleDisclaimerClick = () => {
    setIsDisclaimerLocked(true);
    setIsDisclaimerOpen(true);
  };

  const handleCloseDisclaimer = () => {
    setIsDisclaimerLocked(false);
    setIsDisclaimerOpen(false);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onUpload(e.target.files[0]);
  };

  const downloadFile = (file: AppFile) => {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle assignment submission
  const handleSubmitAssignmentClick = async () => {
    if (!selectedAssignment || !submissionFile) return;
    
    setIsSubmitting(true);
    try {
      const success = await onSubmitAssignment(
        selectedAssignment.id,
        selectedAssignment.title,
        submissionFile,
        submissionNotes || undefined
      );
      
      if (success) {
        setSelectedAssignment(null);
        setSubmissionFile(null);
        setSubmissionNotes('');
        alert('✅ Elaborato consegnato con successo!');
      } else {
        alert('❌ Errore durante la consegna. Riprova.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('❌ Errore durante la consegna. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if student already submitted for an assignment
  const hasSubmitted = (assignmentId: string) => {
    return (submissions || []).some(s => s.assignmentId === assignmentId);
  };

  // Get student's submission for an assignment
  const getSubmission = (assignmentId: string) => {
    return (submissions || []).find(s => s.assignmentId === assignmentId);
  };

  // Get grades for a specific assignment
  const getGradesForAssignment = (assignmentId: string) => {
    return (grades || []).filter(g => g.assignmentId === assignmentId);
  };

  // Calculate average grade for an assignment (collective)
  const getAverageGrade = (assignmentId: string) => {
    const assignmentGrades = getGradesForAssignment(assignmentId);
    if (assignmentGrades.length === 0) return null;
    const sum = assignmentGrades.reduce((acc, g) => acc + g.value, 0);
    return (sum / assignmentGrades.length).toFixed(1);
  };

  const filteredFiles = (files || []).filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSenderName = (fb: TeacherFeedback) => {
    if (fb.senderName) return fb.senderName;
    if (fb.senderRole === UserRole.STUDENT) {
      return 'Studente';
    }
    const teacher = (teachers || []).find(t => t.id === fb.teacherId);
    return teacher?.name || 'Docente';
  };

  const getSenderRole = (fb: TeacherFeedback): UserRole => {
    if (fb.senderRole) return fb.senderRole;
    return UserRole.TEACHER;
  };

  const handleReply = (fb: TeacherFeedback) => {
    const senderName = getSenderName(fb);
    // Reply goes to the sender
    setReplyingTo({ 
      id: fb.id, 
      recipientId: fb.teacherId, 
      recipientName: senderName, 
      content: fb.content 
    });
    setReplyText('');
  };

  const handleSendReply = () => {
    if (replyingTo && replyText.trim()) {
      onSendMessage(replyingTo.recipientId, replyingTo.recipientName, replyText.trim(), replyingTo.id, replyingTo.content);
      setReplyingTo(null);
      setReplyText('');
    }
  };

  const handleSubmitPost = () => {
    if (newPostText.trim()) {
      onStudentPost(newPostText.trim());
      setNewPostText('');
      setIsPostModalOpen(false);
    }
  };

  // Group feedbacks by date
  const feedbacksByDate = (feedbacks || []).reduce((acc, fb) => {
    const date = new Date(fb.timestamp).toLocaleDateString('it-IT');
    if (!acc[date]) acc[date] = [];
    acc[date].push(fb);
    return acc;
  }, {} as Record<string, TeacherFeedback[]>);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative p-4 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
                <div className="relative flex justify-between items-center">
                  <h3 className="text-white font-bold">Rispondi a {replyingTo.recipientName}</h3>
                  <button onClick={() => setReplyingTo(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Messaggio originale:</p>
                  <p className="text-sm text-white/70 italic">"{replyingTo.content}"</p>
                </div>
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Scrivi la tua risposta..." className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => setReplyingTo(null)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm font-medium transition-all">Annulla</button>
                  <button onClick={handleSendReply} disabled={!replyText.trim()} className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                    📤 Invia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Modal */}
      {isAssignmentsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh]">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="relative p-4 border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Compiti Assegnati</h3>
                      <p className="text-white/50 text-xs">{(assignments || []).length} compit{(assignments || []).length === 1 ? 'o' : 'i'} attiv{(assignments || []).length === 1 ? 'o' : 'i'}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAssignmentsOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-auto flex-1">
                {(assignments || []).length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">📋</div>
                    <p className="text-white/50">Nessun compito assegnato</p>
                    <p className="text-white/30 text-sm mt-1">I docenti non hanno ancora assegnato compiti</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(assignments || []).map(assignment => {
                      const submitted = hasSubmitted(assignment.id);
                      const submission = getSubmission(assignment.id);
                      const assignmentGrades = getGradesForAssignment(assignment.id);
                      const isOverdue = assignment.dueDate && assignment.dueDate < Date.now() && !submitted;
                      
                      return (
                        <div key={assignment.id} className={`bg-white/5 rounded-xl border ${isOverdue ? 'border-red-500/30' : 'border-white/10'} overflow-hidden`}>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${assignment.type === 'collective' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {assignment.type === 'collective' ? '👥 Collettivo' : '👤 Singolo'}
                                  </span>
                                  {assignment.subject && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/10 text-white/60">{assignment.subject}</span>
                                  )}
                                  {isOverdue && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">⚠️ Scaduto</span>
                                  )}
                                  {submitted && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400">✅ Consegnato</span>
                                  )}
                                </div>
                                <h4 className="text-white font-semibold text-lg">{assignment.title}</h4>
                                <p className="text-white/50 text-xs mt-1">
                                  {assignment.creatorName} • {new Date(assignment.createdAt).toLocaleDateString('it-IT')}
                                  {assignment.dueDate && ` • Scadenza: ${new Date(assignment.dueDate).toLocaleDateString('it-IT')}`}
                                </p>
                              </div>
                              {assignmentGrades.length > 0 && (
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-amber-400">
                                    {assignment.type === 'collective' ? getAverageGrade(assignment.id) : assignmentGrades[0]?.value}
                                  </p>
                                  <p className="text-white/40 text-xs">
                                    {assignment.type === 'collective' ? `${assignmentGrades.length} valutazion${assignmentGrades.length === 1 ? 'e' : 'i'}` : 'Voto'}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-white/70 text-sm mb-4">{assignment.description}</p>
                            
                            {/* Submission Info */}
                            {submitted && submission && (
                              <div className="bg-green-500/10 rounded-lg p-3 mb-4 border border-green-500/20">
                                <p className="text-green-400 text-sm font-medium mb-1">📁 Elaborato consegnato</p>
                                <p className="text-white/60 text-xs">
                                  {submission.fileName} • {new Date(submission.submittedAt).toLocaleDateString('it-IT')}
                                </p>
                              </div>
                            )}
                            
                            {/* Submit Button */}
                            {!submitted && (
                              <button 
                                onClick={() => setSelectedAssignment(assignment)}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                Consegna Elaborato
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative p-4 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Consegna Elaborato</h3>
                      <p className="text-white/50 text-xs truncate max-w-[200px]">{selectedAssignment.title}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedAssignment(null); setSubmissionFile(null); setSubmissionNotes(''); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">File da caricare *</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => e.target.files && setSubmissionFile(e.target.files[0])}
                      className="hidden"
                      id="submission-file"
                    />
                    <label 
                      htmlFor="submission-file"
                      className={`flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${submissionFile ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
                    >
                      {submissionFile ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-white font-medium">{submissionFile.name}</p>
                            <p className="text-white/50 text-xs">{(submissionFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white/40">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                          <div className="text-center">
                            <p className="text-white/70">Clicca per selezionare un file</p>
                            <p className="text-white/40 text-xs">PDF, DOC, DOCX, TXT, immagini...</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase mb-2">Note (Opzionale)</label>
                  <textarea 
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none h-24" 
                    placeholder="Aggiungi note o commenti per il docente..." 
                  />
                </div>

                {/* Submit Button */}
                <button 
                  onClick={handleSubmitAssignmentClick}
                  disabled={!submissionFile || isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Caricamento in corso...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Invia Elaborato
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grades Table Modal */}
      {isGradesTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh]">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="relative p-4 border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold">I Miei Voti</h3>
                      <p className="text-white/50 text-xs">{(grades || []).length} valutazion{(grades || []).length === 1 ? 'e' : 'i'} ricevut{(grades || []).length === 1 ? 'a' : 'e'}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsGradesTableOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-auto flex-1">
                {(grades || []).length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">⭐</div>
                    <p className="text-white/50">Nessun voto ricevuto</p>
                    <p className="text-white/30 text-sm mt-1">I tuoi voti appariranno qui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Group grades by assignment */}
                    {(assignments || []).filter(a => getGradesForAssignment(a.id).length > 0).map(assignment => {
                      const assignmentGrades = getGradesForAssignment(assignment.id);
                      const avgGrade = getAverageGrade(assignment.id);
                      
                      return (
                        <div key={assignment.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${assignment.type === 'collective' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {assignment.type === 'collective' ? '👥 Collettivo' : '👤 Singolo'}
                                  </span>
                                  {assignment.subject && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/10 text-white/60">{assignment.subject}</span>
                                  )}
                                </div>
                                <h4 className="text-white font-semibold">{assignment.title}</h4>
                                <p className="text-white/50 text-xs mt-1">{assignment.creatorName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-amber-400">{assignment.type === 'collective' ? avgGrade : assignmentGrades[0]?.value}</p>
                                <p className="text-white/40 text-xs">
                                  {assignment.type === 'collective' ? 'Media' : 'Voto'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Show individual grades for collective assignments */}
                            {assignment.type === 'collective' && assignmentGrades.length > 1 && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-white/50 text-xs mb-2">Valutazioni ricevute:</p>
                                <div className="flex flex-wrap gap-2">
                                  {assignmentGrades.map(g => (
                                    <span key={g.id} className="text-xs px-2 py-1 bg-white/10 rounded-lg text-white/70">
                                      {g.teacherName}: <strong className="text-amber-400">{g.value}</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Show comment if exists */}
                            {assignmentGrades[0]?.comment && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-white/50 text-xs mb-1">💬 Commento:</p>
                                <p className="text-white/70 text-sm italic">"{assignmentGrades[0].comment}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Calculate overall average */}
                    {(grades || []).length > 0 && (
                      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 p-4 mt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-amber-400 font-bold">Media Generale</p>
                            <p className="text-white/50 text-xs">{(grades || []).length} valutazion{(grades || []).length === 1 ? 'e' : 'i'}</p>
                          </div>
                          <p className="text-4xl font-bold text-white">
                            {((grades || []).reduce((sum, g) => sum + g.value, 0) / (grades || []).length).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative p-4 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
                <div className="relative flex justify-between items-center">
                  <h3 className="text-white font-bold">✍️ Scrivi in Bacheca</h3>
                  <button onClick={() => setIsPostModalOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/70">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-white/50 text-sm mb-4">Il tuo messaggio sarà visibile a tutta la classe e ai docenti.</p>
                <textarea 
                  value={newPostText} 
                  onChange={(e) => setNewPostText(e.target.value)} 
                  placeholder="Scrivi il tuo messaggio..." 
                  className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none mb-4" 
                />
                <div className="flex gap-3">
                  <button onClick={() => setIsPostModalOpen(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm font-medium transition-all">Annulla</button>
                  <button onClick={handleSubmitPost} disabled={!newPostText.trim()} className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                    📌 Pubblica
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Messages Modal */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[80vh]">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="relative p-4 border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">📅</div>
                    <div>
                      <h3 className="text-white font-bold">Comunicazioni del {selectedDateModal}</h3>
                      <p className="text-white/50 text-xs">{feedbacksByDate[selectedDateModal]?.length || 0} messaggi</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(feedbacksByDate[selectedDateModal] || []).map((fb, idx) => {
                    const isRead = (fb.readBy || []).includes(user.id);
                    return (
                      <div key={fb.id} className={`bg-gradient-to-br ${getPostItColor(idx)} p-4 rounded-xl shadow-lg`} style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * 2}deg)` }}>
                        <p className="text-slate-900 font-medium text-sm mb-3">{fb.content}</p>
                        {fb.grade && <p className="text-slate-800 text-xs font-bold mb-2">📊 Voto: {fb.grade}</p>}
                        
                        {/* Attachment */}
                        {fb.attachmentUrl && (
                          <a href={fb.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-white/30 hover:bg-white/50 text-slate-800 px-2 py-1.5 rounded-lg mb-2 transition-all">
                            📎 {fb.attachmentName || 'Scarica allegato'}
                          </a>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-slate-700/80 pt-2 border-t border-black/10">
                          <span className="font-bold">
                            {getSenderRole(fb) === UserRole.STUDENT ? '👨‍🎓' : '👨‍🏫'} {getSenderName(fb)}
                          </span>
                          <span>{new Date(fb.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setSelectedDateModal(null); handleReply(fb); }} className="flex-1 text-xs bg-white/30 hover:bg-white/50 text-slate-800 py-1.5 px-2 rounded-lg font-medium transition-all">💬 Rispondi</button>
                          {!isRead && <button onClick={() => onMarkAsRead(fb.id)} className="flex-1 text-xs bg-green-500/80 hover:bg-green-500 text-white py-1.5 px-2 rounded-lg font-medium transition-all">✓ Letto</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 sticky top-0">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Leonardo 1.0" className="w-10 h-10 rounded-xl shadow-lg object-contain" />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatarUrl} alt={user.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <h1 className="font-bold text-white leading-tight">{user.name}</h1>
                <p className="text-xs text-white/50">Studente</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Compiti Button */}
            <button 
              onClick={() => setIsAssignmentsOpen(true)} 
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all group"
              title="Compiti assegnati"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span className="text-white text-sm font-medium hidden sm:inline">Compiti</span>
              {(assignments || []).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-green-600 px-1.5">
                  {(assignments || []).length}
                </span>
              )}
            </button>
            
            {/* Voti Button */}
            <button 
              onClick={() => setIsGradesTableOpen(true)} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all group"
              title="I miei voti"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span className="text-white text-sm font-medium hidden sm:inline">Voti</span>
            </button>
            
            {/* Messages Button */}
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

      <main className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto">
        
        <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Bentornato, {user.name.split(' ')[0]}! 👋</h2>
                  <p className="text-white/60">Pronto per una nuova sessione di studio?</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{(files || []).length}</p>
                    <p className="text-xs text-white/50">File caricati</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Bulletin Board */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/20">📌</div>
                  Bacheca Classe
                </h3>
                {/* Button to write on bulletin board */}
                <button 
                  onClick={() => setIsPostModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-green-500/20"
                >
                  ✍️ Scrivi
                </button>
              </div>
              
              {(feedbacks || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(feedbacksByDate)
                    .sort((a, b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime())
                    .slice(0, 8)
                    .map(([date, dateFeedbacks], idx) => {
                      const unreadCount = dateFeedbacks.filter(fb => !(fb.readBy || []).includes(user.id)).length;
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDateModal(date)}
                          className={`bg-gradient-to-br ${getPostItColor(idx)} p-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-left relative`}
                          style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * 1.5}deg)` }}
                        >
                          {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5 shadow-lg">{unreadCount}</span>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📅</span>
                            <span className="font-bold text-slate-900 text-xs">{date}</span>
                          </div>
                          <p className="text-xs text-slate-700">{dateFeedbacks.length} msg</p>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/50">Nessun messaggio in bacheca</p>
                  <p className="text-white/30 text-sm">Sii il primo a scrivere!</p>
                </div>
              )}
            </div>

            {/* Files Area */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">📁 I Miei Materiali</h2>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <input type="text" placeholder="Cerca file..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-56 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all" />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white/40 absolute left-3.5 top-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>

                        <label className="relative group cursor-pointer">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                                ⬆️ Carica File
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </div>
                        </label>
                    </div>
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📂</div>
                        <p className="text-white/50 font-medium">Nessun file caricato</p>
                        <p className="text-white/30 text-sm mt-1">Carica appunti, foto o documenti</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFiles.map(file => <FileCard key={file.id} file={file} onDownload={downloadFile} />)}
                    </div>
                )}
            </div>
        </section>

        <section className="lg:col-span-5 h-[700px] lg:h-auto lg:sticky lg:top-24">
            <ChatInterface discipline={discipline} setDiscipline={setDiscipline} onSaveToFiles={onSaveAiContent} />
        </section>
      </main>

      <MessageCenter isOpen={isMessageCenterOpen} onClose={() => setIsMessageCenterOpen(false)} currentUser={user} messages={messages} users={usersForMessaging} onSendMessage={onSendMessage} onMarkAsRead={onMarkMessageAsRead} />

      {/* Disclaimer - Bottom Right Corner */}
      <div className="fixed bottom-4 right-4 z-40">
        <div 
          className="relative"
          onMouseEnter={handleDisclaimerMouseEnter}
          onMouseLeave={handleDisclaimerMouseLeave}
        >
          {/* Question Mark Button */}
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
              disclaimerAccepted 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-amber-500 hover:bg-amber-600 animate-pulse'
            }`}
            onClick={handleDisclaimerClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>

          {/* Disclaimer Popup */}
          {isDisclaimerOpen && (
            <div 
              className="absolute bottom-12 right-0 w-80 sm:w-96 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="relative p-3 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        </div>
                        <h3 className="text-white font-bold text-sm">Informativa sul Caricamento</h3>
                      </div>
                      {isDisclaimerLocked && (
                        <button 
                          onClick={handleCloseDisclaimer}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white/70">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <p className="text-white/80 text-xs leading-relaxed mb-4">
                      Il caricamento di qualsiasi file o contenuto su questa piattaforma implica la garanzia, da parte dell'utente, della piena e legittima titolarità dello stesso.
                    </p>
                    <p className="text-white/80 text-xs leading-relaxed mb-4">
                      Con l'atto del caricamento, l'utente riconosce e conferma che la successiva pubblicazione del materiale da parte dei gestori del sito avviene sulla base di una specifica autorizzazione – concessa in forma scritta o verbale – tra l'utente (proprietario) e i gestori del sito.
                    </p>
                    <p className="text-white/80 text-xs leading-relaxed mb-4">
                      L'utente accetta che il caricamento stesso valga come ratifica di tale accordo di pubblicazione.
                    </p>
                    
                    {/* Checkbox */}
                    <label className={`flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all ${isSendingEmail ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={disclaimerAccepted}
                        onChange={(e) => handleDisclaimerAccept(e.target.checked)}
                        disabled={isSendingEmail || disclaimerAccepted}
                        className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-white/70 leading-relaxed">
                        <strong className="text-white">Dichiaro</strong> di aver preso visione e di accettare integralmente quanto sopra riportato.
                      </span>
                    </label>
                    
                    {isSendingEmail && (
                      <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs">
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Invio conferma in corso...</span>
                      </div>
                    )}
                    
                    {disclaimerAccepted && !isSendingEmail && (
                      <div className="mt-3 flex items-center gap-2 text-green-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Accettato e confermato via email</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Arrow pointing to button */}
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-slate-900 border-r border-b border-white/10 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Animation style */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
