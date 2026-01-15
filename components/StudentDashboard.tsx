import React, { useState } from 'react';
import { User, AppFile, Discipline, TeacherFeedback, Message, UserRole } from '../types';
import FileCard from './FileCard';
import ChatInterface from './ChatInterface';
import MessageCenter from './MessageCenter';

interface StudentDashboardProps {
  user: User;
  files: AppFile[];
  feedbacks: TeacherFeedback[];
  messages: Message[];
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
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, files, feedbacks, messages, onUpload, onSaveAiContent, onLogout, onMarkAsRead,
  onSendMessage, onMarkMessageAsRead, unreadMessageCount, usersForMessaging, teachers, onStudentPost
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
    </div>
  );
};

export default StudentDashboard;
