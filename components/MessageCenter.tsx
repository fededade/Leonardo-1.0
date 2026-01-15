import React, { useState } from 'react';
import { Message, User, UserRole } from '../types';

interface MessageCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  messages: Message[];
  users: User[];
  onSendMessage: (recipientId: string, recipientName: string, content: string, replyToId?: string, replyToContent?: string) => void;
  onMarkAsRead: (messageId: string) => void;
}

const MessageCenter: React.FC<MessageCenterProps> = ({
  isOpen, onClose, currentUser, messages, users, onSendMessage, onMarkAsRead
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');

  if (!isOpen) return null;

  const userMessages = messages.filter(
    m => m.senderId === currentUser.id || m.recipientId === currentUser.id
  );

  const getConversationPartner = (message: Message): string => {
    return message.senderId === currentUser.id ? message.recipientId : message.senderId;
  };

  const conversations = userMessages.reduce((acc, message) => {
    const partnerId = getConversationPartner(message);
    if (!acc[partnerId]) {
      acc[partnerId] = {
        partnerId,
        partnerName: message.senderId === currentUser.id ? message.recipientName : message.senderName,
        partnerRole: message.senderId === currentUser.id ? 
          (users.find(u => u.id === message.recipientId)?.role || UserRole.STUDENT) : message.senderRole,
        messages: [],
        unreadCount: 0,
        lastMessage: message
      };
    }
    acc[partnerId].messages.push(message);
    if (!message.read && message.recipientId === currentUser.id) {
      acc[partnerId].unreadCount++;
    }
    if (message.timestamp > acc[partnerId].lastMessage.timestamp) {
      acc[partnerId].lastMessage = message;
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedConversations = Object.values(conversations).sort(
    (a: any, b: any) => b.lastMessage.timestamp - a.lastMessage.timestamp
  );

  const conversationMessages = selectedConversation
    ? conversations[selectedConversation]?.messages.sort((a: Message, b: Message) => a.timestamp - b.timestamp) || []
    : [];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (isComposing && selectedRecipient) {
      const recipient = users.find(u => u.id === selectedRecipient);
      if (recipient) {
        onSendMessage(recipient.id, recipient.name, newMessage.trim());
        setIsComposing(false);
        setSelectedRecipient('');
        setSelectedConversation(recipient.id);
      }
    } else if (selectedConversation) {
      const conv = conversations[selectedConversation];
      if (conv) {
        onSendMessage(conv.partnerId, conv.partnerName, newMessage.trim());
      }
    }
    setNewMessage('');
  };

  const handleSelectConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);
    setIsComposing(false);
    const conv = conversations[partnerId];
    if (conv) {
      conv.messages.forEach((msg: Message) => {
        if (!msg.read && msg.recipientId === currentUser.id) {
          onMarkAsRead(msg.id);
        }
      });
    }
  };

  const totalUnread = sortedConversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[600px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30"></div>
        
        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="relative p-4 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Centro Messaggi</h3>
                  {totalUnread > 0 && (
                    <span className="text-xs text-purple-400">{totalUnread} messaggi non letti</span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-white/10 flex flex-col">
              <div className="p-3">
                <button
                  onClick={() => { setIsComposing(true); setSelectedConversation(null); }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nuovo Messaggio
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {sortedConversations.length === 0 ? (
                  <div className="p-4 text-center text-white/40 text-sm">Nessuna conversazione</div>
                ) : (
                  sortedConversations.map((conv: any) => (
                    <div
                      key={conv.partnerId}
                      onClick={() => handleSelectConversation(conv.partnerId)}
                      className={`p-3 border-b border-white/5 cursor-pointer transition-all ${
                        selectedConversation === conv.partnerId ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                          {conv.partnerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium text-sm truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-white/70'}`}>
                              {conv.partnerName}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white/60' : 'text-white/40'}`}>
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {isComposing ? (
                <div className="flex-1 p-6 flex flex-col">
                  <h4 className="font-bold text-white mb-4">Nuovo Messaggio</h4>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">Destinatario</label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="" className="bg-slate-800">Seleziona...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id} className="bg-slate-800">
                          {user.name} ({user.role === UserRole.TEACHER ? 'Docente' : 'Studente'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-white/50 uppercase mb-2">Messaggio</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Scrivi il tuo messaggio..."
                      className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!selectedRecipient || !newMessage.trim()}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Invia Messaggio
                  </button>
                </div>
              ) : selectedConversation ? (
                <>
                  <div className="p-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold">
                        {conversations[selectedConversation]?.partnerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white text-sm">{conversations[selectedConversation]?.partnerName}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {conversationMessages.map((msg: Message) => (
                      <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-xl p-3 ${
                          msg.senderId === currentUser.id
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white/10 text-white rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={`text-[10px] mt-1 ${msg.senderId === currentUser.id ? 'text-white/60' : 'text-white/40'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            {msg.senderId === currentUser.id && msg.read && <span className="ml-1">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Scrivi un messaggio..."
                      className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                    <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl disabled:opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/40">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <p className="text-sm">Seleziona una conversazione</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;
