import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    const user = (users || []).find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenziali non valide. Riprova.');
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage('');
    setIsRecovering(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Find user by email
    const user = (users || []).find(u => u.email === recoveryEmail);
    
    if (user && user.email) {
      try {
        // @ts-ignore - EmailJS is loaded from CDN
        if (typeof emailjs !== 'undefined') {
          const templateParams = {
            to_email: user.email,
            to_name: user.name,
            username: user.username,
            password: user.password,
            role: user.role === 'TEACHER' ? 'Docente' : 'Studente',
            platform_url: window.location.origin
          };
          
          // @ts-ignore
          await emailjs.send(
            'service_leonardo',
            'template_credentials',
            templateParams
          );
          
          setRecoveryMessage('✅ Email inviata! Controlla la tua casella di posta.');
        } else {
          setRecoveryMessage('⚠️ Servizio email non configurato. Contatta l\'amministratore.');
        }
      } catch (error) {
        console.error('Errore invio email:', error);
        setRecoveryMessage('❌ Errore nell\'invio. Riprova più tardi.');
      }
    } else {
      setRecoveryMessage('❌ Nessun account trovato con questa email.');
    }
    
    setIsRecovering(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Animated Colorful Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-amber-50">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-red-400/40 to-orange-400/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-10 w-80 h-80 bg-gradient-to-br from-yellow-400/40 to-green-400/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Confetti */}
        <div className="absolute top-20 left-[20%] w-4 h-4 bg-red-500 rounded-sm rotate-12 opacity-60"></div>
        <div className="absolute top-32 right-[30%] w-3 h-3 bg-yellow-500 rounded-sm -rotate-12 opacity-60"></div>
        <div className="absolute top-40 left-[40%] w-5 h-5 bg-green-500 rounded-sm rotate-45 opacity-50"></div>
        <div className="absolute bottom-40 right-[20%] w-4 h-4 bg-blue-500 rounded-sm -rotate-12 opacity-60"></div>
        <div className="absolute bottom-32 left-[15%] w-3 h-3 bg-purple-500 rounded-sm rotate-12 opacity-60"></div>
        <div className="absolute top-1/2 right-[10%] w-4 h-4 bg-orange-500 rounded-sm rotate-45 opacity-50"></div>
        <div className="absolute top-1/3 left-[10%] w-3 h-3 bg-cyan-500 rounded-sm -rotate-45 opacity-60"></div>
        <div className="absolute bottom-1/4 right-[40%] w-5 h-5 bg-pink-500 rounded-sm rotate-12 opacity-50"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-3xl blur-lg opacity-30"></div>
          
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 text-center">
              {/* Logo Image */}
              <div className="relative w-28 h-28 mx-auto mb-4">
                <img 
                  src="/logo.png" 
                  alt="Leonardo 1.0 Logo" 
                  className="w-full h-full object-contain rounded-2xl shadow-2xl"
                />
              </div>
              
              {/* Title with rainbow gradient */}
              <h1 className="text-4xl font-extrabold mb-2">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">Leonardo</span>
                <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent"> 1.0</span>
              </h1>
              <p className="text-gray-500 text-sm font-medium italic">La piattaforma che cresce con te</p>
            </div>

            {/* Password Recovery Form */}
            {showRecovery ? (
              <div className="px-8 pb-8 space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-700">Recupera Password</h2>
                  <p className="text-sm text-gray-500">Inserisci l'email associata al tuo account</p>
                </div>

                <form onSubmit={handlePasswordRecovery} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition duration-300"
                        placeholder="Inserisci la tua email"
                        required
                      />
                    </div>
                  </div>

                  {recoveryMessage && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                      recoveryMessage.includes('✅') 
                        ? 'bg-green-50 border border-green-200 text-green-600'
                        : recoveryMessage.includes('⚠️')
                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-600'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      {recoveryMessage}
                    </div>
                  )}

                  <button type="submit" disabled={isRecovering} className="relative w-full group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                    <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl px-6 py-4 text-white font-semibold transition duration-300 shadow-lg hover:shadow-xl">
                      {isRecovering ? (
                        <>
                          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          📧 Invia Credenziali
                        </>
                      )}
                    </div>
                  </button>
                </form>

                <button
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryMessage('');
                    setRecoveryEmail('');
                  }}
                  className="w-full text-center text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  ← Torna al login
                </button>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition duration-300"
                      placeholder="Inserisci username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition duration-300"
                      placeholder="Inserisci password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="relative w-full group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-xl px-6 py-4 text-white font-semibold transition duration-300 shadow-lg hover:shadow-xl">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Accesso in corso...
                      </>
                    ) : (
                      <>
                        🚀 Accedi alla Piattaforma
                      </>
                    )}
                  </div>
                </button>

                {/* Password Recovery Link */}
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="w-full text-center text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  🔑 Password dimenticata?
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center">
        <p className="text-gray-500 text-xs">
          © 2026 Effetre Properties for Educational - Uso interno
        </p>
      </footer>
    </div>
  );
};

export default Login;
