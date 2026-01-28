import React from 'react';
import { Message, TeacherFeedback, Assignment, User, UserRole } from '../types';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  messages: Message[];
  feedbacks: TeacherFeedback[];
  assignments: Assignment[];
  lastLoginTime: number;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  messages,
  feedbacks,
  assignments,
  lastLoginTime
}) => {
  if (!isOpen) return null;

  // Filtra le attività dopo l'ultimo login
  const newMessages = (messages || []).filter(
    m => m.recipientId === currentUser.id && m.timestamp > lastLoginTime && !m.read
  );

  const newBulletinPosts = (feedbacks || []).filter(
    fb => (fb.isPublic || fb.studentId === 'all') && 
          fb.timestamp > lastLoginTime && 
          fb.teacherId !== currentUser.id &&
          !(fb.readBy || []).includes(currentUser.id)
  );

  const newAssignments = (assignments || []).filter(
    a => a.createdAt > lastLoginTime && a.status === 'active'
  );

  // Se non ci sono novità, non mostrare nulla
  const totalNews = newMessages.length + newBulletinPosts.length + newAssignments.length;
  
  if (totalNews === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg animate-fadeIn">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-40"></div>
        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="relative p-5 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Bentornato, {currentUser.name.split(' ')[0]}!</h2>
                  <p className="text-white/50 text-sm">Ecco le novità dalla tua ultima visita</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
            
            {/* Nuovi Messaggi */}
            {newMessages.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Nuovi Messaggi</h3>
                    <p className="text-white/50 text-sm">{newMessages.length} messagg{newMessages.length === 1 ? 'io' : 'i'} non lett{newMessages.length === 1 ? 'o' : 'i'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {newMessages.slice(0, 3).map(msg => (
                    <div key={msg.id} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="text-pink-400">💬</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">
                          <strong>{msg.senderName}</strong> ti ha scritto
                        </p>
                        <p className="text-white/50 text-xs truncate">"{msg.content}"</p>
                      </div>
                    </div>
                  ))}
                  {newMessages.length > 3 && (
                    <p className="text-white/40 text-xs text-center">e altri {newMessages.length - 3} messaggi...</p>
                  )}
                </div>
              </div>
            )}

            {/* Aggiornamenti Bacheca */}
            {newBulletinPosts.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Bacheca di Classe</h3>
                    <p className="text-white/50 text-sm">{newBulletinPosts.length} nuov{newBulletinPosts.length === 1 ? 'o avviso' : 'i avvisi'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {newBulletinPosts.slice(0, 3).map(post => (
                    <div key={post.id} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="text-amber-400">📢</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">
                          <strong>{post.senderName || 'Docente'}</strong> ha pubblicato
                        </p>
                        <p className="text-white/50 text-xs truncate">"{post.content}"</p>
                      </div>
                    </div>
                  ))}
                  {newBulletinPosts.length > 3 && (
                    <p className="text-white/40 text-xs text-center">e altri {newBulletinPosts.length - 3} avvisi...</p>
                  )}
                </div>
              </div>
            )}

            {/* Nuovi Compiti */}
            {newAssignments.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Nuovi Compiti</h3>
                    <p className="text-white/50 text-sm">{newAssignments.length} compit{newAssignments.length === 1 ? 'o assegnato' : 'i assegnati'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {newAssignments.slice(0, 3).map(assignment => (
                    <div key={assignment.id} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="text-green-400">📝</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">
                          <strong>{assignment.title}</strong>
                        </p>
                        <p className="text-white/50 text-xs">
                          {assignment.creatorName}
                          {assignment.dueDate && ` • Scadenza: ${new Date(assignment.dueDate).toLocaleDateString('it-IT')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {newAssignments.length > 3 && (
                    <p className="text-white/40 text-xs text-center">e altri {newAssignments.length - 3} compiti...</p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all"
            >
              Ho capito, continua
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ActivityModal;
