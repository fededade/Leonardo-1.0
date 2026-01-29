import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import UploadProgressModal from './components/UploadProgressModal';
import ActivityModal from './components/ActivityModal';
import { User, UserRole, AppFile, TeacherFeedback, Message, UploadProgress, Assignment, Submission, Grade } from './types';
import { MOCK_USERS } from './constants';

// Firebase Imports
import { db, storage, isConfigured } from './firebaseConfig';
// @ts-ignore
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
// @ts-ignore
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Email service function using EmailJS
const sendCredentialsEmail = async (email: string, name: string, username: string, password: string, role: string) => {
  if (!email) return;
  
  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      username: username,
      password: password,
      role: role === UserRole.TEACHER ? 'Docente' : 'Studente',
      platform_url: window.location.origin
    };
    
    // @ts-ignore - EmailJS is loaded from CDN
    if (typeof emailjs !== 'undefined') {
      // @ts-ignore
      const response = await emailjs.send(
        'service_leonardo',      // Service ID - da configurare su EmailJS
        'template_credentials',  // Template ID - da configurare su EmailJS
        templateParams
      );
      console.log('✅ Email inviata con successo!', response.status);
      alert(`✅ Utente creato e email inviata a ${email}!`);
    } else {
      console.warn('⚠️ EmailJS non configurato. Mostrando credenziali in alert.');
      alert(`✅ Utente creato!\n\nCredenziali:\nUsername: ${username}\nPassword: ${password}\n\n⚠️ EmailJS non configurato.\nConfigura EmailJS per inviare email automatiche.`);
    }
  } catch (error) {
    console.error('❌ Errore invio email:', error);
    alert(`✅ Utente creato!\n\nCredenziali:\nUsername: ${username}\nPassword: ${password}\n\n⚠️ Errore invio email. Comunica le credenziali manualmente.`);
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [files, setFiles] = useState<AppFile[]>([]);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for assignments, submissions, grades
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState<number>(0);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    fileName: '',
    status: 'uploading'
  });

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot: any) => {
      const fetchedUsers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as User));
      setStudents(fetchedUsers.filter((u: User) => u.role === UserRole.STUDENT));
      setTeachers(fetchedUsers.filter((u: User) => u.role === UserRole.TEACHER));
      setIsLoading(false);
    }, (error: any) => {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    });

    const qFiles = query(collection(db, 'files'), orderBy('timestamp', 'desc'));
    const unsubscribeFiles = onSnapshot(qFiles, (snapshot: any) => {
      setFiles(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AppFile)));
    });

    const qFeedbacks = query(collection(db, 'feedbacks'), orderBy('timestamp', 'desc'));
    const unsubscribeFeedbacks = onSnapshot(qFeedbacks, (snapshot: any) => {
      setFeedbacks(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as TeacherFeedback)));
    });

    const qMessages = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot: any) => {
      setMessages(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Message)));
    });

    // New listeners for assignments, submissions, grades
    const qAssignments = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribeAssignments = onSnapshot(qAssignments, (snapshot: any) => {
      setAssignments(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Assignment)));
    });

    const qSubmissions = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot: any) => {
      setSubmissions(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Submission)));
    });

    const qGrades = query(collection(db, 'grades'), orderBy('timestamp', 'desc'));
    const unsubscribeGrades = onSnapshot(qGrades, (snapshot: any) => {
      setGrades(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Grade)));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeFiles();
      unsubscribeFeedbacks();
      unsubscribeMessages();
      unsubscribeAssignments();
      unsubscribeSubmissions();
      unsubscribeGrades();
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    // Get last login time from localStorage
    const storedLastLogin = localStorage.getItem(`lastLogin_${loggedInUser.id}`);
    const lastLogin = storedLastLogin ? parseInt(storedLastLogin) : 0;
    setLastLoginTime(lastLogin);
    
    // Set user
    setUser(loggedInUser);
    
    // Show activity modal after a short delay to allow data to load
    setTimeout(() => {
      setShowActivityModal(true);
    }, 500);
    
    // Update last login time
    localStorage.setItem(`lastLogin_${loggedInUser.id}`, Date.now().toString());
  };

  const handleLogout = () => setUser(null);
  const handleCloseUploadModal = () => setUploadProgress({ isUploading: false, progress: 0, fileName: '', status: 'uploading' });
  const handleCloseActivityModal = () => setShowActivityModal(false);

  const handleUpload = async (file: File) => {
    if (!user) return;
    
    setUploadProgress({ isUploading: true, progress: 0, fileName: file.name, status: 'uploading' });
    
    try {
      const storageRef = ref(storage, `uploads/${user.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed',
        (snapshot: any) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, progress }));
        },
        (error: any) => {
          console.error('Upload error:', error);
          setUploadProgress(prev => ({ ...prev, status: 'error' }));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'files'), {
            name: file.name,
            content: downloadURL,
            type: file.type,
            ownerId: user.id,
            timestamp: Date.now()
          });
          setUploadProgress(prev => ({ ...prev, status: 'success', progress: 100 }));
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleSaveAiContent = async (content: string, title: string) => {
    if (!user) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], `${title}.txt`, { type: 'text/plain' });
    await handleUpload(file);
  };

  const handleMarkFeedbackAsRead = async (feedbackId: string) => {
    if (!user) return;
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await updateDoc(feedbackRef, { readBy: arrayUnion(user.id) });
  };

  // Updated to support attachments and sender info
  const handleAddFeedback = async (
    studentId: string, 
    content: string, 
    grade?: string, 
    isPublic = false,
    attachmentUrl?: string,
    attachmentName?: string
  ) => {
    if (!user) return;
    
    const feedbackData: any = {
      studentId,
      teacherId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content,
      grade: grade || "",
      isPublic,
      timestamp: Date.now(),
      readBy: []
    };
    
    if (attachmentUrl) {
      feedbackData.attachmentUrl = attachmentUrl;
      feedbackData.attachmentName = attachmentName;
    }
    
    await addDoc(collection(db, 'feedbacks'), feedbackData);
  };

  // Student can also post to bulletin board
  const handleStudentPost = async (content: string) => {
    if (!user || user.role !== UserRole.STUDENT) return;
    
    await addDoc(collection(db, 'feedbacks'), {
      studentId: user.id,
      teacherId: user.id,
      senderName: user.name,
      senderRole: UserRole.STUDENT,
      content,
      grade: "",
      isPublic: true,
      timestamp: Date.now(),
      readBy: []
    });
  };

  const handleAddStudent = async (name: string, username: string, password?: string, email?: string) => {
    const finalPassword = password || "1234";
    
    try {
      await addDoc(collection(db, 'users'), {
        name,
        username,
        role: UserRole.STUDENT,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        password: finalPassword,
        email: email || ""
      });
      
      // Send email with credentials
      if (email) {
        await sendCredentialsEmail(email, name, username, finalPassword, UserRole.STUDENT);
      }
      
      console.log('✅ Studente aggiunto:', name);
    } catch (error) {
      console.error('❌ Errore aggiunta studente:', error);
      alert('Errore durante la creazione dello studente. Riprova.');
    }
  };

  const handleAddTeacher = async (name: string, username: string, password?: string, email?: string) => {
    const finalPassword = password || "1234";
    
    try {
      await addDoc(collection(db, 'users'), {
        name,
        username,
        role: UserRole.TEACHER,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`,
        password: finalPassword,
        email: email || ""
      });
      
      // Send email with credentials
      if (email) {
        await sendCredentialsEmail(email, name, username, finalPassword, UserRole.TEACHER);
      }
      
      console.log('✅ Docente aggiunto:', name);
      alert(`✅ Docente "${name}" creato con successo!\n\nCredenziali:\nUsername: ${username}\nPassword: ${finalPassword}`);
    } catch (error) {
      console.error('❌ Errore aggiunta docente:', error);
      alert('Errore durante la creazione del docente. Riprova.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteDoc(doc(db, 'users', studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleSendMessage = async (recipientId: string, recipientName: string, content: string, replyToId?: string, replyToContent?: string) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.id,
        senderName: user.name,
        recipientId,
        recipientName,
        content,
        timestamp: Date.now(),
        read: false,
        replyToId: replyToId || null,
        replyToContent: replyToContent || null
      });
      console.log('✅ Messaggio inviato a:', recipientName);
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Upload attachment for feedback
  const handleUploadAttachment = async (file: File): Promise<{url: string, name: string} | null> => {
    if (!user) return null;
    
    try {
      const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          () => {},
          (error) => {
            console.error('Attachment upload error:', error);
            reject(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url: downloadURL, name: file.name });
          }
        );
      });
    } catch (error) {
      console.error('Attachment upload error:', error);
      return null;
    }
  };

  // ============================================
  // NEW: Assignment handlers
  // ============================================

  const handleCreateAssignment = async (
    title: string, 
    description: string, 
    type: 'collective' | 'single', 
    dueDate?: number, 
    subject?: string
  ) => {
    if (!user || user.role !== UserRole.TEACHER) return;
    
    try {
      await addDoc(collection(db, 'assignments'), {
        title,
        description,
        creatorId: user.id,
        creatorName: user.name,
        type,
        dueDate: dueDate || null,
        subject: subject || null,
        createdAt: Date.now(),
        status: 'active'
      });
      console.log('✅ Compito creato:', title);
    } catch (error) {
      console.error('❌ Errore creazione compito:', error);
      alert('Errore durante la creazione del compito. Riprova.');
    }
  };

  const handleSubmitAssignment = async (
    assignmentId: string, 
    assignmentTitle: string, 
    file: File, 
    notes?: string,
    targetTeacherId?: string,
    targetTeacherName?: string
  ): Promise<boolean> => {
    if (!user || user.role !== UserRole.STUDENT) return false;
    
    try {
      // Upload file first
      const storageRef = ref(storage, `submissions/${user.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve) => {
        uploadTask.on('state_changed',
          () => {},
          (error) => {
            console.error('Submission upload error:', error);
            resolve(false);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create submission record
            const submissionData: any = {
              assignmentId,
              assignmentTitle,
              studentId: user.id,
              studentName: user.name,
              fileUrl: downloadURL,
              fileName: file.name,
              submittedAt: Date.now(),
              notes: notes || null
            };
            
            // Add target teacher for collective assignments
            if (targetTeacherId) {
              submissionData.targetTeacherId = targetTeacherId;
              submissionData.targetTeacherName = targetTeacherName;
            }
            
            await addDoc(collection(db, 'submissions'), submissionData);
            
            console.log('✅ Elaborato consegnato per:', assignmentTitle);
            resolve(true);
          }
        );
      });
    } catch (error) {
      console.error('❌ Errore consegna elaborato:', error);
      return false;
    }
  };

  const handleAddGrade = async (
    assignmentId: string, 
    submissionId: string, 
    studentId: string, 
    studentName: string, 
    value: number, 
    comment?: string
  ) => {
    if (!user || user.role !== UserRole.TEACHER) return;
    
    try {
      await addDoc(collection(db, 'grades'), {
        assignmentId,
        submissionId,
        studentId,
        studentName,
        teacherId: user.id,
        teacherName: user.name,
        value,
        comment: comment || null,
        timestamp: Date.now()
      });
      console.log('✅ Voto assegnato a:', studentName);
    } catch (error) {
      console.error('❌ Errore assegnazione voto:', error);
      alert('Errore durante l\'assegnazione del voto. Riprova.');
    }
  };

  // ============================================
  // Utility functions
  // ============================================

  const getUnreadMessageCount = () => {
    if (!user) return 0;
    return messages.filter(m => m.recipientId === user.id && !m.read).length;
  };

  const getUsersForMessaging = () => {
    if (!user) return [];
    if (user.role === UserRole.TEACHER) {
      return [...students, ...teachers.filter(t => t.id !== user.id)];
    }
    return [...teachers, ...students.filter(s => s.id !== user.id)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Caricamento...</p>
        </div>
      </div>
    );
  }

  const adminUser = MOCK_USERS.find(u => u.role === UserRole.TEACHER);
  const safeTeachers = teachers || [];
  const safeStudents = students || [];
  const allUsersForLogin = [
    ...safeTeachers,
    ...(adminUser && !safeTeachers.find(t => t.username === adminUser.username) ? [adminUser] : []),
    ...safeStudents
  ];

  if (!user) {
    return <Login onLogin={handleLogin} users={allUsersForLogin} />;
  }

  if (user.role === UserRole.TEACHER) {
    return (
      <>
        <TeacherDashboard
          currentUser={user}
          students={students || []}
          teachers={teachers || []}
          allFiles={files}
          feedbacks={feedbacks}
          messages={messages}
          assignments={assignments}
          submissions={submissions}
          grades={grades}
          onAddFeedback={handleAddFeedback}
          onLogout={handleLogout}
          onAddStudent={handleAddStudent}
          onAddTeacher={handleAddTeacher}
          onDeleteStudent={handleDeleteStudent}
          onSendMessage={handleSendMessage}
          onMarkMessageAsRead={handleMarkMessageAsRead}
          unreadMessageCount={getUnreadMessageCount()}
          usersForMessaging={getUsersForMessaging()}
          onUploadAttachment={handleUploadAttachment}
          onCreateAssignment={handleCreateAssignment}
          onAddGrade={handleAddGrade}
        />
        <UploadProgressModal uploadProgress={uploadProgress} onClose={handleCloseUploadModal} />
        <ActivityModal
          isOpen={showActivityModal}
          onClose={handleCloseActivityModal}
          currentUser={user}
          messages={messages}
          feedbacks={feedbacks}
          assignments={assignments}
          lastLoginTime={lastLoginTime}
        />
      </>
    );
  }

  return (
    <>
      <StudentDashboard
        user={user}
        files={files.filter(f => f.ownerId === user.id)}
        feedbacks={feedbacks.filter(f => f.studentId === user.id || f.isPublic)}
        messages={messages}
        assignments={assignments.filter(a => a.status === 'active')}
        submissions={submissions.filter(s => s.studentId === user.id)}
        grades={grades.filter(g => g.studentId === user.id)}
        onUpload={handleUpload}
        onSaveAiContent={handleSaveAiContent}
        onLogout={handleLogout}
        onMarkAsRead={handleMarkFeedbackAsRead}
        onSendMessage={handleSendMessage}
        onMarkMessageAsRead={handleMarkMessageAsRead}
        unreadMessageCount={getUnreadMessageCount()}
        usersForMessaging={getUsersForMessaging()}
        teachers={teachers || []}
        onStudentPost={handleStudentPost}
        onSubmitAssignment={handleSubmitAssignment}
      />
      <UploadProgressModal uploadProgress={uploadProgress} onClose={handleCloseUploadModal} />
      <ActivityModal
        isOpen={showActivityModal}
        onClose={handleCloseActivityModal}
        currentUser={user}
        messages={messages}
        feedbacks={feedbacks}
        assignments={assignments}
        lastLoginTime={lastLoginTime}
      />
    </>
  );
};

export default App;
